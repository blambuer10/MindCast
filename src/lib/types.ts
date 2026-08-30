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
  MIND_SLEEPING = 'MIND_SLEEPING',
  MIND_AWAKENED = 'MIND_AWAKENED',
  PREDICTION_CREATED = 'PREDICTION_CREATED',
  PREDICTION_RESOLVED = 'PREDICTION_RESOLVED',
  PREDICTION_CORRECT = 'PREDICTION_CORRECT',
  PREDICTION_INCORRECT = 'PREDICTION_INCORRECT',
  LIFECYCLE_CHANGED = 'LIFECYCLE_CHANGED',
  MIND_BECAME_EMERGING = 'MIND_BECAME_EMERGING',
  MIND_BECAME_PROVEN = 'MIND_BECAME_PROVEN',
  MIND_BECAME_MARKET_READY = 'MIND_BECAME_MARKET_READY',
  VALUATION_UPDATED = 'VALUATION_UPDATED',
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
  computeBudget: number;
  computeSpent: number;
  computeRemaining: number;
  lifecycleStatus: MindLifecycleStatus;
  predictionAccuracy: number;
  calibrationScore: number;
  estimatedValue: number;
  marketStatus: string;
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

export type EvidenceType = 'NEWS' | 'RESEARCH' | 'DATA' | 'OFFICIAL' | 'EXPERT' | 'MARKET' | 'SOCIAL' | 'OPINION';

export interface Evidence {
  id: string;
  agentId: string;
  claim: string;
  direction: EvidenceStance;
  sourceUrl: string;
  sourceName: string;
  sourceType: EvidenceType;
  publishedAt: string | null;
  discoveredAt: string;
  reliabilityScore: number;  // 0-100
  relevanceScore: number;    // 0-100
  strengthScore: number;      // 0-100
  confidenceImpact: number;  // e.g. +5 or -4
  status: string;            // 'NEW' | 'VERIFIED' | 'CONTESTED' etc
  
  // Backward compatibility compatibility layer
  source?: string;
  title?: string;
  url?: string;
  snippet?: string;
  relevance?: number;
  stance?: EvidenceStance;
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
  allEvidence?: Evidence[];
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
  tab: 'trending' | 'recent' | 'debating' | 'top-mcap' | 'dex';
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
  claim?: string;
  sourceType?: EvidenceType;
  reliabilityScore?: number;
  relevanceScore?: number;
  strengthScore?: number;
  confidenceImpact?: number;
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
  | 'challenge_payment_confirmed'
  | 'market_shares_bought'
  | 'market_shares_sold'
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

// --- Mind Economy & Reputation Types ---

export type MindLifecycleStatus = 'INCUBATING' | 'EMERGING' | 'PROVEN' | 'MARKET_READY' | 'MARKET_ACTIVE' | 'ARCHIVED';

export type PredictionStatus = 'OPEN' | 'RESOLVED_TRUE' | 'RESOLVED_FALSE' | 'PARTIALLY_TRUE' | 'INVALIDATED' | 'CANCELLED';

export interface Prediction {
  id: string;
  mindId: string;
  claim: string;
  targetValue: string | null;
  targetMetric: string | null;
  targetDate: string | null;
  resolutionMethod: string | null;
  resolutionSource: string | null;
  status: PredictionStatus;
  confidenceAtCreation: number;
  confidenceAtResolution: number | null;
  outcome: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface DebateOutcome {
  debateId: string;
  mindId: string;
  argumentScore: number;
  evidenceScore: number;
  rebuttalScore: number;
  intellectualHonestyScore: number;
  confidenceBefore: number;
  confidenceAfter: number;
  positionChanged: boolean;
  createdAt: string;
}

export interface MindAsset {
  id: string;
  mindId: string;
  assetType: 'MIND_SHARE';
  totalSupply: number;
  creatorAllocation: number;
  communityAllocation: number;
  protocolAllocation: number;
  liquidityAllocation: number;
  marketStatus: string;
  createdAt: string;
}

export interface MindFounder {
  creatorId: string;
  mindId: string;
  allocationPercentage: number;
  allocationStatus: string;
  createdAt: string;
}

export interface MindReputationEvent {
  id: string;
  mindId: string;
  eventType: string;
  scoreChange: number;
  description: string;
  createdAt: string;
}

export interface MindValuationSnapshot {
  id: string;
  mindId: string;
  estimatedValue: number;
  createdAt: string;
}

export interface ProtocolAsset {
  id: string;
  assetType: 'PROTOCOL_TOKEN';
  symbol: string;
  status: string;
  createdAt: string;
}

export interface MindComputeUsage {
  id: string;
  mindId: string;
  taskType: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number;
  createdAt: string;
}

// --- Data Intelligence Layer Types ---

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'PERSONAL' | 'PSEUDONYMOUS' | 'SENSITIVE' | 'RESTRICTED';

export type ConsentType = 'ANALYTICS' | 'PERSONALIZATION' | 'RESEARCH' | 'COMMERCIAL_DATA_USE';

export interface DataEvent {
  id: string;
  eventId: string;
  eventType: string;
  actorType: 'USER' | 'AI' | 'SYSTEM';
  actorId: string | null;
  anonymousActorId: string | null;
  entityType: string | null;
  entityId: string | null;
  sessionId: string | null;
  requestId: string | null;
  metadata: Record<string, any>;
  source: string;
  version: string;
  schemaVersion: string;
  createdAt: string;
}

export interface MindThesisVersion {
  id: string;
  mindId: string;
  version: number;
  thesis: string;
  reason: string | null;
  generatedBy: 'USER' | 'AI';
  confidence: number;
  createdAt: string;
}

export interface MindBeliefSnapshot {
  id: string;
  mindId: string;
  confidence: number;
  credibility: number;
  evidenceCount: number;
  counterEvidenceCount: number;
  predictionAccuracy: number;
  followers: number;
  debateCount: number;
  timestamp: string;
}

export interface SourceIntelligence {
  domain: string;
  publisher: string | null;
  sourceType: string;
  citationCount: number;
  evidenceCount: number;
  supportingCount: number;
  opposingCount: number;
  averageReliability: number;
  averageRelevance: number;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface MindTopic {
  mindId: string;
  topicId: string;
  relevanceScore: number;
  createdAt: string;
}

export interface MindRelationship {
  id: string;
  sourceMindId: string;
  targetMindId: string;
  relationshipType: 'AGREES' | 'DISAGREES' | 'CITES' | 'RESPONDS_TO' | 'INFLUENCES' | 'SHARES_EVIDENCE' | 'COMPETES_WITH';
  confidenceImpact: number;
  createdAt: string;
}

export interface SessionEvent {
  sessionId: string;
  anonymousUserId: string;
  userId: string | null;
  startedAt: string;
  endedAt: string | null;
  referrer: string | null;
  landingPage: string | null;
  deviceCategory: string | null;
  browserCategory: string | null;
  countryRegion: string | null;
  eventsCount: number;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  version: string;
  granted: boolean;
  timestamp: string;
  source: string;
}

export interface DatasetDefinition {
  datasetId: string;
  name: string;
  version: string;
  description: string | null;
  sourceTables: string[];
  transformationVersion: string;
  createdAt: string;
}

export interface DataQualityRun {
  id: string;
  datasetId: string;
  qualityScore: number;
  metrics: Record<string, any>;
  timestamp: string;
}

export interface EarlySignal {
  id: string;
  topic: string;
  strength: number;
  evidenceVelocity: number;
  convergingMindsCount: number;
  details: Record<string, any>;
  detectedAt: string;
}

export interface DataAccessAuditLog {
  id: string;
  actorId: string | null;
  role: string;
  datasetId: string;
  purpose: string;
  action: string;
  timestamp: string;
  result: string;
}
