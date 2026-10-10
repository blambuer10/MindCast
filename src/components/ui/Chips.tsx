import React from 'react';
import type { Mind } from '@/types/mind';

interface ChipsProps {
  minds: Mind[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function Chips({ minds, selectedId, onSelect }: ChipsProps) {
  return (
    <div className="chips" role="tablist" aria-label="Select Mind">
      {minds.map((mind) => {
        const isSelected = mind.id === selectedId;
        return (
          <button
            key={mind.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(mind.id)}
          >
            {mind.name}
          </button>
        );
      })}
    </div>
  );
}
