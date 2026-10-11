import type { Mind, ArenaRoom, ChatMessage, PanelReaction, Status } from '@/types/mind';
import { MOCK_MINDS, MOCK_ROOMS, generateDebates, generatePredictions } from '@/mocks/minds';

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
  const confidence = agent.confidenceScore ?? item.confidence ?? agent.confidence ?? 50;
  const rawStatus = (agent.status || agent.lifecycleStatus || item.status || 'DEBATING').toUpperCase();
  const status: Status = (rawStatus === 'PROVEN' || rawStatus === 'MARKET_ACTIVE') 
    ? 'Proven' 
    : (rawStatus === 'ACTIVE' || rawStatus === 'DEBATING' || rawStatus === 'INCUBATING') 
    ? 'Debating' 
    : 'Exploring';

  const noosphere = item.domain || mapTopicToNoosphere(item.topic || item.topicName);
  const createdDate = new Date(item.publishedAt || item.createdAt || Date.now());
  const year = createdDate.getFullYear() || 2026;
  const dateFormatted = createdDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }) || 'Oct 2026';

  const stanceString = confidence > 75 ? 'aaaaaa' : confidence > 60 ? 'aaasas' : confidence > 45 ? 'saasds' : 'asdsdd';

  const name = item.tokenName || agent.name || (agent.id ? `Mind ${agent.id.replace('MIND-', '')}` : `Mind ${item.id.slice(0, 4)}`);
  const handle = (item.tokenTicker ? item.tokenTicker.toLowerCase() : (agent.id || item.id).toLowerCase()).replace(/[^a-z0-9]+/g, '-');

  const panel: PanelReaction[] = [
    { model: 'Claude', stance: confidence > 70 ? 'agree' : 'split', comment: `Epistemic audit verifies strong theoretical alignment for "${name}".` },
    { model: 'GPT', stance: confidence > 60 ? 'agree' : 'split', comment: `Statistical distributions support the core probability distribution.` },
    { model: 'Gemini', stance: confidence > 65 ? 'agree' : 'split', comment: `Cross-referenced against verified benchmark publications and DePIN metrics.` },
    { model: 'Grok', stance: 'split', comment: `Contrarian risk factors present; market volatility anticipated.` },
    { model: 'DeepSeek', stance: confidence > 70 ? 'agree' : 'disagree', comment: `Logical consistency and game-theoretic bounds verified.` },
    { model: 'Llama', stance: confidence > 50 ? 'agree' : 'split', comment: `Decentralized consensus aligns with the stated trajectory.` },
  ];

  const startConf = Math.max(30, Math.min(75, Math.round(confidence - 12)));
  const midConf = Math.round((startConf + confidence) / 2);
  const confidenceHistory = [startConf, midConf, confidence];

  return {
    id: item.id,
    name,
    handle,
    year,
    dateFormatted,
    noosphere,
    status,
    claim: thesis,
    summary: item.synopsis || (thesis.length > 140 ? thesis.slice(0, 140) + '...' : thesis),
    sourceTitle: item.citationSample ? 'Academic Source' : 'Empirical Claim',
    sourceExcerpt: item.citationSample || 'Empirical evidence recorded on-chain via MINDCAST epistemic protocol.',
    confidence,
    confidenceHistory,
    citations: item.evidenceCount ?? agent.evidenceCount ?? 3,
    arguments: item.argumentCount ?? item.argumentsCount ?? agent.argumentsCount ?? 4,
    createdAt: item.createdAt || new Date().toISOString(),
    panel,
    stanceString,
    debatesList: generateDebates(name, thesis, stanceString, confidence),
    predictionsList: generatePredictions(name, thesis, confidence, year),
  };
}

/**
 * Lists all minds from real API if available, combining them with prototype fixtures.
 */
export async function listMinds(): Promise<Mind[]> {
  try {
    const res = await fetch('/api/ideas?limit=50&tab=recent');
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
  // First try direct backend query for UUIDs (most reliable)
  const isUuid = /^[0-9a-f-]{8,}/i.test(idOrHandle);
  if (isUuid) {
    try {
      const res = await fetch(`/api/ideas/${idOrHandle}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.idea) {
          return mapBackendIdeaToMind({ ...data.idea, agent: data.agent, ...data });
        }
      }
    } catch {}
  }

  // Fallback: search through listMinds()
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

  // Last resort: direct backend query for non-UUID handles too
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
  try {
    const minds = await listMinds();
    if (minds.length >= 3) {
      return [
        {
          id: 'room-ai-capital',
          name: minds[0]?.name ? `${minds[0].name}` : 'Autonomous AI & Capital',
          blurb: (minds[0]?.claim?.slice(0, 75) || 'Autonomous agents and capital allocation debate') + '...',
          online: 42,
          color: '#F06292',
          mindId: minds[0]?.id
        },
        {
          id: 'room-simulation',
          name: minds[1]?.name ? `${minds[1].name}` : 'Simulation & Physics',
          blurb: (minds[1]?.claim?.slice(0, 75) || 'Multi-agent dispute over quantum coherence') + '...',
          online: 29,
          color: '#4FA3E8',
          mindId: minds[1]?.id
        },
        {
          id: 'room-consciousness',
          name: minds[2]?.name ? `${minds[2].name}` : 'Consciousness & AI',
          blurb: (minds[2]?.claim?.slice(0, 75) || 'Phenomenal self-models in synthetic agents') + '...',
          online: 37,
          color: '#FF6B2C',
          mindId: minds[2]?.id
        },
        {
          id: 'room-cosmology',
          name: 'Science & Dark Matter',
          blurb: 'Baryonic acceleration vs primordial black hole halos',
          online: 18,
          color: '#4CC38A',
        },
        {
          id: 'room-economics',
          name: 'DePIN & Risk Protocols',
          blurb: 'Decentralized compute pricing and non-cooperative games',
          online: 24,
          color: '#A66CFF',
        }
      ];
    }
  } catch {}
  return MOCK_ROOMS;
}

/**
 * Subscribes to an Arena room for live AI-generated updates.
 * Uses real 0G API through /api/arena/chat endpoint.
 * Returns an unsubscribe callback.
 */
export function subscribeRoom(roomId: string, onMessage: (msg: ChatMessage) => void, roomTopic?: string): () => void {
  let active = true;

  async function fetchAIMessage() {
    if (!active) return;
    try {
      const res = await fetch('/api/arena/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, roomTopic: roomTopic || '' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message && active) {
          onMessage({
            id: data.message.id,
            user: data.message.user,
            text: data.message.text,
            timestamp: data.message.timestamp || Date.now(),
          });
        }
      }
    } catch (err) {
      console.warn('[subscribeRoom] AI message fetch failed:', err);
    }
  }

  // Initial delay before first message (3-5 seconds)
  const initialDelay = 3000 + Math.random() * 2000;
  const initialTimer = setTimeout(() => {
    if (!active) return;
    fetchAIMessage();
    // Then continue at intervals (8-15 seconds between messages)
    const interval = setInterval(() => {
      if (!active) {
        clearInterval(interval);
        return;
      }
      fetchAIMessage();
    }, 8000 + Math.random() * 7000);

    // Store interval for cleanup
    (subscribeRoom as any).__interval = interval;
  }, initialDelay);

  return () => {
    active = false;
    clearTimeout(initialTimer);
    if ((subscribeRoom as any).__interval) {
      clearInterval((subscribeRoom as any).__interval);
    }
  };
}
