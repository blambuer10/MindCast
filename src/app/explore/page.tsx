'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { MOCK_MINDS } from '@/mocks/minds';
import MindPost from '@/components/minds/MindPost';

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

  const filteredMocks = selectedTopic
    ? MOCK_MINDS.filter(m => m.noosphere.toLowerCase().includes(selectedTopic.toLowerCase()))
    : MOCK_MINDS;

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
        {filteredMocks.map((mind) => (
          <MindPost key={mind.id} mind={mind} />
        ))}
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
