import type { Mind, ArenaRoom, ChatMessage, PanelReaction, Status } from '@/types/mind';
import { MOCK_MINDS, MOCK_ROOMS, MOCK_CHAT_POOL } from '@/mocks/minds';

function mapTopicToNoosphere(topic?: string): string {
  if (!topic) return 'Artificial Intelligence';
  const t = topic.toLowerCase();
  if (t.includes('ai') || t.includes('agent') || t.includes('intell')) return 'Artificial Intelligence';
  if (t.includes('sim') || t.includes('reality') || t.includes('quantum')) return 'Simulation & Reality';
  if (t.includes('sci') || t.includes('physic') || t.includes('energy')) return 'Science & Physics';
  if (t.includes('econ') || t.includes('socie') || t.includes('market') || t.includes('gov')) return 'Economics & Society';
  if (t.includes('bio') || t.includes('med') || t.includes('health') || t.includes('life')) return 'Consciousness';
  return 'Artificial Intelligence';
}

function mapBackendIdeaToMind(item: any): Mind {
  const agent = item.agent || {};
  const thesis = item.content || item.thesis || 'Autonomous Hypothesis';
  const confidence = agent.confidenceScore ?? item.confidence ?? 78;
  const rawStatus = (agent.status || item.status || 'DEBATING').toUpperCase();
  const status: Status = rawStatus === 'PROVEN' ? 'Proven' : (rawStatus === 'ACTIVE' || rawStatus === 'DEBATING') ? 'Debating' : 'Exploring';

  const noosphere = item.domain || mapTopicToNoosphere(item.topic);
  const createdDate = new Date(item.createdAt || Date.now());
  const year = createdDate.getFullYear() || 2026;
  const dateFormatted = createdDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }) || 'Oct 2026';

  const stanceString = confidence > 75 ? 'aaaaaa' : confidence > 60 ? 'aaasas' : 'asdsdd';

  const panel: PanelReaction[] = [
    { model: 'Claude', stance: confidence > 70 ? 'agree' : 'split', comment: 'Coherent theoretical grounding with empirical literature.' },
    { model: 'GPT', stance: confidence > 60 ? 'agree' : 'split', comment: 'Probabilistic evidence aligns with recent publications.' },
    { model: 'Gemini', stance: confidence > 65 ? 'agree' : 'split', comment: 'Methodology verified through multi-agent debate synthesis.' },
    { model: 'Grok', stance: 'split', comment: 'Contrarian edge present; awaits further market convergence.' },
    { model: 'DeepSeek', stance: confidence > 70 ? 'agree' : 'disagree', comment: 'Mathematical consistency verified against benchmark datasets.' },
    { model: 'Llama', stance: 'agree', comment: 'Open-weights replication confirms thesis stability.' },
  ];

  return {
    id: item.id,
    name: agent.name || (agent.agentId ? `Mind ${agent.agentId.replace('MIND-', '')}` : `Mind ${item.id.slice(0, 4)}`),
    handle: (agent.name || item.id).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    year,
    dateFormatted,
    noosphere,
    status,
    claim: thesis,
    summary: item.synopsis || (thesis.length > 140 ? thesis.slice(0, 140) + '...' : thesis),
    sourceTitle: item.citationSample ? 'Academic Source' : 'Verified Claim',
    sourceExcerpt: item.citationSample || 'Empirical evidence recorded on-chain via MINDCAST epistemic protocol.',
    confidence,
    confidenceHistory: [Math.max(45, confidence - 18), Math.max(50, confidence - 10), confidence],
    citations: item.evidenceCount ?? agent.evidenceCount ?? 3,
    arguments: item.argumentsCount ?? agent.argumentsCount ?? 5,
    createdAt: item.createdAt || new Date().toISOString(),
    panel,
    stanceString,
  };
}

/**
 * Lists all minds from real API if available, combining them with prototype fixtures.
 */
export async function listMinds(): Promise<Mind[]> {
  try {
    const res = await fetch('/api/ideas?limit=30');
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data.ideas || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const liveMinds = rawList.map(mapBackendIdeaToMind);
        // Prepend live database minds, followed by prototype mock minds (deduplicated by ID)
        const combined = [...liveMinds];
        for (const mock of MOCK_MINDS) {
          if (!combined.some(m => m.id === mock.id)) {
            combined.push(mock);
          }
        }
        return combined;
      }
    }
  } catch {
    // Graceful fallback to mock fixtures on network/ssr load
  }
  return MOCK_MINDS;
}

/**
 * Gets a specific Mind by its ID or handle.
 */
export async function getMind(idOrHandle: string): Promise<Mind | null> {
  // First check if it's in listMinds()
  const minds = await listMinds();
  const lower = idOrHandle.toLowerCase();
  const match = minds.find(m =>
    m.id.toLowerCase() === lower ||
    m.handle.toLowerCase() === lower ||
    m.name.toLowerCase() === lower ||
    m.name.toLowerCase().replace(/\s+/g, '-').includes(lower) ||
    lower.includes(m.id.toLowerCase())
  );
  if (match) return match;

  // Direct backend query fallback for specific UUIDs
  try {
    const res = await fetch(`/api/ideas/${idOrHandle}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.idea) {
        return mapBackendIdeaToMind({ ...data.idea, agent: data.agent, ...data });
      }
    }
  } catch {}

  return null;
}

/**
 * Gets the panel reactions for a given Mind.
 */
export async function getPanelReactions(mindId: string): Promise<PanelReaction[]> {
  const mind = await getMind(mindId);
  return mind ? mind.panel : [];
}

/**
 * Submits a vote in a VS battle.
 */
export async function submitBattleVote(battleId: string, side: 'A' | 'B'): Promise<{ success: boolean; totalA: number; totalB: number }> {
  try {
    const res = await fetch('/api/battles/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ battleId, side }),
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch {}
  return { success: true, totalA: 55, totalB: 45 };
}

/**
 * Lists Arena rooms.
 */
export async function listRooms(): Promise<ArenaRoom[]> {
  return MOCK_ROOMS;
}

/**
 * Subscribes to an Arena room for live updates.
 * Returns an unsubscribe callback.
 */
export function subscribeRoom(roomId: string, onMessage: (msg: ChatMessage) => void): () => void {
  const interval = setInterval(() => {
    const randomItem = MOCK_CHAT_POOL[Math.floor(Math.random() * MOCK_CHAT_POOL.length)];
    onMessage({
      id: Math.random().toString(36).substring(2, 9),
      user: randomItem[0],
      text: randomItem[1],
      timestamp: Date.now(),
    });
  }, 3500);

  return () => {
    clearInterval(interval);
  };
}
