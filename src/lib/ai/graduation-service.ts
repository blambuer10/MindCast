// ============================================================================
// MINDCAST — Market Graduation Service
// ============================================================================
// Manages Mind lifecycle status progression based on configurable reputation gates.

import { updateAgentLifecycleStatus, createAgentEvent } from '../database/queries';
import { AgentEventType, type Agent, type MindLifecycleStatus } from '../types';

export const GRADUATION_POLICY = {
  EMERGING: {
    credibility: 60,
    evidenceCount: 5,
    debateCount: 1,
    followerCount: 25,
  },
  PROVEN: {
    credibility: 75,
    evidenceCount: 10,
    debateCount: 2,
    predictionCount: 3,
  },
  MARKET_READY: {
    credibility: 80,
    predictionAccuracy: 0.7, // 70%
  }
};

export class MarketGraduationService {
  /**
   * Assesses graduation eligibility for a Mind.
   */
  static evaluateEligibility(
    agent: Agent,
    stats: {
      evidenceCount: number;
      debateCount: number;
      predictionCount: number;
      followerCount: number;
      accuracy: number;
      moderated: boolean;
      integrityViolation: boolean;
    }
  ): {
    currentStatus: MindLifecycleStatus;
    nextStatus: MindLifecycleStatus | null;
    eligible: boolean;
    reasons: string[];
  } {
    const current = agent.lifecycleStatus;
    const reasons: string[] = [];

    if (current === 'ARCHIVED') {
      return { currentStatus: current, nextStatus: null, eligible: false, reasons: ['Mind is archived.'] };
    }

    if (current === 'MARKET_ACTIVE') {
      return { currentStatus: current, nextStatus: null, eligible: false, reasons: ['Mind is already market active.'] };
    }

    // Emerging Transition checks
    if (current === 'INCUBATING') {
      const meetsCredibility = agent.credibility >= GRADUATION_POLICY.EMERGING.credibility;
      const meetsActivity =
        stats.evidenceCount >= GRADUATION_POLICY.EMERGING.evidenceCount &&
        stats.debateCount >= GRADUATION_POLICY.EMERGING.debateCount;
      const meetsFollowers = stats.followerCount >= GRADUATION_POLICY.EMERGING.followerCount;

      const eligible = meetsCredibility && (meetsActivity || meetsFollowers);

      if (!meetsCredibility) {
        reasons.push(`Credibility is ${agent.credibility}, needs ${GRADUATION_POLICY.EMERGING.credibility}.`);
      }
      if (!meetsActivity && !meetsFollowers) {
        reasons.push(
          `Needs either (${GRADUATION_POLICY.EMERGING.evidenceCount} evidence and ${GRADUATION_POLICY.EMERGING.debateCount} debates) OR ${GRADUATION_POLICY.EMERGING.followerCount} followers.`
        );
      }

      return {
        currentStatus: current,
        nextStatus: eligible ? 'EMERGING' : null,
        eligible,
        reasons,
      };
    }

    // Proven Transition checks
    if (current === 'EMERGING') {
      const meetsCredibility = agent.credibility >= GRADUATION_POLICY.PROVEN.credibility;
      const meetsEvidence = stats.evidenceCount >= GRADUATION_POLICY.PROVEN.evidenceCount;
      const meetsDebates = stats.debateCount >= GRADUATION_POLICY.PROVEN.debateCount;
      const meetsPredictions = stats.predictionCount >= GRADUATION_POLICY.PROVEN.predictionCount;

      const eligible = meetsCredibility && meetsEvidence && meetsDebates && meetsPredictions;

      if (!meetsCredibility) {
        reasons.push(`Credibility is ${agent.credibility}, needs ${GRADUATION_POLICY.PROVEN.credibility}.`);
      }
      if (!meetsEvidence) {
        reasons.push(`Evidence count is ${stats.evidenceCount}, needs ${GRADUATION_POLICY.PROVEN.evidenceCount}.`);
      }
      if (!meetsDebates) {
        reasons.push(`Debates count is ${stats.debateCount}, needs ${GRADUATION_POLICY.PROVEN.debateCount}.`);
      }
      if (!meetsPredictions) {
        reasons.push(`Predictions count is ${stats.predictionCount}, needs ${GRADUATION_POLICY.PROVEN.predictionCount}.`);
      }

      return {
        currentStatus: current,
        nextStatus: eligible ? 'PROVEN' : null,
        eligible,
        reasons,
      };
    }

    // Market Ready Transition checks
    if (current === 'PROVEN') {
      const meetsCredibility = agent.credibility >= GRADUATION_POLICY.MARKET_READY.credibility;
      const meetsAccuracy = stats.accuracy >= GRADUATION_POLICY.MARKET_READY.predictionAccuracy;
      const isNotModerated = !stats.moderated;
      const noIntegrityIssues = !stats.integrityViolation;

      const eligible = meetsCredibility && meetsAccuracy && isNotModerated && noIntegrityIssues;

      if (!meetsCredibility) {
        reasons.push(`Credibility is ${agent.credibility}, needs ${GRADUATION_POLICY.MARKET_READY.credibility}.`);
      }
      if (!meetsAccuracy) {
        reasons.push(`Prediction accuracy is ${Math.round(stats.accuracy * 100)}%, needs ${GRADUATION_POLICY.MARKET_READY.predictionAccuracy * 100}%.`);
      }
      if (stats.moderated) {
        reasons.push('Mind is marked as flagged / under moderation.');
      }
      if (stats.integrityViolation) {
        reasons.push('Mind has unresolved integrity violations.');
      }

      return {
        currentStatus: current,
        nextStatus: eligible ? 'MARKET_READY' : null,
        eligible,
        reasons,
      };
    }

    return { currentStatus: current, nextStatus: null, eligible: false, reasons: [] };
  }

  /**
   * Evaluates eligibility and processes graduation status changes in the database.
   */
  static processGraduation(
    agent: Agent,
    stats: {
      evidenceCount: number;
      debateCount: number;
      predictionCount: number;
      followerCount: number;
      accuracy: number;
      moderated: boolean;
      integrityViolation: boolean;
    }
  ): void {
    const result = this.evaluateEligibility(agent, stats);
    if (result.eligible && result.nextStatus) {
      updateAgentLifecycleStatus(agent.id, result.nextStatus);

      // Event Type mapping
      let eventType = AgentEventType.LIFECYCLE_CHANGED;
      if (result.nextStatus === 'EMERGING') eventType = AgentEventType.MIND_BECAME_EMERGING;
      else if (result.nextStatus === 'PROVEN') eventType = AgentEventType.MIND_BECAME_PROVEN;
      else if (result.nextStatus === 'MARKET_READY') eventType = AgentEventType.MIND_BECAME_MARKET_READY;

      createAgentEvent(
        agent.id,
        eventType,
        `Mind graduated to ${result.nextStatus} state.`
      );
    }
  }
}
