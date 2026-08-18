import { NextRequest, NextResponse } from 'next/server';
import { getEarlySignals } from '@/lib/database/queries';
import { getDb } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    // Query counts
    const eventsRow = db.prepare('SELECT COUNT(*) as c FROM data_events').get() as { c: number };
    const topicsRow = db.prepare('SELECT COUNT(*) as c FROM topics').get() as { c: number };
    const snapshotsRow = db.prepare('SELECT COUNT(*) as c FROM mind_belief_snapshots').get() as { c: number };
    const sourcesCountRow = db.prepare('SELECT COUNT(*) as c FROM source_intelligence').get() as { c: number };

    // Query top cited domains
    const topDomains = db.prepare(`
      SELECT domain, source_type, citation_count, supporting_count, opposing_count, average_reliability
      FROM source_intelligence
      ORDER BY citation_count DESC
      LIMIT 5
    `).all() as any[];

    // Query audit logs
    const auditLogs = db.prepare(`
      SELECT actor_id, role, dataset_id, purpose, action, timestamp, result
      FROM data_access_audit_log
      ORDER BY timestamp DESC
      LIMIT 5
    `).all() as any[];

    const signals = getEarlySignals();

    return NextResponse.json({
      totalEvents: eventsRow.c || 0,
      totalTopics: topicsRow.c || 0,
      totalSnapshots: snapshotsRow.c || 0,
      totalSources: sourcesCountRow.c || 0,
      topDomains,
      auditLogs,
      signals,
    });
  } catch (error) {
    console.error('[API] Get admin data intelligence error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin data intelligence metrics' }, { status: 500 });
  }
}
