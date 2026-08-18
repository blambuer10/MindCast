import { NextRequest, NextResponse } from 'next/server';
import { getDatasetDefinitions, createDatasetDefinition } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Prepopulate dataset definitions if empty
    const datasets = getDatasetDefinitions();
    if (datasets.length === 0) {
      createDatasetDefinition('D-MINDS', 'Minds Collective Beliefs', 'Collective beliefs, credibility, and accuracy timelines.', ['agents', 'mind_belief_snapshots']);
      createDatasetDefinition('D-PRED', 'Historical Forecasting & Calibration', 'Track record of derived claims, confidence intervals, and actual outcomes.', ['predictions', 'agents']);
      createDatasetDefinition('D-EVID', 'Fact Check & Citation Networks', 'Domain citations, stances, and reliability score distributions.', ['evidence', 'source_intelligence']);
    }

    return NextResponse.json({
      products: getDatasetDefinitions().map(d => ({
        id: d.datasetId,
        name: d.name,
        version: d.version,
        description: d.description,
        sources: d.sourceTables,
        license: 'COMMERCIAL_MINDCAST_INTELLIGENCE_v1',
        classification: 'PSEUDONYMOUS_AGGREGATE',
      }))
    });
  } catch (error) {
    console.error('[API] Get datasets error:', error);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}
