// ============================================================================
// MINDCAST — Data Intelligence & Data Asset Layer Test Suite
// ============================================================================

import {
  findOrCreateUser,
  createIdea,
  createAgent,
  createEvidence,
  updateAgentConfidence,
  createConsentRecord,
  getConsentRecords,
} from '../src/lib/database/queries';
import { getDb } from '../src/lib/database/connection';
import { trackEvent } from '../src/lib/analytics/tracker';
import { EarlySignalEngine } from '../src/lib/ai/early-signal-engine';
import { EvidenceStance } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runDataTests() {
  console.log('=== STARTING DATA INTELLIGENCE LAYER TESTS ===');

  const db = getDb();
  
  // Clean tables
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM ideas');
  db.exec('DELETE FROM agents');
  db.exec('DELETE FROM predictions');
  db.exec('DELETE FROM evidence');
  db.exec('DELETE FROM data_events');
  db.exec('DELETE FROM mind_thesis_versions');
  db.exec('DELETE FROM mind_belief_snapshots');
  db.exec('DELETE FROM source_intelligence');
  db.exec('DELETE FROM topics');
  db.exec('DELETE FROM mind_topics');
  db.exec('DELETE FROM consent_records');
  db.exec('DELETE FROM early_signals');
  db.exec('DELETE FROM data_access_audit_log');
  db.exec('PRAGMA foreign_keys = ON;');

  // Test 1: Event-driven capture
  console.log('\n--- Test 1: Event-driven capture ---');
  const user = findOrCreateUser('0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a');
  trackEvent('wallet_connected', user.id, { sessionId: 'SESS-1029', referrer: 'https://google.com' });
  
  const events = db.prepare("SELECT * FROM data_events WHERE event_type = 'wallet_connected'").all() as any[];
  assert(events.length === 1, 'Event-driven trackEvent logs structured event in data_events store.');
  assert(events[0].actor_id === user.id, 'DataEvent preserves actor reference.');
  assert(JSON.parse(events[0].metadata).sessionId === 'SESS-1029', 'DataEvent metadata fields mapped correctly.');

  // Test 2: Thesis versioning
  console.log('\n--- Test 2: Thesis versioning ---');
  const idea = createIdea(user.id, 'By 2035, AI agents will replace search.');
  const agent = createAgent(idea.id, idea.content, 'System prompt');
  
  const thesisVersions = db.prepare('SELECT * FROM mind_thesis_versions WHERE mind_id = ?').all(agent.id) as any[];
  assert(thesisVersions.length === 1, 'Mind creation automatically logs thesis version 1.');
  assert(thesisVersions[0].thesis === idea.content, 'Thesis text matched.');

  // Test 3: Time-series belief snapshots
  console.log('\n--- Test 3: Time-series belief snapshots ---');
  updateAgentConfidence(agent.id, 75.0);
  
  const snapshots = db.prepare('SELECT * FROM mind_belief_snapshots WHERE mind_id = ?').all(agent.id) as any[];
  assert(snapshots.length === 1, 'Belief trajectory logs snapshot on confidence change.');
  assert(snapshots[0].confidence === 75.0, 'Snapshot confidence matches updated value.');

  // Test 4: Source intelligence
  console.log('\n--- Test 4: Source intelligence updates ---');
  createEvidence({
    agentId: agent.id,
    claim: 'Autonomous systems market set to double by next fiscal year.',
    direction: 'SUPPORTING' as any,
    sourceUrl: 'https://reuters.com/market-news',
    sourceName: 'Reuters',
    sourceType: 'NEWS',
    publishedAt: '2026-08-17',
    reliabilityScore: 90,
    relevanceScore: 95,
    strengthScore: 85,
    confidenceImpact: 5,
    status: 'VERIFIED',
    source: 'Reuters',
    title: 'Autonomous systems market set to double by next fiscal year.',
    url: 'https://reuters.com/market-news',
    snippet: 'Autonomous systems market set to double by next fiscal year.',
    relevance: 0.9,
    stance: EvidenceStance.SUPPORTING,
  });

  const sources = db.prepare("SELECT * FROM source_intelligence WHERE domain = 'reuters.com'").all() as any[];
  assert(sources.length === 1, 'Source intelligence updates Domain mapping correctly.');
  assert(sources[0].supporting_count === 1, 'Domain citation type classified correctly.');
  assert(sources[0].average_reliability === 90.0, 'Reliability average matches weighted calculation.');

  // Test 5 & 6: Topic taxonomy & Signal engine
  console.log('\n--- Test 5 & 6: Topic Taxonomy & Signal Engine ---');
  EarlySignalEngine.classifyMind(agent.id, agent.thesis);
  const mindTopics = db.prepare('SELECT * FROM mind_topics WHERE mind_id = ?').all(agent.id) as any[];
  assert(mindTopics.length === 1, 'Mind successfully classified into topic taxonomy.');
  
  EarlySignalEngine.runSignalDetection();
  const signals = db.prepare('SELECT * FROM early_signals').all() as any[];
  assert(signals.length > 0, 'Signal anomaly engine runs and detects emerging topic trends.');

  // Test 7: User Consent governance
  console.log('\n--- Test 7: User Consent Governance ---');
  createConsentRecord(user.id, 'RESEARCH', true, 'CONSENT_FORM');
  const consents = getConsentRecords(user.id);
  assert(consents.length === 1, 'Consent record logged.');
  assert(consents[0].consentType === 'RESEARCH' && consents[0].granted === true, 'Consent choices recorded correctly.');

  console.log('\n=== ALL DATA INTELLIGENCE TESTS PASSED! ===');
}

runDataTests().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
