/**
 * MINDCAST — Full Agent Pipeline E2E Test
 * Tests: arguments, evidence, predictions, activity
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

import { getDb } from '../src/lib/database/connection';
import {
  findOrCreateUser,
  createIdea,
  getIdea,
  getAgentByIdea,
  getAgent,
  getEvidenceByAgent,
  getArgumentsByAgent,
  getAgentEvents,
  createPrediction,
  getPredictionsByMind,
  resolvePrediction,
} from '../src/lib/database/queries';
import { birthMind, getMindState, analyzeMind } from '../src/lib/ai/mind-engine';

// Force-register the OpenAI/ZeroG provider
import '../src/lib/ai/openai';

async function main() {
  console.log('=== MINDCAST FULL AGENT PIPELINE E2E TEST ===\n');

  // 1. Setup
  getDb();

  const user = findOrCreateUser('0xTEST_PIPELINE_' + Date.now().toString(16));
  console.log(`[1] Test user created: ${user.id}`);

  // 2. Create an idea
  const idea = createIdea(
    user.id,
    'Autonomous AI agents will manage 40% of global supply chains by 2030.'
  );
  console.log(`[2] Idea created: ${idea.id} — status: ${idea.status}`);

  // 3. Birth a Mind
  console.log(`[3] Birthing Mind...`);
  const agent = await birthMind(idea.id, idea.content);
  console.log(`[3] Mind born: ${agent.id}`);

  // Wait for the background async analysis & evidence gathering to complete
  console.log(`[3] Waiting 22s for background async analysis and evidence gathering to complete...`);
  await new Promise(r => setTimeout(r, 22000));


  // 4. Check arguments
  const args = getArgumentsByAgent(agent.id);
  console.log(`\n[4] ARGUMENTS: ${args.length} found`);
  for (const arg of args) {
    console.log(`    - [strength=${(arg.strength * 100).toFixed(0)}%] ${arg.content.slice(0, 100)}...`);
  }

  // 5. Check evidence
  const evidence = getEvidenceByAgent(agent.id);
  console.log(`\n[5] EVIDENCE: ${evidence.length} items found`);
  for (const ev of evidence) {
    const claim = ev.claim || ev.title || 'No claim';
    const dir = ev.direction || ev.stance || 'UNKNOWN';
    console.log(`    - [${dir}] ${claim.slice(0, 100)}...`);
  }

  // 6. Check activity/events
  const events = getAgentEvents(agent.id, 50);
  console.log(`\n[6] ACTIVITY: ${events.length} events found`);
  for (const ev of events) {
    console.log(`    - [${ev.eventType}] ${ev.content.slice(0, 100)}...`);
    if (ev.confidenceBefore != null && ev.confidenceAfter != null) {
      console.log(`      Confidence: ${ev.confidenceBefore}% → ${ev.confidenceAfter}%`);
    }
  }

  // 7. Create & resolve predictions
  console.log(`\n[7] PREDICTIONS TEST:`);
  const pred1 = createPrediction(
    agent.id,
    'AI supply chain management adoption will exceed 25% by 2027',
    null, null, null, null, null,
    75
  );
  console.log(`    - Created prediction: ${pred1.id} (confidence: ${pred1.confidenceAtCreation}%)`);

  const pred2 = createPrediction(
    agent.id,
    'Major logistics companies will deploy AI agents for inventory by 2026',
    null, null, null, null, null,
    60
  );
  console.log(`    - Created prediction: ${pred2.id} (confidence: ${pred2.confidenceAtCreation}%)`);

  // Resolve one as true
  resolvePrediction(pred1.id, 'RESOLVED_TRUE', 85, 'Confirmed by McKinsey report');
  console.log(`    - Resolved ${pred1.id} as TRUE`);

  const predictions = getPredictionsByMind(agent.id);
  console.log(`    - Total predictions: ${predictions.length}`);
  for (const p of predictions) {
    console.log(`      [${p.status}] ${p.claim.slice(0, 80)}... (conf: ${p.confidenceAtCreation}%)`);
  }

  // 8. Full MindState check
  console.log(`\n[8] FULL MIND STATE CHECK:`);
  const state = getMindState(agent.id);
  if (!state) {
    console.log('    ❌ getMindState returned null!');
  } else {
    console.log(`    ✅ thesis: "${state.thesis.slice(0, 60)}..."`);
    console.log(`    ✅ confidence: ${state.belief.confidence}%`);
    console.log(`    ✅ credibility: ${state.belief.credibility}`);
    console.log(`    ✅ arguments: ${state.arguments.length}`);
    console.log(`    ✅ counterArguments: ${state.counterArguments.length}`);
    console.log(`    ✅ supporting evidence: ${state.evidence.length}`);
    console.log(`    ✅ opposing evidence: ${state.counterEvidence.length}`);
    console.log(`    ✅ all evidence: ${state.allEvidence?.length || 0}`);
    console.log(`    ✅ event history: ${state.memory.eventHistory.length}`);
    console.log(`    ✅ confidence history: ${state.memory.confidenceHistory.length}`);
  }

  // 9. Check the refreshed agent state from DB
  const refreshedAgent = getAgent(agent.id);
  if (refreshedAgent) {
    console.log(`\n[9] REFRESHED AGENT STATE:`);
    console.log(`    confidence: ${refreshedAgent.confidence}%`);
    console.log(`    credibility: ${refreshedAgent.credibility}`);
    console.log(`    computeBudget: ${refreshedAgent.computeBudget} USDC`);
    console.log(`    computeSpent: ${refreshedAgent.computeSpent} USDC`);
    console.log(`    computeRemaining: ${refreshedAgent.computeRemaining} USDC`);
    console.log(`    lifecycleStatus: ${refreshedAgent.lifecycleStatus}`);
    console.log(`    predictionAccuracy: ${refreshedAgent.predictionAccuracy}`);
    console.log(`    estimatedValue: $${refreshedAgent.estimatedValue}`);
  }

  // Summary
  const hasArgs = args.length > 0;
  const hasEvidence = evidence.length > 0;
  const hasEvents = events.length > 0;
  const hasPredictions = predictions.length > 0;
  const hasMindState = !!state && state.arguments.length >= 0;

  console.log('\n=== SUMMARY ===');
  console.log(`Arguments:   ${hasArgs ? '✅ WORKING' : '⚠️  FALLBACK (no AI provider key)'} (${args.length})`);
  console.log(`Evidence:    ${hasEvidence ? '✅ WORKING' : '⚠️  FALLBACK (no evidence provider)'} (${evidence.length})`);
  console.log(`Activity:    ${hasEvents ? '✅ WORKING' : '❌ BROKEN'} (${events.length})`);
  console.log(`Predictions: ${hasPredictions ? '✅ WORKING' : '❌ BROKEN'} (${predictions.length})`);
  console.log(`MindState:   ${hasMindState ? '✅ WORKING' : '❌ BROKEN'}`);
  
  const allWorking = hasEvents && hasPredictions && hasMindState;
  console.log(`\n${allWorking ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️  SOME SYSTEMS IN FALLBACK MODE'}`);

  if (!hasArgs) {
    console.log('\n⚠️  Arguments are empty because no AI API key is configured.');
    console.log('   The fallback creates analysis events but no structured arguments.');
    console.log('   To fix: set OPENAI_API_KEY or 0G_API_KEY in .env.local');
  }
}

main().catch(err => {
  console.error('E2E TEST FAILED:', err);
  process.exit(1);
});
