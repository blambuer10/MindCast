import { getDb } from '../src/lib/database/connection';

function diagnoseDatabase() {
  console.log('=== RUNNING MINDCAST AGENTS DIAGNOSTIC ===\n');

  const db = getDb();
  
  // 1. Total Agents Count
  const agents = db.prepare('SELECT * FROM agents').all() as any[];
  console.log(`Total Minds in database: ${agents.length}`);
  
  if (agents.length === 0) {
    console.log('No minds created yet. Try submitting an idea on the landing page!');
    return;
  }

  // 2. Status Breakdown
  const statusCounts = db.prepare('SELECT lifecycle_status, COUNT(*) as c FROM agents GROUP BY lifecycle_status').all() as any[];
  console.log('\nLifecycle status breakdown:');
  for (const row of statusCounts) {
    console.log(`- ${row.lifecycle_status}: ${row.c} Mind(s)`);
  }

  // 3. Credibility & Accuracy stats
  console.log('\nAgent Metrics Summary:');
  for (const agent of agents) {
    const evidenceCount = db.prepare('SELECT COUNT(*) as c FROM evidence WHERE agent_id = ?').get(agent.id) as any;
    const debateCount = db.prepare('SELECT COUNT(*) as c FROM debates WHERE agent_a = ? OR agent_b = ?').get(agent.id, agent.id) as any;
    const predictionCount = db.prepare('SELECT COUNT(*) as c FROM predictions WHERE mind_id = ?').get(agent.id) as any;
    
    console.log(`\nAgent ${agent.id}:`);
    console.log(`  Thesis: "${agent.thesis.slice(0, 80)}..."`);
    console.log(`  Lifecycle: ${agent.lifecycle_status}`);
    console.log(`  Confidence: ${agent.confidence}%`);
    console.log(`  Credibility: ${agent.credibility}%`);
    console.log(`  Accuracy: ${Math.round(agent.prediction_accuracy * 100)}%`);
    console.log(`  Evidence Citations: ${evidenceCount.c}`);
    console.log(`  Debates Joined: ${debateCount.c}`);
    console.log(`  Predictions Tracked: ${predictionCount.c}`);
  }

  console.log('\n=== DIAGNOSTICS COMPLETED SUCCESSFULLY ===');
}

diagnoseDatabase();
