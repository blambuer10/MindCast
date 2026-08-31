// ============================================================================
// MINDCAST — Mind Predictions API Route
// ============================================================================
// GET  /api/minds/[id]/predictions — List all predictions for a Mind
// POST /api/minds/[id]/predictions — Create a new prediction for a Mind

import { NextRequest, NextResponse } from 'next/server';
import { getPredictionsByMind, createPrediction, getAgent, getAgentByIdea, getIdea } from '@/lib/database/queries';
import { updateMindTrackRecordAndReputation } from '@/lib/ai/reputation-service';
import { analyzeMind, birthMind } from '@/lib/ai/mind-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let agent = getAgent(id) || getAgentByIdea(id);
    if (!agent) {
      const idea = getIdea(id);
      if (idea) {
        agent = getAgentByIdea(idea.id) || (idea.agentId ? getAgent(idea.agentId) : undefined);
      }
    }
    const mindId = agent ? agent.id : id;
    const predictions = getPredictionsByMind(mindId);
    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('[API] Get predictions error:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let agent = getAgent(id) || getAgentByIdea(id);
    if (!agent) {
      const idea = getIdea(id);
      if (idea) {
        agent = getAgentByIdea(idea.id) || (idea.agentId ? getAgent(idea.agentId) : undefined);
        if (!agent) {
          agent = await birthMind(idea.id, idea.content);
        }
      }
    }

    if (!agent) {
      return NextResponse.json({ error: 'Mind not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      claim,
      targetValue,
      targetMetric,
      targetDate,
      resolutionMethod,
      resolutionSource,
      confidenceAtCreation,
    } = body;

    if (!claim || confidenceAtCreation === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: claim, confidenceAtCreation' },
        { status: 400 }
      );
    }

    const prediction = createPrediction(
      agent.id,
      claim,
      targetValue || null,
      targetMetric || null,
      targetDate || null,
      resolutionMethod || null,
      resolutionSource || null,
      Number(confidenceAtCreation)
    );

    // Recalculate reputation
    updateMindTrackRecordAndReputation(agent.id);

    // Trigger AI argument and evidence analysis in the background
    analyzeMind(agent.id).catch((err) => {
      console.error(`[API] Analysis after prediction failed for ${agent.id}:`, err);
    });

    return NextResponse.json({ prediction }, { status: 201 });
  } catch (error) {
    console.error('[API] Create prediction error:', error);
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
  }
}
