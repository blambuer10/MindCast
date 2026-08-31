// ============================================================================
// MINDCAST — Mind Shares Market Sell API Route
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
import { Wallet, ethers, Contract, parseUnits } from 'ethers';
import { calculateTradePrice } from '@/lib/blockchain/pricing';

const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { percentage, walletAddress } = body;

    if (!id || !percentage || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: percentage, walletAddress' },
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

    const user = findOrCreateUser(walletAddress);
    const db = getDb();
    const parsedPercentage = parseFloat(percentage);

    // 1. Verify user has enough allocation to sell
    const row = db.prepare('SELECT allocation_percentage FROM mind_founders WHERE (UPPER(mind_id) = UPPER(?) OR UPPER(mind_id) = UPPER(?)) AND creator_id = ?')
      .get(agent.id, agent.ideaId, user.id) as { allocation_percentage: number } | undefined;
    if (!row || row.allocation_percentage < parsedPercentage) {
      return NextResponse.json(
        { error: `Insufficient shares. You only own ${row ? row.allocation_percentage : 0}% shares.` },
        { status: 400 }
      );
    }

    // 2. Process pay-out to user from deployer/liquidity wallet
    const privateKey = process.env.DEPLOY_PRIVATE_KEY || process.env.TEST_PRIVATE_KEY;
    let payoutTxHash = '';
    
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Liquidity pool wallet not configured. Contact platform admin.' },
        { status: 503 }
      );
    }

    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';
    const rpcUrl = process.env.RPC_MAINNET_BASE || process.env.BLOCKCHAIN_RPC_URL || (chainId === '84532' ? 'https://sepolia.base.org' : 'https://mainnet.base.org');
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    // Prevent pool from sending payouts to itself
    if (walletAddress.toLowerCase() === wallet.address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Transaction rejected. Payout recipient wallet cannot be the liquidity pool wallet itself.' },
        { status: 400 }
      );
    }

    try {
      // Pre-flight: Check ETH balance for gas
      const ethBalance = await provider.getBalance(wallet.address);
      if (ethBalance === BigInt(0)) {
        return NextResponse.json(
          { error: 'Liquidity pool wallet has insufficient ETH for gas fees. Please fund the pool wallet with Base Sepolia ETH.' },
          { status: 503 }
        );
      }

      // Pre-flight: Check USDC balance for payout
      const USDC_BALANCE_ABI = ['function balanceOf(address) view returns (uint256)'];
      const usdcReadContract = new Contract(usdcAddress, USDC_BALANCE_ABI, provider);
      const usdcBalance = await usdcReadContract.balanceOf(wallet.address);

      // Compute dynamic payout amount using the pricing model
      const followerCount = getFollowerCount(agent.ideaId);
      const priceDetails = calculateTradePrice(parsedPercentage, agent, followerCount);
      const requiredAmount = parseUnits(priceDetails.netAmount.toFixed(6), 6);
      
      if (usdcBalance < requiredAmount) {
        const available = Number(usdcBalance) / 1000000;
        return NextResponse.json(
          { error: `Insufficient USDC in liquidity pool. Available: ${available} USDC, Required: ${priceDetails.netAmount.toFixed(2)} USDC.` },
          { status: 503 }
        );
      }

      // Execute real USDC transfer
      const usdcContract = new Contract(usdcAddress, USDC_ABI, wallet);
      const parsedAmount = requiredAmount;
      
      console.log(`[API] Processing USDC payout transfer of ${percentage} USDC to ${walletAddress}...`);
      const tx = await usdcContract.transfer(walletAddress, parsedAmount);
      await tx.wait(); // Wait for confirmation
      payoutTxHash = tx.hash;
      console.log(`[API] Payout transfer confirmed: ${tx.hash}`);
    } catch (blockchainErr: any) {
      console.error('[API] USDC payout failed:', blockchainErr.message);
      return NextResponse.json(
        { error: `Payout transaction failed: ${blockchainErr.shortMessage || blockchainErr.message}` },
        { status: 500 }
      );
    }

    // 3. Update database allocations
    const newCreatorAlloc = Math.max(0, asset.creatorAllocation - parsedPercentage);
    const newCommunityAlloc = asset.communityAllocation + parsedPercentage;
    updateMindAssetAllocations(agent.id, newCreatorAlloc, newCommunityAlloc);

    // Deduct user allocation
    const newFounderPercentage = Math.max(0, row.allocation_percentage - parsedPercentage);
    if (newFounderPercentage === 0) {
      db.prepare('DELETE FROM mind_founders WHERE (UPPER(mind_id) = UPPER(?) OR UPPER(mind_id) = UPPER(?)) AND creator_id = ?')
        .run(agent.id, agent.ideaId, user.id);
    } else {
      db.prepare('UPDATE mind_founders SET allocation_percentage = ? WHERE (UPPER(mind_id) = UPPER(?) OR UPPER(mind_id) = UPPER(?)) AND creator_id = ?')
        .run(newFounderPercentage, agent.id, agent.ideaId, user.id);
    }

    return NextResponse.json({
      success: true,
      creatorAllocation: newCreatorAlloc,
      communityAllocation: newCommunityAlloc,
      payoutTxHash,
    });

  } catch (error) {
    console.error('[API] Market Sell error:', error);
    return NextResponse.json(
      { error: 'Failed to process sell transaction.' },
      { status: 500 }
    );
  }
}
