import { NextResponse } from 'next/server';
import { getNoospheres } from '@/lib/database/queries';

export async function GET() {
  try {
    const noospheres = getNoospheres();
    return NextResponse.json({ noospheres });
  } catch (error) {
    console.error('[API] Noospheres GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch Noospheres' }, { status: 500 });
  }
}
