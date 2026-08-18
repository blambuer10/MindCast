// ============================================================================
// MINDCAST — E2E Load Test Suite (10 Minds Simulation)
// ============================================================================

import { getDb } from '../src/lib/database/connection';
import {
  findOrCreateUser,
  createIdea,
  getIdea,
  createPayment,
  updatePaymentStatus,
  publishIdea,
  getMindThesisVersions,
  getMindBeliefSnapshots
} from '../src/lib/database/queries';
import { birthMind, processEvidence } from '../src/lib/ai/mind-engine';
import { trackEvent } from '../src/lib/analytics/tracker';
import { PaymentStatus, EvidenceStance } from '../src/lib/types';
import { EarlySignalEngine } from '../src/lib/ai/early-signal-engine';

const PROMPTS = [
  { thesis: 'Generative AI will automate 80% of software testing by 2028.', topic: 'AI', domain: 'wired.com', pub: 'Wired' },
  { thesis: 'DeFi protocols will handle 30% of global retail remittances by 2030.', topic: 'Finance', domain: 'bloomberg.com', pub: 'Bloomberg' },
  { thesis: 'Humanoid robots will exceed the active workforce in manufacturing by 2035.', topic: 'Robotics', domain: 'techcrunch.com', pub: 'TechCrunch' },
  { thesis: 'CRISPR gene therapies will cure three major hereditary blood disorders by 2029.', topic: 'Biotech', domain: 'nature.com', pub: 'Nature Journal' },
  { thesis: 'Carbon tax implementations in G20 nations will double the cost of coal by 2027.', topic: 'Climate', domain: 'reuters.com', pub: 'Reuters' },
  { thesis: 'Bilateral trade between EU and US will shift completely to digital ledger assets.', topic: 'Geopolitics', domain: 'economist.com', pub: 'The Economist' },
  { thesis: 'AI agents will manage personal budgets for over 1 billion internet users by 2032.', topic: 'AI', domain: 'venturebeat.com', pub: 'VentureBeat' },
  { thesis: 'Solid-state batteries will replace lithium-ion in 90% of electric vehicles by 2031.', topic: 'Climate', domain: 'wired.com', pub: 'Wired' },
  { thesis: 'Autonomous drones will deliver over 50% of urban packages by 2028.', topic: 'Robotics', domain: 'techcrunch.com', pub: 'TechCrunch' },
  { thesis: 'mRNA vaccine technology will target lung cancer tumors successfully by 2030.', topic: 'Biotech', domain: 'nature.com', pub: 'Nature Journal' },
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function run10MindsLoadTest() {
  console.log('=== STARTING 10 MINDS LOAD AND E2E VERIFICATION TEST ===\n');

  const db = getDb();
  
  // Clear tables
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

  const walletAddress = '0x1234567890123456789012345678901234567890';
  const user = findOrCreateUser(walletAddress);
  trackEvent('wallet_connected', user.id, { sessionId: 'LOAD-TEST-SESSION' });

  console.log(`Generated Test User: ${user.id}\n`);

  for (let i = 0; i < PROMPTS.length; i++) {
    const item = PROMPTS[i];
    console.log(`[Mind ${i + 1}/10] Processing: "${item.thesis}"`);
    
    // 1. Submit Idea
    const idea = createIdea(user.id, item.thesis);
    assert(idea.status === 'PENDING', 'Idea in pending state.');

    // 2. Prepare Payment
    const txHash = `0xmocktxhash_${i}_${Date.now()}`;
    const payment = createPayment({
      userId: user.id,
      ideaId: idea.id,
      chain: 'Base Sepolia',
      txHash: txHash,
      amount: '1',
      token: 'USDC',
      recipient: '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a',
      status: PaymentStatus.VERIFYING,
    });
    assert(payment.status === PaymentStatus.VERIFYING, 'Verifying state set.');

    // 3. Confirm Payment
    updatePaymentStatus(payment.id, PaymentStatus.CONFIRMED);
    
    // 4. Birth Mind
    const agent = await birthMind(idea.id, idea.content);
    assert(!!agent.id, 'Mind born successfully.');
    publishIdea(idea.id, agent.id);

    // 5. Verify local data entries
    const thesisVersions = getMindThesisVersions(agent.id);
    assert(thesisVersions.length === 1, 'Thesis version 1 recorded.');

    const snapshots = getMindBeliefSnapshots(agent.id);
    assert(snapshots.length === 1, 'Initial belief snapshot recorded.');

    // 6. Evaluate dynamic evidence citation
    await processEvidence(agent.id, {
      title: `Fact check report by ${item.pub} regarding this thesis.`,
      snippet: `Analysis reveals interesting indicators for: ${item.thesis.slice(0, 30)}`,
      url: `https://${item.domain}/facts-check`,
      source: item.pub,
    });

    // 7. Run taxonomy classification
    EarlySignalEngine.classifyMind(agent.id, agent.thesis);

    console.log(`[Mind ${i + 1}/10] Status: Success. ID: ${agent.id}\n`);
  }

  // 8. Run early signal detection across all topics
  console.log('--- Running Early Signal Detections ---');
  EarlySignalEngine.runSignalDetection();

  // 9. Inspect Database Metrics
  console.log('\n--- Live Database Diagnostic Check ---');
  const mindsCount = db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number };
  const eventsCount = db.prepare('SELECT COUNT(*) as c FROM data_events').get() as { c: number };
  const evidenceCount = db.prepare('SELECT COUNT(*) as c FROM evidence').get() as { c: number };
  const signalsCount = db.prepare('SELECT COUNT(*) as c FROM early_signals').get() as { c: number };
  const sourcesCount = db.prepare('SELECT COUNT(*) as c FROM source_intelligence').get() as { c: number };

  console.log(`Total Minds: ${mindsCount.c}`);
  console.log(`Total Telemetry Events: ${eventsCount.c}`);
  console.log(`Total Evidence Citations: ${evidenceCount.c}`);
  console.log(`Total Citation Sources Ranked: ${sourcesCount.c}`);
  console.log(`Total Early Signals Detected: ${signalsCount.c}`);

  assert(mindsCount.c === 10, 'All 10 Minds registered in DB.');
  assert(evidenceCount.c === 10, 'All 10 evidence items successfully evaluated.');

  console.log('\n=== E2E LOAD TEST EXECUTED SUCCESSFULLY WITH ZERO ERRORS ===');
}

run10MindsLoadTest().catch(err => {
  console.error('[E2E LOAD TEST FAILED]', err);
  process.exit(1);
});
