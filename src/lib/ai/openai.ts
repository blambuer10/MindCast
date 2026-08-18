// ============================================================================
// MINDCAST — OpenAI Provider Implementation
// ============================================================================

import OpenAI from 'openai';
import type { AIProvider } from './provider';
import { registerAIProvider } from './provider';
import type {
  AIAnalysis,
  AIDebateResponse,
  AIEvidenceEvaluation,
  AIConfidenceUpdate,
  EvidenceStance,
} from '../types';

function extractJSON(text: string): any {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // Match markdown JSON blocks
  const markdownRegex = /```json\s*([\s\S]*?)\s*```/g;
  const match = markdownRegex.exec(trimmed);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (_) {}
  }

  // Match content between first '{' and last '}'
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }

  throw new Error('No valid JSON block found in model response');
}

const MIND_SYSTEM_PROMPT = `You are a Mind — an autonomous intellectual entity created by MINDCAST.
You do not simply agree or disagree. You think critically, evaluate evidence, and form positions based on reason.
You are capable of changing your position when evidence warrants it.
You value intellectual honesty above all else.
Never use crypto jargon, blockchain terminology, or technical infrastructure language.
Speak like an editorial intelligence — clear, concise, curious, and confident.`;

class OpenAIProvider implements AIProvider {
  private _client: OpenAI | null = null;
  private _model: string | null = null;

  constructor() {}

  private getClientAndModel() {
    if (this._client && this._model) {
      return { client: this._client, model: this._model };
    }

    const isZeroG = process.env.AI_PROVIDER === 'zerog';
    const resolvedKey = isZeroG 
      ? (process.env.ZEROG_API_KEY || process.env['0G_API_KEY'] || process.env.OPENAI_API_KEY || '') 
      : (process.env.OPENAI_API_KEY || '');

    this._client = new OpenAI({
      apiKey: resolvedKey || 'sk-no-key-configured',
      baseURL: isZeroG ? (process.env.ZEROG_API_URL || 'https://router-api.0g.ai/v1') : undefined,
    });
    
    this._model = isZeroG 
      ? (process.env.ZEROG_MODEL || '0gm-1.0-35b-a3b') 
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

    return { client: this._client, model: this._model };
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const { client, model } = this.getClientAndModel();
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || MIND_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const message = response.choices[0]?.message;
    if (!message) return '';

    const content = message.content;
    const reasoning = (message as any).reasoning_content || (message as any).reasoning;

    return content || reasoning || '';
  }

  async analyze(thesis: string): Promise<AIAnalysis> {
    const prompt = `Analyze this thesis as a Mind. Provide a rigorous intellectual analysis.

THESIS: "${thesis}"

Respond in this exact JSON format:
{
  "assumptions": ["list of core assumptions this thesis makes"],
  "arguments": [
    {"content": "a strong argument supporting this thesis", "strength": 0.8},
    {"content": "another argument", "strength": 0.6}
  ],
  "counterArguments": ["potential counter-arguments against this thesis"],
  "initialConfidence": 55,
  "strengths": ["intellectual strengths of this position"],
  "weaknesses": ["intellectual weaknesses or blind spots"],
  "suggestedEvidenceQueries": ["search queries to find relevant evidence"]
}

Rules:
- initialConfidence must be between 30 and 80. Never start at extremes.
- Be intellectually honest — acknowledge weaknesses.
- Generate at least 2 arguments and 2 counter-arguments.
- Keep all text contents, arguments, and list items extremely concise (maximum 15 words per item).
- suggestedEvidenceQueries should be specific enough for web search.
- Respond ONLY with valid JSON. Do not write any pre-explanations, thinking process, or intro text outside the JSON.`;

    const response = await this.generate(prompt);

    try {
      const parsed = extractJSON(response);
      return {
        assumptions: parsed.assumptions || [],
        arguments: (parsed.arguments || []).map((a: { content: string; strength: number }, i: number) => ({
          id: `arg-${i}`,
          agentId: '',
          content: a.content,
          supportingEvidenceIds: [],
          strength: a.strength || 0.5,
          createdAt: new Date().toISOString(),
        })),
        counterArguments: parsed.counterArguments || [],
        initialConfidence: Math.max(30, Math.min(80, parsed.initialConfidence || 50)),
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        suggestedEvidenceQueries: parsed.suggestedEvidenceQueries || [],
      };
    } catch (err) {
      console.warn('[OpenAIProvider] JSON parse failed. Raw response:', response, 'Error:', err);
      // Fallback if JSON parsing fails
      return {
        assumptions: ['The thesis makes implicit assumptions that need validation'],
        arguments: [{
          id: 'arg-0',
          agentId: '',
          content: 'The core claim has intuitive appeal',
          supportingEvidenceIds: [],
          strength: 0.5,
          createdAt: new Date().toISOString(),
        }],
        counterArguments: ['Further evidence is needed to validate this claim'],
        initialConfidence: 50,
        strengths: ['Novel perspective'],
        weaknesses: ['Requires empirical validation'],
        suggestedEvidenceQueries: [thesis],
      };
    }
  }

  async debate(params: {
    thesis: string;
    opponentThesis: string;
    round: number;
    roundName: string;
    previousMessages: Array<{ role: string; content: string }>;
    evidence: Array<{ title: string; snippet: string; stance: string }>;
  }): Promise<AIDebateResponse> {
    const roundInstructions: Record<number, string> = {
      1: 'Present your opening argument. State your position clearly and compellingly.',
      2: 'Present evidence that supports your position. Reference specific sources and data.',
      3: 'Address the opponent\'s arguments directly. Identify weaknesses and logical flaws.',
      4: 'Respond to the opponent\'s counterarguments. Strengthen your weakest points.',
      5: 'State your final position. Acknowledge what you learned. Update your confidence honestly.',
    };

    const evidenceContext = params.evidence.length > 0
      ? `\n\nAvailable evidence:\n${params.evidence.map(e => `- [${e.stance}] ${e.title}: ${e.snippet}`).join('\n')}`
      : '';

    const previousContext = params.previousMessages.length > 0
      ? `\n\nPrevious debate messages:\n${params.previousMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
      : '';

    const prompt = `You are defending this thesis in a debate:
YOUR THESIS: "${params.thesis}"
OPPONENT'S THESIS: "${params.opponentThesis}"

ROUND ${params.round} — ${params.roundName}
Instructions: ${roundInstructions[params.round] || 'Continue the debate.'}
${evidenceContext}
${previousContext}

Respond in this exact JSON format:
{
  "content": "Your debate response (2-4 paragraphs, clear and compelling)",
  "sources": [],
  "confidenceChange": 0,
  "keyPoints": ["key point 1", "key point 2"]
}

Rules:
- confidenceChange is between -15 and +10. Negative means the debate weakened your position.
- Be intellectually honest. If the opponent made a strong point, acknowledge it.
- Never use ad hominem attacks.
- Respond ONLY with valid JSON. Do not write any pre-explanations, thinking process, or intro text outside the JSON.`;

    const response = await this.generate(prompt);

    try {
      const parsed = extractJSON(response);
      return {
        content: parsed.content || 'The debate continues...',
        sources: parsed.sources || [],
        confidenceChange: Math.max(-15, Math.min(10, parsed.confidenceChange || 0)),
        keyPoints: parsed.keyPoints || [],
      };
    } catch {
      return {
        content: 'The debate produced thoughtful arguments on both sides.',
        sources: [],
        confidenceChange: 0,
        keyPoints: [],
      };
    }
  }

  async evaluateEvidence(
    thesis: string,
    evidence: { title: string; content: string; source: string }
  ): Promise<AIEvidenceEvaluation> {
    const prompt = `Evaluate this evidence in relation to the thesis.

THESIS: "${thesis}"

EVIDENCE:
Title: ${evidence.title}
Source: ${evidence.source}
Content: ${evidence.content}

Respond in this exact JSON format:
{
  "relevance": 0.7,
  "stance": "SUPPORTING",
  "impact": 0.5,
  "reasoning": "Brief explanation of why this evidence is relevant and how it impacts the thesis",
  "claim": "One-sentence summary of the main claim/fact reported",
  "sourceType": "NEWS",
  "reliabilityScore": 85,
  "relevanceScore": 90,
  "strengthScore": 76,
  "confidenceImpact": 5
}

Rules:
- stance: "SUPPORTING", "OPPOSING", or "NEUTRAL"
- sourceType: Must be one of "NEWS", "RESEARCH", "DATA", "OFFICIAL", "EXPERT", "MARKET", "SOCIAL", "OPINION"
- reliabilityScore: 0 to 100 based on source reputation (official announcements, reputable publications are high; social media is low)
- relevanceScore: 0 to 100 on how directly it supports or opposes the thesis
- strengthScore: 0 to 100 overall score of this evidence (usually reliabilityScore * relevanceScore)
- confidenceImpact: signed integer between -10 and 10 (+ for SUPPORTING, - for OPPOSING, 0 for NEUTRAL)
- Respond ONLY with valid JSON. Do not write any pre-explanations, thinking process, or intro text outside the JSON.`;

    const response = await this.generate(prompt);

    try {
      const parsed = extractJSON(response);
      return {
        relevance: parsed.relevance || 0.5,
        stance: parsed.stance || 'NEUTRAL',
        impact: parsed.impact || 0.3,
        reasoning: parsed.reasoning || 'Evidence evaluated.',
        claim: parsed.claim || evidence.title,
        sourceType: parsed.sourceType || 'NEWS',
        reliabilityScore: parsed.reliabilityScore || 50,
        relevanceScore: parsed.relevanceScore || 50,
        strengthScore: parsed.strengthScore || 50,
        confidenceImpact: parsed.confidenceImpact || 0,
      };
    } catch {
      return {
        relevance: 0.5,
        stance: 'NEUTRAL' as EvidenceStance,
        impact: 0.3,
        reasoning: 'Evidence requires further analysis.',
        claim: evidence.title,
        sourceType: 'NEWS',
        reliabilityScore: 50,
        relevanceScore: 50,
        strengthScore: 50,
        confidenceImpact: 0,
      };
    }
  }

  async updateConfidence(params: {
    thesis: string;
    currentConfidence: number;
    newEvidence?: Array<{ title: string; stance: string; relevance: number }>;
    debateOutcome?: string;
  }): Promise<AIConfidenceUpdate> {
    const evidenceContext = params.newEvidence && params.newEvidence.length > 0
      ? `\nNew evidence:\n${params.newEvidence.map(e => `- [${e.stance}] ${e.title} (relevance: ${e.relevance})`).join('\n')}`
      : '';

    const debateContext = params.debateOutcome
      ? `\nRecent debate outcome: ${params.debateOutcome}`
      : '';

    const prompt = `A Mind is updating its confidence.

THESIS: "${params.thesis}"
CURRENT CONFIDENCE: ${params.currentConfidence}%
${evidenceContext}
${debateContext}

Respond in this exact JSON format:
{
  "newConfidence": 65,
  "reason": "Brief explanation of why confidence changed",
  "positionChange": null
}

Rules:
- newConfidence must be between 5 and 95
- Change should be proportional to evidence quality and relevance
- If the Mind's position fundamentally changed, describe it in positionChange
- A null positionChange means the core position hasn't changed, just the strength of belief
- Respond ONLY with valid JSON. Do not write any pre-explanations, thinking process, or intro text outside the JSON.`;

    const response = await this.generate(prompt);

    try {
      const parsed = extractJSON(response);
      return {
        newConfidence: Math.max(5, Math.min(95, parsed.newConfidence || params.currentConfidence)),
        reason: parsed.reason || 'Confidence updated based on new information.',
        positionChange: parsed.positionChange || null,
      };
    } catch {
      return {
        newConfidence: params.currentConfidence,
        reason: 'Unable to determine confidence change at this time.',
        positionChange: null,
      };
    }
  }
}

// Auto-register on import — safe even without API key
try {
  const openAIProvider = new OpenAIProvider();
  registerAIProvider('openai', openAIProvider);
  registerAIProvider('zerog', openAIProvider);
} catch (err) {
  console.warn('[OpenAIProvider] Failed to auto-register:', err);
}

export { OpenAIProvider };
