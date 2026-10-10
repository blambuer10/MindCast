import { NextRequest, NextResponse } from 'next/server';
import { getAgent, getIdea, placeArgumentStake, getArgumentMarketSummary, getArgumentStakes } from '@/lib/database/queries';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; argId: string }> }
) {
  try {
    const { argId } = await params;
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet') || undefined;

    const summary = getArgumentMarketSummary(argId, userWallet);
    const stakes = getArgumentStakes(argId);

    return NextResponse.json({ summary, stakes });
  } catch (error: any) {
    console.error('[API] Get argument stakes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stakes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; argId: string }> }
) {
  try {
    const { id, argId } = await params;
    const body = await request.json();
    const { userWallet, side, amount, token, txHash, chain } = body;

    if (!userWallet || !ethers.isAddress(userWallet)) {
      return NextResponse.json({ error: 'Valid wallet address is required to place stake' }, { status: 400 });
    }

    if (side !== 'SUPPORT' && side !== 'CHALLENGE') {
      return NextResponse.json({ error: 'Side must be SUPPORT or CHALLENGE' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0.5) {
      return NextResponse.json({ error: 'Stake amount must be at least $0.50 USDC' }, { status: 400 });
    }

    // Resolve Agent
    let agent = getAgent(id);
    if (!agent) {
      const idea = getIdea(id);
      if (idea && idea.agentId) {
        agent = getAgent(idea.agentId);
      }
    }

    const agentId = agent ? agent.id : id;

    const stake = placeArgumentStake({
      argumentId: argId,
      agentId,
      userWallet,
      side,
      amount: numAmount,
      token: token || 'USDC',
      txHash,
      chain: chain || 'base',
    });

    const summary = getArgumentMarketSummary(argId, userWallet);

    return NextResponse.json({
      success: true,
      stake,
      summary,
    });
  } catch (error: any) {
    console.error('[API] Place argument stake error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place stake' }, { status: 500 });
  }
}
