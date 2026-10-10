'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import SegmentTabs from '@/components/ui/SegmentTabs';
import YearScrubber from '@/components/ui/YearScrubber';
import MindPost from '@/components/minds/MindPost';
import { listMinds } from '@/api/minds';
import { filterMinds } from '@/lib/scoring';
import type { Mind } from '@/types/mind';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minds, setMinds] = useState<Mind[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeText, setComposeText] = useState('');

  const selectedNoosphere = searchParams.get('noosphere');
  const yearParam = searchParams.get('year');
  const selectedYear = yearParam ? parseInt(yearParam, 10) : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await listMinds();
      setMinds(data);
      setLoading(false);
    }
    load();
  }, []);

  const updateFilters = (newNoos: string | null, newYr: number | null) => {
    const params = new URLSearchParams();
    if (newNoos) params.set('noosphere', newNoos);
    if (newYr) params.set('year', newYr.toString());
    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
  };

  const handleSelectNoosphere = (noos: string | null) => {
    updateFilters(noos, selectedYear);
  };

  const handleSelectYear = (yr: number | null) => {
    updateFilters(selectedNoosphere, yr);
  };

  const handleCreateMind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim() || composeText.length > 280) return;
    router.push(`/create?claim=${encodeURIComponent(composeText.trim())}`);
  };

  const filtered = filterMinds(minds, {
    noosphere: selectedNoosphere,
    year: selectedYear,
  });

  const charCount = composeText.length;
  const isOverLimit = charCount > 280;
  const isCreateDisabled = !composeText.trim() || isOverLimit;

  return (
    <>
      <div className="hero">
        <h2>Dig into the ideas.</h2>
        <p>Every idea is a Mind that gathers evidence, debates opponents and shows each change in position.</p>
      </div>

      <SegmentTabs
        minds={minds}
        selectedNoosphere={selectedNoosphere}
        onSelectNoosphere={handleSelectNoosphere}
      />

      <YearScrubber
        minds={minds}
        selectedYear={selectedYear}
        onSelectYear={handleSelectYear}
      />

      <form className="compose-box" onSubmit={handleCreateMind}>
        <textarea
          className="compose-input"
          placeholder="What's your idea?"
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          rows={2}
          maxLength={320}
          aria-label="What's your idea?"
        />
        <div className="compose-bottom">
          <span className={`compose-count ${isOverLimit ? 'warn' : ''}`}>
            {280 - charCount} characters left
          </span>
          <button
            type="submit"
            className="pri"
            disabled={isCreateDisabled}
          >
            Create a Mind
          </button>
        </div>
      </form>

      <div className="feed" role="feed" aria-label="Minds feed">
        {loading ? (
          <div className="empty">Loading Minds...</div>
        ) : filtered.length > 0 ? (
          filtered.map((mind) => <MindPost key={mind.id} mind={mind} />)
        ) : (
          <div className="empty">No Minds match.</div>
        )}
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <AppShell title="Home">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </AppShell>
  );
}
