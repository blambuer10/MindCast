// ============================================================================
// MINDCAST — Reputation Service Orchestrator
// ============================================================================
// Tying credibility calculations, predictions, valuations, and graduation
// checks into a single atomic update pipeline.

import {
  getAgent,
  getPredictionsByMind,
  getEvidenceByAgent,
  getDebateOutcomesByMind,
  updateAgentReputationScores,
  logReputationEvent,
} from '../database/queries';
import { getDb } from '../database/connection';
import { CredibilityEngine } from './credibility-engine';
import { MindValuationEngine } from './valuation-engine';
import { calculatePredictionAccuracy } from './calibration-service';
import { MarketGraduationService } from './graduation-service';

export function updateMindTrackRecordAndReputation(mindId: string): void {
  const agent = getAgent(mindId);
  if (!agent) return;

  // 1. Fetch performance data
  const predictions = getPredictionsByMind(mindId);
  const evidence = getEvidenceByAgent(mindId);
  const debates = getDebateOutcomesByMind(mindId);

  // 2. Map debates to the structure expected by CredibilityEngine
  const completedDebateScores = debates.map(d => ({
    argument: d.argumentScore,
    rebuttal: d.rebuttalScore,
    evidence: d.evidenceScore,
    honesty: d.intellectualHonestyScore,
  }));

  // 3. Compute Credibility Engine scores
  const credResult = CredibilityEngine.calculate(agent, completedDebateScores);

  // 4. Compute accuracy
  const accResult = calculatePredictionAccuracy(predictions);

  // 5. Fetch follower count
  const db = getDb();
  const followerRow = db.prepare(`
    SELECT COUNT(*) as c FROM idea_follows WHERE idea_id = ?
  `).get(agent.ideaId) as { c: number } | undefined;
  const followerCount = followerRow ? followerRow.c : 0;

  // 6. Compute valuation
  const estimatedValue = MindValuationEngine.calculate(agent, {
    evidenceCount: evidence.length,
    debateCount: debates.length,
    predictionAccuracy: accResult.accuracy,
    followerCount,
  });

  // 7. Update Agent scores in Database
  updateAgentReputationScores(
    mindId,
    credResult.credibility,
    accResult.accuracy,
    credResult.calibrationScore,
    estimatedValue
  );

  // 8. Log Reputation Event if credibility changed
  if (credResult.credibility !== agent.credibility) {
    const diff = credResult.credibility - agent.credibility;
    logReputationEvent(
      mindId,
      'CREDIBILITY_CHANGED',
      diff,
      `Mind credibility recalculated. New: ${credResult.credibility} (${diff >= 0 ? '+' : ''}${diff})`
    );
  }

  // 9. Re-fetch updated agent to pass to Graduation check
  const updatedAgent = getAgent(mindId)!;

  // 10. Run graduation check
  const resolvedPredictions = predictions.filter(p => p.status !== 'OPEN' && p.status !== 'CANCELLED' && p.status !== 'INVALIDATED').length;
  MarketGraduationService.processGraduation(updatedAgent, {
    evidenceCount: evidence.length,
    debateCount: debates.length,
    predictionCount: resolvedPredictions,
    followerCount,
    accuracy: accResult.accuracy,
    moderated: false,
    integrityViolation: false,
  });
}
export default updateMindTrackRecordAndReputation;
