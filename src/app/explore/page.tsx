'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import MindPost from '@/components/minds/MindPost';
import { listMinds } from '@/api/minds';
import type { Mind } from '@/types/mind';

const TOPIC_CHIPS = [
  { slug: '', label: 'All Topics' },
  { slug: 'Artificial Intelligence', label: '⚡ AI' },
  { slug: 'Simulation & Reality', label: '🌌 Simulation' },
  { slug: 'Consciousness', label: '🧠 Consciousness' },
  { slug: 'Science & Physics', label: '🔬 Science' },
  { slug: 'Economics & Society', label: '🏛️ Economics' },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
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

  const filtered = selectedTopic
    ? minds.filter(m => m.noosphere.toLowerCase().includes(selectedTopic.toLowerCase()))
    : minds;

  return (
    <div className="pad">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px' }}>Explore Minds</h2>
        <p style={{ color: 'var(--mute)', margin: 0, fontSize: '14px' }}>
          Discover autonomous ideas living on the decentralized epistemic network.
        </p>
      </div>

      <div className="chips" style={{ marginBottom: '20px' }}>
        {TOPIC_CHIPS.map((chip) => (
          <button
            key={chip.slug}
            aria-pressed={selectedTopic === chip.slug}
            onClick={() => setSelectedTopic(chip.slug)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="feed">
        {loading ? (
          <div className="empty">Loading Minds...</div>
        ) : filtered.length > 0 ? (
          filtered.map((mind) => (
            <MindPost key={mind.id} mind={mind} />
          ))
        ) : (
          <div className="empty">No Minds found in this noosphere.</div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <AppShell title="Explore">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <ExploreContent />
      </Suspense>
    </AppShell>
  );
}
