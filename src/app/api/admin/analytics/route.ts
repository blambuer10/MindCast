// ============================================================================
// MINDCAST — Analytics API Endpoint
// Provides time-series data, distributions, and growth metrics for dashboard
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/connection';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const payload: any = {
    timestamp: new Date().toISOString(),
    overview: {
      totalUsers: 0,
      totalMinds: 0,
      totalStakes: 0,
      totalPayments: 0,
      totalRevenue: 0,
      totalArguments: 0,
      totalDebates: 0,
      totalEvidence: 0,
      avgReputation: 0,
      activeMinds: 0,
    },
    userGrowth: [],        // time-series: users joined per day
    revenueTimeline: [],   // time-series: revenue per day
    stakesTimeline: [],    // time-series: stakes per day
    reputationDistribution: [], // histogram: reputation ranges
    topUsers: [],          // top 15 users by activity score
    mindsByStatus: [],     // pie-chart: minds by lifecycle
    stakesBySide: { support: 0, challenge: 0 },
    topMinds: [],          // top minds by evidence + follower
    recentActivity: [],    // last 50 actions across the platform
    userActivityMap: [],   // user activity heatmap data
    paymentsByChain: [],   // payments grouped by chain
    dailyActiveUsers: [],  // DAU time series
  };

  try {
    const db = getDb();

    // ── OVERVIEW METRICS ──
    try {
      payload.overview.totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
      payload.overview.totalMinds = (db.prepare('SELECT COUNT(*) as c FROM ideas').get() as any)?.c || 0;
      payload.overview.totalStakes = (db.prepare('SELECT COUNT(*) as c FROM argument_stakes').get() as any)?.c || 0;
      payload.overview.totalPayments = (db.prepare('SELECT COUNT(*) as c FROM payments').get() as any)?.c || 0;
      payload.overview.totalRevenue = (db.prepare("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as c FROM payments WHERE status = 'CONFIRMED'").get() as any)?.c || 0;
      payload.overview.totalArguments = (db.prepare('SELECT COUNT(*) as c FROM arguments').get() as any)?.c || 0;
      payload.overview.totalDebates = (db.prepare('SELECT COUNT(*) as c FROM debates').get() as any)?.c || 0;
      payload.overview.totalEvidence = (db.prepare('SELECT COUNT(*) as c FROM evidence').get() as any)?.c || 0;
      payload.overview.activeMinds = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'PUBLISHED'").get() as any)?.c || 0;
      const avgRep = (db.prepare('SELECT AVG(COALESCE(reputation, 100)) as c FROM users').get() as any)?.c;
      payload.overview.avgReputation = avgRep ? Math.round(avgRep) : 100;
    } catch (e: any) {
      console.error('[Analytics] Overview error:', e.message);
    }

    // ── USER GROWTH TIMELINE ──
    try {
      payload.userGrowth = db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at IS NOT NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        LIMIT 60
      `).all();
    } catch (_) {}

    // ── REVENUE TIMELINE ──
    try {
      payload.revenueTimeline = db.prepare(`
        SELECT DATE(created_at) as date, SUM(CAST(amount AS REAL)) as revenue, COUNT(*) as tx_count
        FROM payments
        WHERE status = 'CONFIRMED'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        LIMIT 60
      `).all();
    } catch (_) {}

    // ── STAKES TIMELINE ──
    try {
      payload.stakesTimeline = db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count, SUM(CAST(amount AS REAL)) as volume
        FROM argument_stakes
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        LIMIT 60
      `).all();
    } catch (_) {}

    // ── REPUTATION DISTRIBUTION ──
    try {
      const users = db.prepare(`
        SELECT COALESCE(reputation, 100) as rep FROM users
      `).all() as any[];
      
      const buckets = [
        { label: '0-59', min: 0, max: 59, count: 0, color: '#ef4444' },
        { label: '60-69', min: 60, max: 69, count: 0, color: '#f97316' },
        { label: '70-79', min: 70, max: 79, count: 0, color: '#eab308' },
        { label: '80-84', min: 80, max: 84, count: 0, color: '#84cc16' },
        { label: '85-89', min: 85, max: 89, count: 0, color: '#22c55e' },
        { label: '90-94', min: 90, max: 94, count: 0, color: '#14b8a6' },
        { label: '95-100', min: 95, max: 100, count: 0, color: '#06b6d4' },
      ];

      for (const u of users) {
        for (const b of buckets) {
          if (u.rep >= b.min && u.rep <= b.max) {
            b.count++;
            break;
          }
        }
      }
      payload.reputationDistribution = buckets;
    } catch (_) {}

    // ── TOP USERS BY COMPOSITE SCORE ──
    try {
      payload.topUsers = db.prepare(`
        SELECT 
          u.id,
          u.wallet_address,
          u.username,
          u.display_name,
          u.avatar_url,
          COALESCE(u.reputation, 100) as reputation,
          u.created_at,
          (SELECT COUNT(*) FROM ideas WHERE creator_id = u.id OR LOWER(creator_id) = LOWER(u.wallet_address)) as minds_count,
          (SELECT COUNT(*) FROM arguments WHERE LOWER(author_wallet) = LOWER(u.wallet_address)) as arguments_count,
          (SELECT COUNT(*) FROM argument_stakes WHERE LOWER(user_wallet) = LOWER(u.wallet_address)) as stakes_count,
          (SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) FROM argument_stakes WHERE LOWER(user_wallet) = LOWER(u.wallet_address)) as total_staked,
          (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND status = 'CONFIRMED') as payments_count
        FROM users u
        ORDER BY (minds_count * 10 + arguments_count * 5 + stakes_count * 3 + payments_count * 8) DESC
        LIMIT 15
      `).all();
    } catch (_) {}

    // ── MINDS BY STATUS ──
    try {
      const published = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'PUBLISHED'").get() as any)?.c || 0;
      const draft = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'DRAFT' OR status IS NULL").get() as any)?.c || 0;
      const archived = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'ARCHIVED'").get() as any)?.c || 0;

      // Lifecycle from agents
      let incubating = 0, proven = 0, challenged = 0;
      try {
        incubating = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE lifecycle_status = 'INCUBATING'").get() as any)?.c || 0;
        proven = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE lifecycle_status = 'PROVEN'").get() as any)?.c || 0;
        challenged = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE lifecycle_status = 'CHALLENGED'").get() as any)?.c || 0;
      } catch (_) {}

      payload.mindsByStatus = [
        { status: 'Published', count: published, color: '#4ade80' },
        { status: 'Draft', count: draft, color: '#94a3b8' },
        { status: 'Incubating', count: incubating, color: '#38bdf8' },
        { status: 'Proven', count: proven, color: '#a78bfa' },
        { status: 'Challenged', count: challenged, color: '#f472b6' },
        { status: 'Archived', count: archived, color: '#6b7280' },
      ].filter(s => s.count > 0);
    } catch (_) {}

    // ── STAKES BY SIDE ──
    try {
      payload.stakesBySide.support = (db.prepare("SELECT COUNT(*) as c FROM argument_stakes WHERE UPPER(side) = 'SUPPORT'").get() as any)?.c || 0;
      payload.stakesBySide.challenge = (db.prepare("SELECT COUNT(*) as c FROM argument_stakes WHERE UPPER(side) = 'CHALLENGE'").get() as any)?.c || 0;
    } catch (_) {}

    // ── TOP MINDS ──
    try {
      payload.topMinds = db.prepare(`
        SELECT 
          i.id,
          i.content as thesis,
          i.status,
          i.created_at,
          u.username as creator_name,
          u.wallet_address as creator_wallet,
          a.credibility,
          a.prediction_accuracy,
          a.lifecycle_status,
          a.estimated_value,
          (SELECT COUNT(*) FROM evidence WHERE agent_id = a.id) as evidence_count,
          (SELECT COUNT(*) FROM debates WHERE agent_a = a.id OR agent_b = a.id) as debate_count,
          (SELECT COUNT(*) FROM idea_follows WHERE idea_id = i.id) as follower_count,
          (SELECT COUNT(*) FROM arguments WHERE agent_id = a.id) as argument_count
        FROM ideas i
        LEFT JOIN users u ON i.creator_id = u.id OR LOWER(i.creator_id) = LOWER(u.wallet_address)
        LEFT JOIN agents a ON (i.agent_id = a.id OR a.idea_id = i.id)
        ORDER BY (evidence_count + debate_count + follower_count + argument_count) DESC
        LIMIT 10
      `).all();
    } catch (_) {}

    // ── RECENT ACTIVITY FEED ──
    try {
      const activities: any[] = [];

      // Recent stakes
      try {
        const recentStakes = db.prepare(`
          SELECT 'stake' as type, s.created_at, s.amount, s.side, s.token, 
                 u.username, u.wallet_address, arg.content as context
          FROM argument_stakes s
          LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(s.user_wallet)
          LEFT JOIN arguments arg ON arg.id = s.argument_id
          ORDER BY s.created_at DESC
          LIMIT 15
        `).all() as any[];
        activities.push(...recentStakes);
      } catch (_) {}

      // Recent payments
      try {
        const recentPayments = db.prepare(`
          SELECT 'payment' as type, p.created_at, p.amount, p.status as side, p.token,
                 u.username, u.wallet_address, i.content as context
          FROM payments p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN ideas i ON p.idea_id = i.id
          ORDER BY p.created_at DESC
          LIMIT 15
        `).all() as any[];
        activities.push(...recentPayments);
      } catch (_) {}

      // Recent arguments
      try {
        const recentArgs = db.prepare(`
          SELECT 'argument' as type, arg.created_at, 0 as amount, arg.type as side, 'N/A' as token,
                 u.username, arg.author_wallet as wallet_address, arg.content as context
          FROM arguments arg
          LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(arg.author_wallet)
          ORDER BY arg.created_at DESC
          LIMIT 15
        `).all() as any[];
        activities.push(...recentArgs);
      } catch (_) {}

      // Sort all activities by created_at DESC
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      payload.recentActivity = activities.slice(0, 50);
    } catch (_) {}

    // ── PAYMENTS BY CHAIN ──
    try {
      payload.paymentsByChain = db.prepare(`
        SELECT COALESCE(chain, 'base-sepolia') as chain, COUNT(*) as count, SUM(CAST(amount AS REAL)) as volume
        FROM payments
        GROUP BY chain
      `).all();
    } catch (_) {}

    // ── USER ACTIVITY HEATMAP (users x activity type) ──
    try {
      payload.userActivityMap = db.prepare(`
        SELECT 
          u.username,
          u.display_name,
          COALESCE(u.reputation, 100) as reputation,
          (SELECT COUNT(*) FROM ideas WHERE creator_id = u.id) as minds,
          (SELECT COUNT(*) FROM arguments WHERE LOWER(author_wallet) = LOWER(u.wallet_address)) as arguments,
          (SELECT COUNT(*) FROM argument_stakes WHERE LOWER(user_wallet) = LOWER(u.wallet_address)) as stakes,
          (SELECT COUNT(*) FROM payments WHERE user_id = u.id) as payments,
          (SELECT COUNT(*) FROM idea_follows WHERE user_id = u.id) as follows
        FROM users u
        WHERE u.username IS NOT NULL
        ORDER BY u.username
        LIMIT 32
      `).all();
    } catch (_) {}

  } catch (dbErr: any) {
    console.error('[Analytics] DB connection error:', dbErr.message);
  }

  return NextResponse.json(payload);
}
