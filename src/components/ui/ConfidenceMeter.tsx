import React from 'react';
import type { Status } from '@/types/mind';
import { STATUS_COLORS } from '@/lib/scoring';

interface ConfidenceMeterProps {
  confidence: number | null;
  status?: Status;
}

export default function ConfidenceMeter({ confidence, status = 'Proven' }: ConfidenceMeterProps) {
  if (confidence === null || confidence === undefined) {
    return <span>Not yet assessed</span>;
  }

  const color = STATUS_COLORS[status] || 'var(--proven)';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <div
        className="meter"
        style={{ ['--c' as any]: color }}
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${confidence}%`}
      >
        <b style={{ width: `${confidence}%` }} />
      </div>
      {confidence}%
    </span>
  );
}
