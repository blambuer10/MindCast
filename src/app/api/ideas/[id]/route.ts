// ============================================================================
// MINDCAST — Idea Detail API Route
// ============================================================================
// GET /api/ideas/[id] — Get idea details with Mind state

import { NextRequest, NextResponse } from 'next/server';
import { getIdea, getAgent, getAgentByIdea, getFollowerCount, isFollowing, getUserByWallet, getPredictionsByMind, getMindAsset, getMindFounder } from '@/lib/database/queries';
import { getMindState } from '@/lib/ai/mind-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idea = getIdea(id);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const agent = getAgentByIdea(idea.id) || (idea.agentId ? getAgent(idea.agentId) : null);
    const mindState = agent ? getMindState(agent.id) : null;
    const predictions = agent ? getPredictionsByMind(agent.id) : [];
    const followerCount = getFollowerCount(idea.id);
    const mindAsset = agent ? getMindAsset(agent.id) : null;
    const mindFounder = agent ? getMindFounder(agent.id) : null;

    // Check if a specific wallet is following and get their allocation
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    let following = false;
    let userAllocation = 0;

    if (walletAddress) {
      const user = getUserByWallet(walletAddress);
      if (user) {
        following = isFollowing(user.id, idea.id);
        if (agent) {
          const db = require('@/lib/database/connection').getDb();
          const row = db.prepare('SELECT allocation_percentage FROM mind_founders WHERE mind_id = ? AND creator_id = ?').get(agent.id, user.id) as { allocation_percentage: number } | undefined;
          if (row) {
            userAllocation = row.allocation_percentage;
          }
        }
      }
    }

    const { getUserById } = await import('@/lib/database/queries');
    const creator = idea.creatorId ? getUserById(idea.creatorId) : null;

    return NextResponse.json({
      idea,
      creator: creator ? { id: creator.id, walletAddress: creator.walletAddress } : null,
      agent,
      mindState,
      predictions,
      followerCount,
      isFollowing: following,
      mindAsset,
      mindFounder,
      userAllocation,
    });

  } catch (error) {
    console.error('[API] Idea detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch idea' }, { status: 500 });
  }
}
