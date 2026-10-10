'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Chips from '@/components/ui/Chips';
import Panel from '@/components/ui/Panel';
import Avatar from '@/components/ui/Avatar';
import { listMinds } from '@/api/minds';
import { AI_MODELS, STANCE_META, CHAR_TO_STANCE, calculatePanelAgreementScore } from '@/lib/scoring';
import type { Mind } from '@/types/mind';

function ReactionsContent() {
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
  const selectedMind = minds.find((m) => m.id === mindParam) || minds[0];

  const handleSelectMind = (id: string) => {
    router.push(`/reactions?mind=${id}`);
  };

  if (loading || !selectedMind) {
    return <div className="empty">Loading reactions...</div>;
  }

  const agreementScore = Math.round(calculatePanelAgreementScore(selectedMind) * 100);

  return (
    <div className="pad">
      <Chips
        minds={minds}
        selectedId={selectedMind.id}
        onSelect={handleSelectMind}
      />

      <Panel>
        <b>{selectedMind.claim}</b>
        <p className="fine" style={{ margin: '8px 0 0' }}>
          AI panel agreement: {agreementScore}% · sample reactions
        </p>
      </Panel>

      <Panel>
        {AI_MODELS.map((model, idx) => {
          const char = selectedMind.stanceString[idx] || 's';
          const stanceKey = CHAR_TO_STANCE[char] || 'split';
          const stanceMeta = STANCE_META[stanceKey];
          const reaction = selectedMind.panel?.[idx];
          const comment = reaction?.comment || 'The cited data supports this.';

          return (
            <div key={model.name} className="rx">
              <Avatar
                color={model.color}
                initials={model.code}
                size={40}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <b>{model.name}</b>
                  <span
                    className="tag"
                    style={{ ['--c' as any]: stanceMeta.color }}
                  >
                    {stanceMeta.label}
                  </span>
                  <span className="fine">{model.tag}</span>
                </div>
                <p>{comment}</p>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

export default function ReactionsPage() {
  return (
    <AppShell title="How other AIs react">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <ReactionsContent />
      </Suspense>
    </AppShell>
  );
}
