// ============================================================================
// MINDCAST — Real User Payout E2E Verification Test Script
// ============================================================================

import { getDb } from '../src/lib/database/connection';
import { findOrCreateUser } from '../src/lib/database/queries';
import { Wallet, ethers, Contract } from 'ethers';
import assert from 'assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
];

async function runE2EPayoutTest() {
  console.log('=== STARTING REAL USER PAYOUT E2E TEST ===\n');

  const privateKey = process.env.TEST_PRIVATE_KEY;
  if (!privateKey) {
    console.error('[FAIL] TEST_PRIVATE_KEY not set in .env.local');
    process.exit(1);
  }

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';
  const rpcUrl = process.env.RPC_MAINNET_BASE || process.env.BLOCKCHAIN_RPC_URL || (chainId === '84532' ? 'https://sepolia.base.org' : 'https://mainnet.base.org');
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // 1. POOL_WALLET Setup
  const poolWallet = new Wallet(privateKey, provider);
  const poolAddress = poolWallet.address;
  console.log(`[1] POOL_WALLET: ${poolAddress}`);

  // 2. USER_WALLET Setup (Generate a fresh, separate address)
  const userWallet = Wallet.createRandom();
  const userAddress = userWallet.address;
  console.log(`[2] USER_WALLET: ${userAddress}`);
  assert.notStrictEqual(poolAddress.toLowerCase(), userAddress.toLowerCase(), 'POOL_WALLET and USER_WALLET must be different wallets.');

  // 3. Find/Create Active Mind in SQLite
  const db = getDb();
  let activeMind = db.prepare("SELECT mind_id FROM mind_assets WHERE market_status = 'ACTIVE' LIMIT 1").get() as { mind_id: string } | undefined;
  
  if (!activeMind) {
    console.log('[3] No active shares market found. Activating MIND-072A for testing...');
    db.prepare("INSERT OR REPLACE INTO mind_assets (mind_id, asset_type, total_supply, creator_allocation, community_allocation, protocol_allocation, liquidity_allocation, market_status) VALUES ('MIND-072A', 'SHARE', 100000, 20, 80, 0, 0, 'ACTIVE')").run();
    activeMind = { mind_id: 'MIND-072A' };
  }
  const mindId = activeMind.mind_id;
  console.log(`[3] Testing against Mind ID: ${mindId}`);

  // Ensure user wallet exists in SQLite users table
  const user = findOrCreateUser(userAddress);
  
  // Grant USER_WALLET 21% share allocation in database
  db.prepare('INSERT OR REPLACE INTO mind_founders (creator_id, mind_id, allocation_percentage, allocation_status) VALUES (?, ?, 21, ?)')
    .run(user.id, mindId, 'PENDING');
  console.log(`[3] Setup database allocation of 21% MIND shares for USER_WALLET`);

  // 4. Record Balances BEFORE the Payout
  console.log('\n[4] Fetching Balances BEFORE Payout...');
  const usdcContract = new Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, provider);

  const poolEthBefore = await provider.getBalance(poolAddress);
  const userEthBefore = await provider.getBalance(userAddress);
  const poolUsdcBefore = await usdcContract.balanceOf(poolAddress);
  const userUsdcBefore = await usdcContract.balanceOf(userAddress);

  console.log(`    - Pool ETH: ${ethers.formatEther(poolEthBefore)} ETH`);
  console.log(`    - User ETH: ${ethers.formatEther(userEthBefore)} ETH`);
  console.log(`    - Pool USDC: ${ethers.formatUnits(poolUsdcBefore, 6)} USDC`);
  console.log(`    - User USDC: ${ethers.formatUnits(userUsdcBefore, 6)} USDC`);

  // 5. Execute Payout API call (Sell 1% Shares)
  console.log('\n[5] Executing Sell Shares Payout API call (POST /api/minds/[id]/market/sell)...');
  const response = await fetch(`http://127.0.0.1:3000/api/minds/${mindId}/market/sell`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      percentage: '1',
      walletAddress: userAddress,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error(`\n[FAIL] API call failed with status ${response.status}:`, errorBody.error);
    process.exit(1);
  }

  const result = await response.json();
  console.log('[E2E PASS] API responded successfully:', result);
  
  const txHash = result.payoutTxHash;
  assert.ok(txHash && txHash.startsWith('0x'), 'API must return a valid payout transaction hash.');

  // 6. Verify Transaction Receipt details on Base Sepolia
  console.log('\n[6] Verifying Transaction Receipt on Base Sepolia...');
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    console.error(`[FAIL] Transaction receipt not found on-chain for hash: ${txHash}`);
    process.exit(1);
  }
  
  assert.strictEqual(receipt.status, 1, 'Transaction status must be success (1).');
  
  // Calculate gas fee spent by pool wallet
  const tx = await provider.getTransaction(txHash);
  const gasSpent = receipt.gasUsed * (tx?.gasPrice || BigInt(0));

  // 7. Record Balances AFTER the Payout
  console.log('\n[7] Fetching Balances AFTER Payout...');
  const poolEthAfter = await provider.getBalance(poolAddress);
  const userEthAfter = await provider.getBalance(userAddress);
  const poolUsdcAfter = await usdcContract.balanceOf(poolAddress);
  const userUsdcAfter = await usdcContract.balanceOf(userAddress);

  console.log(`    - Pool ETH: ${ethers.formatEther(poolEthAfter)} ETH`);
  console.log(`    - User ETH: ${ethers.formatEther(userEthAfter)} ETH`);
  console.log(`    - Pool USDC: ${ethers.formatUnits(poolUsdcAfter, 6)} USDC`);
  console.log(`    - User USDC: ${ethers.formatUnits(userUsdcAfter, 6)} USDC`);

  // 8. DB Allocation Checks
  console.log('\n[8] Verifying Database Allocation updates...');
  const row = db.prepare('SELECT allocation_percentage FROM mind_founders WHERE mind_id = ? AND creator_id = ?')
    .get(mindId, user.id) as { allocation_percentage: number } | undefined;
  
  const userAllocationAfter = row ? row.allocation_percentage : 0;
  console.log(`    - User allocation percentage in DB: ${userAllocationAfter}%`);

  // 9. E2E Assertions
  console.log('\n[9] Running final E2E verification assertions...');
  
  // Assert allocations decreased
  assert.strictEqual(userAllocationAfter, 20, 'User allocation in database must update from 21% to 20%.');
  
  // Assert balances changed
  const usdcReceived = userUsdcAfter - userUsdcBefore;
  const usdcSent = poolUsdcBefore - poolUsdcAfter;
  
  console.log(`    - Real USDC transferred: ${ethers.formatUnits(usdcReceived, 6)} USDC`);
  assert.ok(usdcReceived > BigInt(0), 'User wallet must receive a positive amount of USDC.');
  assert.strictEqual(usdcReceived, usdcSent, 'USDC sent by pool must exactly equal USDC received by user.');

  console.log('\n=============================================');
  console.log('REAL_USER_PAYOUT_TEST: PASS');
  console.log('---------------------------------------------');
  console.log(`Pool Wallet:         ${poolAddress}`);
  console.log(`Test User Wallet:    ${userAddress}`);
  console.log(`Shares Before:       21%`);
  console.log(`Shares After:        20%`);
  console.log(`USDC Before:         ${ethers.formatUnits(userUsdcBefore, 6)} USDC`);
  console.log(`USDC After:          ${ethers.formatUnits(userUsdcAfter, 6)} USDC`);
  console.log(`Payout Net Amount:   ${ethers.formatUnits(usdcReceived, 6)} USDC`);
  console.log(`Transaction Hash:    ${txHash}`);
  console.log(`Transaction Status:  SUCCESS`);
  console.log(`Gas Consumed:        ${ethers.formatEther(gasSpent)} ETH`);
  console.log('=============================================');
}

runE2EPayoutTest().catch(err => {
  console.error('\n[FAIL] E2E test execution error:', err);
  process.exit(1);
});
