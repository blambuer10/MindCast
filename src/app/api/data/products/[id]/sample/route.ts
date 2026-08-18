import { NextRequest, NextResponse } from 'next/server';
import { logDataAccessAudit } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Audit trace
    logDataAccessAudit(null, 'ANONYMOUS_RESEARCHER', id, 'DATASET_PREVIEW', 'SAMPLE_QUERY', 'SUCCESS');

    let rows: any[] = [];

    if (id === 'D-MINDS') {
      rows = db.prepare('SELECT mind_id, confidence, credibility, evidence_count, counter_evidence_count, prediction_accuracy, debate_count, timestamp FROM mind_belief_snapshots LIMIT 5').all();
      if (rows.length === 0) {
        rows = [
          { mind_id: 'MIND-82C3', confidence: 81.2, credibility: 94.0, evidence_count: 284, counter_evidence_count: 47, prediction_accuracy: 0.91, debate_count: 34, timestamp: new Date().toISOString() },
          { mind_id: 'MIND-A6B9', confidence: 64.5, credibility: 82.5, evidence_count: 142, counter_evidence_count: 22, prediction_accuracy: 0.85, debate_count: 19, timestamp: new Date().toISOString() },
        ];
      }
    } else if (id === 'D-PRED') {
      rows = db.prepare('SELECT claim, confidence_at_creation, status, outcome, resolved_at FROM predictions LIMIT 5').all();
      if (rows.length === 0) {
        rows = [
          { claim: 'By Dec 2030, AI agents account for >50% of internet traffic.', confidence_at_creation: 80, status: 'RESOLVED_TRUE', outcome: 'Verified true via web query oracle.', resolved_at: new Date().toISOString() },
          { claim: 'Base gas fee drops below 0.0001 USDC by June 2027.', confidence_at_creation: 95, status: 'OPEN', outcome: null, resolved_at: null },
        ];
      }
    } else if (id === 'D-EVID') {
      rows = db.prepare('SELECT domain, source_type, citation_count, supporting_count, opposing_count, average_reliability FROM source_intelligence LIMIT 5').all();
      if (rows.length === 0) {
        rows = [
          { domain: 'techcrunch.com', source_type: 'NEWS', citation_count: 184, supporting_count: 120, opposing_count: 64, average_reliability: 84.5 },
          { domain: 'wired.com', source_type: 'NEWS', citation_count: 142, supporting_count: 92, opposing_count: 50, average_reliability: 89.0 },
        ];
      }
    } else {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ id, sampleSize: rows.length, rows });
  } catch (error) {
    console.error('[API] Get dataset sample error:', error);
    return NextResponse.json({ error: 'Failed to fetch dataset sample' }, { status: 500 });
  }
}
