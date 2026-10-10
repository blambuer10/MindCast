import { NextRequest, NextResponse } from 'next/server';
import { createArgument, getAgent, getIdea } from '@/lib/database/queries';
import { moderateContent } from '@/lib/security/moderation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, stance, authorWallet, walletAddress, evidenceIds } = body;
    const author = authorWallet || walletAddress;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Argument content must be at least 10 characters.' },
        { status: 400 }
      );
    }

    // Rate limiting
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`arg-post-${ip}-${id}`, 15, 60000);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Moderation
    const mod = moderateContent(content);
    if (!mod.ok) {
      return NextResponse.json({ error: mod.reason }, { status: 400 });
    }

    // Locate agent (target can be agent.id or idea.id)
    let agent = getAgent(id);
    if (!agent) {
      const idea = getIdea(id);
      if (idea) {
        if (idea.agentId) {
          agent = getAgent(idea.agentId);
        }
        if (!agent) {
          const { birthMind } = await import('@/lib/ai/mind-engine');
          agent = await birthMind(idea.id, idea.content);
        }
      }
    }

    if (!agent) {
      return NextResponse.json({ error: 'Mind not found.' }, { status: 404 });
    }

    const validStance = stance === 'CHALLENGING' ? 'CHALLENGING' : stance === 'QUESTION' ? 'QUESTION' : 'SUPPORTING';
    const strength = validStance === 'CHALLENGING' ? 0.6 : 0.55;

    const newArg = createArgument(
      agent.id,
      content.trim(),
      Array.isArray(evidenceIds) ? evidenceIds : [],
      strength,
      author || undefined,
      validStance
    );

    return NextResponse.json({ success: true, argument: newArg });
  } catch (error) {
    console.error('[API] Add argument error:', error);
    return NextResponse.json(
      { error: 'Failed to submit argument' },
      { status: 500 }
    );
  }
}
