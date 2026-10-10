import React from 'react';

interface LineChartProps {
  history: number[];
}

export default function LineChart({ history }: LineChartProps) {
  if (!history || history.length === 0) {
    return <p className="empty">Not yet assessed. No history to chart.</p>;
  }

  const labels = history.length === 4
    ? ["Launch", "Challenged", "New evidence", "Now"]
    : history.length === 3
    ? ["Launch", "Debate", "Now"]
    : history.map((_, idx) => `Point ${idx + 1}`);

  const step = history.length > 1 ? 500 / (history.length - 1) : 250;
  const points = history.map((val, idx) => {
    const x = history.length > 1 ? 30 + idx * step : 280;
    const y = 180 - val * 1.6;
    return { x, y, val, label: labels[idx] };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const gridValues = [0, 50, 100];

  return (
    <svg
      className="ch"
      viewBox="0 0 560 220"
      role="img"
      aria-label={`Confidence history chart: ${history.map((h, i) => `${labels[i]} ${h}%`).join(', ')}`}
    >
      {gridValues.map((v) => {
        const y = 180 - v * 1.6;
        return (
          <g key={v}>
            <line x1="20" x2="540" y1={y} y2={y} stroke="var(--line)" />
            <text x="0" y={y + 4} style={{ fill: 'var(--mute)', fontSize: '10px' }}>
              {v}
            </text>
          </g>
        );
      })}

      <polyline
        points={polylinePoints}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="5" fill="var(--accent)" />
          <text
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            style={{ fill: 'var(--ink)', fontSize: '12px', fontWeight: 700 }}
          >
            {p.val}%
          </text>
          <text
            x={p.x}
            y={208}
            textAnchor="middle"
            style={{ fill: 'var(--mute)', fontSize: '11px' }}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
