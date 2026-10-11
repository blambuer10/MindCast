// ============================================================================
// MINDCAST — 0G Decentralized Storage Sync & Snapshot Management API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/connection';
import {
  exportPlatformSnapshot,
  importPlatformSnapshot,
  uploadToZeroG,
  downloadFromZeroG,
  getBackupDir,
  ZEROG_STORAGE_INDEXER,
  ZEROG_STORAGE_RPC
} from '@/lib/storage/zerog-sync';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET — Retrieve 0G Storage status, manifest, and snapshot summary
export async function GET() {
  try {
    const db = getDb();
    const backupDir = getBackupDir();
    const manifestPath = path.join(backupDir, 'manifest.json');

    let manifest: any = null;
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (_) {}
    }

    // Get current live database counts
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    const ideaCount = (db.prepare('SELECT COUNT(*) as c FROM ideas').get() as any)?.c || 0;
    const agentCount = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as any)?.c || 0;
    const eventCount = (db.prepare('SELECT COUNT(*) as c FROM agent_events').get() as any)?.c || 0;
    const evidenceCount = (db.prepare('SELECT COUNT(*) as c FROM evidence').get() as any)?.c || 0;
    const argumentCount = (db.prepare('SELECT COUNT(*) as c FROM arguments').get() as any)?.c || 0;
    const stakeCount = (db.prepare('SELECT COUNT(*) as c FROM argument_stakes').get() as any)?.c || 0;
    const paymentCount = (db.prepare('SELECT COUNT(*) as c FROM payments').get() as any)?.c || 0;

    return NextResponse.json({
      success: true,
      service: '0G Decentralized Storage Layer',
      network: {
        indexer: ZEROG_STORAGE_INDEXER,
        rpc: ZEROG_STORAGE_RPC,
        status: 'OPERATIONAL',
      },
      liveDatabase: {
        users: userCount,
        ideas: ideaCount,
        agents: agentCount,
        agentEvents: eventCount,
        evidence: evidenceCount,
        arguments: argumentCount,
        stakes: stakeCount,
        payments: paymentCount,
      },
      manifest: manifest || {
        status: 'INITIALIZING',
        storageTarget: 'local_backup_and_0g',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API 0G Sync] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get 0G sync status' },
      { status: 500 }
    );
  }
}

// POST — Manually trigger export & 0G Storage upload
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    console.log('[API 0G Sync] Exporting platform snapshot...');
    const snapshot = exportPlatformSnapshot(db);

    console.log('[API 0G Sync] Uploading to 0G Storage & persistent backup...');
    const result = await uploadToZeroG(snapshot);

    return NextResponse.json({
      success: true,
      message: result.message,
      contentHash: result.contentHash,
      zerogRootHash: result.zerogRootHash || null,
      storageTarget: result.storageTarget,
      timestamp: snapshot.timestamp,
      recordsSynced: {
        users: snapshot.users.length,
        ideas: snapshot.ideas.length,
        agents: snapshot.agents.length,
        agentEvents: snapshot.agentEvents.length,
        evidence: snapshot.evidence.length,
        arguments: snapshot.arguments.length,
        predictions: snapshot.predictions.length,
        stakes: snapshot.stakes.length,
        payments: snapshot.payments.length,
      },
    });
  } catch (error: any) {
    console.error('[API 0G Sync] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger 0G sync' },
      { status: 500 }
    );
  }
}

// PUT — Restore / rehydrate platform from snapshot or 0G root hash
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rootHash = body.rootHash;

    const db = getDb();
    const snapshot = await downloadFromZeroG(rootHash);

    if (!snapshot) {
      return NextResponse.json(
        { error: 'No snapshot found on 0G network or local backup' },
        { status: 404 }
      );
    }

    const imported = importPlatformSnapshot(db, snapshot);

    return NextResponse.json({
      success: true,
      message: 'Platform state successfully restored from decentralized snapshot',
      snapshotTimestamp: snapshot.timestamp,
      hash: snapshot.hash,
      restoredRecords: imported,
    });
  } catch (error: any) {
    console.error('[API 0G Sync] PUT restore error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore snapshot' },
      { status: 500 }
    );
  }
}
