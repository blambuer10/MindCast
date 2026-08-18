// ============================================================================
// MINDCAST — E2E Load Test Predictions Suite (10 Minds Simulation)
// ============================================================================

import { getDb } from '../src/lib/database/connection';
import {
  findOrCreateUser,
  createIdea,
  createPayment,
  updatePaymentStatus,
  publishIdea,
  getPredictionsByMind,
  updateAgentCredibility
} from '../src/lib/database/queries';
import { birthMind } from '../src/lib/ai/mind-engine';
import { PaymentStatus } from '../src/lib/types';
import { CredibilityEngine } from '../src/lib/ai/credibility-engine';

const PROMPTS = [
  { thesis: 'Generative AI will automate 80% of software testing by 2028.', resolvedStates: ['RESOLVED_TRUE'] },
  { thesis: 'DeFi protocols will handle 30% of global retail remittances by 2030.', resolvedStates: ['RESOLVED_FALSE'] },
  { thesis: 'Humanoid robots will exceed the active workforce in manufacturing by 2035.', resolvedStates: ['RESOLVED_TRUE'] },
  { thesis: 'CRISPR gene therapies will cure three major hereditary blood disorders by 2029.', resolvedStates: ['RESOLVED_FALSE'] },
  { thesis: 'Carbon tax implementations in G20 nations will double the cost of coal by 2027.', resolvedStates: ['RESOLVED_TRUE', 'RESOLVED_TRUE'] },
  { thesis: 'Bilateral trade between EU and US will shift completely to digital ledger assets.', resolvedStates: ['RESOLVED_TRUE', 'RESOLVED_FALSE'] },
  { thesis: 'AI agents will manage personal budgets for over 1 billion internet users by 2032.', resolvedStates: ['RESOLVED_TRUE'] },
  { thesis: 'Solid-state batteries will replace lithium-ion in 90% of electric vehicles by 2031.', resolvedStates: ['RESOLVED_FALSE'] },
  { thesis: 'Autonomous drones will deliver over 50% of urban packages by 2028.', resolvedStates: ['RESOLVED_TRUE', 'RESOLVED_TRUE', 'RESOLVED_TRUE'] },
  { thesis: 'mRNA vaccine technology will target lung cancer tumors successfully by 2030.', resolvedStates: ['RESOLVED_TRUE', 'RESOLVED_TRUE', 'RESOLVED_FALSE'] },
];

async function run10MindsPredictionsTest() {
  console.log('=== STARTING 10 MINDS PREDICTIONS & RESOLUTIONS E2E TEST ===\n');

  const db = getDb();
  
  // Clear tables to start with a clean 10-minds set
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM ideas');
  db.exec('DELETE FROM agents');
  db.exec('DELETE FROM predictions');
  db.exec('DELETE FROM evidence');
  db.exec('DELETE FROM data_events');
  db.exec('DELETE FROM mind_thesis_versions');
  db.exec('DELETE FROM mind_belief_snapshots');
  db.exec('PRAGMA foreign_keys = ON;');

  const walletAddress = '0x9999999999999999999999999999999999999999';
  const user = findOrCreateUser(walletAddress);

  const results: any[] = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const item = PROMPTS[i];
    
    // 1. Submit & Birth Mind
    const idea = createIdea(user.id, item.thesis);
    const txHash = `0xtx_${i}_${Date.now()}`;
    createPayment({
      userId: user.id,
      ideaId: idea.id,
      chain: 'Base Sepolia',
      txHash: txHash,
      amount: '1',
      token: 'USDC',
      recipient: '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a',
      status: PaymentStatus.VERIFYING,
    });
    const agent = await birthMind(idea.id, idea.content);
    publishIdea(idea.id, agent.id);

    console.log(`[Mind ${i + 1}/10] Created agent ${agent.id}`);

    // 2. Add and Resolve Predictions
    const resolvedCount = item.resolvedStates.length;
    let correctCount = 0;

    for (let k = 0; k < resolvedCount; k++) {
      const state = item.resolvedStates[k];
      const pId = `pred_${agent.id}_${k}`;
      
      // Insert prediction
      db.prepare(`
        INSERT INTO predictions (id, mind_id, claim, confidence_at_creation, status, resolved_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        pId,
        agent.id,
        `Test prediction claim #${k} for ${agent.id}`,
        70, // confidence
        'OPEN',
        null
      );

      // Resolve prediction
      db.prepare(`
        UPDATE predictions
        SET status = ?, resolved_at = DATETIME('now')
        WHERE id = ?
      `).run(state, pId);

      if (state === 'RESOLVED_TRUE' || state === 'PARTIALLY_TRUE') {
        correctCount++;
      }
    }

    // 3. Compute Credibility Engine Score
    const calculations = CredibilityEngine.calculate(agent, []);
    updateAgentCredibility(agent.id, calculations.credibility);

    // Save for diagnostic summary
    results.push({
      id: agent.id,
      thesis: item.thesis,
      correct: correctCount,
      total: resolvedCount,
      predictionScore: calculations.predictionScore,
      calibrationScore: calculations.calibrationScore,
      finalCredibility: calculations.credibility
    });
  }

  // Print results table
  console.log('\n========================================================================================');
  console.log('AGENT ID   | RESOLVED | PREDICT SCORE | CALIBRATION | CREDIBILITY | THESIS SUMMARY');
  console.log('========================================================================================');
  for (const r of results) {
    const ratio = `${r.correct}/${r.total}`;
    console.log(
      `${r.id.padEnd(10)} | ${ratio.padEnd(8)} | ${String(r.predictionScore).padEnd(13)} | ${String(r.calibrationScore).padEnd(11)} | ${String(r.finalCredibility).padEnd(11)} | ${r.thesis.slice(0, 42)}...`
    );
  }
  console.log('========================================================================================');

  console.log('\n=== PREDICTIONS & RESOLUTIONS E2E LIFECYCLE TEST PASSED WITH ZERO ERRORS ===');
}

run10MindsPredictionsTest().catch(err => {
  console.error('[E2E PREDICTIONS TEST FAILED]', err);
  process.exit(1);
});
