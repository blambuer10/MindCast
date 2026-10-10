import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePanelAgreementScore,
  calculateBattleVerdict,
  calculateAverageConfidenceByNoosphere,
  getYearCounts,
  getNoosphereCounts,
  filterMinds,
  NOOSPHERES
} from './scoring.js';
import type { Mind } from '../types/mind.js';

const mockMinds: Mind[] = [
  {
    id: '590A',
    name: 'Mind 590A',
    handle: 'autonomous-capital',
    year: 2026,
    dateFormatted: 'Oct 2026',
    noosphere: 'Artificial Intelligence',
    status: 'Proven',
    claim: 'AI agents managing value',
    summary: 'Coordination summary',
    sourceTitle: 'Bloomberg Intelligence',
    sourceExcerpt: 'Autonomous agents DEX transactions',
    confidence: 88,
    confidenceHistory: [62, 48, 71, 88],
    citations: 2,
    arguments: 5,
    createdAt: '2026-10-01T00:00:00Z',
    stanceString: 'aaasas',
    panel: [
      { model: 'Claude', stance: 'agree', comment: 'Supported' },
      { model: 'GPT', stance: 'agree', comment: 'Supported' },
      { model: 'Gemini', stance: 'agree', comment: 'Supported' },
      { model: 'Grok', stance: 'split', comment: 'Uncertain' },
      { model: 'DeepSeek', stance: 'agree', comment: 'Supported' },
      { model: 'Llama', stance: 'split', comment: 'Uncertain' },
    ]
  },
  {
    id: 'SIM1',
    name: 'Mind SIM1',
    handle: 'substrate-rendering',
    year: 2026,
    dateFormatted: 'Sep 2026',
    noosphere: 'Simulation & Reality',
    status: 'Debating',
    claim: 'Quantum entanglement substrate',
    summary: 'Coordinate simulation',
    sourceTitle: 'Nature Physics 2025',
    sourceExcerpt: 'Algorithmic bounds',
    confidence: 62,
    confidenceHistory: [50, 58, 66, 62],
    citations: 4,
    arguments: 7,
    createdAt: '2026-09-01T00:00:00Z',
    stanceString: 'dsdsda',
    panel: [
      { model: 'Claude', stance: 'disagree', comment: 'Unsupported' },
      { model: 'GPT', stance: 'split', comment: 'Uncertain' },
      { model: 'Gemini', stance: 'disagree', comment: 'Unsupported' },
      { model: 'Grok', stance: 'split', comment: 'Uncertain' },
      { model: 'DeepSeek', stance: 'disagree', comment: 'Unsupported' },
      { model: 'Llama', stance: 'agree', comment: 'Supported' },
    ]
  },
  {
    id: 'SCI1',
    name: 'Mind SCI1',
    handle: 'horizon-entropy',
    year: 2025,
    dateFormatted: 'Dec 2025',
    noosphere: 'Science & Physics',
    status: 'Exploring',
    claim: 'Dark energy acceleration',
    summary: 'Cosmological constant',
    sourceTitle: 'Physical Review Letters',
    sourceExcerpt: 'Holographic dark energy',
    confidence: null,
    confidenceHistory: [],
    citations: 1,
    arguments: 2,
    createdAt: '2025-12-01T00:00:00Z',
    stanceString: 'sasdss',
    panel: []
  }
];

describe('Scoring & Calculation Helpers', () => {
  test('calculatePanelAgreementScore handles stance string and panel array', () => {
    // aaasas = 1 + 1 + 1 + 0.5 + 1 + 0.5 = 5.0 / 6 = 0.8333...
    const scoreA = calculatePanelAgreementScore('aaasas');
    assert.equal(Math.round(scoreA * 100), 83);

    // dsdsda = 0 + 0.5 + 0 + 0.5 + 0 + 1 = 2.0 / 6 = 0.3333...
    const scoreB = calculatePanelAgreementScore(mockMinds[1]);
    assert.equal(Math.round(scoreB * 100), 33);
  });

  test('calculateBattleVerdict compares AI stances between two minds', () => {
    // Mind 590A: aaasas -> [1, 1, 1, 0.5, 1, 0.5]
    // Mind SIM1: dsdsda -> [0, 0.5, 0, 0.5, 0, 1]
    // Model 0 (Claude): 1 > 0 -> A wins
    // Model 1 (GPT): 1 > 0.5 -> A wins
    // Model 2 (Gemini): 1 > 0 -> A wins
    // Model 3 (Grok): 0.5 == 0.5 -> tie
    // Model 4 (DeepSeek): 1 > 0 -> A wins
    // Model 5 (Llama): 0.5 < 1 -> B wins
    // Expected: winsA = 4, winsB = 1, ties = 1
    const verdict = calculateBattleVerdict(mockMinds[0], mockMinds[1]);
    assert.equal(verdict.winsA, 4);
    assert.equal(verdict.winsB, 1);
    assert.equal(verdict.ties, 1);
    assert.equal(verdict.breakdown.length, 6);
  });

  test('calculateAverageConfidenceByNoosphere ignores null confidence values', () => {
    const stats = calculateAverageConfidenceByNoosphere(mockMinds);
    assert.equal(stats.length, NOOSPHERES.length);

    const aiStat = stats.find(s => s.name === 'Artificial Intelligence');
    assert.equal(aiStat?.averageConfidence, 88);
    assert.equal(aiStat?.count, 1);

    const scienceStat = stats.find(s => s.name === 'Science & Physics');
    assert.equal(scienceStat?.averageConfidence, null);
    assert.equal(scienceStat?.count, 0);
  });

  test('getYearCounts and getNoosphereCounts tally properly', () => {
    const yrCounts = getYearCounts(mockMinds, [2026, 2025]);
    assert.equal(yrCounts[2026], 2);
    assert.equal(yrCounts[2025], 1);

    const noosCounts = getNoosphereCounts(mockMinds);
    assert.equal(noosCounts['Artificial Intelligence'], 1);
    assert.equal(noosCounts['Simulation & Reality'], 1);
    assert.equal(noosCounts['Economics & Society'], 0);
  });

  test('filterMinds filters accurately', () => {
    const filteredAI = filterMinds(mockMinds, { noosphere: 'Artificial Intelligence' });
    assert.equal(filteredAI.length, 1);
    assert.equal(filteredAI[0].id, '590A');

    const filtered2025 = filterMinds(mockMinds, { year: 2025 });
    assert.equal(filtered2025.length, 1);
    assert.equal(filtered2025[0].id, 'SCI1');

    const emptyFilter = filterMinds(mockMinds, { noosphere: 'Economics & Society' });
    assert.equal(emptyFilter.length, 0);
  });

  test('edge cases: empty arrays and boundary scores', () => {
    // Empty minds
    assert.deepEqual(filterMinds([], { year: 2026 }), []);
    assert.deepEqual(getNoosphereCounts([]), {
      'Artificial Intelligence': 0,
      'Simulation & Reality': 0,
      'Consciousness': 0,
      'Science & Physics': 0,
      'Economics & Society': 0
    });

    // 100% agreement
    const allAgree = calculatePanelAgreementScore('aaaaaa');
    assert.equal(allAgree, 1.0);

    // 0% agreement
    const allDisagree = calculatePanelAgreementScore('dddddd');
    assert.equal(allDisagree, 0.0);

    // Invalid or empty stance string defaults safely
    const emptyStance = calculatePanelAgreementScore('');
    assert.equal(emptyStance, 0);
  });
});
