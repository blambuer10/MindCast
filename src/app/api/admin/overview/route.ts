// ============================================================================
// MINDCAST — Comprehensive Admin Overview API
// Provides Real-Time On-Chain (Base Sepolia + Base Mainnet), 0G AI Network,
// Database Records, User Wallets, Mind Directory, Transactions, and System Logs
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/connection';
import { ethers, formatEther, formatUnits } from 'ethers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    // 1. Fetch On-Chain Data for Base Sepolia (Testnet) and Base Mainnet (Mainnet)
    const sepoliaRpc = process.env.BLOCKCHAIN_RPC_URL || 'https://sepolia.base.org';
    const mainnetRpc = process.env.RPC_MAINNET_BASE || 'https://mainnet.base.org';
    const sepoliaUsdcContract = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const mainnetUsdcContract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const poolPrivateKey = process.env.TEST_PRIVATE_KEY;
    const paymentRecipientAddress = process.env.PAYMENT_RECIPIENT_ADDRESS || '0x7a63d9197F49e7C6D27faE4fa4896791e84774B8';

    let sepoliaData: any = {
      chainId: 84532,
      name: 'Base Sepolia Testnet',
      rpcUrl: sepoliaRpc,
      status: 'offline',
      blockNumber: 0,
      gasPriceGwei: '0',
      poolWallet: null,
      poolEthBalance: '0',
      poolUsdcBalance: '0',
      usdcContract: sepoliaUsdcContract,
    };

    let mainnetData: any = {
      chainId: 8453,
      name: 'Base Mainnet',
      rpcUrl: mainnetRpc,
      status: 'offline',
      blockNumber: 0,
      gasPriceGwei: '0',
      recipientAddress: paymentRecipientAddress,
      recipientEthBalance: '0',
      recipientUsdcBalance: '0',
      usdcContract: mainnetUsdcContract,
    };

    // Parallel On-Chain Fetching
    await Promise.allSettled([
      (async () => {
        try {
          const provider = new ethers.JsonRpcProvider(sepoliaRpc);
          const [blockNumber, feeData] = await Promise.all([
            provider.getBlockNumber(),
            provider.getFeeData(),
          ]);

          sepoliaData.status = 'healthy';
          sepoliaData.blockNumber = blockNumber;
          sepoliaData.gasPriceGwei = feeData.gasPrice ? Number(formatUnits(feeData.gasPrice, 'gwei')).toFixed(3) : '0';

          if (poolPrivateKey) {
            const wallet = new ethers.Wallet(poolPrivateKey, provider);
            sepoliaData.poolWallet = wallet.address;
            const ethBal = await provider.getBalance(wallet.address);
            sepoliaData.poolEthBalance = Number(formatEther(ethBal)).toFixed(4);

            try {
              const usdc = new ethers.Contract(sepoliaUsdcContract, ['function balanceOf(address) view returns (uint256)'], provider);
              const usdcBal = await usdc.balanceOf(wallet.address);
              sepoliaData.poolUsdcBalance = Number(formatUnits(usdcBal, 6)).toFixed(2);
            } catch (_) {}
          }
        } catch (err: any) {
          sepoliaData.status = 'error';
          sepoliaData.error = err.message;
        }
      })(),
      (async () => {
        try {
          const provider = new ethers.JsonRpcProvider(mainnetRpc);
          const [blockNumber, feeData] = await Promise.all([
            provider.getBlockNumber(),
            provider.getFeeData(),
          ]);

          mainnetData.status = 'healthy';
          mainnetData.blockNumber = blockNumber;
          mainnetData.gasPriceGwei = feeData.gasPrice ? Number(formatUnits(feeData.gasPrice, 'gwei')).toFixed(3) : '0';

          if (paymentRecipientAddress && ethers.isAddress(paymentRecipientAddress)) {
            const ethBal = await provider.getBalance(paymentRecipientAddress);
            mainnetData.recipientEthBalance = Number(formatEther(ethBal)).toFixed(4);
            try {
              const usdc = new ethers.Contract(mainnetUsdcContract, ['function balanceOf(address) view returns (uint256)'], provider);
              const usdcBal = await usdc.balanceOf(paymentRecipientAddress);
              mainnetData.recipientUsdcBalance = Number(formatUnits(usdcBal, 6)).toFixed(2);
            } catch (_) {}
          }
        } catch (err: any) {
          mainnetData.status = 'error';
          mainnetData.error = err.message;
        }
      })(),
    ]);

    // 2. AI / 0G Infrastructure Status
    const aiProvider = process.env.AI_PROVIDER || 'zerog';
    const zerogApiKey = process.env.ZEROG_API_KEY || process.env['0G_API_KEY'];
    const aiData = {
      provider: aiProvider === 'zerog' ? '0G Decentralized AI Network' : 'OpenAI Intelligence',
      status: zerogApiKey || process.env.OPENAI_API_KEY ? 'operational' : 'missing_key',
      activeModel: process.env.ZEROG_MODEL || '0g-glm4-9b-chat',
      endpoint: process.env.ZEROG_API_URL || 'https://api.0g.ai/v1',
      hasApiKey: !!(zerogApiKey || process.env.OPENAI_API_KEY),
    };

    // 3. Database Statistics & High-Level Metrics
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number })?.c || 0;
    const totalIdeas = (db.prepare('SELECT COUNT(*) as c FROM ideas').get() as { c: number })?.c || 0;
    const publishedIdeas = (db.prepare("SELECT COUNT(*) as c FROM ideas WHERE status = 'PUBLISHED'").get() as { c: number })?.c || 0;
    const totalDebates = (db.prepare('SELECT COUNT(*) as c FROM debates').get() as { c: number })?.c || 0;
    const activeDebates = (db.prepare("SELECT COUNT(*) as c FROM debates WHERE status = 'ACTIVE'").get() as { c: number })?.c || 0;
    const totalEvidence = (db.prepare('SELECT COUNT(*) as c FROM evidence').get() as { c: number })?.c || 0;
    const totalEvents = (db.prepare('SELECT COUNT(*) as c FROM agent_events').get() as { c: number })?.c || 0;
    const totalPayments = (db.prepare('SELECT COUNT(*) as c FROM payments').get() as { c: number })?.c || 0;
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as c FROM payments WHERE status = 'CONFIRMED'").get() as { c: number })?.c || 0;

    // 4. Detailed Users & Wallets Log
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.wallet_address, 
        u.name, 
        u.reputation, 
        u.created_at,
        (SELECT COUNT(*) FROM ideas WHERE creator_id = u.id) as ideas_count,
        (SELECT COUNT(*) FROM mind_founders WHERE creator_id = u.id) as investments_count,
        (SELECT COALESCE(SUM(allocation_percentage), 0) FROM mind_founders WHERE creator_id = u.id) as total_shares_percent
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 100
    `).all() as any[];

    // 5. On-Chain Payments & Market Transactions
    const payments = db.prepare(`
      SELECT 
        p.id, 
        p.user_id, 
        p.idea_id, 
        p.chain, 
        p.tx_hash, 
        p.amount, 
        p.token, 
        p.recipient, 
        p.status, 
        p.created_at, 
        p.verified_at,
        u.wallet_address,
        i.content as idea_content
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN ideas i ON p.idea_id = i.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all() as any[];

    // 6. Minds / Ideas Directory with full metrics
    const minds = db.prepare(`
      SELECT 
        i.id,
        i.content as thesis,
        i.status as idea_status,
        i.created_at,
        u.wallet_address as creator_wallet,
        a.id as agent_id,
        a.confidence,
        a.credibility,
        a.prediction_accuracy,
        a.lifecycle_status,
        a.estimated_value,
        ma.token_address,
        ma.market_cap,
        ma.share_price,
        ma.creator_allocation,
        ma.community_allocation,
        (SELECT COUNT(*) FROM evidence WHERE agent_id = a.id) as evidence_count,
        (SELECT COUNT(*) FROM debates WHERE agent_a = a.id OR agent_b = a.id) as debate_count,
        (SELECT COUNT(*) FROM idea_follows WHERE idea_id = i.id) as follower_count
      FROM ideas i
      LEFT JOIN users u ON i.creator_id = u.id
      LEFT JOIN agents a ON i.agent_id = a.id
      LEFT JOIN mind_assets ma ON a.id = ma.mind_id
      ORDER BY i.created_at DESC
      LIMIT 100
    `).all() as any[];

    // 7. Live System Activity & Audit Logs
    const recentAgentEvents = db.prepare(`
      SELECT ae.id, ae.agent_id, ae.event_type, ae.content, ae.source, ae.created_at, a.thesis
      FROM agent_events ae
      LEFT JOIN agents a ON ae.agent_id = a.id
      ORDER BY ae.created_at DESC
      LIMIT 50
    `).all() as any[];

    const recentAuditLogs = db.prepare(`
      SELECT id, actor_id, role, dataset_id, purpose, action, timestamp, result
      FROM data_access_audit_log
      ORDER BY timestamp DESC
      LIMIT 50
    `).all() as any[];

    const topDomains = db.prepare(`
      SELECT domain, source_type, citation_count, supporting_count, opposing_count, average_reliability
      FROM source_intelligence
      ORDER BY citation_count DESC
      LIMIT 10
    `).all() as any[];

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      networks: {
        sepolia: sepoliaData,
        mainnet: mainnetData,
        ai: aiData,
      },
      metrics: {
        totalUsers,
        totalIdeas,
        publishedIdeas,
        totalDebates,
        activeDebates,
        totalEvidence,
        totalEvents,
        totalPayments,
        totalRevenue,
      },
      users,
      payments,
      minds,
      logs: {
        agentEvents: recentAgentEvents,
        auditLogs: recentAuditLogs,
        topDomains,
      },
    });
  } catch (error: any) {
    console.error('[API] Admin Overview failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin overview', details: error.message },
      { status: 500 }
    );
  }
}
