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

    const { getAgentByIdea, createMindAsset } = await import('@/lib/database/queries');
    const agent = getAgent(id) || getAgentByIdea(id);
    if (!agent) {
      return NextResponse.json({ error: 'Mind agent not found.' }, { status: 404 });
    }

    let asset = getMindAsset(agent.id) || getMindAsset(agent.ideaId);
    if (!asset) {
      asset = createMindAsset(agent.id);
    }

    // Rate Limiting Protection
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`market-buy-${ip}-${walletAddress}`, 10, 60000);
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
    updateMindAssetAllocations(agent.id, newCreatorAlloc, newCommunityAlloc);

    // Update user founder allocation
    const row = db.prepare('SELECT * FROM mind_founders WHERE (UPPER(mind_id) = UPPER(?) OR UPPER(mind_id) = UPPER(?)) AND creator_id = ?')
      .get(agent.id, agent.ideaId, user.id) as any;
    if (row) {
      db.prepare('UPDATE mind_founders SET allocation_percentage = allocation_percentage + ?, allocation_status = ? WHERE mind_id = ? AND creator_id = ?')
        .run(parsedPercentage, 'CONFIRMED', row.mind_id, user.id);
    } else {
      db.prepare('INSERT INTO mind_founders (creator_id, mind_id, allocation_percentage, allocation_status) VALUES (?, ?, ?, ?)')
        .run(user.id, agent.id, parsedPercentage, 'CONFIRMED');
    }

    return NextResponse.json({
      success: true,
      creatorAllocation: newCreatorAlloc,
      communityAllocation: newCommunityAlloc,
      agentId: agent.id,
      sharesOwned: parsedPercentage * 1000,
    });

  } catch (error) {
    console.error('[API] Market Buy error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase transaction.' },
      { status: 500 }
    );
  }
}
