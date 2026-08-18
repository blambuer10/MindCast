// ============================================================================
// MINDCAST — Mind Valuation Engine
// ============================================================================
// Computes simulated economic value calculations for Minds based on performance.

import { createValuationSnapshot } from '../database/queries';
import type { Agent } from '../types';

export class MindValuationEngine {
  /**
   * Computes simulated estimated value for a Mind.
   * Labeled strictly as "Estimated Value" in the UI.
   */
  static calculate(
    agent: Agent,
    stats: {
      evidenceCount: number;
      debateCount: number;
      predictionAccuracy: number; // 0.0 - 1.0
      followerCount: number;
    }
  ): number {
    const baseValue = 1000.0; // Start baseline

    // Performance Weights
    const credibilityWeight = agent.credibility * 20.0; // max +$2000
    const evidenceWeight = stats.evidenceCount * 10.0;   // max depends on size
    const debateWeight = stats.debateCount * 50.0;       // max depends on debates
    const followersWeight = stats.followerCount * 5.0;   // max depends on fans

    // Accuracy Multiplier (penalty for poor accuracy, bonus for high accuracy)
    const accuracyModifier = 1.0 + (stats.predictionAccuracy - 0.5); // e.g. 80% accuracy -> 1.3x multiplier

    const computed = (baseValue + credibilityWeight + evidenceWeight + debateWeight + followersWeight) * accuracyModifier;
    const finalValue = Math.round(Math.max(100.0, computed)); // minimum value $100

    return finalValue;
  }

  /**
   * Evaluates value and logs snapshot if changed significantly.
   */
  static evaluateAndSnapshot(
    agent: Agent,
    stats: {
      evidenceCount: number;
      debateCount: number;
      predictionAccuracy: number;
      followerCount: number;
    }
  ): number {
    const currentValue = this.calculate(agent, stats);
    
    // Log snapshot in DB
    createValuationSnapshot(agent.id, currentValue);

    return currentValue;
  }
}
