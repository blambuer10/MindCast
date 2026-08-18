// ============================================================================
// MINDCAST — User Sync API
// Registers or updates connected wallet users into the persistent database
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser } from '@/lib/database/queries';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, name } = await request.json();

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Valid wallet address is required' },
        { status: 400 }
      );
    }

    const user = findOrCreateUser(walletAddress);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('[API] User sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user', details: error.message },
      { status: 500 }
    );
  }
}
