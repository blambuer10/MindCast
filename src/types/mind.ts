export type Status = "Proven" | "Debating" | "Exploring";
export type Stance = "agree" | "split" | "disagree";
export type AIModelName = "Claude" | "GPT" | "Gemini" | "Grok" | "DeepSeek" | "Llama";

export interface PanelReaction {
  model: AIModelName;
  stance: Stance;
  comment: string;
}

export interface Mind {
  id: string;
  name: string; // e.g. "Mind 590A"
  handle: string; // e.g. "autonomous-capital"
  year: number; // e.g. 2026
  dateFormatted: string; // e.g. "Oct 2026"
  noosphere: string; // one of the five categories
  status: Status;
  claim: string;
  summary: string;
  sourceTitle: string; // e.g. "Bloomberg Intelligence"
  sourceExcerpt: string;
  confidence: number | null; // 0-100, null = not yet assessed
  confidenceHistory: number[]; // chronological, may be empty
  citations: number;
  arguments: number;
  createdAt: string; // ISO date
  panel: PanelReaction[]; // one per AI model
  stanceString: string; // e.g. "aaasas"
}

export interface NoosphereConfig {
  name: string;
  shortName: string;
  color: string;
}

export interface AIModelConfig {
  name: AIModelName;
  color: string;
  tag: string;
  code: string;
}

export interface ArenaRoom {
  id: string;
  name: string;
  blurb: string;
  color: string;
  online: number;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp?: number;
  mine?: boolean;
}

export interface BattleVerdict {
  winsA: number;
  winsB: number;
  ties: number;
  breakdown: Array<{
    model: AIModelName;
    winner: 'A' | 'B' | 'tie';
    stanceA: Stance;
    stanceB: Stance;
  }>;
}

export interface NoosphereStat {
  name: string;
  shortName: string;
  color: string;
  count: number;
  averageConfidence: number | null;
}
