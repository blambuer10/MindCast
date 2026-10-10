import { NextResponse } from 'next/server';

// In-memory battle vote counter
const battleVotes: Record<string, { A: number; B: number }> = {
  'CON1-SIM1': { A: 48, B: 52 },
  '590A-ECON': { A: 65, B: 35 },
  'SCI1-SIM1': { A: 42, B: 58 },
};

export async function POST(req: Request) {
  try {
    const { battleId, side } = await req.json();
    if (!battleId || (side !== 'A' && side !== 'B')) {
      return NextResponse.json({ error: 'Invalid battle vote request' }, { status: 400 });
    }

    if (!battleVotes[battleId]) {
      battleVotes[battleId] = { A: 10, B: 10 };
    }

    if (side === 'A') {
      battleVotes[battleId].A += 1;
    } else {
      battleVotes[battleId].B += 1;
    }

    const total = battleVotes[battleId].A + battleVotes[battleId].B;
    const totalA = Math.round((battleVotes[battleId].A / total) * 100);
    const totalB = 100 - totalA;

    return NextResponse.json({
      success: true,
      totalA,
      totalB,
      rawVotes: battleVotes[battleId],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
