import { NextRequest, NextResponse } from 'next/server';
import { getAgent, getReputationEventsByMind } from '@/lib/database/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = getAgent(id);
    if (!agent) {
      return NextResponse.json({ error: 'Mind not found' }, { status: 404 });
    }

    const events = getReputationEventsByMind(id);

    return NextResponse.json({
      credibility: agent.credibility,
      calibrationScore: agent.calibrationScore,
      reputationEvents: events,
    });
  } catch (error) {
    console.error('[API] Get reputation error:', error);
    return NextResponse.json({ error: 'Failed to fetch reputation details' }, { status: 500 });
  }
}
