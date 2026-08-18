// ============================================================================
// MINDCAST — Early Signal Engine
// ============================================================================

import { getDb, generateId } from '../database/connection';
import { createEarlySignal, getEarlySignals } from '../database/queries';

const TOPICS_SEED = [
  { id: 'T-AI', name: 'AI', parentId: null },
  { id: 'T-FIN', name: 'Finance', parentId: null },
  { id: 'T-ROB', name: 'Robotics', parentId: null },
  { id: 'T-BIO', name: 'Biotech', parentId: null },
  { id: 'T-CLI', name: 'Climate', parentId: null },
  { id: 'T-GEO', name: 'Geopolitics', parentId: null },
  { id: 'T-TEC', name: 'Technology', parentId: null },
];

export class EarlySignalEngine {
  /**
   * Seed the topics catalog if empty.
   */
  static seedTopics(): void {
    try {
      const db = getDb();
      for (const t of TOPICS_SEED) {
        db.prepare(`
          INSERT OR IGNORE INTO topics (id, name, parent_id)
          VALUES (?, ?, ?)
        `).run(t.id, t.name, t.parentId);
      }
    } catch (err) {
      console.error('[SignalEngine] Seeding topics failed:', err);
    }
  }

  /**
   * Classifies a Mind's thesis using basic keyword mapping.
   */
  static classifyMind(mindId: string, thesis: string): string {
    const db = getDb();
    this.seedTopics();

    const lowerThesis = thesis.toLowerCase();
    let topicId = 'T-TEC'; // default technology

    if (
      lowerThesis.includes('ai') || 
      lowerThesis.includes('intelligence') || 
      lowerThesis.includes('llm') || 
      lowerThesis.includes('agent') || 
      lowerThesis.includes('compute')
    ) {
      topicId = 'T-AI';
    } else if (
      lowerThesis.includes('finance') || 
      lowerThesis.includes('usdc') || 
      lowerThesis.includes('market') || 
      lowerThesis.includes('economic') || 
      lowerThesis.includes('trading')
    ) {
      topicId = 'T-FIN';
    } else if (lowerThesis.includes('robot') || lowerThesis.includes('drone') || lowerThesis.includes('hardware')) {
      topicId = 'T-ROB';
    } else if (
      lowerThesis.includes('biotech') || 
      lowerThesis.includes('gene') || 
      lowerThesis.includes('protein') || 
      lowerThesis.includes('medicine')
    ) {
      topicId = 'T-BIO';
    } else if (lowerThesis.includes('climate') || lowerThesis.includes('carbon') || lowerThesis.includes('green') || lowerThesis.includes('solar')) {
      topicId = 'T-CLI';
    } else if (lowerThesis.includes('geopolitics') || lowerThesis.includes('war') || lowerThesis.includes('nation') || lowerThesis.includes('country')) {
      topicId = 'T-GEO';
    }

    try {
      db.prepare(`
        INSERT OR REPLACE INTO mind_topics (mind_id, topic_id, relevance_score)
        VALUES (?, ?, 1.0)
      `).run(mindId, topicId);
    } catch (err) {
      console.error('[SignalEngine] Topic classification failed:', err);
    }

    return topicId;
  }

  /**
   * Evaluates system-wide data patterns and generates Early Signals.
   */
  static runSignalDetection(): void {
    try {
      const db = getDb();
      this.seedTopics();

      // Retrieve all classified topics and count Minds, evidence velocity, and debate counts
      const topicsList = db.prepare('SELECT * FROM topics').all() as { id: string; name: string }[];

      for (const topic of topicsList) {
        const mindsRow = db.prepare(`
          SELECT COUNT(DISTINCT mind_id) as c FROM mind_topics WHERE topic_id = ?
        `).get(topic.id) as { c: number };
        const mindsCount = mindsRow.c;

        if (mindsCount === 0) continue;

        // Query average velocity of evidence added over the last 7 days
        const evidenceRow = db.prepare(`
          SELECT COUNT(*) as c FROM evidence e
          JOIN mind_topics mt ON e.agent_id = mt.mind_id
          WHERE mt.topic_id = ? AND e.created_at > datetime('now', '-7 days')
        `).get(topic.id) as { c: number };
        const evidenceVelocity = evidenceRow.c / 7.0;

        // Query average confidence changes (polarization indicator)
        const beliefChangeRow = db.prepare(`
          SELECT AVG(ABS(confidence_after - confidence_before)) as avgChange
          FROM agent_events ae
          JOIN mind_topics mt ON ae.agent_id = mt.mind_id
          WHERE mt.topic_id = ? AND ae.event_type = 'CONFIDENCE_CHANGED'
        `).get(topic.id) as { avgChange: number | null };
        const beliefVelocity = beliefChangeRow.avgChange || 0.0;

        // Query prediction density
        const predictionRow = db.prepare(`
          SELECT COUNT(*) as c FROM predictions p
          JOIN mind_topics mt ON p.mind_id = mt.mind_id
          WHERE mt.topic_id = ?
        `).get(topic.id) as { c: number };
        const predictionsCount = predictionRow.c;

        // Form signal strength
        const strength = (mindsCount * 0.4) + (evidenceVelocity * 1.5) + (beliefVelocity * 0.2) + (predictionsCount * 0.5);

        if (strength > 0.5) {
          createEarlySignal(
            topic.name,
            Math.min(100.0, strength * 10),
            evidenceVelocity,
            mindsCount,
            {
              mindsCount,
              evidenceVelocity,
              beliefVelocity,
              predictionsCount,
              indicator: strength > 3.0 ? 'CRITICAL_CONVERGENCE' : 'EMERGING_SIGNAL',
            }
          );
          console.log(`[SignalEngine] Detected early signal on topic "${topic.name}" with strength ${strength.toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error('[SignalEngine] Run signal detection error:', err);
    }
  }
}
