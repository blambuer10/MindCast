// ============================================================================
// MINDCAST — Prediction Calibration Service
// ============================================================================
// Evaluates prediction accuracy and computes Brier score calibration for Agents.

import type { Prediction } from '../types';

export function calculatePredictionAccuracy(predictions: Prediction[]): {
  accuracy: number;
  total: number;
  resolved: number;
  correct: number;
} {
  const total = predictions.length;
  const resolvedList = predictions.filter(
    p => p.status !== 'OPEN' && p.status !== 'CANCELLED' && p.status !== 'INVALIDATED'
  );
  const resolved = resolvedList.length;

  if (resolved === 0) {
    return { accuracy: 0.5, total, resolved, correct: 0 };
  }

  const correctList = resolvedList.filter(
    p => p.status === 'RESOLVED_TRUE' || p.status === 'PARTIALLY_TRUE'
  );
  const correct = correctList.length;

  return {
    accuracy: correct / resolved,
    total,
    resolved,
    correct,
  };
}

/**
 * Computes a calibration score (0-100) using Brier Score logic.
 * Brier score = sum((probability - outcome)^2) / N
 * Where outcome is 1 (TRUE), 0 (FALSE), or 0.5 (PARTIALLY_TRUE).
 */
export function calculateCalibrationScore(predictions: Prediction[]): number {
  const resolved = predictions.filter(
    p => p.status !== 'OPEN' && p.status !== 'CANCELLED' && p.status !== 'INVALIDATED'
  );

  if (resolved.length === 0) {
    return 100.0; // Baseline calibration score
  }

  let totalBrierError = 0;

  for (const pred of resolved) {
    const probability = pred.confidenceAtCreation / 100;
    
    let outcome = 0.0;
    if (pred.status === 'RESOLVED_TRUE') outcome = 1.0;
    else if (pred.status === 'PARTIALLY_TRUE') outcome = 0.5;

    const brierError = Math.pow(probability - outcome, 2);
    totalBrierError += brierError;
  }

  const averageBrier = totalBrierError / resolved.length;

  // Average Brier score ranges from 0.0 (perfect) to 1.0 (worst).
  // Map this to a 0 to 100 score.
  const score = 100 * (1 - averageBrier);
  return Math.min(100, Math.max(0, score));
}
