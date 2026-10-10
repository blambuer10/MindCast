import { NextRequest, NextResponse } from 'next/server';
import { isUsernameAvailable } from '@/lib/database/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || '';
    const currentWallet = searchParams.get('currentWallet') || undefined;

    if (!username.trim()) {
      return NextResponse.json({ available: false, reason: 'Username cannot be empty' }, { status: 400 });
    }

    const result = isUsernameAvailable(username, currentWallet);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Validation error' }, { status: 500 });
  }
}
