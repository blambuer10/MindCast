import { NextRequest, NextResponse } from 'next/server';
import { getPredictionsByMind, getAgent, getDebateOutcomesByMind, getEvidenceByAgent } from '@/lib/database/queries';
import { calculatePredictionAccuracy } from '@/lib/ai/calibration-service';

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

    const predictions = getPredictionsByMind(id);
    const accuracyStats = calculatePredictionAccuracy(predictions);
    const debates = getDebateOutcomesByMind(id);
    const evidence = getEvidenceByAgent(id);

    return NextResponse.json({
      accuracy: accuracyStats.accuracy,
      totalPredictions: accuracyStats.total,
      resolvedPredictions: accuracyStats.resolved,
      correctPredictions: accuracyStats.correct,
      totalDebates: debates.length,
      totalEvidence: evidence.length,
    });
  } catch (error) {
    console.error('[API] Get track record error:', error);
    return NextResponse.json({ error: 'Failed to fetch track record' }, { status: 500 });
  }
}
