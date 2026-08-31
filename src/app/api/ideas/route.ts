// ============================================================================
// MINDCAST — Ideas API Route
// ============================================================================
// POST /api/ideas — Prepare a new idea
// GET  /api/ideas — List published ideas (feed)

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser, createIdea, getIdeasFeed } from '@/lib/database/queries';
import type { FeedFilters } from '@/lib/types';

// Moderation — basic content filter
function moderateContent(content: string): { ok: boolean; reason?: string } {
  const trimmed = content.trim();

  if (!trimmed || trimmed.length === 0) {
    return { ok: false, reason: 'Idea cannot be empty.' };
  }

  if (trimmed.length > 280) {
    return { ok: false, reason: 'Idea must be 280 characters or less.' };
  }

  if (/^\s+$/.test(trimmed)) {
    return { ok: false, reason: 'Idea cannot be whitespace only.' };
  }

  // Basic spam/malicious content detection
  const blocked = [
    /\b(buy\s*now|free\s*money|click\s*here|earn\s*\$|guaranteed\s*return)\b/i,
  ];

  for (const pattern of blocked) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: 'Content does not meet community guidelines.' };
    }
  }

  return { ok: true };
}

// POST — Prepare a new idea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, walletAddress, tokenName, tokenTicker } = body;

    if (!content || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: content, walletAddress' },
        { status: 400 }
      );
    }

    // Rate Limiting Protection
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`ideas-post-${ip}-${walletAddress}`, 5, 60000);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before submitting another idea.' },
        { status: 429 }
      );
    }

    // Moderate content
    const modResult = moderateContent(content);
    if (!modResult.ok) {
      return NextResponse.json(
        { error: modResult.reason },
        { status: 400 }
      );
    }

    // Find or create user
    const user = findOrCreateUser(walletAddress);

    // Create idea in PENDING state with unique token identity
    const idea = createIdea(user.id, content.trim(), tokenName, tokenTicker);

    // Track analytics event
    const { trackEvent } = await import('@/lib/analytics/tracker');
    trackEvent('idea_submitted', user.id, { contentLength: content.trim().length, tokenTicker: idea.tokenTicker });

    // Return payment instructions
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453');
    return NextResponse.json({
      ideaId: idea.id,
      tokenName: idea.tokenName,
      tokenTicker: idea.tokenTicker,
      paymentAmount: process.env.PAYMENT_AMOUNT || '1',
      paymentToken: 'USDC',
      paymentRecipient: process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS || process.env.PAYMENT_RECIPIENT_ADDRESS || '0x33f18d0BD613A2afa4694A8AAA6b1daf4FEBdbd2',
      chainId,
    });

  } catch (error) {
    console.error('[API] Ideas POST error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare idea' },
      { status: 500 }
    );
  }
}

// GET — List published ideas (feed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = (searchParams.get('tab') || 'trending') as FeedFilters['tab'];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const ideas = getIdeasFeed({ tab, page, limit });

    return NextResponse.json({ ideas, page, limit });

  } catch (error) {
    console.error('[API] Ideas GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}
