/**
 * MINDCAST — Make Mind Shares Market Live Utility Script
 * Force-graduates selected Minds and activates their Share Markets for testing.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// 1. Load .env.local manually
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
  getAgent,
  getMindAsset,
  createMindAsset,
  updateMindAssetStatus,
  updateMindAssetAllocations,
  getMindFounder,
  createMindFounder,
  updateMindFounderAllocation,
} from '../src/lib/database/queries';

async function main() {
  console.log('=== ACTIVATING MIND SHARES MARKET ON LOCAL DB ===\n');

  const db = getDb();
  
  // Get all agents
  const agents = db.prepare('SELECT id, idea_id, thesis FROM agents').all() as { id: string; idea_id: string; thesis: string }[];
  if (agents.length === 0) {
    console.log('❌ No agents found in local database.');
    return;
  }

  // We will force-activate the market for the latest 5 agents, or any agent that has debates/predictions
  const targets = agents.slice(-5); // Make the last 5 minds active/graduated!
  console.log(`Found ${agents.length} agents. Activating market for ${targets.length} targets...\n`);

  for (const agent of targets) {
    console.log(`Target Mind: ${agent.id}`);
    console.log(`  Thesis: "${agent.thesis.slice(0, 70)}..."`);

    // 1. Force-update lifecycleStatus to MARKET_READY or MARKET_ACTIVE
    db.prepare("UPDATE agents SET lifecycle_status = 'MARKET_READY', credibility = 85.0 WHERE id = ?").run(agent.id);
    
    // 2. Fetch or create mind asset
    let asset = getMindAsset(agent.id);
    if (!asset) {
      asset = createMindAsset(agent.id);
    }
    
    // 3. Fetch or create founder
    // Find creator of the idea
    const ideaRow = db.prepare('SELECT creator_id FROM ideas WHERE id = ?').get(agent.idea_id) as { creator_id: string } | undefined;
    const creatorId = ideaRow?.creator_id || 'system-user';
    
    let founder = getMindFounder(agent.id);
    if (!founder) {
      founder = createMindFounder(creatorId, agent.id);
    }

    // 4. Update asset status to ACTIVE, creator_allocation to 20% (exceeding 15%)
    updateMindAssetStatus(agent.id, 'ACTIVE');
    updateMindAssetAllocations(agent.id, 20.0, 65.0);
    updateMindFounderAllocation(agent.id, creatorId, 20.0);

    console.log(`  ✅ Status updated to MARKET_READY`);
    console.log(`  ✅ Shares Market activated (status: ACTIVE)`);
    console.log(`  ✅ Founder Allocation increased to 20% (exceeded 15% bar)\n`);
  }

  console.log('=== ACTIVATION COMPLETED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Activation failed:', err);
});
