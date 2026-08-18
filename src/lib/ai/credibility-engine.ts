// ============================================================================
// MINDCAST — Credibility Engine
// ============================================================================
// Calculates the deterministic credibility score for a Mind based on
// intellectual performance signals: predictions, debates, and evidence.

import {
  getPredictionsByMind,
  getEvidenceByAgent,
  getReputationEventsByMind,
} from '../database/queries';
import { calculateCalibrationScore, calculatePredictionAccuracy } from './calibration-service';
import type { Agent, Evidence } from '../types';

export class CredibilityEngine {
  /**
   * Deterministically calculates the 0-100 credibility score of a Mind.
   */
  static calculate(agent: Agent, completedDebateScores: { argument: number; rebuttal: number; evidence: number; honesty: number }[]): {
    credibility: number;
    predictionScore: number;
    calibrationScore: number;
    evidenceScore: number;
    debateScore: number;
    honestyScore: number;
  } {
    // 1. Prediction Score (Accuracy with Laplace Smoothing to discount small sample sizes)
    const predictions = getPredictionsByMind(agent.id);
    const accuracyResult = calculatePredictionAccuracy(predictions);
    const resolved = accuracyResult.resolved;
    const correct = accuracyResult.correct;
    
    // Laplace smoothing: baseline of 5 pseudo-predictions at 50% accuracy
    const predictionScore = resolved === 0
      ? 50
      : ((correct + 2.5) / (resolved + 5)) * 100;

    // 2. Calibration Score with sample size dampening towards a 50% prior
    const rawCalibration = calculateCalibrationScore(predictions);
    const calibrationScore = resolved === 0
      ? 50
      : rawCalibration * (resolved / (resolved + 3)) + 50 * (3 / (resolved + 3));

    // 3. Evidence Quality Score
    const evidence = getEvidenceByAgent(agent.id);
    const evidenceScore = this.calculateEvidenceScore(evidence); // 0-100

    // 4. Debate Performance Score
    const debateScore = this.calculateDebateScore(completedDebateScores); // 0-100

    // 5. Intellectual Honesty Score
    const honestyScore = this.calculateIntellectualHonestyScore(evidence, completedDebateScores); // 0-100

    // 6. Weighted Sum (Configurable Policy)
    // Predictions: 30%, Calibration: 20%, Evidence Quality: 20%, Debate performance: 20%, Honesty: 10%
    const weighted =
      predictionScore * 0.3 +
      calibrationScore * 0.2 +
      evidenceScore * 0.2 +
      debateScore * 0.2 +
      honestyScore * 0.1;

    // Credibility starts at 50 if there are no data points, otherwise follows the formula
    const totalDataPoints = predictions.filter(p => p.status !== 'OPEN').length + evidence.length + completedDebateScores.length;
    const finalCredibility = totalDataPoints === 0 ? 50 : Math.round(Math.min(100, Math.max(0, weighted)));

    return {
      credibility: finalCredibility,
      predictionScore: Math.round(predictionScore),
      calibrationScore: Math.round(calibrationScore),
      evidenceScore: Math.round(evidenceScore),
      debateScore: Math.round(debateScore),
      honestyScore: Math.round(honestyScore),
    };
  }

  private static calculateEvidenceScore(evidence: Evidence[]): number {
    if (evidence.length === 0) return 50; // default starting score
    
    // Average strength and reliability score of retrieved evidence
    const sum = evidence.reduce((acc, ev) => acc + (ev.strengthScore + ev.reliabilityScore) / 2, 0);
    return sum / evidence.length;
  }

  private static calculateDebateScore(scores: { argument: number; rebuttal: number; evidence: number }[]): number {
    if (scores.length === 0) return 50; // default starting score

    const sum = scores.reduce((acc, s) => acc + (s.argument + s.rebuttal + s.evidence) / 3, 0);
    return sum / scores.length;
  }

  private static calculateIntellectualHonestyScore(
    evidence: Evidence[],
    debateScores: { honesty: number }[]
  ): number {
    let score = 50; // baseline

    // Factor A: Ratio of supporting vs opposing evidence.
    // If the agent retrieves and acknowledges counter-evidence, it shows honesty.
    const opposing = evidence.filter(e => e.direction === 'OPPOSING').length;
    if (evidence.length > 0) {
      const opposingRatio = opposing / evidence.length;
      // Ideally has some opposing evidence (balanced research target = 30% opposing)
      const opposingBonus = Math.min(20, opposingRatio * 60); 
      score += opposingBonus;
    }

    // Factor B: Debate honesty ratings from AI evaluation
    if (debateScores.length > 0) {
      const averageDebateHonesty = debateScores.reduce((acc, s) => acc + s.honesty, 0) / debateScores.length;
      score = (score + averageDebateHonesty) / 2;
    }

    return Math.min(100, Math.max(0, score));
  }
}
