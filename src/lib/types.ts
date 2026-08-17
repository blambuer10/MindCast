// ============================================================================
// MINDCAST — Core Type System
// ============================================================================

// --- Status Enums ---

export enum IdeaStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export enum DebateStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EvidenceStance {
  SUPPORTING = 'SUPPORTING',
  OPPOSING = 'OPPOSING',
  NEUTRAL = 'NEUTRAL',
}

export enum AgentEventType {
  MIND_CREATED = 'MIND_CREATED',
  INITIAL_ANALYSIS = 'INITIAL_ANALYSIS',
  NEW_EVIDENCE = 'NEW_EVIDENCE',
  CONFIDENCE_CHANGED = 'CONFIDENCE_CHANGED',
  ARGUMENT_CREATED = 'ARGUMENT_CREATED',
  COUNTER_ARGUMENT_FOUND = 'COUNTER_ARGUMENT_FOUND',
  DEBATE_STARTED = 'DEBATE_STARTED',
  DEBATE_COMPLETED = 'DEBATE_COMPLETED',
  POSITION_UPDATED = 'POSITION_UPDATED',
  FOLLOWER_MILESTONE = 'FOLLOWER_MILESTONE',
  CREDIBILITY_CHANGED = 'CREDIBILITY_CHANGED',
  EVIDENCE_INVALIDATED = 'EVIDENCE_INVALIDATED',
}

export enum DebateRound {
  OPENING = 1,
  EVIDENCE = 2,
  COUNTERARGUMENT = 3,
  REBUTTAL = 4,
  FINAL = 5,
}

// --- Core Entities ---

export interface User {
  id: string;
  walletAddress: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  creatorId: string;
  content: string;
  agentId: string | null;
  status: IdeaStatus;
  createdAt: string;
  publishedAt: string | null;
}

export interface Agent {
  id: string;
  ideaId: string;
  thesis: string;
  confidence: number;       // 0-100 — current belief strength
  credibility: number;      // 0-100 — historical reliability
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  eventType: AgentEventType;
  content: string;
  source: string | null;
  confidenceBefore: number | null;
  confidenceAfter: number | null;
  createdAt: string;
}

export interface Evidence {
  id: string;
  agentId: string;
  source: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null;
  retrievedAt: string;
  relevance: number;        // 0-1
  stance: EvidenceStance;
}

export interface Argument {
  id: string;
  agentId: string;
  content: string;
  supportingEvidenceIds: string[];
  strength: number;         // 0-1
  createdAt: string;
}

export interface Debate {
  id: string;
  ideaA: string;
  ideaB: string;
  agentA: string;
  agentB: string;
  status: DebateStatus;
  currentRound: DebateRound;
  createdAt: string;
  completedAt: string | null;
}

export interface DebateMessage {
  id: string;
  debateId: string;
  agentId: string;
  round: DebateRound;
  content: string;
  sources: string[];         // evidence IDs
  createdAt: string;
}

export interface DebateResult {
  debateId: string;
  strongestArgument: string;
  strongestEvidence: string;
  confidenceChanges: {
    agentA: { before: number; after: number };
    agentB: { before: number; after: number };
  };
  unresolvedQuestions: string[];
  summary: string;
}

export interface Payment {
  id: string;
  userId: string;
  ideaId: string;
  chain: string;
  txHash: string;
  amount: string;
  token: string;
  recipient: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt: string | null;
}

export interface IdeaFollow {
  userId: string;
  ideaId: string;
  createdAt: string;
}

// --- Mind State (Rich Model for Mind Engine) ---

export interface MindState {
  agent: Agent;
  thesis: string;
  belief: MindBelief;
  evidence: Evidence[];
  counterEvidence: Evidence[];
  arguments: Argument[];
  counterArguments: Argument[];
  memory: MindMemory;
}

export interface MindBelief {
  confidence: number;
  credibility: number;
  assumptions: string[];
  strengths: string[];
  weaknesses: string[];
  lastUpdated: string;
}

export interface MindMemory {
  agentId: string;
  eventHistory: AgentEvent[];
  debateHistory: string[];     // debate IDs
  evidenceTimeline: string[];  // evidence IDs in discovery order
  confidenceHistory: Array<{
    value: number;
    reason: string;
    timestamp: string;
  }>;
  positionChanges: Array<{
    from: string;
    to: string;
    reason: string;
    timestamp: string;
  }>;
}

// --- API Types ---

export interface IdeaPrepareRequest {
  content: string;
  walletAddress: string;
}

export interface IdeaPrepareResponse {
  ideaId: string;
  paymentAmount: string;
  paymentToken: string;
  paymentRecipient: string;
  chainId: number;
}

export interface PaymentVerifyRequest {
  ideaId: string;
  txHash: string;
  chain: string;
  walletAddress: string;
}

export interface PaymentVerifyResponse {
  status: PaymentStatus;
  ideaId: string;
  agentId?: string;
}

export interface IdeaPublishRequest {
  ideaId: string;
  txHash: string;
}

// --- Feed / Ranking ---

export interface IdeaWithMind extends Idea {
  agent: Agent | null;
  creator: { walletAddress: string };
  followerCount: number;
  argumentCount: number;
  evidenceCount: number;
  momentum: number;
}

export interface FeedFilters {
  tab: 'trending' | 'recent' | 'debating';
  page: number;
  limit: number;
}

// --- AI Provider Types ---

export interface AIAnalysis {
  assumptions: string[];
  arguments: Argument[];
  counterArguments: string[];
  initialConfidence: number;
  strengths: string[];
  weaknesses: string[];
  suggestedEvidenceQueries: string[];
}

export interface AIDebateResponse {
  content: string;
  sources: string[];
  confidenceChange: number;
  keyPoints: string[];
}

export interface AIEvidenceEvaluation {
  relevance: number;
  stance: EvidenceStance;
  impact: number;
  reasoning: string;
}

export interface AIConfidenceUpdate {
  newConfidence: number;
  reason: string;
  positionChange: string | null;
}

// --- Analytics ---

export type AnalyticsEvent =
  | 'landing_view'
  | 'wallet_connect_started'
  | 'wallet_connected'
  | 'idea_started'
  | 'idea_submitted'
  | 'payment_started'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'idea_published'
  | 'mind_created'
  | 'mind_analysis_completed'
  | 'idea_followed'
  | 'debate_started'
  | 'debate_completed'
  | 'return_visit';

// --- Config ---

export interface MindcastConfig {
  payment: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    usdcContract: string;
    recipientAddress: string;
    publishingFee: string;
  };
  ai: {
    provider: 'openai' | 'anthropic' | 'local';
  };
}

// --- Utility Types ---

export type MindId = string;  // Format: MIND-XXXX

export function generateMindId(): MindId {
  const chars = '0123456789ABCDEF';
  let id = 'MIND-';
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
}
