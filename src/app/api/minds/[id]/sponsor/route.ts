import { NextRequest, NextResponse } from 'next/server';
import { getAgent, getIdea, sponsorMindCompute, getMindSponsorships } from '@/lib/database/queries';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let agent = getAgent(id);
    if (!agent) {
      const idea = getIdea(id);
      if (idea && idea.agentId) {
        agent = getAgent(idea.agentId);
      }
    }

    const agentId = agent ? agent.id : id;
    const sponsorships = getMindSponsorships(agentId);

    return NextResponse.json({
      agentId,
      sponsorships,
      totalSponsored: sponsorships.reduce((sum, s) => sum + s.amount, 0),
      computeRemaining: agent?.computeRemaining || 1.0,
    });
  } catch (error: any) {
    console.error('[API] Get sponsorships error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sponsorships' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userWallet, amount, token, message, txHash, chain } = body;

    if (!userWallet || !ethers.isAddress(userWallet)) {
      return NextResponse.json({ error: 'Valid wallet address is required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0.5) {
      return NextResponse.json({ error: 'Sponsorship must be at least $0.50 USDC' }, { status: 400 });
    }

    let agent = getAgent(id);
    if (!agent) {
      const idea = getIdea(id);
      if (idea && idea.agentId) {
        agent = getAgent(idea.agentId);
      }
    }

    const agentId = agent ? agent.id : id;

    const sponsorship = sponsorMindCompute({
      mindId: agentId,
      userWallet,
      amount: numAmount,
      token: token || 'USDC',
      message: message ? String(message).slice(0, 280) : undefined,
      txHash,
      chain: chain || 'base',
    });

    const updatedAgent = getAgent(agentId);

    return NextResponse.json({
      success: true,
      sponsorship,
      newComputeBudget: updatedAgent?.computeBudget,
      newComputeRemaining: updatedAgent?.computeRemaining,
    });
  } catch (error: any) {
    console.error('[API] Sponsor mind error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sponsor mind' }, { status: 500 });
  }
}
