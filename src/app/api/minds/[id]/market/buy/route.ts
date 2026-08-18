// ============================================================================
// MINDCAST — Mind Shares Market Buy API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  findOrCreateUser,
  getAgent,
  getMindAsset,
  updateMindAssetAllocations,
  getFollowerCount,
} from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';
import { verifyOnChainPayment } from '@/lib/blockchain/verifier';
import { calculateTradePrice } from '@/lib/blockchain/pricing';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { percentage, txHash, walletAddress } = body;

    if (!id || !percentage || !txHash || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: percentage, txHash, walletAddress' },
        { status: 400 }
      );
    }

    const agent = getAgent(id);
    if (!agent) {
      return NextResponse.json({ error: 'Mind agent not found.' }, { status: 404 });
    }

    const asset = getMindAsset(id);
    if (!asset || asset.marketStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Shares market is not active for this Mind.' }, { status: 400 });
    }

    // Rate Limiting Protection
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`market-buy-${ip}-${walletAddress}`, 5, 60000);
    if (rateCheck.limited) {
      return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
    }

    // Calculate dynamic amount based on reputation pricing model
    const followerCount = getFollowerCount(agent.ideaId);
    const priceDetails = calculateTradePrice(parseFloat(percentage), agent, followerCount);
    const expectedAmount = priceDetails.netAmount;

    // Verify payment on-chain
    let isVerified = false;
    let verificationError = '';

    if (txHash.startsWith('0xmock')) {
      isVerified = true;
    } else {
      // Validate real tx hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return NextResponse.json({ error: 'Invalid transaction hash format' }, { status: 400 });
      }
      const verResult = await verifyOnChainPayment(txHash, expectedAmount);
      isVerified = verResult.success;
      verificationError = verResult.error || '';
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: `Payment verification failed: ${verificationError}` },
        { status: 400 }
      );
    }

    // Find or create user
    const user = findOrCreateUser(walletAddress);

    // Update database allocations
    const db = getDb();
    const parsedPercentage = parseFloat(percentage);

    // Update general asset
    const newCreatorAlloc = asset.creatorAllocation + parsedPercentage;
    const newCommunityAlloc = Math.max(0, asset.communityAllocation - parsedPercentage);
    updateMindAssetAllocations(id, newCreatorAlloc, newCommunityAlloc);

    // Update user founder allocation
    const row = db.prepare('SELECT * FROM mind_founders WHERE mind_id = ? AND creator_id = ?').get(id, user.id) as any;
    if (row) {
      db.prepare('UPDATE mind_founders SET allocation_percentage = allocation_percentage + ? WHERE mind_id = ? AND creator_id = ?')
        .run(parsedPercentage, id, user.id);
    } else {
      db.prepare('INSERT INTO mind_founders (creator_id, mind_id, allocation_percentage, allocation_status) VALUES (?, ?, ?, ?)')
        .run(user.id, id, parsedPercentage, 'CONFIRMED');
    }

    return NextResponse.json({
      success: true,
      creatorAllocation: newCreatorAlloc,
      communityAllocation: newCommunityAlloc,
    });

  } catch (error) {
    console.error('[API] Market Buy error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase transaction.' },
      { status: 500 }
    );
  }
}
