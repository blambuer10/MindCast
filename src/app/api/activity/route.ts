import { NextRequest, NextResponse } from 'next/server';
import {
  getActivityStream,
  getUserNotificationPreferences,
  saveUserNotificationPreferences
} from '@/lib/database/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);

    const stream = getActivityStream(walletAddress, limit);
    const preferences = walletAddress ? getUserNotificationPreferences(walletAddress) : null;

    return NextResponse.json({
      activity: stream,
      preferences,
    });
  } catch (error) {
    console.error('[API] Activity GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity stream' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, preferences } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const updated = saveUserNotificationPreferences(walletAddress, preferences || {});
    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error('[API] Activity POST preferences error:', error);
    return NextResponse.json({ error: 'Failed to save notification preferences' }, { status: 500 });
  }
}
