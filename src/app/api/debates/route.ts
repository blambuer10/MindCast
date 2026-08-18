// ============================================================================
// MINDCAST — Debates API Route
// ============================================================================
// POST /api/debates — Create a new debate
// GET  /api/debates — List debates (optional)

import { NextRequest, NextResponse } from 'next/server';
import {
  createDebate,
  getIdea,
  getAgentByIdea,
} from '@/lib/database/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ideaA, ideaB } = body;

    if (!ideaA || !ideaB) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaA, ideaB' },
        { status: 400 }
      );
    }

    if (ideaA === ideaB) {
      return NextResponse.json(
        { error: 'A Mind cannot debate itself.' },
        { status: 400 }
      );
    }

    // Get both ideas and their agents
    const idea1 = getIdea(ideaA);
    const idea2 = getIdea(ideaB);

    if (!idea1 || !idea2) {
      return NextResponse.json(
        { error: 'One or both ideas not found.' },
        { status: 404 }
      );
    }

    const agentA = getAgentByIdea(ideaA);
    const agentB = getAgentByIdea(ideaB);

    if (!agentA || !agentB) {
      return NextResponse.json(
        { error: 'Both ideas must have active Minds to debate.' },
        { status: 400 }
      );
    }

    const debate = createDebate(ideaA, ideaB, agentA.id, agentB.id);

    // Ensure OpenAI provider is registered
    try {
      await import('@/lib/ai/openai');
    } catch {}

    // Trigger async debate execution (fire and forget)
    const { runDebate } = await import('@/lib/ai/mind-engine');
    runDebate(debate.id).catch(err => {
      console.error(`[API] Background debate execution failed for ${debate.id}:`, err);
    });

    return NextResponse.json({ debate });

  } catch (error) {
    console.error('[API] Create debate error:', error);
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    );
  }
}
