// ============================================================================
// MINDCAST — Agent Activity Timeline API Route
// ============================================================================
// GET /api/agents/[id]/activity — Get agent timeline events

import { NextRequest, NextResponse } from 'next/server';
import { getAgent, getAgentEvents } from '@/lib/database/queries';

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

    const events = getAgentEvents(id, 100);

    return NextResponse.json({
      agentId: id,
      events,
    });

  } catch (error) {
    console.error('[API] Agent activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent activity' }, { status: 500 });
  }
}
