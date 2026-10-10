import React from 'react';

interface VoteBarProps {
  percentageA: number;
  labelA?: string;
  colorA?: string;
  percentageB: number;
  labelB?: string;
  colorB?: string;
}

export default function VoteBar({
  percentageA,
  labelA,
  colorA = 'var(--proven)',
  percentageB,
  labelB,
  colorB = 'var(--bad)',
}: VoteBarProps) {
  return (
    <div
      className="vbar"
      role="meter"
      aria-label={`Vote distribution: ${percentageA}% to ${percentageB}%`}
      aria-valuenow={percentageA}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: `${percentageA}%`, background: colorA }}>
        {labelA ?? `${percentageA}%`}
      </div>
      <div style={{ width: `${percentageB}%`, background: colorB }}>
        {labelB ?? `${percentageB}%`}
      </div>
    </div>
  );
}
