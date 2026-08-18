// ============================================================================
// MINDCAST — Follow API
// ============================================================================
// POST /api/ideas/[id]/follow — Follow
// DELETE /api/ideas/[id]/follow — Unfollow

import { NextRequest, NextResponse } from 'next/server';
import { followIdea, unfollowIdea, findOrCreateUser, getIdea, isFollowing } from '@/lib/database/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const idea = getIdea(id);
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const user = findOrCreateUser(walletAddress);
    followIdea(user.id, id);

    // Track analytics event
    const { trackEvent } = await import('@/lib/analytics/tracker');
    trackEvent('idea_followed', user.id, { ideaId: id });

    return NextResponse.json({ followed: true });
  } catch (error) {
    console.error('[API] Follow error:', error);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const user = findOrCreateUser(walletAddress);
    unfollowIdea(user.id, id);

    return NextResponse.json({ followed: false });
  } catch (error) {
    console.error('[API] Unfollow error:', error);
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
  }
}
