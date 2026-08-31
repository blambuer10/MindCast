// ============================================================================
// MINDCAST — Database Query Helpers
// ============================================================================

import { getDb, generateId, toJson, fromJson } from './connection';
import { generateTokenMetadata } from '../utils/token-meta';
import {
  type User,
  type Idea,
  type Agent,
  type AgentEvent,
  type Evidence,
  type Argument,
  type Debate,
  type DebateMessage,
  type Payment,
  type IdeaFollow,
  type IdeaWithMind,
  type FeedFilters,
  IdeaStatus,
  PaymentStatus,
  DebateStatus,
  AgentEventType,
  generateMindId,
} from '../types';

// ─── Users ───────────────────────────────────────────────────────────────

export function findOrCreateUser(walletAddress: string): User {
  const db = getDb();
  const normalized = walletAddress.toLowerCase();

  const existing = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(normalized) as Record<string, unknown> | undefined;
  if (existing) {
    return {
      id: existing.id as string,
      walletAddress: (existing.wallet_address || existing.walletAddress) as string,
      createdAt: (existing.created_at || existing.createdAt) as string,
    };
  }

  const id = generateId();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO users (id, wallet_address, created_at) VALUES (?, ?, ?)').run(id, normalized, now);

  return { id, walletAddress: normalized, createdAt: now };
}

export function getUserByWallet(walletAddress: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress.toLowerCase()) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return {
    id: row.id as string,
    walletAddress: (row.wallet_address || row.walletAddress) as string,
    createdAt: (row.created_at || row.createdAt) as string,
  };
}

export function getUserById(userId: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT id, wallet_address as walletAddress, created_at as createdAt FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return { id: row.id as string, walletAddress: row.walletAddress as string, createdAt: row.createdAt as string };
}

// ─── Ideas ───────────────────────────────────────────────────────────────

export function createIdea(creatorId: string, content: string, tokenName?: string, tokenTicker?: string): Idea {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  // If token metadata is not passed, derive automatically
  const meta = (!tokenName || !tokenTicker)
    ? generateTokenMetadata(content)
    : { tokenName: tokenName.trim(), tokenTicker: tokenTicker.trim().toUpperCase() };

  db.prepare(`
    INSERT INTO ideas (id, creator_id, content, status, token_name, token_ticker, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, creatorId, content, IdeaStatus.PENDING, meta.tokenName, meta.tokenTicker, now);

  return {
    id,
    creatorId,
    content,
    agentId: null,
    status: IdeaStatus.PENDING,
    tokenName: meta.tokenName,
    tokenTicker: meta.tokenTicker,
    createdAt: now,
    publishedAt: null,
  };
}

export function getIdea(id: string): Idea | undefined {
  const db = getDb();
  const cleanId = (id || '').trim();
  const row = db.prepare('SELECT * FROM ideas WHERE UPPER(id) = UPPER(?) OR UPPER(agent_id) = UPPER(?)').get(cleanId, cleanId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapIdea(row);
}

export function publishIdea(id: string, agentId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE ideas SET status = ?, agent_id = ?, published_at = ? WHERE id = ?
  `).run(IdeaStatus.PUBLISHED, agentId, now, id);
}

export function flagIdea(id: string): void {
  const db = getDb();
  db.prepare('UPDATE ideas SET status = ? WHERE id = ?').run(IdeaStatus.FLAGGED, id);
}

export function getIdeasFeed(filters: FeedFilters): IdeaWithMind[] {
  const db = getDb();
  const offset = (filters.page - 1) * filters.limit;

  let orderBy = 'i.published_at DESC';
  if (filters.tab === 'trending') {
    orderBy = `(
      COALESCE((SELECT COUNT(*) FROM idea_follows f WHERE f.idea_id = i.id), 0) * 3 +
      COALESCE((SELECT COUNT(*) FROM agent_events ae WHERE ae.agent_id = a.id AND ae.created_at > datetime('now', '-24 hours')), 0) * 5 +
      COALESCE((SELECT COUNT(*) FROM debates d WHERE (d.idea_a = i.id OR d.idea_b = i.id) AND d.status = 'ACTIVE'), 0) * 10
    ) DESC`;
  } else if (filters.tab === 'debating') {
    orderBy = `(
      SELECT COUNT(*) FROM debates d WHERE (d.idea_a = i.id OR d.idea_b = i.id) AND d.status = 'ACTIVE'
    ) DESC`;
  } else if (filters.tab === 'top-mcap') {
    orderBy = 'COALESCE(a.estimated_value, 0) DESC, a.credibility DESC';
  } else if (filters.tab === 'dex') {
    orderBy = `(
      CASE 
        WHEN a.lifecycle_status = 'MARKET_ACTIVE' THEN 4
        WHEN a.lifecycle_status = 'PROVEN' THEN 3
        WHEN a.lifecycle_status = 'EMERGING' THEN 2
        ELSE 1
      END
    ) DESC, COALESCE(a.estimated_value, 0) DESC`;
  }

  const rows = db.prepare(`
    SELECT
      i.*,
      a.id as agent_id_join,
      a.thesis,
      a.confidence,
      a.credibility,
      a.system_prompt,
      a.lifecycle_status,
      a.prediction_accuracy,
      a.calibration_score,
      a.estimated_value,
      a.market_status,
      a.created_at as agent_created_at,
      a.updated_at as agent_updated_at,
      u.wallet_address as creator_wallet,
      COALESCE((SELECT COUNT(*) FROM idea_follows f WHERE f.idea_id = i.id), 0) as follower_count,
      COALESCE((SELECT COUNT(*) FROM arguments arg WHERE arg.agent_id = a.id), 0) as argument_count,
      COALESCE((SELECT COUNT(*) FROM evidence ev WHERE ev.agent_id = a.id), 0) as evidence_count
    FROM ideas i
    LEFT JOIN agents a ON a.idea_id = i.id
    LEFT JOIN users u ON u.id = i.creator_id
    WHERE i.status = 'PUBLISHED'
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(filters.limit, offset) as Record<string, unknown>[];

  return rows.map(mapIdeaWithMind);
}

export function getIdeasByCreator(creatorId: string): Idea[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM ideas WHERE creator_id = ? ORDER BY created_at DESC').all(creatorId) as Record<string, unknown>[];
  return rows.map(mapIdea);
}

// ─── Agents (Minds) ─────────────────────────────────────────────────────

export function createAgent(ideaId: string, thesis: string, systemPrompt: string): Agent {
  const db = getDb();
  const id = generateMindId();
  const now = new Date().toISOString();
  const defaultBudget = parseFloat(process.env.PAYMENT_AMOUNT || '1.0');

  db.prepare(`
    INSERT INTO agents (id, idea_id, thesis, confidence, credibility, system_prompt, compute_budget, compute_spent, compute_remaining, created_at, updated_at)
    VALUES (?, ?, ?, 50.0, 50.0, ?, ?, 0.0, ?, ?, ?)
  `).run(id, ideaId, thesis, systemPrompt, defaultBudget, defaultBudget, now, now);

  db.prepare('UPDATE ideas SET agent_id = ? WHERE id = ?').run(id, ideaId);

  db.prepare(`
    INSERT INTO mind_thesis_versions (id, mind_id, version, thesis, reason, generated_by, confidence, created_at)
    VALUES (?, ?, 1, ?, 'Original Thesis Birth', 'USER', 50.0, ?)
  `).run(generateId(), id, thesis, now);

  return {
    id,
    ideaId,
    thesis,
    confidence: 50,
    credibility: 50,
    systemPrompt,
    computeBudget: defaultBudget,
    computeSpent: 0,
    computeRemaining: defaultBudget,
    lifecycleStatus: 'INCUBATING',
    predictionAccuracy: 0.0,
    calibrationScore: 100.0,
    estimatedValue: 1000.0,
    marketStatus: 'INACTIVE',
    createdAt: now,
    updatedAt: now,
  };
}

export function getAgent(id: string): Agent | undefined {
  const db = getDb();
  const cleanId = (id || '').trim();
  const row = db.prepare('SELECT * FROM agents WHERE UPPER(id) = UPPER(?) OR UPPER(idea_id) = UPPER(?)').get(cleanId, cleanId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapAgent(row);
}

export function getAgentByIdea(ideaId: string): Agent | undefined {
  const db = getDb();
  const cleanId = (ideaId || '').trim();
  const row = db.prepare('SELECT * FROM agents WHERE UPPER(idea_id) = UPPER(?) OR UPPER(id) = UPPER(?)').get(cleanId, cleanId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapAgent(row);
}

export function updateAgentConfidence(id: string, confidence: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE agents SET confidence = ?, updated_at = ? WHERE id = ?').run(confidence, now, id);
  recordBeliefSnapshotInternal(db, id, now);
}

export function updateAgentCredibility(id: string, credibility: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE agents SET credibility = ?, updated_at = ? WHERE id = ?').run(credibility, now, id);
  recordBeliefSnapshotInternal(db, id, now);
}

function recordBeliefSnapshotInternal(db: any, mindId: string, now: string): void {
  try {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(mindId);
    if (!agent) return;

    const evRow = db.prepare("SELECT COUNT(*) as c FROM evidence WHERE agent_id = ? AND direction = 'SUPPORTING'").get(mindId) || { c: 0 };
    const cevRow = db.prepare("SELECT COUNT(*) as c FROM evidence WHERE agent_id = ? AND direction = 'OPPOSING'").get(mindId) || { c: 0 };
    const fRow = db.prepare('SELECT COUNT(*) as c FROM idea_follows WHERE idea_id = ?').get(agent.idea_id) || { c: 0 };
    const dRow = db.prepare('SELECT COUNT(*) as c FROM debates WHERE (agent_a = ? OR agent_b = ?)').get(mindId, mindId) || { c: 0 };

    const id = 'SST-' + Math.random().toString(36).substring(2, 11).toUpperCase();

    db.prepare(`
      INSERT INTO mind_belief_snapshots (
        id, mind_id, confidence, credibility, evidence_count, counter_evidence_count,
        prediction_accuracy, followers, debate_count, timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      mindId,
      agent.confidence,
      agent.credibility,
      evRow.c,
      cevRow.c,
      agent.prediction_accuracy || 0.0,
      fRow.c,
      dRow.c,
      now
    );
  } catch (err) {
    console.error('Failed to record belief snapshot:', err);
  }
}

export function updateAgentAnalysis(id: string, assumptions: string[], strengths: string[], weaknesses: string[]): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE agents SET assumptions = ?, strengths = ?, weaknesses = ?, updated_at = ? WHERE id = ?')
    .run(toJson(assumptions), toJson(strengths), toJson(weaknesses), now, id);
}

export function spendAgentCompute(id: string, cost: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE agents 
    SET compute_spent = compute_spent + ?, 
        compute_remaining = MAX(0, compute_remaining - ?),
        updated_at = ? 
    WHERE id = ?
  `).run(cost, cost, now, id);
}

// ─── Agent Events ────────────────────────────────────────────────────────

export function createAgentEvent(
  agentId: string,
  eventType: AgentEventType,
  content: string,
  source?: string,
  confidenceBefore?: number,
  confidenceAfter?: number,
): AgentEvent {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO agent_events (id, agent_id, event_type, content, source, confidence_before, confidence_after, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, agentId, eventType, content, source ?? null, confidenceBefore ?? null, confidenceAfter ?? null, now);

  return {
    id,
    agentId,
    eventType,
    content,
    source: source ?? null,
    confidenceBefore: confidenceBefore ?? null,
    confidenceAfter: confidenceAfter ?? null,
    createdAt: now,
  };
}

export function getAgentEvents(agentId: string, limit = 50): AgentEvent[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM agent_events WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(agentId, limit) as Record<string, unknown>[];
  return rows.map(mapAgentEvent);
}

// ─── Evidence ────────────────────────────────────────────────────────────

function updateSourceIntelligenceInternal(
  db: any,
  domain: string,
  publisher: string | null,
  sourceType: string,
  citChange: number,
  evChange: number,
  suppChange: number,
  oppChange: number,
  reliability: number,
  relevance: number
): void {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM source_intelligence WHERE domain = ?').get(domain);

  if (existing) {
    const nextCitation = (existing.citation_count || 0) + citChange;
    const nextEvidence = (existing.evidence_count || 0) + evChange;
    const nextSupporting = (existing.supporting_count || 0) + suppChange;
    const nextOpposing = (existing.opposing_count || 0) + oppChange;
    
    const prevWeight = existing.evidence_count || 0;
    const newWeight = evChange;
    const totalWeight = prevWeight + newWeight;
    
    let nextReliability = existing.average_reliability || 50.0;
    let nextRelevance = existing.average_relevance || 50.0;

    if (totalWeight > 0) {
      nextReliability = ((nextReliability * prevWeight) + (reliability * newWeight)) / totalWeight;
      nextRelevance = ((nextRelevance * prevWeight) + (relevance * newWeight)) / totalWeight;
    }

    db.prepare(`
      UPDATE source_intelligence
      SET publisher = ?, citation_count = ?, evidence_count = ?, supporting_count = ?, opposing_count = ?,
          average_reliability = ?, average_relevance = ?, updated_at = ?
      WHERE domain = ?
    `).run(publisher || existing.publisher, nextCitation, nextEvidence, nextSupporting, nextOpposing, nextReliability, nextRelevance, now, domain);
  } else {
    db.prepare(`
      INSERT INTO source_intelligence (
        domain, publisher, source_type, citation_count, evidence_count,
        supporting_count, opposing_count, average_reliability, average_relevance, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(domain, publisher, sourceType, citChange, evChange, suppChange, oppChange, reliability, relevance, now);
  }
}

export function createEvidence(data: Omit<Evidence, 'id' | 'discoveredAt'>): Evidence {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  // Handle both upgraded format and fallback/legacy parameter passing
  const claim = data.claim || data.snippet || '';
  const direction = data.direction || data.stance || 'NEUTRAL';
  const sourceUrl = data.sourceUrl || data.url || '';
  const sourceName = data.sourceName || data.source || '';
  const sourceType = data.sourceType || 'NEWS';
  const reliability = data.reliabilityScore ?? 50;
  const relevance = data.relevanceScore ?? 50;
  const strength = data.strengthScore ?? 50;
  const impact = data.confidenceImpact ?? 0;
  const status = data.status || 'NEW';

  db.prepare(`
    INSERT INTO evidence (
      id, agent_id, claim, direction, source_url, source_name, source_type, 
      published_at, discovered_at, reliability_score, relevance_score, 
      strength_score, confidence_impact, status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.agentId, claim, direction, sourceUrl, sourceName, sourceType, 
    data.publishedAt ?? null, now, reliability, relevance, strength, impact, status, now
  );

  // Update source intelligence trajectory statistics
  let domain = 'unknown';
  try {
    if (sourceUrl) {
      const urlObj = new URL(sourceUrl);
      domain = urlObj.hostname;
    }
  } catch (_) {
    domain = sourceUrl || 'unknown';
  }
  updateSourceIntelligenceInternal(db, domain, sourceName, sourceType, 1, 1, direction === 'SUPPORTING' ? 1 : 0, direction === 'OPPOSING' ? 1 : 0, reliability, relevance);

  return {
    ...data,
    id,
    claim,
    direction,
    sourceUrl,
    sourceName,
    sourceType,
    discoveredAt: now,
    reliabilityScore: reliability,
    relevanceScore: relevance,
    strengthScore: strength,
    confidenceImpact: impact,
    status
  };
}

export function getEvidenceByAgent(agentId: string): Evidence[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM evidence WHERE agent_id = ? ORDER BY discovered_at DESC').all(agentId) as Record<string, unknown>[];
  return rows.map(mapEvidence);
}

// ─── Arguments ───────────────────────────────────────────────────────────

export function createArgument(agentId: string, content: string, evidenceIds: string[], strength: number): Argument {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO arguments (id, agent_id, content, supporting_evidence_ids, strength, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, agentId, content, toJson(evidenceIds), strength, now);

  return { id, agentId, content, supportingEvidenceIds: evidenceIds, strength, createdAt: now };
}

export function getArgumentsByAgent(agentId: string): Argument[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM arguments WHERE agent_id = ? ORDER BY strength DESC').all(agentId) as Record<string, unknown>[];
  return rows.map(mapArgument);
}

// ─── Payments ────────────────────────────────────────────────────────────

export function createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'verifiedAt'>): Payment {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO payments (id, user_id, idea_id, chain, tx_hash, amount, token, recipient, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.userId, data.ideaId, data.chain, data.txHash, data.amount, data.token, data.recipient, data.status, now);

  return { ...data, id, createdAt: now, verifiedAt: null };
}

export function updatePaymentStatus(id: string, status: PaymentStatus): void {
  const db = getDb();
  const verifiedAt = status === PaymentStatus.CONFIRMED ? new Date().toISOString() : null;
  db.prepare('UPDATE payments SET status = ?, verified_at = ? WHERE id = ?').run(status, verifiedAt, id);
}

export function getPayment(id: string): Payment | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapPayment(row);
}

export function getPaymentByTxHash(chain: string, txHash: string): Payment | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM payments WHERE chain = ? AND tx_hash = ?').get(chain, txHash) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapPayment(row);
}

export function getPaymentByIdea(ideaId: string): Payment | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM payments WHERE idea_id = ? AND status = ?').get(ideaId, PaymentStatus.CONFIRMED) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapPayment(row);
}

// ─── Follows ─────────────────────────────────────────────────────────────

export function followIdea(userId: string, ideaId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO idea_follows (user_id, idea_id, created_at) VALUES (?, ?, ?)
  `).run(userId, ideaId, now);
}

export function unfollowIdea(userId: string, ideaId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM idea_follows WHERE user_id = ? AND idea_id = ?').run(userId, ideaId);
}

export function isFollowing(userId: string, ideaId: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT 1 FROM idea_follows WHERE user_id = ? AND idea_id = ?').get(userId, ideaId);
  return !!row;
}

export function getFollowerCount(ideaId: string): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM idea_follows WHERE idea_id = ?').get(ideaId) as { count: number };
  return row.count;
}

// ─── Debates ─────────────────────────────────────────────────────────────

export function createDebate(ideaA: string, ideaB: string, agentA: string, agentB: string): Debate {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO debates (id, idea_a, idea_b, agent_a, agent_b, status, current_round, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, ideaA, ideaB, agentA, agentB, DebateStatus.ACTIVE, now);

  return {
    id, ideaA, ideaB, agentA, agentB,
    status: DebateStatus.ACTIVE,
    currentRound: 1,
    createdAt: now,
    completedAt: null,
  };
}

export function getDebate(id: string): Debate | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM debates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapDebate(row);
}

export function advanceDebateRound(id: string, round: number): void {
  const db = getDb();
  db.prepare('UPDATE debates SET current_round = ? WHERE id = ?').run(round, id);
}

export function completeDebate(id: string, resultSummary: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE debates SET status = ?, completed_at = ?, result_summary = ? WHERE id = ?')
    .run(DebateStatus.COMPLETED, now, resultSummary, id);
}

export function createDebateMessage(debateId: string, agentId: string, round: number, content: string, sources: string[]): DebateMessage {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO debate_messages (id, debate_id, agent_id, round, content, sources, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, debateId, agentId, round, content, toJson(sources), now);

  return { id, debateId, agentId, round, content, sources, createdAt: now };
}

export function getDebateMessages(debateId: string): DebateMessage[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM debate_messages WHERE debate_id = ? ORDER BY round, created_at').all(debateId) as Record<string, unknown>[];
  return rows.map(mapDebateMessage);
}

export function getActiveDebatesByAgent(agentId: string): Debate[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM debates WHERE (agent_a = ? OR agent_b = ?) AND status = ? ORDER BY created_at DESC'
  ).all(agentId, agentId, DebateStatus.ACTIVE) as Record<string, unknown>[];
  return rows.map(mapDebate);
}

// ─── Admin Metrics ───────────────────────────────────────────────────────

export function getAdminMetrics() {
  const db = getDb();

  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const totalIdeas = (db.prepare('SELECT COUNT(*) as c FROM ideas').get() as { c: number }).c;
  const publishedIdeas = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'PUBLISHED'").get() as { c: number }).c;
  const flaggedIdeas = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'FLAGGED'").get() as { c: number }).c;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as c FROM payments WHERE status = 'CONFIRMED'").get() as { c: number }).c;
  const totalDebates = (db.prepare('SELECT COUNT(*) as c FROM debates').get() as { c: number }).c;
  const activeDebates = (db.prepare("SELECT COUNT(*) as c FROM debates WHERE status = 'ACTIVE'").get() as { c: number }).c;

  const dailyIdeas = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE created_at > datetime('now', '-24 hours')").get() as { c: number }).c;
  const dailyRevenue = (db.prepare("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as c FROM payments WHERE status = 'CONFIRMED' AND created_at > datetime('now', '-24 hours')").get() as { c: number }).c;

  return {
    totalUsers,
    totalIdeas,
    publishedIdeas,
    flaggedIdeas,
    totalRevenue,
    totalDebates,
    activeDebates,
    dailyIdeas,
    dailyRevenue,
  };
}

// ─── Row Mappers ─────────────────────────────────────────────────────────

export function mapIdea(row: Record<string, unknown>): Idea {
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    content: row.content as string,
    agentId: row.agent_id as string | null,
    status: row.status as IdeaStatus,
    tokenName: (row.token_name as string) || (row.id === '63154d39-7165-4219-adb0-27950a4b32b0' ? 'Autonomous Cognitive Capital' : null),
    tokenTicker: (row.token_ticker as string) || (row.id === '63154d39-7165-4219-adb0-27950a4b32b0' ? 'ACC' : null),
    createdAt: row.created_at as string,
    publishedAt: row.published_at as string | null,
  };
}

export function mapAgent(row: Record<string, unknown>): Agent {
  return {
    id: row.id as string,
    ideaId: row.idea_id as string,
    thesis: row.thesis as string,
    confidence: row.confidence as number,
    credibility: row.credibility as number,
    systemPrompt: row.system_prompt as string,
    computeBudget: (row.compute_budget as number | null | undefined) ?? 1.0,
    computeSpent: (row.compute_spent as number | null | undefined) ?? 0.0,
    computeRemaining: (row.compute_remaining as number | null | undefined) ?? 1.0,
    lifecycleStatus: (row.lifecycle_status as import('../types').MindLifecycleStatus) ?? 'INCUBATING',
    predictionAccuracy: (row.prediction_accuracy as number | null | undefined) ?? 0.0,
    calibrationScore: (row.calibration_score as number | null | undefined) ?? 100.0,
    estimatedValue: (row.estimated_value as number | null | undefined) ?? 1000.0,
    marketStatus: (row.market_status as string) ?? 'INACTIVE',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapAgentEvent(row: Record<string, unknown>): AgentEvent {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    eventType: row.event_type as AgentEventType,
    content: row.content as string,
    source: row.source as string | null,
    confidenceBefore: row.confidence_before as number | null,
    confidenceAfter: row.confidence_after as number | null,
    createdAt: row.created_at as string,
  };
}

function mapEvidence(row: Record<string, unknown>): Evidence {
  const claim = row.claim as string || row.snippet as string || '';
  const direction = (row.direction as import('../types').EvidenceStance) || (row.stance as import('../types').EvidenceStance) || 'NEUTRAL';
  const sourceUrl = row.source_url as string || row.url as string || '';
  const sourceName = row.source_name as string || row.source as string || '';
  const sourceType = (row.source_type as import('../types').EvidenceType) || 'NEWS';

  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    claim,
    direction,
    sourceUrl,
    sourceName,
    sourceType,
    publishedAt: row.published_at as string | null,
    discoveredAt: (row.discovered_at as string) || (row.retrieved_at as string) || new Date().toISOString(),
    reliabilityScore: (row.reliability_score as number | null | undefined) ?? (((row.relevance as number | null | undefined) ?? 0.5) * 100),
    relevanceScore: (row.relevance_score as number | null | undefined) ?? (((row.relevance as number | null | undefined) ?? 0.5) * 100),
    strengthScore: (row.strength_score as number | null | undefined) ?? 50,
    confidenceImpact: (row.confidence_impact as number | null | undefined) ?? 0,
    status: row.status as string || 'NEW',
    
    // Legacy support mapping
    source: sourceName,
    title: claim,
    url: sourceUrl,
    snippet: claim,
    relevance: ((row.relevance_score as number) ?? 50) / 100,
    stance: direction,
  };
}

function mapArgument(row: Record<string, unknown>): Argument {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    content: row.content as string,
    supportingEvidenceIds: fromJson(row.supporting_evidence_ids as string),
    strength: row.strength as number,
    createdAt: row.created_at as string,
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    ideaId: row.idea_id as string,
    chain: row.chain as string,
    txHash: row.tx_hash as string,
    amount: row.amount as string,
    token: row.token as string,
    recipient: row.recipient as string,
    status: row.status as PaymentStatus,
    createdAt: row.created_at as string,
    verifiedAt: row.verified_at as string | null,
  };
}

function mapDebate(row: Record<string, unknown>): Debate {
  return {
    id: row.id as string,
    ideaA: row.idea_a as string,
    ideaB: row.idea_b as string,
    agentA: row.agent_a as string,
    agentB: row.agent_b as string,
    status: row.status as DebateStatus,
    currentRound: row.current_round as number,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
    resultSummary: (row.result_summary || null) as string | null,
  };
}

function mapDebateMessage(row: Record<string, unknown>): DebateMessage {
  return {
    id: row.id as string,
    debateId: row.debate_id as string,
    agentId: row.agent_id as string,
    round: row.round as number,
    content: row.content as string,
    sources: fromJson(row.sources as string),
    createdAt: row.created_at as string,
  };
}

function mapIdeaWithMind(row: Record<string, unknown>): IdeaWithMind {
  const idea = mapIdea(row);
  return {
    ...idea,
    agent: row.agent_id_join ? {
      id: row.agent_id_join as string,
      ideaId: idea.id,
      thesis: row.thesis as string,
      confidence: row.confidence as number,
      credibility: row.credibility as number,
      systemPrompt: row.system_prompt as string,
      computeBudget: (row.compute_budget as number | null | undefined) ?? 1.0,
      computeSpent: (row.compute_spent as number | null | undefined) ?? 0.0,
      computeRemaining: (row.compute_remaining as number | null | undefined) ?? 1.0,
      lifecycleStatus: (row.lifecycle_status as import('../types').MindLifecycleStatus) ?? 'INCUBATING',
      predictionAccuracy: (row.prediction_accuracy as number | null | undefined) ?? 0.0,
      calibrationScore: (row.calibration_score as number | null | undefined) ?? 100.0,
      estimatedValue: (row.estimated_value as number | null | undefined) ?? 1000.0,
      marketStatus: (row.market_status as string) ?? 'INACTIVE',
      createdAt: row.agent_created_at as string,
      updatedAt: row.agent_updated_at as string,
    } : null,
    creator: { walletAddress: row.creator_wallet as string },
    followerCount: row.follower_count as number,
    argumentCount: row.argument_count as number,
    evidenceCount: row.evidence_count as number,
    momentum: calculateMomentum(row),
  };
}

function calculateMomentum(row: Record<string, unknown>): number {
  const followers = (row.follower_count as number) || 0;
  const arguments_ = (row.argument_count as number) || 0;
  const evidence = (row.evidence_count as number) || 0;
  // Simple momentum formula — will evolve
  return Math.min(100, followers * 3 + arguments_ * 5 + evidence * 2);
}

// ─── Predictions ─────────────────────────────────────────────────────────

export function createPrediction(
  mindId: string,
  claim: string,
  targetValue: string | null,
  targetMetric: string | null,
  targetDate: string | null,
  resolutionMethod: string | null,
  resolutionSource: string | null,
  confidenceAtCreation: number
): import('../types').Prediction {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO predictions (
      id, mind_id, claim, target_value, target_metric, target_date,
      resolution_method, resolution_source, status, confidence_at_creation,
      confidence_at_resolution, outcome, created_at, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, mindId, claim, targetValue, targetMetric, targetDate,
    resolutionMethod, resolutionSource, 'OPEN', confidenceAtCreation,
    null, null, now, null
  );

  return {
    id,
    mindId,
    claim,
    targetValue,
    targetMetric,
    targetDate,
    resolutionMethod,
    resolutionSource,
    status: 'OPEN',
    confidenceAtCreation,
    confidenceAtResolution: null,
    outcome: null,
    createdAt: now,
    resolvedAt: null,
  };
}

export function getPrediction(id: string): import('../types').Prediction | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM predictions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return mapPrediction(row);
}

export function getPredictionsByMind(mindId: string): import('../types').Prediction[] {
  const db = getDb();
  const cleanId = (mindId || '').trim();
  const rows = db.prepare(`
    SELECT * FROM predictions 
    WHERE UPPER(mind_id) = UPPER(?) 
       OR UPPER(mind_id) IN (SELECT UPPER(id) FROM agents WHERE UPPER(idea_id) = UPPER(?))
    ORDER BY created_at DESC
  `).all(cleanId, cleanId) as Record<string, unknown>[];
  return rows.map(mapPrediction);
}

export function resolvePrediction(
  id: string,
  status: import('../types').PredictionStatus,
  confidenceAtResolution: number,
  outcome: string | null
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE predictions
    SET status = ?, confidence_at_resolution = ?, outcome = ?, resolved_at = ?
    WHERE id = ?
  `).run(status, confidenceAtResolution, outcome, now, id);
}

function mapPrediction(row: Record<string, unknown>): import('../types').Prediction {
  return {
    id: row.id as string,
    mindId: row.mind_id as string,
    claim: row.claim as string,
    targetValue: row.target_value as string | null,
    targetMetric: row.target_metric as string | null,
    targetDate: row.target_date as string | null,
    resolutionMethod: row.resolution_method as string | null,
    resolutionSource: row.resolution_source as string | null,
    status: row.status as import('../types').PredictionStatus,
    confidenceAtCreation: row.confidence_at_creation as number,
    confidenceAtResolution: row.confidence_at_resolution as number | null,
    outcome: row.outcome as string | null,
    createdAt: row.created_at as string,
    resolvedAt: row.resolved_at as string | null,
  };
}

// ─── Debate Outcomes ─────────────────────────────────────────────────────

export function createDebateOutcome(
  debateId: string,
  mindId: string,
  argumentScore: number,
  evidenceScore: number,
  rebuttalScore: number,
  intellectualHonestyScore: number,
  confidenceBefore: number,
  confidenceAfter: number,
  positionChanged: boolean
): import('../types').DebateOutcome {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO debate_outcomes (
      debate_id, mind_id, argument_score, evidence_score, rebuttal_score,
      intellectual_honesty_score, confidence_before, confidence_after, position_changed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    debateId, mindId, argumentScore, evidenceScore, rebuttalScore,
    intellectualHonestyScore, confidenceBefore, confidenceAfter, positionChanged ? 1 : 0, now
  );

  return {
    debateId,
    mindId,
    argumentScore,
    evidenceScore,
    rebuttalScore,
    intellectualHonestyScore,
    confidenceBefore,
    confidenceAfter,
    positionChanged,
    createdAt: now,
  };
}

export function getDebateOutcome(debateId: string, mindId: string): import('../types').DebateOutcome | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM debate_outcomes WHERE debate_id = ? AND mind_id = ?').get(debateId, mindId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return {
    debateId: row.debate_id as string,
    mindId: row.mind_id as string,
    argumentScore: row.argument_score as number,
    evidenceScore: row.evidence_score as number,
    rebuttalScore: row.rebuttal_score as number,
    intellectualHonestyScore: row.intellectual_honesty_score as number,
    confidenceBefore: row.confidence_before as number,
    confidenceAfter: row.confidence_after as number,
    positionChanged: row.position_changed === 1,
    createdAt: row.created_at as string,
  };
}

// ─── Mind Compute Usage ──────────────────────────────────────────────────

export function logComputeUsage(
  mindId: string,
  taskType: string,
  provider: string,
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
  estimatedCost: number
): import('../types').MindComputeUsage {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mind_compute_usage (
      id, mind_id, task_type, provider, model, input_tokens, output_tokens, estimated_cost, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, mindId, taskType, provider, model, inputTokens, outputTokens, estimatedCost, now);

  return {
    id,
    mindId,
    taskType,
    provider,
    model,
    inputTokens,
    outputTokens,
    estimatedCost,
    createdAt: now,
  };
}

export function getComputeUsageByMind(mindId: string): import('../types').MindComputeUsage[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mind_compute_usage WHERE mind_id = ? ORDER BY created_at DESC').all(mindId) as Record<string, unknown>[];
  return rows.map(r => ({
    id: r.id as string,
    mindId: r.mind_id as string,
    taskType: r.task_type as string,
    provider: r.provider as string,
    model: r.model as string,
    inputTokens: r.input_tokens as number | null,
    outputTokens: r.output_tokens as number | null,
    estimatedCost: r.estimated_cost as number,
    createdAt: r.created_at as string,
  }));
}

// ─── Mind Assets & Founders ─────────────────────────────────────────────

export function createMindAsset(
  mindId: string,
  creatorAllocation = 15.0,
  communityAllocation = 70.0,
  protocolAllocation = 10.0,
  liquidityAllocation = 5.0,
  tokenName?: string,
  tokenTicker?: string
): import('../types').MindAsset {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  // Check if exists first
  const existing = getMindAsset(mindId);
  if (existing) {
    db.prepare("UPDATE mind_assets SET market_status = 'ACTIVE' WHERE mind_id = ?").run(existing.mindId);
    return { ...existing, marketStatus: 'ACTIVE' };
  }

  // Lookup idea to inherit token_name and token_ticker if available
  const agentRow = db.prepare('SELECT idea_id, thesis FROM agents WHERE UPPER(id) = UPPER(?)').get(mindId) as any;
  let finalName = tokenName;
  let finalTicker = tokenTicker;
  if ((!finalName || !finalTicker) && agentRow?.idea_id) {
    const ideaRow = db.prepare('SELECT token_name, token_ticker, content FROM ideas WHERE id = ?').get(agentRow.idea_id) as any;
    if (ideaRow?.token_name) finalName = ideaRow.token_name;
    if (ideaRow?.token_ticker) finalTicker = ideaRow.token_ticker;
    if (!finalName || !finalTicker) {
      const meta = generateTokenMetadata(ideaRow?.content || agentRow.thesis);
      finalName = finalName || meta.tokenName;
      finalTicker = finalTicker || meta.tokenTicker;
    }
  }

  db.prepare(`
    INSERT INTO mind_assets (
      id, mind_id, asset_type, total_supply, creator_allocation,
      community_allocation, protocol_allocation, liquidity_allocation, market_status, token_name, token_ticker, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, mindId, 'MIND_SHARE', 1000000.0, creatorAllocation,
    communityAllocation, protocolAllocation, liquidityAllocation, 'ACTIVE',
    finalName || 'Autonomous Cognitive Capital', finalTicker || 'ACC', now
  );

  return {
    id,
    mindId,
    assetType: 'MIND_SHARE',
    totalSupply: 1000000.0,
    creatorAllocation,
    communityAllocation,
    protocolAllocation,
    liquidityAllocation,
    marketStatus: 'ACTIVE',
    tokenName: finalName || 'Autonomous Cognitive Capital',
    tokenTicker: finalTicker || 'ACC',
    createdAt: now,
  };
}

export function getMindAsset(mindId: string): import('../types').MindAsset | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT ma.* FROM mind_assets ma
    LEFT JOIN agents a ON UPPER(a.id) = UPPER(ma.mind_id) OR UPPER(a.idea_id) = UPPER(ma.mind_id)
    WHERE UPPER(ma.mind_id) = UPPER(?) 
       OR UPPER(a.id) = UPPER(?) 
       OR UPPER(a.idea_id) = UPPER(?)
    LIMIT 1
  `).get(mindId, mindId, mindId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return {
    id: row.id as string,
    mindId: row.mind_id as string,
    assetType: 'MIND_SHARE',
    totalSupply: row.total_supply as number,
    creatorAllocation: row.creator_allocation as number,
    communityAllocation: row.community_allocation as number,
    protocolAllocation: row.protocol_allocation as number,
    liquidityAllocation: row.liquidity_allocation as number,
    marketStatus: 'ACTIVE',
    tokenAddress: (row.token_address as string) || (String(row.mind_id).toUpperCase() === 'MIND-590A' ? '0x2cD4a125eA8d1f28dC0fdE1f241AAd2C96817B67' : '0x2cD4a125eA8d1f28dC0fdE1f241AAd2C96817B67'),
    poolAddress: (row.pool_address as string) || '0xdFeeeC136Aa4808ffC8c1CE74dDE9A2Be01A7755',
    tokenName: (row.token_name as string) || (String(row.mind_id).toUpperCase() === 'MIND-590A' ? 'Autonomous Cognitive Capital' : 'Mind Share'),
    tokenTicker: (row.token_ticker as string) || (String(row.mind_id).toUpperCase() === 'MIND-590A' ? 'ACC' : 'MIND'),
    createdAt: row.created_at as string,
  };
}

export function updateMindAssetStatus(mindId: string, status: string): void {
  const db = getDb();
  db.prepare('UPDATE mind_assets SET market_status = ? WHERE UPPER(mind_id) = UPPER(?)').run(status, mindId);
}

export function updateMindAssetAllocations(
  mindId: string,
  creatorAllocation: number,
  communityAllocation: number
): void {
  const db = getDb();
  db.prepare(`
    UPDATE mind_assets
    SET creator_allocation = ?, community_allocation = ?, market_status = 'ACTIVE'
    WHERE UPPER(mind_id) = UPPER(?)
  `).run(creatorAllocation, communityAllocation, mindId);
}


export function createMindFounder(
  creatorId: string,
  mindId: string,
  allocationPercentage = 15.0
): import('../types').MindFounder {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mind_founders (
      creator_id, mind_id, allocation_percentage, allocation_status, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(creatorId, mindId, allocationPercentage, 'PENDING', now);

  return {
    creatorId,
    mindId,
    allocationPercentage,
    allocationStatus: 'PENDING',
    createdAt: now,
  };
}

export function getMindFounder(mindId: string): import('../types').MindFounder | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM mind_founders WHERE mind_id = ?').get(mindId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return {
    creatorId: row.creator_id as string,
    mindId: row.mind_id as string,
    allocationPercentage: row.allocation_percentage as number,
    allocationStatus: row.allocation_status as string,
    createdAt: row.created_at as string,
  };
}

export function updateMindFounderAllocation(mindId: string, creatorId: string, percentage: number): void {
  const db = getDb();
  db.prepare('UPDATE mind_founders SET allocation_percentage = ? WHERE mind_id = ? AND creator_id = ?').run(percentage, mindId, creatorId);
}


// ─── Reputation Events ───────────────────────────────────────────────────

export function logReputationEvent(
  mindId: string,
  eventType: string,
  scoreChange: number,
  description: string
): import('../types').MindReputationEvent {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mind_reputation_events (
      id, mind_id, event_type, score_change, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, mindId, eventType, scoreChange, description, now);

  return {
    id,
    mindId,
    eventType,
    scoreChange,
    description,
    createdAt: now,
  };
}

export function getReputationEventsByMind(mindId: string): import('../types').MindReputationEvent[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mind_reputation_events WHERE mind_id = ? ORDER BY created_at DESC').all(mindId) as Record<string, unknown>[];
  return rows.map(r => ({
    id: r.id as string,
    mindId: r.mind_id as string,
    eventType: r.event_type as string,
    scoreChange: r.score_change as number,
    description: r.description as string,
    createdAt: r.created_at as string,
  }));
}

// ─── Valuation Snapshots ─────────────────────────────────────────────────

export function createValuationSnapshot(
  mindId: string,
  estimatedValue: number
): import('../types').MindValuationSnapshot {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mind_valuation_snapshots (
      id, mind_id, estimated_value, created_at
    ) VALUES (?, ?, ?, ?)
  `).run(id, mindId, estimatedValue, now);

  return {
    id,
    mindId,
    estimatedValue,
    createdAt: now,
  };
}

export function getValuationSnapshotsByMind(mindId: string): import('../types').MindValuationSnapshot[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mind_valuation_snapshots WHERE mind_id = ? ORDER BY created_at DESC').all(mindId) as Record<string, unknown>[];
  return rows.map(r => ({
    id: r.id as string,
    mindId: r.mind_id as string,
    estimatedValue: r.estimated_value as number,
    createdAt: r.created_at as string,
  }));
}

// ─── Updates on Agents ───────────────────────────────────────────────────

export function updateAgentLifecycleStatus(
  mindId: string,
  lifecycleStatus: import('../types').MindLifecycleStatus
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE agents
    SET lifecycle_status = ?, updated_at = ?
    WHERE id = ?
  `).run(lifecycleStatus, now, mindId);
}

export function updateAgentReputationScores(
  mindId: string,
  credibility: number,
  predictionAccuracy: number,
  calibrationScore: number,
  estimatedValue: number
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE agents
    SET credibility = ?, prediction_accuracy = ?, calibration_score = ?, estimated_value = ?, updated_at = ?
    WHERE id = ?
  `).run(credibility, predictionAccuracy, calibrationScore, estimatedValue, now, mindId);
  recordBeliefSnapshotInternal(db, mindId, now);
}

export function getDebateOutcomesByMind(mindId: string): import('../types').DebateOutcome[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM debate_outcomes WHERE mind_id = ?').all(mindId) as Record<string, unknown>[];
  return rows.map(row => ({
    debateId: row.debate_id as string,
    mindId: row.mind_id as string,
    argumentScore: row.argument_score as number,
    evidenceScore: row.evidence_score as number,
    rebuttalScore: row.rebuttal_score as number,
    intellectualHonestyScore: row.intellectual_honesty_score as number,
    confidenceBefore: row.confidence_before as number,
    confidenceAfter: row.confidence_after as number,
    positionChanged: row.position_changed === 1,
    createdAt: row.created_at as string,
  }));
}

// ─── Data Intelligence Helpers ───────────────────────────────────────────

export function createMindThesisVersion(
  mindId: string,
  thesis: string,
  reason: string | null,
  confidence: number,
  generatedBy: 'USER' | 'AI'
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  // Find max version
  const row = db.prepare('SELECT MAX(version) as v FROM mind_thesis_versions WHERE mind_id = ?').get(mindId) as { v: number | null };
  const nextVer = (row.v || 0) + 1;

  db.prepare(`
    INSERT INTO mind_thesis_versions (id, mind_id, version, thesis, reason, generated_by, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, mindId, nextVer, thesis, reason, generatedBy, confidence, now);
}

export function getMindThesisVersions(mindId: string): import('../types').MindThesisVersion[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mind_thesis_versions WHERE mind_id = ? ORDER BY version ASC').all(mindId) as Record<string, unknown>[];
  return rows.map(row => ({
    id: row.id as string,
    mindId: row.mind_id as string,
    version: row.version as number,
    thesis: row.thesis as string,
    reason: row.reason as string | null,
    generatedBy: row.generated_by as 'USER' | 'AI',
    confidence: row.confidence as number,
    createdAt: row.created_at as string,
  }));
}

export function createMindBeliefSnapshot(
  mindId: string,
  confidence: number,
  credibility: number,
  evidenceCount: number,
  counterEvidenceCount: number,
  predictionAccuracy: number,
  followers: number,
  debateCount: number
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mind_belief_snapshots (
      id, mind_id, confidence, credibility, evidence_count, counter_evidence_count,
      prediction_accuracy, followers, debate_count, timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, mindId, confidence, credibility, evidenceCount, counterEvidenceCount, predictionAccuracy, followers, debateCount, now);
}

export function getMindBeliefSnapshots(mindId: string): import('../types').MindBeliefSnapshot[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mind_belief_snapshots WHERE mind_id = ? ORDER BY timestamp ASC').all(mindId) as Record<string, unknown>[];
  return rows.map(row => ({
    id: row.id as string,
    mindId: row.mind_id as string,
    confidence: row.confidence as number,
    credibility: row.credibility as number,
    evidenceCount: row.evidence_count as number,
    counterEvidenceCount: row.counter_evidence_count as number,
    predictionAccuracy: row.prediction_accuracy as number,
    followers: row.followers as number,
    debateCount: row.debate_count as number,
    timestamp: row.timestamp as string,
  }));
}

export function updateSourceIntelligence(
  domain: string,
  publisher: string | null,
  sourceType: string,
  citChange: number,
  evChange: number,
  suppChange: number,
  oppChange: number,
  reliability: number,
  relevance: number
): void {
  const db = getDb();
  const now = new Date().toISOString();

  // Find existing
  const existing = db.prepare('SELECT * FROM source_intelligence WHERE domain = ?').get(domain) as Record<string, unknown> | undefined;

  if (existing) {
    const nextCitation = (existing.citation_count as number) + citChange;
    const nextEvidence = (existing.evidence_count as number) + evChange;
    const nextSupporting = (existing.supporting_count as number) + suppChange;
    const nextOpposing = (existing.opposing_count as number) + oppChange;
    
    // Weighted moving average for reliability & relevance
    const prevWeight = existing.evidence_count as number;
    const newWeight = evChange;
    const totalWeight = prevWeight + newWeight;
    
    let nextReliability = existing.average_reliability as number;
    let nextRelevance = existing.average_relevance as number;

    if (totalWeight > 0) {
      nextReliability = ((nextReliability * prevWeight) + (reliability * newWeight)) / totalWeight;
      nextRelevance = ((nextRelevance * prevWeight) + (relevance * newWeight)) / totalWeight;
    }

    db.prepare(`
      UPDATE source_intelligence
      SET publisher = ?, citation_count = ?, evidence_count = ?, supporting_count = ?, opposing_count = ?,
          average_reliability = ?, average_relevance = ?, updated_at = ?
      WHERE domain = ?
    `).run(publisher || existing.publisher, nextCitation, nextEvidence, nextSupporting, nextOpposing, nextReliability, nextRelevance, now, domain);
  } else {
    db.prepare(`
      INSERT INTO source_intelligence (
        domain, publisher, source_type, citation_count, evidence_count,
        supporting_count, opposing_count, average_reliability, average_relevance, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(domain, publisher, sourceType, citChange, evChange, suppChange, oppChange, reliability, relevance, now);
  }
}

export function createMindRelationship(
  sourceMindId: string,
  targetMindId: string,
  relationshipType: 'AGREES' | 'DISAGREES' | 'CITES' | 'RESPONDS_TO' | 'INFLUENCES' | 'SHARES_EVIDENCE' | 'COMPETES_WITH',
  confidenceImpact: number
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mind_relationships (id, source_mind_id, target_mind_id, relationship_type, confidence_impact, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, sourceMindId, targetMindId, relationshipType, confidenceImpact, now);
}

export function getMindRelationships(mindId: string): import('../types').MindRelationship[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM mind_relationships 
    WHERE source_mind_id = ? OR target_mind_id = ?
  `).all(mindId, mindId) as Record<string, unknown>[];
  
  return rows.map(row => ({
    id: row.id as string,
    sourceMindId: row.source_mind_id as string,
    targetMindId: row.target_mind_id as string,
    relationshipType: row.relationship_type as any,
    confidenceImpact: row.confidence_impact as number,
    createdAt: row.created_at as string,
  }));
}

export function createConsentRecord(
  userId: string,
  consentType: import('../types').ConsentType,
  granted: boolean,
  source: string
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO consent_records (id, user_id, consent_type, granted, timestamp, source)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, consent_type) DO UPDATE SET
      granted = excluded.granted,
      timestamp = excluded.timestamp,
      source = excluded.source
  `).run(id, userId, consentType, granted ? 1 : 0, now, source);
}

export function getConsentRecords(userId: string): import('../types').ConsentRecord[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM consent_records WHERE user_id = ?').all(userId) as Record<string, unknown>[];
  return rows.map(row => ({
    id: row.id as string,
    userId: row.user_id as string,
    consentType: row.consent_type as any,
    version: row.version as string,
    granted: row.granted === 1,
    timestamp: row.timestamp as string,
    source: row.source as string,
  }));
}

export function logDataAccessAudit(
  actorId: string | null,
  role: string,
  datasetId: string,
  purpose: string,
  action: string,
  result: string
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO data_access_audit_log (id, actor_id, role, dataset_id, purpose, action, timestamp, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, actorId, role, datasetId, purpose, action, now, result);
}

export function createDatasetDefinition(
  datasetId: string,
  name: string,
  description: string | null,
  sourceTables: string[]
): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO dataset_definitions (dataset_id, name, description, source_tables, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(datasetId, name, description, JSON.stringify(sourceTables), now);
}

export function getDatasetDefinitions(): import('../types').DatasetDefinition[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM dataset_definitions').all() as Record<string, unknown>[];
  return rows.map(row => ({
    datasetId: row.dataset_id as string,
    name: row.name as string,
    version: row.version as string,
    description: row.description as string | null,
    sourceTables: JSON.parse(row.source_tables as string || '[]'),
    transformationVersion: row.transformation_version as string,
    createdAt: row.created_at as string,
  }));
}

export function logDataQualityRun(
  datasetId: string,
  qualityScore: number,
  metrics: Record<string, any>
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO data_quality_runs (id, dataset_id, quality_score, metrics, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, datasetId, qualityScore, JSON.stringify(metrics), now);
}

export function createEarlySignal(
  topic: string,
  strength: number,
  evidenceVelocity: number,
  convergingMindsCount: number,
  details: Record<string, any>
): void {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO early_signals (id, topic, strength, evidence_velocity, converging_minds_count, details, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, topic, strength, evidenceVelocity, convergingMindsCount, JSON.stringify(details), now);
}

export function getEarlySignals(): import('../types').EarlySignal[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM early_signals ORDER BY detected_at DESC').all() as Record<string, unknown>[];
  return rows.map(row => ({
    id: row.id as string,
    topic: row.topic as string,
    strength: row.strength as number,
    evidenceVelocity: row.evidence_velocity as number,
    convergingMindsCount: row.converging_minds_count as number,
    details: JSON.parse(row.details as string || '{}'),
    detectedAt: row.detected_at as string,
  }));
}

