import { NextRequest, NextResponse } from 'next/server';
import { getUserByWallet, mapAgent } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const user = getUserByWallet(address);
    if (!user) {
      return NextResponse.json({
        createdMinds: 0,
        provenMinds: 0,
        marketReadyMinds: 0,
        avgCredibility: 0,
        avgAccuracy: 0,
        totalFollowers: 0,
        estimatedValue: 0,
      });
    }

    const db = getDb();
    
    // Fetch all agents created by this user
    const rows = db.prepare(`
      SELECT a.* FROM agents a
      JOIN ideas i ON a.idea_id = i.id
      WHERE i.creator_id = ?
    `).all(user.id) as Record<string, unknown>[];

    const agents = rows.map(mapAgent);

    if (agents.length === 0) {
      return NextResponse.json({
        createdMinds: 0,
        provenMinds: 0,
        marketReadyMinds: 0,
        avgCredibility: 0,
        avgAccuracy: 0,
        totalFollowers: 0,
        estimatedValue: 0,
      });
    }

    let provenCount = 0;
    let marketReadyCount = 0;
    let totalCredibility = 0;
    let totalAccuracy = 0;
    let totalValue = 0;
    let totalFollowers = 0;

    for (const agent of agents) {
      if (['PROVEN', 'MARKET_READY', 'MARKET_ACTIVE'].includes(agent.lifecycleStatus)) {
        provenCount++;
      }
      if (['MARKET_READY', 'MARKET_ACTIVE'].includes(agent.lifecycleStatus)) {
        marketReadyCount++;
      }
      totalCredibility += agent.credibility;
      totalAccuracy += agent.predictionAccuracy;
      totalValue += agent.estimatedValue;

      // Get followers for each agent
      const fRow = db.prepare('SELECT COUNT(*) as c FROM idea_follows WHERE idea_id = ?').get(agent.ideaId) as { c: number };
      totalFollowers += fRow.c;
    }

    return NextResponse.json({
      createdMinds: agents.length,
      provenMinds: provenCount,
      marketReadyMinds: marketReadyCount,
      avgCredibility: totalCredibility / agents.length,
      avgAccuracy: totalAccuracy / agents.length,
      totalFollowers,
      estimatedValue: totalValue,
    });

  } catch (error) {
    console.error('[API] Get creator portfolio error:', error);
    return NextResponse.json({ error: 'Failed to fetch creator portfolio' }, { status: 500 });
  }
}
