import React from 'react';
import { AI_MODELS, STANCE_META, CHAR_TO_STANCE } from '@/lib/scoring';
import type { PanelReaction } from '@/types/mind';

interface ReactionDotsProps {
  stanceString?: string;
  panel?: PanelReaction[];
}

export default function ReactionDots({ stanceString, panel }: ReactionDotsProps) {
  return (
    <span className="dots" title="AI reactions" aria-label="AI reactions">
      {AI_MODELS.map((model, idx) => {
        let stanceKey = 'split';
        if (panel && panel[idx]) {
          stanceKey = panel[idx].stance;
        } else if (stanceString && stanceString[idx]) {
          stanceKey = CHAR_TO_STANCE[stanceString[idx]] || 'split';
        }

        const color = STANCE_META[stanceKey as keyof typeof STANCE_META]?.color || 'var(--debate)';
        const letter = model.name[0];

        return (
          <i
            key={model.name}
            style={{ ['--c' as any]: color }}
            title={`${model.name}: ${stanceKey}`}
          >
            {letter}
          </i>
        );
      })}
    </span>
  );
}
