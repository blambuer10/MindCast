// ============================================================================
// MINDCAST — Creator Profile API
// Returns unified profile data: track record, minds, portfolio, activity
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserByWallet } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const user = getUserByWallet(address);

    // Return empty profile for unknown users
    if (!user) {
      return NextResponse.json({
        exists: false,
        address,
        reputation: 0,
        trackRecord: {
          predictionAccuracy: 0,
          calibrationScore: 0,
          evidenceQuality: 0,
          debatePerformance: 0,
          mindSuccessRate: 0,
          totalFollowers: 0,
        },
        minds: [],
        portfolio: [],
        payments: [],
        following: [],
        activity: [],
        stats: {
          totalMinds: 0,
          trendingMinds: 0,
          activeMinds: 0,
          provenMinds: 0,
          totalPortfolioValue: 0,
        },
      });
    }

    const db = getDb();

    // ─── Creator's Minds (Ideas with Agents) ─────────────────────────────
    let minds: any[] = [];
    try {
      minds = db.prepare(`
        SELECT
          i.id as idea_id,
          i.content,
          i.status as idea_status,
          i.created_at as idea_created_at,
          a.id as agent_id,
          a.thesis,
          a.confidence,
          a.credibility,
          a.prediction_accuracy,
          a.calibration_score,
          a.lifecycle_status,
          a.estimated_value,
          a.market_status,
          a.created_at as agent_created_at,
          ma.creator_allocation,
          ma.community_allocation,
          ma.market_status as asset_market_status,
          COALESCE((SELECT COUNT(*) FROM evidence WHERE agent_id = a.id), 0) as evidence_count,
          COALESCE((SELECT COUNT(*) FROM arguments WHERE agent_id = a.id), 0) as argument_count,
          COALESCE((SELECT COUNT(*) FROM debates WHERE agent_a = a.id OR agent_b = a.id), 0) as debate_count,
          COALESCE((SELECT COUNT(*) FROM idea_follows WHERE idea_id = i.id), 0) as follower_count,
          COALESCE((SELECT COUNT(*) FROM predictions WHERE mind_id = a.id), 0) as prediction_count,
          COALESCE((SELECT COUNT(*) FROM predictions WHERE mind_id = a.id AND status IN ('CORRECT','VERIFIED')), 0) as correct_predictions
        FROM ideas i
        LEFT JOIN agents a ON a.idea_id = i.id
        LEFT JOIN mind_assets ma ON ma.mind_id = a.id
        WHERE i.creator_id = ?
        ORDER BY i.created_at DESC
      `).all(user.id) as any[];
    } catch (e: any) {
      console.error('[Profile] Minds query error:', e.message);
    }

    // ─── Track Record Calculation ────────────────────────────────────────
    let totalConfidence = 0;
    let totalCredibility = 0;
    let totalPredictionAccuracy = 0;
    let totalCalibration = 0;
    let totalFollowers = 0;
    let totalEvidenceQuality = 0;
    let totalDebateScore = 0;
    let trendingCount = 0;
    let activeCount = 0;
    let provenCount = 0;
    let totalValue = 0;
    let agentCount = 0;

    for (const m of minds) {
      if (!m.agent_id) continue;
      agentCount++;
      totalConfidence += m.confidence || 50;
      totalCredibility += m.credibility || 50;
      totalPredictionAccuracy += m.prediction_accuracy || 0;
      totalCalibration += m.calibration_score || 100;
      totalFollowers += m.follower_count || 0;
      totalValue += m.estimated_value || 1000;

      // Evidence quality: normalized from evidence count and credibility
      const evidenceScore = Math.min(100, ((m.evidence_count || 0) * 8) + (m.credibility || 50) * 0.3);
      totalEvidenceQuality += evidenceScore;

      // Debate performance estimate
      const debateScore = m.debate_count > 0 ? Math.min(100, 50 + (m.credibility - 50) * 0.5) : 50;
      totalDebateScore += debateScore;

      // Categorize lifecycle
      const momentum = (m.follower_count || 0) * 3 + (m.argument_count || 0) * 5 + (m.evidence_count || 0) * 2;
      if (momentum >= 30) trendingCount++;
      if (['INCUBATING', 'PROVEN', 'MARKET_READY', 'MARKET_ACTIVE'].includes(m.lifecycle_status)) activeCount++;
      if (['PROVEN', 'MARKET_READY', 'MARKET_ACTIVE'].includes(m.lifecycle_status)) provenCount++;
    }

    const mindSuccessRate = minds.length > 0
      ? Math.round((minds.filter(m => m.idea_status === 'PUBLISHED').length / minds.length) * 100)
      : 0;

    const trackRecord = {
      predictionAccuracy: agentCount > 0 ? Math.round(totalPredictionAccuracy / agentCount * 100) : 0,
      calibrationScore: agentCount > 0 ? Math.round(totalCalibration / agentCount) : 0,
      evidenceQuality: agentCount > 0 ? Math.round(totalEvidenceQuality / agentCount) : 0,
      debatePerformance: agentCount > 0 ? Math.round(totalDebateScore / agentCount) : 0,
      mindSuccessRate,
      totalFollowers,
    };

    // Creator reputation = weighted average of all track record metrics
    const reputation = Math.round(
      (trackRecord.predictionAccuracy * 0.30 +
       trackRecord.calibrationScore * 0.15 +
       trackRecord.evidenceQuality * 0.20 +
       trackRecord.debatePerformance * 0.15 +
       trackRecord.mindSuccessRate * 0.10 +
       Math.min(100, totalFollowers * 2) * 0.10)
    );

    // ─── Portfolio (Mind Shares in other Minds) ──────────────────────────
    let portfolio: any[] = [];
    try {
      portfolio = db.prepare(`
        SELECT
          mf.mind_id,
          mf.allocation_percentage,
          mf.allocation_status,
          mf.created_at,
          a.thesis,
          a.confidence,
          a.credibility,
          a.estimated_value,
          a.lifecycle_status,
          i.content as idea_content
        FROM mind_founders mf
        JOIN agents a ON a.id = mf.mind_id
        JOIN ideas i ON i.agent_id = a.id
        WHERE mf.creator_id = ?
        ORDER BY mf.created_at DESC
      `).all(user.id) as any[];
    } catch (e: any) {
      console.error('[Profile] Portfolio query error:', e.message);
    }

    // ─── Payments (Transaction History) ──────────────────────────────────
    let payments: any[] = [];
    try {
      payments = db.prepare(`
        SELECT
          p.id,
          p.idea_id,
          p.chain,
          p.tx_hash,
          p.amount,
          p.token,
          p.recipient,
          p.status,
          p.created_at,
          p.verified_at,
          i.content as idea_content
        FROM payments p
        LEFT JOIN ideas i ON p.idea_id = i.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `).all(user.id) as any[];
    } catch (e: any) {
      console.error('[Profile] Payments query error:', e.message);
    }

    // ─── Following (Ideas user is tracking) ──────────────────────────────
    let following: any[] = [];
    try {
      following = db.prepare(`
        SELECT
          f.idea_id,
          f.created_at as followed_at,
          i.content,
          i.status as idea_status,
          a.id as agent_id,
          a.confidence,
          a.credibility,
          a.estimated_value,
          a.lifecycle_status,
          u.wallet_address as creator_wallet
        FROM idea_follows f
        JOIN ideas i ON f.idea_id = i.id
        LEFT JOIN agents a ON a.idea_id = i.id
        LEFT JOIN users u ON u.id = i.creator_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `).all(user.id) as any[];
    } catch (e: any) {
      console.error('[Profile] Following query error:', e.message);
    }

    // ─── Activity Timeline ───────────────────────────────────────────────
    let activity: any[] = [];
    try {
      // Get agent events for all of user's minds
      const agentIds = minds.filter(m => m.agent_id).map(m => m.agent_id);
      if (agentIds.length > 0) {
        const placeholders = agentIds.map(() => '?').join(',');
        const agentEvents = db.prepare(`
          SELECT
            ae.id,
            ae.agent_id,
            ae.event_type,
            ae.content,
            ae.source,
            ae.confidence_before,
            ae.confidence_after,
            ae.created_at,
            a.thesis
          FROM agent_events ae
          LEFT JOIN agents a ON ae.agent_id = a.id
          WHERE ae.agent_id IN (${placeholders})
          ORDER BY ae.created_at DESC
          LIMIT 30
        `).all(...agentIds) as any[];

        activity = agentEvents.map(e => ({
          type: 'AGENT_EVENT',
          eventType: e.event_type,
          content: e.content,
          source: e.source,
          agentId: e.agent_id,
          thesis: e.thesis,
          confidenceBefore: e.confidence_before,
          confidenceAfter: e.confidence_after,
          createdAt: e.created_at,
        }));
      }

      // Merge payment events
      for (const p of payments.slice(0, 10)) {
        activity.push({
          type: 'PAYMENT',
          eventType: p.status === 'CONFIRMED' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING',
          content: `${p.amount} ${p.token} on ${p.chain}`,
          txHash: p.tx_hash,
          chain: p.chain,
          createdAt: p.created_at,
        });
      }

      // Sort by date descending
      activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      activity = activity.slice(0, 30);
    } catch (e: any) {
      console.error('[Profile] Activity query error:', e.message);
    }

    // ─── Stats Summary ───────────────────────────────────────────────────
    const totalPortfolioValue = portfolio.reduce((sum, p) => {
      return sum + ((p.estimated_value || 1000) * (p.allocation_percentage || 0) / 100);
    }, 0);

    return NextResponse.json({
      exists: true,
      address,
      userId: user.id,
      joinedAt: (user as any).created_at || user.createdAt,
      reputation,
      trackRecord,
      minds: minds.map(m => ({
        ideaId: m.idea_id,
        agentId: m.agent_id,
        content: m.content,
        thesis: m.thesis,
        ideaStatus: m.idea_status,
        confidence: m.confidence || 50,
        credibility: m.credibility || 50,
        predictionAccuracy: m.prediction_accuracy || 0,
        lifecycleStatus: m.lifecycle_status || 'INCUBATING',
        estimatedValue: m.estimated_value || 1000,
        creatorAllocation: m.creator_allocation || 15,
        evidenceCount: m.evidence_count || 0,
        argumentCount: m.argument_count || 0,
        debateCount: m.debate_count || 0,
        followerCount: m.follower_count || 0,
        predictionCount: m.prediction_count || 0,
        correctPredictions: m.correct_predictions || 0,
        createdAt: m.idea_created_at,
        momentum: Math.min(100, (m.follower_count || 0) * 3 + (m.argument_count || 0) * 5 + (m.evidence_count || 0) * 2),
      })),
      portfolio: portfolio.map(p => ({
        mindId: p.mind_id,
        thesis: p.thesis || p.idea_content,
        allocationPercentage: p.allocation_percentage,
        allocationStatus: p.allocation_status,
        confidence: p.confidence || 50,
        credibility: p.credibility || 50,
        estimatedValue: p.estimated_value || 1000,
        lifecycleStatus: p.lifecycle_status || 'INCUBATING',
        createdAt: p.created_at,
      })),
      payments: payments.map(p => ({
        id: p.id,
        ideaId: p.idea_id,
        ideaContent: p.idea_content,
        chain: p.chain,
        txHash: p.tx_hash,
        amount: p.amount,
        token: p.token,
        status: p.status,
        createdAt: p.created_at,
        verifiedAt: p.verified_at,
      })),
      following: following.map(f => ({
        ideaId: f.idea_id,
        content: f.content,
        agentId: f.agent_id,
        confidence: f.confidence || 50,
        credibility: f.credibility || 50,
        estimatedValue: f.estimated_value || 1000,
        lifecycleStatus: f.lifecycle_status || 'INCUBATING',
        creatorWallet: f.creator_wallet,
        followedAt: f.followed_at,
      })),
      activity,
      stats: {
        totalMinds: minds.length,
        trendingMinds: trendingCount,
        activeMinds: activeCount,
        provenMinds: provenCount,
        totalPortfolioValue: Math.round(totalPortfolioValue + totalValue),
      },
    });
  } catch (error: any) {
    console.error('[Profile] API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
