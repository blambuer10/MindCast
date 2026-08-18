import { NextRequest, NextResponse } from 'next/server';
import { getUserByWallet, mapIdea } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const user = getUserByWallet(address);
    if (!user) {
      return NextResponse.json({ ideas: [] });
    }

    const db = getDb();
    const rows = db.prepare('SELECT * FROM ideas WHERE creator_id = ? ORDER BY created_at DESC').all(user.id) as Record<string, unknown>[];
    const ideas = rows.map(mapIdea);

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('[API] Get creator ideas error:', error);
    return NextResponse.json({ error: 'Failed to fetch creator ideas' }, { status: 500 });
  }
}
