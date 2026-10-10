import React from 'react';

interface Segment {
  percentage: number;
  color: string;
}

interface StackedBarProps {
  label: string;
  segments?: Segment[];
  singleValue?: number | null;
  singleColor?: string;
  valueDisplay?: string | number;
}

export default function StackedBar({
  label,
  segments,
  singleValue,
  singleColor,
  valueDisplay,
}: StackedBarProps) {
  return (
    <div className="row">
      <span title={label}>{label}</span>
      <div className="stk">
        {segments ? (
          segments.map((seg, idx) => (
            <b
              key={idx}
              style={{
                width: `${seg.percentage}%`,
                background: seg.color,
              }}
            />
          ))
        ) : (
          <b
            style={{
              width: `${singleValue || 0}%`,
              background: singleColor || 'var(--accent)',
            }}
          />
        )}
      </div>
      {valueDisplay !== undefined && (
        <span style={{ width: '40px', textAlign: 'right', color: 'var(--ink)' }}>
          {valueDisplay || '–'}
        </span>
      )}
    </div>
  );
}
