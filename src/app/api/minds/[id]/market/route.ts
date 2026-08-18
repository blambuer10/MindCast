import { NextRequest, NextResponse } from 'next/server';
import {
  getAgent,
  getMindAsset,
  createMindAsset,
  getMindFounder,
  createMindFounder,
  getIdea
} from '@/lib/database/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = getAgent(id);
    if (!agent) {
      return NextResponse.json({ error: 'Mind not found' }, { status: 404 });
    }

    const idea = getIdea(agent.ideaId)!;

    let asset = getMindAsset(id);
    if (!asset) {
      asset = createMindAsset(id);
    }

    let founder = getMindFounder(id);
    if (!founder) {
      founder = createMindFounder(idea.creatorId, id);
    }

    return NextResponse.json({
      asset,
      founder,
    });
  } catch (error) {
    console.error('[API] Get market allocation error:', error);
    return NextResponse.json({ error: 'Failed to fetch market details' }, { status: 500 });
  }
}
