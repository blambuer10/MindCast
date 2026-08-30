'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';
import type { IdeaWithMind } from '@/lib/types';

type Tab = 'trending' | 'recent' | 'debating' | 'my-minds';

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('trending');
  const [ideas, setIdeas] = useState<IdeaWithMind[]>([]);
  const [myIdeas, setMyIdeas] = useState<IdeaWithMind[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, address } = useWallet();

  const fetchIdeas = useCallback(async (selectedTab: Tab) => {
    setLoading(true);
    try {
      if (selectedTab === 'my-minds' && address) {
        // Fetch user's own ideas
        const res = await fetch(`/api/creators/${address}/ideas`);
        if (res.ok) {
          const data = await res.json();
          setMyIdeas(data.ideas || []);
        }
      } else {
        const apiTab = selectedTab === 'my-minds' ? 'trending' : selectedTab;
        const res = await fetch(`/api/ideas?tab=${apiTab}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setIdeas(data.ideas || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchIdeas(tab);
  }, [tab, fetchIdeas]);

  const displayIdeas = tab === 'my-minds' ? myIdeas : ideas;

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
          {isConnected && address && (
            <button
              className={`feed-tab ${tab === 'my-minds' ? 'active' : ''}`}
              onClick={() => setTab('my-minds')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--violet)',
                display: 'inline-block',
              }} />
              my minds
            </button>
          )}
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
        ) : displayIdeas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">·</div>
            <h3 className="empty-state-title">
              {tab === 'my-minds' ? 'You haven\'t created any Minds yet.' : 'The Noosphere awaits.'}
            </h3>
            <p className="empty-state-text">
              {tab === 'my-minds'
                ? 'Cast your first idea to create an autonomous Mind.'
                : 'No ideas have been cast yet. Be the first to set an idea free.'
              }
            </p>
            <Link href="/#cast" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Cast an Idea
            </Link>
          </div>
        ) : (
          <div className="feed-grid">
            {tab === 'my-minds'
              ? displayIdeas.map((idea: any) => (
                  <MyMindCard key={idea.id} idea={idea} />
                ))
              : displayIdeas.map((idea) => (
                  <MindCard key={idea.id} idea={idea} />
                ))
            }
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

// ─── MyMindCard Component (for "My Minds" tab) ──────────────────────────

function MyMindCard({ idea }: { idea: any }) {
  return (
    <Link href={`/idea/${idea.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="mind-card" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}>
        <div className="mind-card-header">
          <span className="mind-id" style={{ color: 'var(--violet)', fontWeight: 600 }}>
            {idea.agentId || 'MIND-????'}
          </span>
          <span className="badge" style={{
            background: idea.status === 'PUBLISHED' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
            color: idea.status === 'PUBLISHED' ? 'var(--success)' : 'var(--muted)',
            fontSize: '10px',
          }}>
            {idea.status}
          </span>
        </div>

        <p className="mind-card-title" style={{ marginTop: '12px', marginBottom: '16px', color: 'var(--ink)' }}>
          &ldquo;{idea.content}&rdquo;
        </p>

        <div className="mind-card-meta">
          <span>{idea.status}</span>
          <span>·</span>
          <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}

function shortenAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-3)}`;
}
