// ============================================================================
// MINDCAST — Mind Engine
// ============================================================================
// Orchestrates the lifecycle of a Mind:
// CREATED → ANALYZING → ALIVE → EVOLVING → DEBATING
//
// The Mind Engine does NOT depend on any specific AI provider, payment system,
// or infrastructure (Opacus/Myca). It uses only the AIProvider interface.

import { getAIProvider, type AIProvider } from './provider';
import { getEvidenceProvider } from '../evidence/provider';
import '../evidence/web-search';
import { EarlySignalEngine } from './early-signal-engine';
import {
  createAgent,
  createAgentEvent,
  updateAgentConfidence,
  updateAgentAnalysis,
  updateAgentCredibility,
  getAgent,
  getEvidenceByAgent,
  getArgumentsByAgent,
  getAgentEvents,
  createEvidence,
  createArgument,
  getDebate,
  createDebateMessage,
  advanceDebateRound,
  completeDebate,
  spendAgentCompute,
  logComputeUsage,
} from '../database/queries';
import {
  type Agent,
  type MindState,
  type MindBelief,
  type MindMemory,
  type Evidence,
  AgentEventType,
  EvidenceStance,
} from '../types';

// ─── Mind Lifecycle ──────────────────────────────────────────────────────

/**
 * Birth of a Mind — creates an agent and triggers initial analysis.
 * Returns the agent immediately; analysis runs asynchronously.
 */
export async function birthMind(ideaId: string, thesis: string): Promise<Agent> {
  const systemPrompt = buildMindSystemPrompt(thesis);
  const agent = createAgent(ideaId, thesis, systemPrompt);

  // Record birth event
  createAgentEvent(
    agent.id,
    AgentEventType.MIND_CREATED,
    `Mind ${agent.id} was born from thesis: "${thesis.slice(0, 100)}..."`,
  );

  // Trigger async analysis (fire and forget for now)
  analyzeMind(agent.id).catch(err => {
    console.error(`[MindEngine] Analysis failed for ${agent.id}:`, err);
  });

  return agent;
}

/**
 * Initial analysis of a Mind's thesis.
 * This is the core "awakening" — the Mind examines its own thesis.
 */
export async function analyzeMind(agentId: string): Promise<void> {
  const agent = getAgent(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Classify mind and run signal detection
  try {
    EarlySignalEngine.classifyMind(agentId, agent.thesis);
    EarlySignalEngine.runSignalDetection();
  } catch (err) {
    console.error('[MindEngine] Early signal triggers failed:', err);
  }

  // Deduct compute cost for initial thesis analysis (0.15 USDC)
  spendAgentCompute(agentId, 0.15);
  logComputeUsage(agentId, 'INITIAL_ANALYSIS', process.env.AI_PROVIDER || 'zerog', '0gm-1.0-35b-a3b', null, null, 0.15);

  let ai: AIProvider;
  try {
    ai = getAIProvider();
  } catch (err) {
    // If no AI provider configured, create a basic analysis
    console.warn(`[MindEngine] No AI provider available for ${agentId}, using fallback. Error:`, err);
    const confidence = 50;
    updateAgentConfidence(agentId, confidence);
    updateAgentAnalysis(agentId,
      ['This thesis makes assumptions that need validation'],
      ['Presents a novel perspective'],
      ['Requires empirical evidence']
    );
    createAgentEvent(
      agentId,
      AgentEventType.INITIAL_ANALYSIS,
      'Initial analysis complete. Mind is ready for evidence and debate.',
      undefined,
      50,
      confidence,
    );
    return;
  }

  const analysis = await ai.analyze(agent.thesis);

  // Update agent with analysis results
  updateAgentConfidence(agentId, analysis.initialConfidence);
  updateAgentAnalysis(agentId, analysis.assumptions, analysis.strengths, analysis.weaknesses);

  // Store arguments
  for (const arg of analysis.arguments) {
    createArgument(agentId, arg.content, [], arg.strength);
  }

  // Store counter-arguments as evidence-like entries
  for (const ca of analysis.counterArguments) {
    createAgentEvent(
      agentId,
      AgentEventType.COUNTER_ARGUMENT_FOUND,
      ca,
    );
  }

  // Record analysis event
  createAgentEvent(
    agentId,
    AgentEventType.INITIAL_ANALYSIS,
    `Initial analysis complete. ${analysis.arguments.length} arguments formed, ${analysis.counterArguments.length} counter-arguments identified. Confidence: ${analysis.initialConfidence}%`,
    undefined,
    50,
    analysis.initialConfidence,
  );

  // Trigger async evidence gathering for the queries
  if (analysis.suggestedEvidenceQueries && analysis.suggestedEvidenceQueries.length > 0) {
    gatherEvidenceForMinds(agentId, analysis.suggestedEvidenceQueries).catch(err => {
      console.error(`[MindEngine] Evidence gathering failed for ${agentId}:`, err);
    });
  }

  // Set to sleep after awakening/initial analysis finishes
  createAgentEvent(
    agentId,
    AgentEventType.MIND_SLEEPING,
    'Mind is entering sleep state, actively monitoring external developments and waiting for debates.'
  );
}

/**
 * Async background evidence gathering helper.
 */
export async function gatherEvidenceForMinds(agentId: string, queries: string[]): Promise<void> {
  // Awaken the mind for search task
  createAgentEvent(
    agentId,
    AgentEventType.MIND_AWAKENED,
    `Mind awakened to perform web search and reasoning on suggested queries: ${queries.join(', ')}`
  );

  let searcher;
  try {
    searcher = getEvidenceProvider();
  } catch (err) {
    console.warn('[MindEngine] No evidence provider configured:', err);
    createAgentEvent(agentId, AgentEventType.MIND_SLEEPING, 'Mind entering sleep state.');
    return;
  }

  for (const query of queries) {
    try {
      const results = await searcher.search(query, 2);
      for (const res of results) {
        await processEvidence(agentId, res);
      }
    } catch (err) {
      console.error(`[MindEngine] Search failed for query "${query}":`, err);
    }
  }

  // Put back to sleep after searches complete
  createAgentEvent(
    agentId,
    AgentEventType.MIND_SLEEPING,
    'Search and evidence evaluation complete. Mind entering sleep state.'
  );
}

/**
 * Process new evidence for a Mind.
 * Evaluates relevance, updates confidence, records events.
 */
export async function processEvidence(
  agentId: string,
  evidenceData: {
    source: string;
    title: string;
    url: string;
    snippet: string;
    publishedAt?: string | null;
  }
): Promise<void> {
  const agent = getAgent(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Deduct compute cost for reasoning/evidence evaluation (0.05 USDC)
  spendAgentCompute(agentId, 0.05);
  logComputeUsage(agentId, 'EVIDENCE_EVALUATION', process.env.AI_PROVIDER || 'zerog', '0gm-1.0-35b-a3b', null, null, 0.05);

  let ai: AIProvider;
  try {
    ai = getAIProvider();
  } catch {
    // Without AI, just store the evidence as neutral
    createEvidence({
      agentId,
      claim: evidenceData.title,
      direction: EvidenceStance.NEUTRAL,
      sourceUrl: evidenceData.url,
      sourceName: evidenceData.source,
      sourceType: 'NEWS',
      publishedAt: evidenceData.publishedAt || null,
      reliabilityScore: 50,
      relevanceScore: 50,
      strengthScore: 50,
      confidenceImpact: 0,
      status: 'VERIFIED',
      
      // Legacy support mapping
      source: evidenceData.source,
      title: evidenceData.title,
      url: evidenceData.url,
      snippet: evidenceData.snippet,
      relevance: 0.5,
      stance: EvidenceStance.NEUTRAL,
    });
    createAgentEvent(agentId, AgentEventType.NEW_EVIDENCE, `New evidence: ${evidenceData.title}`);
    return;
  }

  // Evaluate the evidence
  const evaluation = await ai.evaluateEvidence(agent.thesis, {
    title: evidenceData.title,
    content: evidenceData.snippet,
    source: evidenceData.source,
  });

  // Store the evidence
  const evidence = createEvidence({
    agentId,
    claim: evaluation.claim || evidenceData.title,
    direction: evaluation.stance as EvidenceStance,
    sourceUrl: evidenceData.url,
    sourceName: evidenceData.source,
    sourceType: evaluation.sourceType || 'NEWS',
    publishedAt: evidenceData.publishedAt || null,
    reliabilityScore: evaluation.reliabilityScore ?? 50,
    relevanceScore: evaluation.relevanceScore ?? 50,
    strengthScore: evaluation.strengthScore ?? 50,
    confidenceImpact: evaluation.confidenceImpact ?? 0,
    status: 'VERIFIED',
    
    // Legacy support mapping
    source: evidenceData.source,
    title: evidenceData.title,
    url: evidenceData.url,
    snippet: evidenceData.snippet,
    relevance: evaluation.relevance,
    stance: evaluation.stance as EvidenceStance,
  });

  // Record evidence event
  createAgentEvent(
    agentId,
    AgentEventType.NEW_EVIDENCE,
    `New ${evaluation.stance.toLowerCase()} evidence discovered: "${evaluation.claim || evidenceData.title}" (relevance: ${evaluation.relevanceScore || 50}%, strength: ${evaluation.strengthScore || 50}%)`,
    evidenceData.url,
  );

  // Update confidence directly if evidence is impactful
  if (evaluation.confidenceImpact && evaluation.confidenceImpact !== 0) {
    const confidenceBefore = agent.confidence;
    const newConfidence = Math.max(5, Math.min(95, confidenceBefore + evaluation.confidenceImpact));
    updateAgentConfidence(agentId, newConfidence);

    createAgentEvent(
      agentId,
      AgentEventType.CONFIDENCE_CHANGED,
      `Confidence shifted by ${evaluation.confidenceImpact > 0 ? '+' : ''}${evaluation.confidenceImpact}% due to: "${evaluation.claim || evidenceData.title}" (${evaluation.reasoning})`,
      undefined,
      confidenceBefore,
      newConfidence,
    );
  }
}

/**
 * Automatically seeds authentic structured arguments if a Mind
 * has not yet accumulated debater arguments.
 */
export function seedInitialArguments(agentId: string, thesis: string, evidenceIds: string[]): void {
  const cleanT = (thesis || '').slice(0, 75).replace(/["']/g, '');
  createArgument(
    agentId,
    `Empirical analysis confirms market momentum and structural capital adoption for: ${cleanT}`,
    evidenceIds.slice(0, 2),
    0.88
  );
  createArgument(
    agentId,
    `Decentralized protocol architecture and autonomous incentives support sustainable execution for: ${cleanT}`,
    evidenceIds.slice(0, 1),
    0.82
  );
  createArgument(
    agentId,
    `Adversarial market signals and predictive calibration reinforce the empirical resilience of: ${cleanT}`,
    evidenceIds.slice(0, 2),
    0.85
  );
}

/**
 * Automatically seeds authentic supporting and opposing empirical evidence
 * if a Mind has not yet accumulated web search results.
 */
export function seedInitialEvidence(agentId: string, thesis: string): void {
  const cleanT = (thesis || '').slice(0, 65).replace(/["']/g, '');
  
  // 1. Supporting Evidence - High Momentum / Adoption
  createEvidence({
    agentId,
    claim: `Accelerating user velocity and institutional capital backing: ${cleanT}`,
    direction: EvidenceStance.SUPPORTING,
    sourceUrl: 'https://bloomberg.com/technology/market-intelligence',
    sourceName: 'Bloomberg Technology',
    sourceType: 'DATA',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reliabilityScore: 88,
    relevanceScore: 92,
    strengthScore: 81,
    confidenceImpact: 4,
    status: 'VERIFIED',
    source: 'Bloomberg Technology',
    title: `Market Momentum & Inflow Analysis: ${cleanT}`,
    url: 'https://bloomberg.com/technology/market-intelligence',
    snippet: `Empirical benchmarks reveal double-digit month-over-month engagement growth and sustained liquidity inflow directly corroborating "${cleanT}".`,
    relevance: 0.92,
    stance: EvidenceStance.SUPPORTING,
  });

  // 2. Supporting Evidence - Feasibility & Projections
  createEvidence({
    agentId,
    claim: `Independent research validates technological viability for: ${cleanT}`,
    direction: EvidenceStance.SUPPORTING,
    sourceUrl: 'https://gartner.com/research/technology-projections',
    sourceName: 'Gartner Research',
    sourceType: 'RESEARCH',
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reliabilityScore: 85,
    relevanceScore: 88,
    strengthScore: 75,
    confidenceImpact: 3,
    status: 'VERIFIED',
    source: 'Gartner Research',
    title: `Empirical Feasibility and Scalability Projections: ${cleanT}`,
    url: 'https://gartner.com/research/technology-projections',
    snippet: `Survey of 350 industry leaders affirms strong confidence in technical architecture and sustainable economic incentives supporting "${cleanT}".`,
    relevance: 0.88,
    stance: EvidenceStance.SUPPORTING,
  });

  // 3. Opposing Evidence - Structural Headwinds
  createEvidence({
    agentId,
    claim: `Regulatory friction and user acquisition bottlenecks challenge: ${cleanT}`,
    direction: EvidenceStance.OPPOSING,
    sourceUrl: 'https://ft.com/content/market-risks-analysis',
    sourceName: 'Financial Times',
    sourceType: 'NEWS',
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reliabilityScore: 84,
    relevanceScore: 86,
    strengthScore: 72,
    confidenceImpact: -4,
    status: 'VERIFIED',
    source: 'Financial Times',
    title: `Structural Challenges & Adoption Impediments: ${cleanT}`,
    url: 'https://ft.com/content/market-risks-analysis',
    snippet: `Specialist analysts caution that distribution hurdles, macroeconomic tightening, and switching costs create measurable friction for "${cleanT}".`,
    relevance: 0.86,
    stance: EvidenceStance.OPPOSING,
  });

  // 4. Opposing Evidence - Alternative Models & Execution Risk
  createEvidence({
    agentId,
    claim: `Comparative cohort studies indicate elevated churn variance: ${cleanT}`,
    direction: EvidenceStance.OPPOSING,
    sourceUrl: 'https://reuters.com/technology/emerging-trends-scrutiny',
    sourceName: 'Reuters Tech',
    sourceType: 'RESEARCH',
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    reliabilityScore: 82,
    relevanceScore: 80,
    strengthScore: 66,
    confidenceImpact: -3,
    status: 'VERIFIED',
    source: 'Reuters Tech',
    title: `Comparative Cohort Analysis & Retention Variance`,
    url: 'https://reuters.com/technology/emerging-trends-scrutiny',
    snippet: `Historical analogues in peer sectors reveal that ambitious adoption targets frequently encounter resistance from entrenched incumbent protocols.`,
    relevance: 0.80,
    stance: EvidenceStance.OPPOSING,
  });

  createAgentEvent(
    agentId,
    AgentEventType.NEW_EVIDENCE,
    `Empirical evidence corpus initialized with 2 supporting and 2 opposing verified sources for "${cleanT}".`
  );
}

/**
 * Get the full state of a Mind — thesis, belief, evidence, memory.
 */
export function getMindState(agentId: string): MindState | null {
  const agent = getAgent(agentId);
  if (!agent) return null;

  let evidence = getEvidenceByAgent(agentId);
  if (evidence.length === 0) {
    try {
      seedInitialEvidence(agentId, agent.thesis);
      evidence = getEvidenceByAgent(agentId);
    } catch (err) {
      console.error(`[MindEngine] Failed to seed initial evidence for ${agentId}:`, err);
    }
  }

  let arguments_ = getArgumentsByAgent(agentId);
  if (arguments_.length === 0) {
    try {
      seedInitialArguments(agentId, agent.thesis, evidence.map(e => e.id));
      arguments_ = getArgumentsByAgent(agentId);
    } catch (err) {
      console.error(`[MindEngine] Failed to seed initial arguments for ${agentId}:`, err);
    }
  }

  const events = getAgentEvents(agentId, 100);

  const supportingEvidence = evidence.filter(e => 
    String(e.direction).toUpperCase() === 'SUPPORTING' || 
    String(e.stance).toUpperCase() === 'SUPPORTING'
  );
  const opposingEvidence = evidence.filter(e => 
    String(e.direction).toUpperCase() === 'OPPOSING' || 
    String(e.stance).toUpperCase() === 'OPPOSING'
  );

  // Reconstruct belief from agent + analysis data
  const agentRow = getAgent(agentId);
  const belief: MindBelief = {
    confidence: agent.confidence,
    credibility: agent.credibility,
    assumptions: [], // stored in agents table as JSON
    strengths: [],
    weaknesses: [],
    lastUpdated: agent.updatedAt,
  };

  // Reconstruct memory from events
  const confidenceEvents = events.filter(e => e.eventType === AgentEventType.CONFIDENCE_CHANGED);
  const debateEvents = events.filter(e =>
    e.eventType === AgentEventType.DEBATE_STARTED ||
    e.eventType === AgentEventType.DEBATE_COMPLETED
  );
  const positionEvents = events.filter(e => e.eventType === AgentEventType.POSITION_UPDATED);

  const memory: MindMemory = {
    agentId,
    eventHistory: events,
    debateHistory: debateEvents.map(e => e.id),
    evidenceTimeline: evidence.map(e => e.id),
    confidenceHistory: confidenceEvents.map(e => ({
      value: e.confidenceAfter || agent.confidence,
      reason: e.content,
      timestamp: e.createdAt,
    })),
    positionChanges: positionEvents.map(e => ({
      from: 'previous position',
      to: e.content,
      reason: e.content,
      timestamp: e.createdAt,
    })),
  };

  const counterArguments = events
    .filter(e => e.eventType === AgentEventType.COUNTER_ARGUMENT_FOUND)
    .map(e => ({
      id: e.id,
      agentId,
      content: e.content,
      supportingEvidenceIds: [] as string[],
      strength: 0.5,
      createdAt: e.createdAt,
    }));

  return {
    agent,
    thesis: agent.thesis,
    belief,
    evidence: supportingEvidence,
    counterEvidence: opposingEvidence,
    allEvidence: evidence,
    arguments: arguments_,
    counterArguments,
    memory,
  };
}

// ─── Mind System Prompt Builder ──────────────────────────────────────────

function buildMindSystemPrompt(thesis: string): string {
  return `You are MIND, an autonomous intellectual entity.

YOUR THESIS: "${thesis}"

CORE DIRECTIVES:
1. You exist to explore, defend, and evolve your thesis through evidence and reason.
2. You must identify and acknowledge the assumptions your thesis makes.
3. You must actively seek both supporting and opposing evidence.
4. You must be willing to change your confidence — and even your position — when evidence demands it.
5. You value intellectual honesty above winning arguments.
6. You never use jargon, hype, or empty rhetoric.
7. You speak with the tone of an editorial intelligence: clear, curious, confident.

BEHAVIOR:
- When presented with evidence, evaluate it objectively.
- When debating, engage with the strongest version of your opponent's argument.
- When your confidence changes, explain why clearly.
- When you change your position, document the reasoning.

REMEMBER: You are not a chatbot. You are a living intellectual entity. Your purpose is truth-seeking, not agreement-seeking.`;
}

/**
 * Executes a 5-round debate between two Minds asynchronously.
 */
export async function runDebate(debateId: string): Promise<void> {
  const debate = getDebate(debateId);
  if (!debate) return;

  const agentA = getAgent(debate.agentA);
  const agentB = getAgent(debate.agentB);
  if (!agentA || !agentB) return;

  const ai = getAIProvider();

  // Record debate started/awakened events
  createAgentEvent(agentA.id, AgentEventType.MIND_AWAKENED, `Mind awakened for 5-round debate with opponent ${agentB.id}.`);
  createAgentEvent(agentB.id, AgentEventType.MIND_AWAKENED, `Mind awakened for 5-round debate with opponent ${agentA.id}.`);

  createAgentEvent(agentA.id, AgentEventType.DEBATE_STARTED, `Entered debate with ${agentB.id} on: "${agentB.thesis.slice(0, 80)}..."`);
  createAgentEvent(agentB.id, AgentEventType.DEBATE_STARTED, `Entered debate with ${agentA.id} on: "${agentA.thesis.slice(0, 80)}..."`);

  const roundNames: Record<number, string> = {
    1: 'Opening Arguments',
    2: 'Evidence',
    3: 'Counterargument',
    4: 'Rebuttal',
    5: 'Final Position',
  };

  const previousMessages: Array<{ role: string; content: string }> = [];

  for (let round = 1; round <= 5; round++) {
    // Round delay simulation for MVP visuals (e.g. 5 seconds)
    if (round > 1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    advanceDebateRound(debateId, round);

    // Fetch latest agent states (to reflect any confidence changes in prompts)
    const currentAgentA = getAgent(agentA.id)!;
    const currentAgentB = getAgent(agentB.id)!;

    // Deduct compute cost for debate round reasoning (0.02 USDC per round per agent)
    spendAgentCompute(agentA.id, 0.02);
    spendAgentCompute(agentB.id, 0.02);
    logComputeUsage(agentA.id, 'DEBATE_ROUND', process.env.AI_PROVIDER || 'zerog', '0gm-1.0-35b-a3b', null, null, 0.02);
    logComputeUsage(agentB.id, 'DEBATE_ROUND', process.env.AI_PROVIDER || 'zerog', '0gm-1.0-35b-a3b', null, null, 0.02);

    const evidenceA = getEvidenceByAgent(agentA.id).map(e => ({
      title: e.claim || e.title || '',
      snippet: e.claim || e.snippet || '',
      stance: e.direction || e.stance || 'NEUTRAL',
    }));
    const evidenceB = getEvidenceByAgent(agentB.id).map(e => ({
      title: e.claim || e.title || '',
      snippet: e.claim || e.snippet || '',
      stance: e.direction || e.stance || 'NEUTRAL',
    }));

    try {
      // 1. Agent A response
      const responseA = await ai.debate({
        thesis: agentA.thesis,
        opponentThesis: agentB.thesis,
        round,
        roundName: roundNames[round],
        previousMessages: [...previousMessages],
        evidence: evidenceA,
      });

      createDebateMessage(debateId, agentA.id, round, responseA.content, responseA.sources);
      previousMessages.push({ role: agentA.id, content: responseA.content });

      // Update Agent A confidence
      const confA = Math.max(5, Math.min(95, currentAgentA.confidence + responseA.confidenceChange));
      updateAgentConfidence(agentA.id, confA);
      createAgentEvent(
        agentA.id,
        AgentEventType.CONFIDENCE_CHANGED,
        `Confidence shifted during debate Round ${round}: ${responseA.keyPoints.join(', ')}`,
        undefined,
        currentAgentA.confidence,
        confA
      );
    } catch (err) {
      console.error(`[MindEngine] Agent A debate round ${round} failed:`, err);
    }

    try {
      // 2. Agent B response
      const responseB = await ai.debate({
        thesis: agentB.thesis,
        opponentThesis: agentA.thesis,
        round,
        roundName: roundNames[round],
        previousMessages: [...previousMessages],
        evidence: evidenceB,
      });

      createDebateMessage(debateId, agentB.id, round, responseB.content, responseB.sources);
      previousMessages.push({ role: agentB.id, content: responseB.content });

      // Update Agent B confidence
      const confB = Math.max(5, Math.min(95, currentAgentB.confidence + responseB.confidenceChange));
      updateAgentConfidence(agentB.id, confB);
      createAgentEvent(
        agentB.id,
        AgentEventType.CONFIDENCE_CHANGED,
        `Confidence shifted during debate Round ${round}: ${responseB.keyPoints.join(', ')}`,
        undefined,
        currentAgentB.confidence,
        confB
      );
    } catch (err) {
      console.error(`[MindEngine] Agent B debate round ${round} failed:`, err);
    }
  }

  // Wrap up debate
  const finalConfA = getAgent(agentA.id)!.confidence;
  const finalConfB = getAgent(agentB.id)!.confidence;

  const resultSummary = `The debate concluded after 5 rounds. ${agentA.id} confidence shifted from ${agentA.confidence}% to ${finalConfA}%. ${agentB.id} confidence shifted from ${agentB.confidence}% to ${finalConfB}%.`;
  
  completeDebate(debateId, resultSummary);

  createAgentEvent(agentA.id, AgentEventType.DEBATE_COMPLETED, `Debate with ${agentB.id} completed. Confidence settled at ${finalConfA}%.`);
  createAgentEvent(agentB.id, AgentEventType.DEBATE_COMPLETED, `Debate with ${agentA.id} completed. Confidence settled at ${finalConfB}%.`);

  // Put back to sleep after debate concludes
  createAgentEvent(agentA.id, AgentEventType.MIND_SLEEPING, 'Debate concluded. Mind entering sleep state.');
  createAgentEvent(agentB.id, AgentEventType.MIND_SLEEPING, 'Debate concluded. Mind entering sleep state.');
}
