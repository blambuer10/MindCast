// ============================================================================
// MINDCAST — Agent Manual Intelligence Refresh API Route
// ============================================================================
// POST /api/agents/[id]/refresh — Trigger manual background search & updates

import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/database/queries';
import { analyzeMind } from '@/lib/ai/mind-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = getAgent(id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Ensure OpenAI provider is registered
    try {
      await import('@/lib/ai/openai');
    } catch {
      // Handled by fallback
    }

    // Trigger async refresh
    analyzeMind(id).catch((err) => {
      console.error(`[API] Background mind analysis refresh failed for ${id}:`, err);
    });

    return NextResponse.json({
      status: 'REFRESH_STARTED',
      agentId: id,
    });

  } catch (error) {
    console.error('[API] Agent manual refresh error:', error);
    return NextResponse.json({ error: 'Failed to initiate agent refresh' }, { status: 500 });
  }
}
