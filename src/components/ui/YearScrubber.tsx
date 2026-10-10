import React from 'react';
import type { Mind } from '@/types/mind';

interface YearScrubberProps {
  minds: Mind[];
  years?: number[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
}

export default function YearScrubber({
  minds,
  years = [2026, 2025],
  selectedYear,
  onSelectYear,
}: YearScrubberProps) {
  return (
    <div className="yrs" role="region" aria-label="Year filters">
      <button
        aria-pressed={selectedYear === null}
        onClick={() => onSelectYear(null)}
      >
        All years
      </button>

      {years.map((year) => {
        const count = minds.filter((m) => m.year === year).length;
        const isSelected = selectedYear === year;

        return (
          <button
            key={year}
            aria-pressed={isSelected}
            onClick={() => onSelectYear(isSelected ? null : year)}
          >
            {year} <small>({count})</small>
          </button>
        );
      })}
    </div>
  );
}
