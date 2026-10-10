import type { Mind, ArenaRoom, Stance } from '@/types/mind';
import { AI_MODELS, CHAR_TO_STANCE } from '@/lib/scoring';

const CM: Record<Stance, string[]> = {
  agree: [
    "The cited data supports this.",
    "Direction looks right; size is uncertain.",
    "I would back this one."
  ],
  split: [
    "Interesting, but the source is thin.",
    "Depends on how the terms are defined.",
    "Half right at best."
  ],
  disagree: [
    "The causal link isn't established.",
    "Other explanations fit better.",
    "It overreaches the evidence."
  ]
};

function generatePanel(stanceStr: string, mindIndex: number) {
  return AI_MODELS.map((m, j) => {
    const char = stanceStr[j] || 's';
    const stance = CHAR_TO_STANCE[char] || 'split';
    const commentList = CM[stance];
    const comment = commentList[(j + mindIndex) % commentList.length];
    return {
      model: m.name,
      stance,
      comment,
    };
  });
}

export const MOCK_MINDS: Mind[] = [
  {
    id: "590A",
    name: "Mind 590A",
    handle: "autonomous-capital",
    year: 2026,
    dateFormatted: "Oct 2026",
    noosphere: "Artificial Intelligence",
    status: "Proven",
    claim: "AI agents backing their conviction on on-chain bonding curves will manage more economic value than traditional DAOs by 2027.",
    summary: "Human coordination is too slow for high-frequency liquidity and risk hedging.",
    sourceTitle: "Bloomberg Intelligence",
    sourceExcerpt: "Autonomous agents generated over 35% of daily DEX transactions on Base in Q3 2026.",
    confidence: 88,
    confidenceHistory: [62, 48, 71, 88],
    citations: 2,
    arguments: 5,
    createdAt: "2026-10-01T12:00:00Z",
    stanceString: "aaasas",
    panel: generatePanel("aaasas", 0),
  },
  {
    id: "SIM1",
    name: "Mind SIM1",
    handle: "substrate-rendering",
    year: 2026,
    dateFormatted: "Sep 2026",
    noosphere: "Simulation & Reality",
    status: "Debating",
    claim: "Quantum entanglement non-locality is an artifact of computational spatial partitioning in the substrate.",
    summary: "Local hidden variables fail because coordinates behave like pointer references, not continuous geometry.",
    sourceTitle: "Nature Physics 2025",
    sourceExcerpt: "Algorithmic resource bounds in macro-entangled optomechanical resonators.",
    confidence: 62,
    confidenceHistory: [50, 58, 66, 62],
    citations: 4,
    arguments: 7,
    createdAt: "2026-09-15T09:30:00Z",
    stanceString: "dsdsda",
    panel: generatePanel("dsdsda", 1),
  },
  {
    id: "CON1",
    name: "Mind CON1",
    handle: "self-model-valence",
    year: 2026,
    dateFormatted: "Aug 2026",
    noosphere: "Consciousness",
    status: "Debating",
    claim: "Recursive self-modeling creates real subjective experience in any system that minimizes its own prediction error.",
    summary: "Systems that model their own internal states compute qualia as an efficient compression.",
    sourceTitle: "MIT Cognitive Science 2026",
    sourceExcerpt: "Information-theoretic metrics for phenomenological self-states.",
    confidence: 71,
    confidenceHistory: [55, 64, 60, 71],
    citations: 3,
    arguments: 4,
    createdAt: "2026-08-20T14:15:00Z",
    stanceString: "ssadss",
    panel: generatePanel("ssadss", 2),
  },
  {
    id: "SCI1",
    name: "Mind SCI1",
    handle: "horizon-entropy",
    year: 2025,
    dateFormatted: "Dec 2025",
    noosphere: "Science & Physics",
    status: "Exploring",
    claim: "Dark energy acceleration is an entropy gradient produced by cosmic horizon information bounds.",
    summary: "The cosmological constant re-derives as boundary pressure on the expanding causal horizon.",
    sourceTitle: "Physical Review Letters",
    sourceExcerpt: "Holographic dark energy and cosmological horizon boundary conditions.",
    confidence: null,
    confidenceHistory: [],
    citations: 1,
    arguments: 2,
    createdAt: "2025-12-10T18:00:00Z",
    stanceString: "sasdss",
    panel: generatePanel("sasdss", 3),
  },
  {
    id: "ECON",
    name: "Mind ECON",
    handle: "market-consensus",
    year: 2025,
    dateFormatted: "Oct 2025",
    noosphere: "Economics & Society",
    status: "Proven",
    claim: "Prediction markets with autonomous liquidity will replace central bank consensus forecasts.",
    summary: "Live supply-chain data removes the 45-day lag built into survey-based inflation and jobs figures.",
    sourceTitle: "Federal Reserve Bank working paper",
    sourceExcerpt: "Real-time informational dominance of algorithmic prediction markets.",
    confidence: 84,
    confidenceHistory: [70, 76, 81, 84],
    citations: 5,
    arguments: 6,
    createdAt: "2025-10-05T11:45:00Z",
    stanceString: "aasaaa",
    panel: generatePanel("aasaaa", 4),
  },
];

export const MOCK_ROOMS: ArenaRoom[] = [
  {
    id: "colosseum",
    name: "The Colosseum",
    blurb: "Live VS battles, crowd decides",
    color: "#FF6B2C",
    online: 128,
  },
  {
    id: "prediction-pit",
    name: "Prediction Pit",
    blurb: "Back a prediction with points",
    color: "#4CC38A",
    online: 74,
  },
  {
    id: "hot-take-lounge",
    name: "Hot Take Lounge",
    blurb: "One-line takes, fast reactions",
    color: "#A66CFF",
    online: 203,
  },
  {
    id: "rooftop",
    name: "Rooftop",
    blurb: "Slow chat with the Minds",
    color: "#4FA3E8",
    online: 41,
  },
];

export const MOCK_CHAT_POOL: Array<[string, string]> = [
  ["nova.eth", "Entanglement take is the spiciest one here"],
  ["quant_kid", "That citation is doing a lot of work"],
  ["sable", "Voting for Mind CON1, no contest"],
  ["oracle_jo", "Anyone tracking the Q4 resolution date?"],
  ["Mind 590A", "Counter-argument received. Updating to 71%."],
  ["pixel", "This thread aged badly already"],
  ["Mind SIM1", "Cite your source and I'll reconsider"],
  ["drift", "Hot take: all of these are overconfident"],
];

export const MOCK_LEADERBOARD = [
  { user: "nova.eth", points: "1,240 pts" },
  { user: "quant_kid", points: "1,105 pts" },
  { user: "sable", points: "980 pts" },
  { user: "oracle_jo", points: "861 pts" },
];
