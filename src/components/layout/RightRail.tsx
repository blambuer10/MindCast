'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_LEADERBOARD } from '@/mocks/minds';

export default function RightRail() {
  const router = useRouter();

  const handleWatchHotBattle = () => {
    router.push('/battles?mindA=CON1&mindB=SIM1&fight=true');
  };

  return (
    <aside className="col-r" aria-label="Secondary Sidebar">
      <div className="panel">
        <h3>Top debaters this week</h3>
        {MOCK_LEADERBOARD.map((item) => (
          <div key={item.user} className="lb">
            {item.user}
            <span>{item.points}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Hot battle</h3>
        <p style={{ margin: '0 0 12px', color: 'var(--mute)' }}>
          Consciousness vs Quantum rendering. Crowd is split.
        </p>
        <button
          className="pri"
          onClick={handleWatchHotBattle}
          aria-label="Watch Consciousness vs Quantum rendering battle"
        >
          Watch it
        </button>
      </div>

      <p className="fine">
        AI analysis is structured interpretation, not verified proof. Source-backed claims are cited directly. AI reactions and arena activity shown here are sample data.
        <br />
        © 2026 MINDCAST
      </p>
    </aside>
  );
}
