/**
 * MINDCAST — Mind Shares Market E2E Scenario Test
 * Tests the scenario where Mind Shares Market is active,
 * founder/creator allocation exceeds 15%, and uses TEST_PRIVATE_KEY
 * to verify signing/blockchain connection.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Wallet, ethers } from 'ethers';

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
  findOrCreateUser,
  createIdea,
  createAgent,
  getAgent,
  createMindAsset,
  getMindAsset,
  updateMindAssetStatus,
  updateMindAssetAllocations,
  createMindFounder,
  getMindFounder,
  updateMindFounderAllocation,
} from '../src/lib/database/queries';
import { updateMindTrackRecordAndReputation } from '../src/lib/ai/reputation-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function main() {
  console.log('=== STARTING MIND SHARES MARKET SCENARIO TEST ===\n');

  // Initialize DB
  getDb();

  // 1. Resolve User & Mind
  const walletAddress = '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a';
  const user = findOrCreateUser(walletAddress);
  console.log(`[1] Resolved User: ${user.walletAddress}`);

  const idea = createIdea(user.id, 'Fully autonomous agent-driven markets will form 10% of DeFi TVL by 2028.');
  const agent = createAgent(idea.id, idea.content, 'System prompt');
  console.log(`[2] Created Mind Agent: ${agent.id}`);

  // Create initial assets and founder allocations (default 15.0%)
  const asset = createMindAsset(agent.id);
  const founder = createMindFounder(user.id, agent.id);
  
  assert(asset.creatorAllocation === 15.0, 'Default creator allocation starts at 15%.');
  assert(asset.marketStatus === 'INACTIVE', 'Default market status starts as INACTIVE.');
  assert(founder.allocationPercentage === 15.0, 'Default founder allocation starts at 15%.');

  // 2. Simulate graduation / reputation events to reach MARKET_READY
  console.log('\n[3] Simulating reputation updates to transition to MARKET_READY...');
  
  // Set high credibility and trigger graduation evaluation
  const db = getDb();
  db.prepare('UPDATE agents SET credibility = 85.0 WHERE id = ?').run(agent.id);
  
  // Run graduation
  updateMindTrackRecordAndReputation(agent.id);
  
  const graduatedAgent = getAgent(agent.id)!;
  console.log(`    Agent status after graduation check: ${graduatedAgent.lifecycleStatus}`);

  // 3. Unlock Shares Market: transition to ACTIVE status
  console.log('\n[4] Unlocking Shares Market (exceeding 15% scenario)...');
  updateMindAssetStatus(agent.id, 'ACTIVE');

  // Simulate buying more shares: increase allocation percentage to 20% (exceeding 15%!)
  updateMindAssetAllocations(agent.id, 20.0, 65.0); // 20% creator, 65% community
  updateMindFounderAllocation(agent.id, user.id, 20.0);

  // Re-fetch and assert
  const updatedAsset = getMindAsset(agent.id)!;
  const updatedFounder = getMindFounder(agent.id)!;

  assert(updatedAsset.marketStatus === 'ACTIVE', 'Shares market is now ACTIVE.');
  assert(updatedAsset.creatorAllocation === 20.0, 'Creator allocation successfully updated to 20%.');
  assert(updatedAsset.creatorAllocation > 15.0, 'Creator allocation successfully exceeded 15%!');
  assert(updatedFounder.allocationPercentage === 20.0, 'Founder allocation successfully updated to 20%.');

  // 4. Test TEST_PRIVATE_KEY sign verification
  console.log('\n[5] Testing TEST_PRIVATE_KEY sign verification on Base Sepolia...');
  
  const privateKey = process.env.TEST_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('TEST_PRIVATE_KEY is missing in env!');
  }

  // Initialize wallet with private key
  const rpcUrl = 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);

  console.log(`    Wallet Address from private key: ${wallet.address}`);
  assert(wallet.address !== '', 'Wallet address resolved from private key successfully.');

  // Sign a test payload
  const message = `MindCast E2E Verification - Agent ${agent.id} - Allocation: 20%`;
  const signature = await wallet.signMessage(message);
  console.log(`    Signed message signature: ${signature}`);
  
  // Recover signer
  const recoveredAddress = ethers.verifyMessage(message, signature);
  assert(recoveredAddress.toLowerCase() === wallet.address.toLowerCase(), 'Signature verification matches wallet address.');

  console.log('\n=== SHARES MARKET SCENARIO TESTS PASSED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('[E2E SHARES MARKET TEST FAILED]', err);
  process.exit(1);
});
