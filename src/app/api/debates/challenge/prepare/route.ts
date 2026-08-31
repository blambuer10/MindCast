// ============================================================================
// MINDCAST — Challenge Prepare API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser, createIdea, getIdea, getAgentByIdea } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';
import { getAIProvider } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentIdeaId, evidenceId, walletAddress } = body;

    if (!parentIdeaId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: parentIdeaId, walletAddress' },
        { status: 400 }
      );
    }

    const parentIdea = getIdea(parentIdeaId);
    if (!parentIdea) {
      return NextResponse.json({ error: 'Parent idea not found.' }, { status: 404 });
    }

    const parentAgent = getAgentByIdea(parentIdeaId);
    if (!parentAgent) {
      return NextResponse.json({ error: 'Parent Mind agent not found.' }, { status: 404 });
    }

    // Rate Limiting Protection
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`challenge-prepare-${ip}-${walletAddress}`, 5, 60000);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429 }
      );
    }

    // Find challenged evidence claim if provided
    let evidenceClaim = '';
    if (evidenceId) {
      const db = getDb();
      const row = db.prepare('SELECT claim FROM evidence WHERE id = ?').get(evidenceId) as { claim: string } | undefined;
      if (row) {
        evidenceClaim = row.claim;
      }
    }

    // Generate a contrarian counter-thesis via the registered AI provider
    let counterThesis = `Opposing thesis to: "${parentAgent.thesis.slice(0, 100)}..."`;
    try {
      // Ensure OpenAI/0G provider is registered
      try { await import('@/lib/ai/openai'); } catch {}
      
      const ai = getAIProvider();
      const prompt = `You are a contrarian intellectual. Given the thesis: "${parentAgent.thesis}" ${
        evidenceClaim ? `and the specific evidence being challenged: "${evidenceClaim}"` : ''
      }, write a concise, compelling counter-thesis or contrarian stance.
It MUST be under 280 characters, highly precise, and directly oppose the main thesis or evidence. Return ONLY the raw counter-thesis text, with no quotes, preambles, or conversational filler.`;
      
      const aiRes = await ai.generate(prompt);
      if (aiRes && aiRes.trim().length > 0) {
        counterThesis = aiRes.trim().slice(0, 280);
      }
    } catch (aiErr) {
      console.warn('[API] AI counter-thesis generation failed, using fallback:', aiErr);
      if (evidenceClaim) {
        counterThesis = `Evidence "${evidenceClaim.slice(0, 50)}..." is invalid/misinterpreted. Contrary to this, opposing factors prevent the thesis from materializing.`;
      } else {
        counterThesis = `The thesis "${parentAgent.thesis.slice(0, 50)}..." is built on incorrect assumptions and will fail to hold under closer analysis.`;
      }
    }

    // Find or create user
    const user = findOrCreateUser(walletAddress);

    // Create opposing idea in PENDING state
    const opposingIdea = createIdea(user.id, counterThesis);

    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
    return NextResponse.json({
      opposingIdeaId: opposingIdea.id,
      opposingThesis: counterThesis,
      paymentAmount: '2', // Challenge costs 2 USDC
      paymentToken: 'USDC',
      paymentRecipient: process.env.NEXT_PUBLIC_BONDING_VAULT_ADDRESS || process.env.BONDING_VAULT_ADDRESS || '0xf2f726598E96D85b9b08ece943590529555b867d',
      chainId,
    });

  } catch (error) {
    console.error('[API] Challenge prepare error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare challenge' },
      { status: 500 }
    );
  }
}
