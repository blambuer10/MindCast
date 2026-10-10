'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Chips from '@/components/ui/Chips';
import Panel from '@/components/ui/Panel';
import LineChart from '@/components/ui/LineChart';
import StackedBar from '@/components/ui/StackedBar';
import { listMinds } from '@/api/minds';
import { calculateAverageConfidenceByNoosphere } from '@/lib/scoring';
import type { Mind } from '@/types/mind';

function ChartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minds, setMinds] = useState<Mind[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await listMinds();
      setMinds(data);
      setLoading(false);
    }
    load();
  }, []);

  const mindParam = searchParams.get('mind');
  const selectedMind = minds.find(m => m.id === mindParam) || minds[0];

  const handleSelectMind = (id: string) => {
    router.push(`/charts?mind=${id}`);
  };

  if (loading || !selectedMind) {
    return <div className="empty">Loading charts...</div>;
  }

  const noosphereStats = calculateAverageConfidenceByNoosphere(minds);

  return (
    <div className="pad">
      <Chips
        minds={minds}
        selectedId={selectedMind.id}
        onSelect={handleSelectMind}
      />

      <Panel title={`Confidence over time · ${selectedMind.name}`}>
        <LineChart history={selectedMind.confidenceHistory} />
      </Panel>

      <Panel title="How the AI panel reacted">
        {minds.map((m) => {
          const agrees = m.stanceString.split('a').length - 1;
          const splits = m.stanceString.split('s').length - 1;
          const disagrees = m.stanceString.split('d').length - 1;
          const total = m.stanceString.length || 6;

          const segments = [
            { percentage: (agrees / total) * 100, color: 'var(--proven)' },
            { percentage: (splits / total) * 100, color: 'var(--debate)' },
            { percentage: (disagrees / total) * 100, color: 'var(--bad)' },
          ];

          return (
            <StackedBar
              key={m.id}
              label={m.name}
              segments={segments}
            />
          );
        })}
        <p className="fine" style={{ marginTop: '12px' }}>
          Green agrees, amber split, red disagrees.
        </p>
      </Panel>

      <Panel title="Average confidence by noosphere">
        {noosphereStats.map((stat) => (
          <StackedBar
            key={stat.name}
            label={stat.shortName}
            singleValue={stat.averageConfidence}
            singleColor={stat.color}
            valueDisplay={stat.averageConfidence ?? '–'}
          />
        ))}
      </Panel>
    </div>
  );
}

export default function ChartsPage() {
  return (
    <AppShell title="Charts">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <ChartsContent />
      </Suspense>
    </AppShell>
  );
}
