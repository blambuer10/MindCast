// ============================================================================
// MINDCAST — Reputation & Economic Layer Test Suite
// ============================================================================

import {
  findOrCreateUser,
  createIdea,
  createAgent,
  createEvidence,
  createPrediction,
  resolvePrediction,
  getAgent,
  getPredictionsByMind,
  getEvidenceByAgent,
  getMindAsset,
  createMindAsset,
  createMindFounder,
  getMindFounder,
} from '../src/lib/database/queries';
import { getDb } from '../src/lib/database/connection';
import { updateMindTrackRecordAndReputation } from '../src/lib/ai/reputation-service';
import { EvidenceStance } from '../src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('=== STARTING REPUTATION & ECONOMIC LAYER TESTS ===');

  const db = getDb();
  
  // Clean start transactions for testing
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM ideas');
  db.exec('DELETE FROM agents');
  db.exec('DELETE FROM predictions');
  db.exec('DELETE FROM evidence');
  db.exec('DELETE FROM mind_assets');
  db.exec('DELETE FROM mind_founders');
  db.exec('PRAGMA foreign_keys = ON;');

  // Test 1 & 2: User and Mind Creation
  console.log('\n--- Test 1 & 2: User and Mind Creation ---');
  const user = findOrCreateUser('0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a');
  assert(user.walletAddress === '0xb284ed722ccc17b0be3737a1a5ca8b991fa81f3a', 'User wallet address normalizes to lowercase.');

  const idea = createIdea(user.id, 'By 2035, AI agents will become the primary interface of the web.');
  assert(idea.content !== '', 'Idea creation yields content.');

  const agent = createAgent(idea.id, idea.content, 'System prompt placeholder');
  assert(agent.lifecycleStatus === 'INCUBATING', 'New Mind starts in INCUBATING lifecycle state.');
  assert(agent.confidence === 50 && agent.credibility === 50, 'Baseline Mind has 50 confidence and 50 credibility.');

  // Test 3: Evidence
  console.log('\n--- Test 3: Evidence Insertion ---');
  const ev1 = createEvidence({
    agentId: agent.id,
    claim: 'AI agents accounted for 15% of web requests in recent survey.',
    direction: 'SUPPORTING' as any,
    sourceUrl: 'https://techcrunch.com/survey',
    sourceName: 'TechCrunch',
    sourceType: 'NEWS',
    publishedAt: '2026-08-17',
    reliabilityScore: 80,
    relevanceScore: 90,
    strengthScore: 75,
    confidenceImpact: 5,
    status: 'VERIFIED',
    source: 'TechCrunch',
    title: 'AI agents accounted for 15% of web requests in recent survey.',
    url: 'https://techcrunch.com/survey',
    snippet: 'AI agents accounted for 15% of web requests in recent survey.',
    relevance: 0.8,
    stance: EvidenceStance.SUPPORTING,
  });
  assert(ev1.direction === 'SUPPORTING', 'Evidence stance mapped correctly.');

  // Test 5, 6, 7, 8: Predictions System (Creation & Resolution)
  console.log('\n--- Test 5, 6, 7, 8: Prediction Creation & Resolution ---');
  const pred = createPrediction(
    agent.id,
    'AI-agent mediated web traffic will exceed 20% by Dec 2027.',
    null, null, null, null, null,
    80 // 80% confidence
  );
  assert(pred.status === 'OPEN', 'New prediction is OPEN.');

  // Resolve prediction as TRUE
  resolvePrediction(pred.id, 'RESOLVED_TRUE', 85, 'Verified true via API');
  const updatedPred = getPredictionsByMind(agent.id)[0];
  assert(updatedPred.status === 'RESOLVED_TRUE', 'Prediction resolved correctly.');

  // Run update pipeline
  updateMindTrackRecordAndReputation(agent.id);
  const updatedAgent = getAgent(agent.id)!;
  assert(updatedAgent.predictionAccuracy === 1.0, 'Accuracy is 100% after 1 correct prediction.');
  assert(updatedAgent.credibility > 50, 'Credibility increases after correct prediction.');

  // Test 9, 10, 11: Stance Independence
  console.log('\n--- Test 9, 10, 11: Confidence/Credibility Independence ---');
  // Add strong counter-evidence
  createEvidence({
    agentId: agent.id,
    claim: 'Users reject automated agents due to security concerns.',
    direction: 'OPPOSING' as any,
    sourceUrl: 'https://wired.com/security',
    sourceName: 'Wired',
    sourceType: 'NEWS',
    publishedAt: '2026-08-17',
    reliabilityScore: 90,
    relevanceScore: 95,
    strengthScore: 88,
    confidenceImpact: -15,
    status: 'VERIFIED',
    source: 'Wired',
    title: 'Users reject automated agents due to security concerns.',
    url: 'https://wired.com/security',
    snippet: 'Users reject automated agents due to security concerns.',
    relevance: 0.9,
    stance: EvidenceStance.OPPOSING,
  });

  // Calculate new reputation
  updateMindTrackRecordAndReputation(agent.id);
  const agentAfterOpposing = getAgent(agent.id)!;
  assert(agentAfterOpposing.credibility >= updatedAgent.credibility, 'Acknowledging counter-evidence preserves/improves credibility (intellectual honesty).');

  // Test 12, 13, 14: Lifecycle Transitions
  console.log('\n--- Test 12, 13, 14: Graduation Eligibility Checks ---');
  // Currently, we don't have enough evidence/debates to graduate to Proven or Market Ready.
  assert(agentAfterOpposing.lifecycleStatus === 'INCUBATING', 'Lifecycle remains INCUBATING due to unmet debate criteria.');

  // Test 15 & 16: Mind Assets Allocation (Market Ready doesn\'t auto-enable trading)
  console.log('\n--- Test 15 & 16: Market Assets allocation ---');
  let asset = getMindAsset(agent.id);
  if (!asset) {
    asset = createMindAsset(agent.id);
  }
  assert(asset.creatorAllocation === 15.0, 'Creator default allocation is 15%.');
  assert(asset.marketStatus === 'INACTIVE', 'Default asset marketStatus is INACTIVE.');

  // Test 17: Creator Founder maps correctly
  console.log('\n--- Test 17: Founder allocation maps correctly ---');
  let founder = getMindFounder(agent.id);
  if (!founder) {
    founder = createMindFounder(user.id, agent.id);
  }
  assert(founder.allocationPercentage === 15.0, 'Founder default allocation is 15%.');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
