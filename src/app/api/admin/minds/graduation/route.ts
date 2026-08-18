import { NextRequest, NextResponse } from 'next/server';
import {
  mapAgent,
  getPredictionsByMind,
  getEvidenceByAgent,
  getDebateOutcomesByMind
} from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';
import { MarketGraduationService } from '@/lib/ai/graduation-service';
import { calculatePredictionAccuracy } from '@/lib/ai/calibration-service';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Fetch all agents that are not MARKET_ACTIVE or ARCHIVED
    const rows = db.prepare(`
      SELECT * FROM agents
      WHERE lifecycle_status NOT IN ('MARKET_ACTIVE', 'ARCHIVED')
    `).all() as Record<string, unknown>[];

    const agents = rows.map(mapAgent);
    const queue = [];

    for (const agent of agents) {
      const predictions = getPredictionsByMind(agent.id);
      const evidence = getEvidenceByAgent(agent.id);
      const debates = getDebateOutcomesByMind(agent.id);

      // Get follower count
      const followerRow = db.prepare(`
        SELECT COUNT(*) as c FROM idea_follows WHERE idea_id = ?
      `).get(agent.ideaId) as { c: number } | undefined;
      const followerCount = followerRow ? followerRow.c : 0;

      const accResult = calculatePredictionAccuracy(predictions);
      const resolvedPredictions = predictions.filter(p => p.status !== 'OPEN' && p.status !== 'CANCELLED' && p.status !== 'INVALIDATED').length;

      const eligibility = MarketGraduationService.evaluateEligibility(agent, {
        evidenceCount: evidence.length,
        debateCount: debates.length,
        predictionCount: resolvedPredictions,
        followerCount,
        accuracy: accResult.accuracy,
        moderated: false,
        integrityViolation: false,
      });

      queue.push({
        id: agent.id,
        thesis: agent.thesis,
        currentStatus: agent.lifecycleStatus,
        credibility: agent.credibility,
        predictionAccuracy: accResult.accuracy,
        evidenceCount: evidence.length,
        debateCount: debates.length,
        followerCount,
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
      });
    }

    return NextResponse.json({ graduationQueue: queue });

  } catch (error) {
    console.error('[API] Get graduation queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch graduation queue' }, { status: 500 });
  }
}
