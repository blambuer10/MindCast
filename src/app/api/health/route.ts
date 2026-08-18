import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  const health: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      application: 'healthy',
      database: 'degraded',
      ai: 'degraded',
      blockchain: 'degraded',
    }
  };

  // 1. Check Database
  try {
    const dbPath = process.env.DATABASE_PATH || '';
    const fs = require('fs');
    if (dbPath) {
      const dir = require('path').dirname(dbPath);
      try {
        fs.writeFileSync(require('path').join(dir, '.write-test'), 'test');
        fs.unlinkSync(require('path').join(dir, '.write-test'));
        console.log(`[Health Check] Write test successful for directory: ${dir}`);
      } catch (writeErr: any) {
        console.error(`[Health Check] Write permission test FAILED for directory ${dir}:`, writeErr.stack || writeErr.message);
      }
    }

    const db = getDb();
    const result = db.prepare('SELECT 1 as val').get() as { val: number };
    if (result.val === 1) {
      health.services.database = 'healthy';
    }
  } catch (err: any) {
    console.error('[Health Check] Database verification failed. Full stack:', err.stack || err.message || err);
    health.status = 'degraded';
    health.services.database = 'unavailable';
  }

  // 2. Check AI / 0G Compute configuration
  try {
    const provider = process.env.AI_PROVIDER || 'zerog';
    const apiKey = provider === 'zerog' ? (process.env.ZEROG_API_KEY || process.env['0G_API_KEY'] || process.env.OPENAI_API_KEY) : process.env.OPENAI_API_KEY;
    if (apiKey) {
      health.services.ai = 'healthy';
    } else {
      health.status = 'degraded';
      health.services.ai = 'misconfigured';
    }
  } catch (_) {
    health.status = 'degraded';
    health.services.ai = 'unavailable';
  }

  // 3. Check Blockchain RPC
  try {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || (chainId === '84532' ? 'https://sepolia.base.org' : 'https://mainnet.base.org');
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      }),
      signal: AbortSignal.timeout(3000) // Timeout after 3 seconds
    });
    
    if (response.ok) {
      health.services.blockchain = 'healthy';
    } else {
      health.status = 'degraded';
      health.services.blockchain = 'unreachable';
    }
  } catch (_) {
    health.status = 'degraded';
    health.services.blockchain = 'unavailable';
  }

  return NextResponse.json(health);
}
