// ============================================================================
// MINDCAST — Debate Detail API
// ============================================================================
// GET /api/debates/[id] — Get debate with messages

import { NextRequest, NextResponse } from 'next/server';
import {
  getDebate,
  getDebateMessages,
  getAgent,
  getIdea,
} from '@/lib/database/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debate = getDebate(id);

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    const messages = getDebateMessages(id);
    const agentA = getAgent(debate.agentA);
    const agentB = getAgent(debate.agentB);
    const ideaA = getIdea(debate.ideaA);
    const ideaB = getIdea(debate.ideaB);

    return NextResponse.json({
      debate,
      messages,
      sides: {
        a: { agent: agentA, idea: ideaA },
        b: { agent: agentB, idea: ideaB },
      },
    });

  } catch (error) {
    console.error('[API] Debate detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch debate' }, { status: 500 });
  }
}
