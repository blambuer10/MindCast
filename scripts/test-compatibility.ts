import { ethers } from 'ethers';

const BASE_URL = process.env.BASE_URL || 'https://mindcast.fun';

async function runCompatibilityTests() {
  console.log(`\n🔍 STARTING FULL BACKEND & FRONTEND COMPATIBILITY TESTS ON ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err: any) {
      console.log(`❌ FAIL: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('API Health & System Ping', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Health status: ${data.status}`);
  });

  // 2. Ideas list
  let testIdeaId = '';
  let testAgentId = '';
  await test('Fetch Ideas Feed & Verify Content', async () => {
    const res = await fetch(`${BASE_URL}/api/ideas`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ideas || data.ideas.length === 0) throw new Error('No ideas found');
    const idea = data.ideas.find((i: any) => i.agentId === 'MIND-590A') || data.ideas[0];
    testIdeaId = idea.id;
    testAgentId = idea.agentId || idea.agent?.id;
    if (!testIdeaId || !testAgentId) throw new Error('Idea or agent ID missing');
  });

  // 3. Idea Detail Resolution
  await test(`Idea Detail Route for ${testIdeaId}`, async () => {
    const res = await fetch(`${BASE_URL}/api/ideas/${testIdeaId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.idea || !data.agent) throw new Error('Idea or agent missing in detail');
    if (data.agent.id !== testAgentId) throw new Error('Agent mismatch');
  });

  // 4. Market Details & Active Status
  await test(`Market Bonding Curve Active for ${testAgentId}`, async () => {
    const res = await fetch(`${BASE_URL}/api/minds/${testAgentId}/market`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.asset) throw new Error('Market asset missing');
    if (data.asset.marketStatus !== 'ACTIVE') throw new Error(`Market status is ${data.asset.marketStatus}, expected ACTIVE`);
    if (!data.founder) throw new Error('Founder allocation missing');
  });

  // 5. Prediction Submission & Auto-Resolution
  await test(`Submit Prediction for ${testAgentId}`, async () => {
    const res = await fetch(`${BASE_URL}/api/minds/${testAgentId}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claim: 'MindCast compatibility automated test prediction will pass smoothly.',
        confidenceAtCreation: 95,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.prediction || !data.prediction.id) throw new Error('Prediction not created');
  });

  // 6. Bonding Curve Buy Simulation
  await test(`Bonding Curve Buy Verification for ${testAgentId}`, async () => {
    const mockHash = '0xmock' + Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const res = await fetch(`${BASE_URL}/api/minds/${testAgentId}/market/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        percentage: '0.1',
        txHash: mockHash,
        walletAddress: '0x73877aBf37e7400393B538E3babD182949C1cA55',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error('Buy operation did not return success');
  });

  // 7. Lifecycle & DEX Graduation Check
  await test(`Lifecycle & DEX Graduation for ${testAgentId}`, async () => {
    const res = await fetch(`${BASE_URL}/api/minds/${testAgentId}/lifecycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus: 'MARKET_ACTIVE' }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.newStatus !== 'MARKET_ACTIVE') throw new Error(`Status is ${data.newStatus}, expected MARKET_ACTIVE`);
  });

  // 8. Frontend Route Status Check
  await test('Frontend HTML / Route Status Verification', async () => {
    const resIdea = await fetch(`${BASE_URL}/idea/${testIdeaId}`);
    if (!resIdea.ok) throw new Error(`Idea page HTTP ${resIdea.status}`);
    const html = await resIdea.text();
    if (!html.toLowerCase().includes('mindcast')) throw new Error('MindCast brand not in page HTML');
  });

  console.log(`\n========================================`);
  console.log(`🏁 COMPATIBILITY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runCompatibilityTests().catch((e) => {
  console.error('Fatal error running tests:', e);
  process.exit(1);
});
