import React from 'react';
import { NOOSPHERES, ALL_MINDS_TAB_COLOR } from '@/lib/scoring';
import type { Mind } from '@/types/mind';

interface SegmentTabsProps {
  minds: Mind[];
  selectedNoosphere: string | null;
  onSelectNoosphere: (noosphere: string | null) => void;
}

export default function SegmentTabs({
  minds,
  selectedNoosphere,
  onSelectNoosphere,
}: SegmentTabsProps) {
  const allCount = minds.length;

  return (
    <div className="segs" role="region" aria-label="Category filters">
      <button
        className="seg"
        style={{ ['--c' as any]: ALL_MINDS_TAB_COLOR }}
        aria-pressed={selectedNoosphere === null}
        onClick={() => onSelectNoosphere(null)}
      >
        <b>{allCount}</b>
        <small>All Minds</small>
      </button>

      {NOOSPHERES.map((noos) => {
        const count = minds.filter((m) => m.noosphere === noos.name).length;
        const isSelected = selectedNoosphere === noos.name;

        return (
          <button
            key={noos.name}
            className="seg"
            style={{ ['--c' as any]: noos.color }}
            aria-pressed={isSelected}
            onClick={() => onSelectNoosphere(isSelected ? null : noos.name)}
          >
            <b>{count}</b>
            <small>{noos.shortName}</small>
          </button>
        );
      })}
    </div>
  );
}
