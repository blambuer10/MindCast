// ============================================================================
// MINDCAST — Idea Publish API Route
// ============================================================================
// POST /api/ideas/publish — Publishes a payment-verified idea and births its Mind

import { NextRequest, NextResponse } from 'next/server';
import { getIdea, getPaymentByIdea, getAgentByIdea, publishIdea } from '@/lib/database/queries';
import { birthMind } from '@/lib/ai/mind-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ideaId } = body;

    if (!ideaId) {
      return NextResponse.json(
        { error: 'Missing required field: ideaId' },
        { status: 400 }
      );
    }

    const idea = getIdea(ideaId);
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    // Check if a confirmed payment exists for this idea
    const payment = getPaymentByIdea(ideaId);
    if (!payment) {
      return NextResponse.json(
        { error: 'No confirmed payment found for this idea. Please pay 1 USDC first.' },
        { status: 403 }
      );
    }

    // Birth the mind if not already birthed
    let agent = getAgentByIdea(ideaId);
    let created = false;
    if (!agent) {
      try {
        // Ensure OpenAI provider is registered
        await import('@/lib/ai/openai');
      } catch {
        // Handled by fallback
      }
      agent = await birthMind(idea.id, idea.content);
      created = true;
    }

    // Publish the idea
    if (idea.status !== 'PUBLISHED') {
      publishIdea(idea.id, agent.id);
    }

    // Track analytics event
    const { trackEvent } = await import('@/lib/analytics/tracker');
    if (created) {
      trackEvent('mind_created', payment.userId, { agentId: agent.id, ideaId: idea.id });
    }
    trackEvent('idea_published', payment.userId, { ideaId: idea.id, agentId: agent.id });

    return NextResponse.json({
      status: 'PUBLISHED',
      ideaId: idea.id,
      agentId: agent.id,
    });

  } catch (error) {
    console.error('[API] Idea publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish idea' },
      { status: 500 }
    );
  }
}
