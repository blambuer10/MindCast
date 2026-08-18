import { NextRequest, NextResponse } from 'next/server';
import { getAgent, getValuationSnapshotsByMind } from '@/lib/database/queries';

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

    const snapshots = getValuationSnapshotsByMind(id);

    return NextResponse.json({
      estimatedValue: agent.estimatedValue,
      valuationSnapshots: snapshots,
    });
  } catch (error) {
    console.error('[API] Get valuation error:', error);
    return NextResponse.json({ error: 'Failed to fetch valuation snapshots' }, { status: 500 });
  }
}
