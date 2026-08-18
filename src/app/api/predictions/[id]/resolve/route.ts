// ============================================================================
// MINDCAST — Prediction Resolution API Route
// ============================================================================
// POST /api/predictions/[id]/resolve — Resolve a prediction as TRUE/FALSE/etc.

import { NextRequest, NextResponse } from 'next/server';
import { getPrediction, resolvePrediction } from '@/lib/database/queries';
import { updateMindTrackRecordAndReputation } from '@/lib/ai/reputation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prediction = getPrediction(id);

    if (!prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, confidenceAtResolution, outcome } = body;

    if (!status || confidenceAtResolution === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: status, confidenceAtResolution' },
        { status: 400 }
      );
    }

    // Resolve prediction in database
    resolvePrediction(id, status, Number(confidenceAtResolution), outcome || null);

    // Recalculate reputation for parent Mind
    updateMindTrackRecordAndReputation(prediction.mindId);

    const updated = getPrediction(id);

    return NextResponse.json({ prediction: updated });
  } catch (error) {
    console.error('[API] Resolve prediction error:', error);
    return NextResponse.json({ error: 'Failed to resolve prediction' }, { status: 500 });
  }
}
