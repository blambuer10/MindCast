import { NextRequest, NextResponse } from 'next/server';
import { flagEvidence } from '@/lib/database/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, notes, userWallet } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Flag reason is required' }, { status: 400 });
    }

    const result = flagEvidence(id, reason, notes, userWallet);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Flag evidence error:', error);
    return NextResponse.json({ error: 'Failed to flag evidence source' }, { status: 500 });
  }
}
