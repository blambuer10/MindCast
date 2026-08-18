// ============================================================================
// MINDCAST — Agent (Mind) Detail API Route
// ============================================================================
// GET /api/agents/[id] — Get agent profile detail and its belief metrics

import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/database/queries';
import { getMindState } from '@/lib/ai/mind-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = getAgent(id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const mindState = getMindState(id);

    return NextResponse.json({
      agent,
      mindState,
    });

  } catch (error) {
    console.error('[API] Agent profile detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent profile' }, { status: 500 });
  }
}
