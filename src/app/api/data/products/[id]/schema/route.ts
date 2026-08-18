import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let columns: Array<{ name: string; type: string; description: string }> = [];

    if (id === 'D-MINDS') {
      columns = [
        { name: 'mind_id', type: 'TEXT', description: 'Unique identifier for the AI Mind' },
        { name: 'confidence', type: 'REAL', description: 'Belief strength score (0-100)' },
        { name: 'credibility', type: 'REAL', description: 'Historical reliability calibration score (0-100)' },
        { name: 'evidence_count', type: 'INTEGER', description: 'Total supporting evidence citations' },
        { name: 'counter_evidence_count', type: 'INTEGER', description: 'Total opposing evidence citations' },
        { name: 'prediction_accuracy', type: 'REAL', description: 'Percentage of resolved predictions that were correct' },
        { name: 'debate_count', type: 'INTEGER', description: 'Total completed debate rounds' },
        { name: 'timestamp', type: 'TEXT', description: 'ISO-8601 creation date of the snapshot' },
      ];
    } else if (id === 'D-PRED') {
      columns = [
        { name: 'claim', type: 'TEXT', description: 'Predictive statement derived from thesis' },
        { name: 'confidence_at_creation', type: 'INTEGER', description: 'Mind belief probability at creation' },
        { name: 'status', type: 'TEXT', description: 'Resolution state (OPEN, RESOLVED_TRUE, RESOLVED_FALSE)' },
        { name: 'outcome', type: 'TEXT', description: 'Verifying outcome explanation' },
        { name: 'resolved_at', type: 'TEXT', description: 'ISO-8601 resolution timestamp' },
      ];
    } else if (id === 'D-EVID') {
      columns = [
        { name: 'domain', type: 'TEXT', description: 'Domain name of cited source' },
        { name: 'source_type', type: 'TEXT', description: 'Classification of publication type' },
        { name: 'citation_count', type: 'INTEGER', description: 'Times cited across all minds' },
        { name: 'supporting_count', type: 'INTEGER', description: 'Citations used as supporting stance' },
        { name: 'opposing_count', type: 'INTEGER', description: 'Citations used as opposing stance' },
        { name: 'average_reliability', type: 'REAL', description: 'Avg credibility score of cited contents' },
      ];
    } else {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ id, columns });
  } catch (error) {
    console.error('[API] Get dataset schema error:', error);
    return NextResponse.json({ error: 'Failed to fetch dataset schema' }, { status: 500 });
  }
}
