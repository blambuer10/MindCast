// ============================================================================
// MINDCAST — AI Provider Interface
// ============================================================================
// The Mind domain depends ONLY on this interface.
// Never import OpenAI, Anthropic, Myca, or Opacus directly into Mind code.

import type {
  AIAnalysis,
  AIDebateResponse,
  AIEvidenceEvaluation,
  AIConfidenceUpdate,
  EvidenceStance,
} from '../types';

export interface AIProvider {
  /**
   * Generate a text response from a prompt.
   */
  generate(prompt: string, systemPrompt?: string): Promise<string>;

  /**
   * Analyze a thesis — find assumptions, build arguments, assess confidence.
   * This is the core "birth" of a Mind.
   */
  analyze(thesis: string): Promise<AIAnalysis>;

  /**
   * Participate in a debate round.
   */
  debate(params: {
    thesis: string;
    opponentThesis: string;
    round: number;
    roundName: string;
    previousMessages: Array<{ role: string; content: string }>;
    evidence: Array<{ title: string; snippet: string; stance: string }>;
  }): Promise<AIDebateResponse>;

  /**
   * Evaluate a piece of evidence for relevance, stance, and impact.
   */
  evaluateEvidence(thesis: string, evidence: { title: string; content: string; source: string }): Promise<AIEvidenceEvaluation>;

  /**
   * Update confidence based on new evidence or debate outcome.
   */
  updateConfidence(params: {
    thesis: string;
    currentConfidence: number;
    newEvidence?: Array<{ title: string; stance: string; relevance: number }>;
    debateOutcome?: string;
  }): Promise<AIConfidenceUpdate>;
}

/**
 * Registry for AI providers — allows runtime switching.
 */
const providers = new Map<string, AIProvider>();

export function registerAIProvider(name: string, provider: AIProvider): void {
  providers.set(name, provider);
}

export function getAIProvider(name?: string): AIProvider {
  const providerName = name || process.env.AI_PROVIDER || 'openai';
  const provider = providers.get(providerName);
  if (!provider) {
    throw new Error(`AI provider "${providerName}" not registered. Available: ${Array.from(providers.keys()).join(', ')}`);
  }
  return provider;
}
