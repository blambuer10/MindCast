import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, getUserByWallet, findOrCreateUser } from '@/lib/database/queries';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, address, username, displayName, bio, avatarUrl, bannerUrl, coverUrl } = body;
    const targetAddress = walletAddress || address;

    if (!targetAddress || !ethers.isAddress(targetAddress)) {
      return NextResponse.json({ error: 'Valid wallet address is required' }, { status: 400 });
    }

    const result = updateUserProfile(targetAddress, {
      username,
      displayName,
      bio,
      avatarUrl,
      bannerUrl: bannerUrl || coverUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Trigger 0G sync to preserve updated user profile permanently
    try {
      const { triggerSync } = await import('@/lib/storage/zerog-sync');
      const { getDb } = await import('@/lib/database/connection');
      triggerSync(getDb());
    } catch (_) {}

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error: any) {
    console.error('[API] Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}

export const PUT = PATCH;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress') || searchParams.get('address');

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Valid wallet address query param is required' }, { status: 400 });
    }

    let isNew = false;
    let user = getUserByWallet(walletAddress);
    if (!user) {
      user = findOrCreateUser(walletAddress);
      isNew = true;
    }

    // Trigger sync for new wallet user registration
    if (isNew) {
      try {
        const { triggerSync } = await import('@/lib/storage/zerog-sync');
        const { getDb } = await import('@/lib/database/connection');
        triggerSync(getDb());
      } catch (_) {}
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
  }
}
