import { NextRequest, NextResponse } from 'next/server';
import {
  getAgent,
  getPredictionsByMind,
  getEvidenceByAgent,
  getDebateOutcomesByMind,
} from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';
import { MarketGraduationService } from '@/lib/ai/graduation-service';
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
    const evidence = getEvidenceByAgent(id);
    const debates = getDebateOutcomesByMind(id);

    // Get follower count
    const db = getDb();
    const followerRow = db.prepare(`
      SELECT COUNT(*) as c FROM idea_follows WHERE idea_id = ?
    `).get(agent.ideaId) as { c: number } | undefined;
    const followerCount = followerRow ? followerRow.c : 0;

    const accResult = calculatePredictionAccuracy(predictions);
    const resolvedPredictions = predictions.filter(p => p.status !== 'OPEN' && p.status !== 'CANCELLED' && p.status !== 'INVALIDATED').length;

    const result = MarketGraduationService.evaluateEligibility(agent, {
      evidenceCount: evidence.length,
      debateCount: debates.length,
      predictionCount: resolvedPredictions,
      followerCount,
      accuracy: accResult.accuracy,
      moderated: false,
      integrityViolation: false,
    });

    return NextResponse.json({
      currentStatus: result.currentStatus,
      nextStatus: result.nextStatus,
      eligible: result.eligible,
      reasons: result.reasons,
    });
  } catch (error) {
    console.error('[API] Get lifecycle error:', error);
    return NextResponse.json({ error: 'Failed to fetch lifecycle details' }, { status: 500 });
  }
}
