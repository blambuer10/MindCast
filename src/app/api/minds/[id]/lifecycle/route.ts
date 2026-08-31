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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getAgentByIdea } = await import('@/lib/database/queries');
    const agent = getAgent(id) || getAgentByIdea(id);
    if (!agent) {
      return NextResponse.json({ error: 'Mind not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const targetStatus = body.targetStatus;

    const db = getDb();
    const now = new Date().toISOString();

    let newStatus: string;
    if (targetStatus) {
      newStatus = targetStatus;
    } else {
      const order = ['INCUBATING', 'EMERGING', 'PROVEN', 'MARKET_READY', 'MARKET_ACTIVE'];
      const currentIndex = order.indexOf(agent.lifecycleStatus);
      newStatus = currentIndex >= 0 && currentIndex < order.length - 1 ? order[currentIndex + 1] : 'MARKET_ACTIVE';
    }

    db.prepare('UPDATE agents SET lifecycle_status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, agent.id);

    if (newStatus === 'MARKET_ACTIVE') {
      db.prepare(`
        UPDATE mind_assets SET market_status = 'ACTIVE' WHERE mind_id = ?
      `).run(agent.id);

      const { createAgentEvent } = await import('@/lib/database/queries');
      const { AgentEventType } = await import('@/lib/types');
      createAgentEvent(
        agent.id,
        AgentEventType.LIFECYCLE_CHANGED,
        `🎓 Mind graduated internal bonding curve! DEX pool initialized on Uniswap v3 & Aerodrome on Base. LP tokens locked permanently.`
      );

      // Trigger On-Chain Pump.fun style vault graduation to DEX
      try {
        const { triggerVaultGraduation } = await import('@/lib/blockchain/vault');
        await triggerVaultGraduation(agent.id);
      } catch (vaultErr) {
        console.warn('[Lifecycle] On-chain vault graduation error (non-fatal):', vaultErr);
      }
    }

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      previousStatus: agent.lifecycleStatus,
      newStatus,
    });
  } catch (error: any) {
    console.error('[API] Post lifecycle error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lifecycle' }, { status: 500 });
  }
}
