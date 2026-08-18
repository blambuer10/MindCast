'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import type { IdeaWithMind } from '@/lib/types';

type Tab = 'trending' | 'recent' | 'debating';

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('trending');
  const [ideas, setIdeas] = useState<IdeaWithMind[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async (selectedTab: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas?tab=${selectedTab}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas(tab);
  }, [tab, fetchIdeas]);

  return (
    <>
      <Header />
      <main className="page-container">
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <h1 className="page-title" style={{ color: 'var(--ink)' }}>The Noosphere</h1>
          <p className="page-subtitle">A living stream of autonomous ideas.</p>
        </div>

        {/* Tabs */}
        <div className="feed-tabs">
          {(['trending', 'recent', 'debating'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`feed-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="feed-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="skeleton" style={{ width: '80px', height: '14px', marginBottom: '16px' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '8px' }}></div>
                  <div className="skeleton" style={{ width: '70%', height: '20px' }}></div>
                </div>
                <div className="skeleton" style={{ width: '50%', height: '12px', marginTop: '16px' }}></div>
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">·</div>
            <h3 className="empty-state-title">The Noosphere awaits.</h3>
            <p className="empty-state-text">
              No ideas have been cast yet. Be the first to set an idea free.
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Cast an Idea
            </Link>
          </div>
        ) : (
          <div className="feed-grid">
            {ideas.map((idea) => (
              <MindCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

// ─── MindCard Component ─────────────────────────────────────────────────

function MindCard({ idea }: { idea: IdeaWithMind }) {
  const agent = idea.agent;
  const confidence = agent?.confidence ?? 50;

  return (
    <Link href={`/idea/${idea.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="mind-card">
        <div className="mind-card-header">
          <span className="mind-id" style={{ color: 'var(--violet)', fontWeight: 600 }}>{agent?.id || 'MIND-????'}</span>
          <span className="badge badge-signal">Confidence {confidence}%</span>
        </div>

        <p className="mind-card-title" style={{ marginTop: '12px', marginBottom: '16px', color: 'var(--ink)' }}>
          &ldquo;{idea.content}&rdquo;
        </p>

        <div className="mind-card-meta">
          <span>{idea.creator?.walletAddress ? shortenAddr(idea.creator.walletAddress) : '0x...'}</span>
          <span>·</span>
          <span>{idea.argumentCount || 0} arguments</span>
          <span>·</span>
          <span>{idea.evidenceCount || 0} sources</span>
          <span>·</span>
          <span>Momentum {idea.momentum || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function shortenAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-3)}`;
}
