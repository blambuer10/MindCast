import type { Mind, PanelReaction, Stance, NoosphereConfig, AIModelConfig, BattleVerdict, NoosphereStat } from '@/types/mind';

export const NOOSPHERES: NoosphereConfig[] = [
  { name: "Artificial Intelligence", shortName: "AI", color: "#F06292" },
  { name: "Simulation & Reality", shortName: "Simulation", color: "#4FA3E8" },
  { name: "Consciousness", shortName: "Consciousness", color: "#FF6B2C" },
  { name: "Science & Physics", shortName: "Science", color: "#4CC38A" },
  { name: "Economics & Society", shortName: "Economics", color: "#A66CFF" },
];

export const ALL_MINDS_TAB_COLOR = "#F5C518";

export const AI_MODELS: AIModelConfig[] = [
  { name: "Claude", color: "#E8956D", tag: "Careful", code: "Cl" },
  { name: "GPT", color: "#34C79A", tag: "Balanced", code: "GP" },
  { name: "Gemini", color: "#6AA4FF", tag: "Data-first", code: "Ge" },
  { name: "Grok", color: "#B0B7BF", tag: "Contrarian", code: "Gr" },
  { name: "DeepSeek", color: "#8591FF", tag: "Analytical", code: "De" },
  { name: "Llama", color: "#C99BFF", tag: "Open-minded", code: "Ll" },
];

export const STANCE_META: Record<Stance, { label: string; color: string; score: number; char: 'a' | 's' | 'd' }> = {
  agree: { label: "Agrees", color: "var(--proven)", score: 1, char: 'a' },
  split: { label: "Split", color: "var(--debate)", score: 0.5, char: 's' },
  disagree: { label: "Disagrees", color: "var(--bad)", score: 0, char: 'd' },
};

export const CHAR_TO_STANCE: Record<string, Stance> = {
  a: "agree",
  s: "split",
  d: "disagree",
};

export const STATUS_COLORS: Record<string, string> = {
  Proven: "var(--proven)",
  Debating: "var(--debate)",
  Exploring: "#8899A6",
};

/**
 * Calculates the agreement score across the AI panel (0.0 to 1.0).
 */
export function calculatePanelAgreementScore(input: Mind | PanelReaction[] | string): number {
  if (typeof input === 'string') {
    if (!input.length) return 0;
    const total = input.split('').reduce((sum, ch) => {
      const stance = CHAR_TO_STANCE[ch] || 'split';
      return sum + STANCE_META[stance].score;
    }, 0);
    return total / input.length;
  }

  if (Array.isArray(input)) {
    if (!input.length) return 0;
    const total = input.reduce((sum, r) => sum + STANCE_META[r.stance].score, 0);
    return total / input.length;
  }

  if (input.panel && input.panel.length > 0) {
    return calculatePanelAgreementScore(input.panel);
  }

  if (input.stanceString) {
    return calculatePanelAgreementScore(input.stanceString);
  }

  return 0;
}

/**
 * Computes AI verdict for a battle between two Minds.
 */
export function calculateBattleVerdict(mindA: Mind, mindB: Mind): BattleVerdict {
  let winsA = 0;
  let winsB = 0;
  let ties = 0;

  const breakdown = AI_MODELS.map((modelConfig, index) => {
    const stanceCharA = mindA.stanceString?.[index] || 's';
    const stanceCharB = mindB.stanceString?.[index] || 's';
    const stanceA = CHAR_TO_STANCE[stanceCharA] || 'split';
    const stanceB = CHAR_TO_STANCE[stanceCharB] || 'split';

    const scoreA = STANCE_META[stanceA].score;
    const scoreB = STANCE_META[stanceB].score;

    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (scoreA > scoreB) {
      winner = 'A';
      winsA++;
    } else if (scoreB > scoreA) {
      winner = 'B';
      winsB++;
    } else {
      ties++;
    }

    return {
      model: modelConfig.name,
      winner,
      stanceA,
      stanceB,
    };
  });

  return {
    winsA,
    winsB,
    ties,
    breakdown,
  };
}

/**
 * Computes average confidence by noosphere (ignoring null confidence values).
 */
export function calculateAverageConfidenceByNoosphere(minds: Mind[]): NoosphereStat[] {
  return NOOSPHERES.map(noosphere => {
    const matching = minds.filter(m => m.noosphere === noosphere.name && m.confidence !== null);
    const count = matching.length;
    if (count === 0) {
      return {
        name: noosphere.name,
        shortName: noosphere.shortName,
        color: noosphere.color,
        count: 0,
        averageConfidence: null,
      };
    }
    const total = matching.reduce((sum, m) => sum + (m.confidence || 0), 0);
    const avg = Math.round(total / count);
    return {
      name: noosphere.name,
      shortName: noosphere.shortName,
      color: noosphere.color,
      count,
      averageConfidence: avg,
    };
  });
}

/**
 * Computes counts per year for filtering.
 */
export function getYearCounts(minds: Mind[], years: number[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const yr of years) {
    counts[yr] = minds.filter(m => m.year === yr).length;
  }
  return counts;
}

/**
 * Computes counts per noosphere for filtering.
 */
export function getNoosphereCounts(minds: Mind[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const noos of NOOSPHERES) {
    counts[noos.name] = minds.filter(m => m.noosphere === noos.name).length;
  }
  return counts;
}

/**
 * Filters list of Minds by active noosphere and year filters.
 */
export function filterMinds(
  minds: Mind[],
  options: { noosphere?: string | null; year?: number | null }
): Mind[] {
  return minds.filter(mind => {
    if (options.noosphere && mind.noosphere !== options.noosphere) {
      return false;
    }
    if (options.year && mind.year !== options.year) {
      return false;
    }
    return true;
  });
}
