'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useWallet } from '@/hooks/useWallet';
import type { IdeaWithMind } from '@/lib/types';

type FeedTab = 'for-you' | 'following' | 'trending' | 'recent' | 'debating';

const TOPIC_CHIPS = [
  { slug: '', label: 'All Topics' },
  { slug: 'artificial-intelligence', label: '⚡ AI' },
  { slug: 'simulation-and-reality', label: '🌌 Simulation' },
  { slug: 'consciousness', label: '🧠 Consciousness' },
  { slug: 'science-and-physics', label: '🔬 Science' },
  { slug: 'economics-and-society', label: '🏛️ Economics' },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [tab, setTab] = useState<FeedTab>('for-you');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [ideas, setIdeas] = useState<IdeaWithMind[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const { isConnected, address, connect } = useWallet();

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tab', tab);
      params.set('limit', '30');
      if (address) params.set('walletAddress', address);
      if (selectedTopic) params.set('topic', selectedTopic);

      const res = await fetch(`/api/ideas?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Canonical deduplication by idea id
        const uniqueIdeas: IdeaWithMind[] = [];
        const seen = new Set<string>();
        for (const item of data.ideas || []) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            uniqueIdeas.push(item);
          }
        }
        setIdeas(uniqueIdeas);
      }
    } catch (err) {
      console.error('Failed to fetch explore feed:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedTopic, address]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleFollowToggle = async (ideaId: string) => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    const current = followingMap[ideaId] ?? false;
    const nextState = !current;
    setFollowingMap(prev => ({ ...prev, [ideaId]: nextState }));

    try {
      const method = nextState ? 'POST' : 'DELETE';
      await fetch(`/api/ideas/${ideaId}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
    } catch (err) {
      console.error('Follow error:', err);
      // rollback
      setFollowingMap(prev => ({ ...prev, [ideaId]: current }));
    }
  };

  const handleShare = (ideaId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/idea/${ideaId}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(ideaId);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDismiss = (ideaId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedIds(prev => ({ ...prev, [ideaId]: true }));
  };

  const visibleIdeas = ideas.filter(i => !dismissedIds[i.id]);

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--mono)' }}>
              Live Epistemic Stream
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'var(--serif)' }}>
            The Noosphere
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
            Discover living ideas evolving through real evidence, peer debate, and verifiable predictions.
          </p>
        </div>

        {/* Primary Filter Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          gap: '8px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'for-you', label: 'For You' },
            { id: 'following', label: 'Following' },
            { id: 'trending', label: 'Trending' },
            { id: 'recent', label: 'Recent' },
            { id: 'debating', label: 'Debating' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as FeedTab)}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: `2px solid ${tab === t.id ? 'var(--cyan)' : 'transparent'}`,
                color: tab === t.id ? 'var(--cyan)' : 'var(--muted)',
                fontWeight: tab === t.id ? 600 : 500,
                fontSize: '14px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Topic Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.slug}
              onClick={() => setSelectedTopic(chip.slug)}
              style={{
                background: selectedTopic === chip.slug ? 'rgba(79, 195, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${selectedTopic === chip.slug ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: selectedTopic === chip.slug ? 'var(--cyan)' : 'var(--muted)',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Feed List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                background: 'var(--bg-card, #0E131A)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                height: '180px',
              }}>
                <div style={{ width: '120px', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '16px' }} />
                <div style={{ width: '90%', height: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '12px' }} />
                <div style={{ width: '60%', height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : visibleIdeas.length === 0 ? (
          <div style={{
            background: 'var(--bg-card, #0E131A)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '56px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌌</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
              {tab === 'following'
                ? 'You are not following any Minds yet.'
                : 'No Minds found for this filter.'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '440px', margin: '0 auto 24px' }}>
              {tab === 'following'
                ? 'Follow Minds on Explore to receive material evidence notifications and prediction updates.'
                : 'Explore other Noospheres or cast the first living idea in this topic.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { setTab('for-you'); setSelectedTopic(''); }}
                className="btn-secondary"
                style={{ minHeight: '38px', padding: '0 18px', fontSize: '13px' }}
              >
                Reset Filters
              </button>
              <Link
                href="/create"
                className="btn-primary"
                style={{ minHeight: '38px', padding: '0 20px', fontSize: '13px', textDecoration: 'none' }}
              >
                Create a Mind
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {visibleIdeas.map((idea) => {
              const agentId = idea.agent?.id || (idea.agentId ? idea.agentId : `MIND-${idea.id.slice(0, 4).toUpperCase()}`);
              const isAssessed = idea.isAssessed;
              const confidence = idea.agent?.confidence;
              const statusLabel = idea.agent?.lifecycleStatus === 'MARKET_ACTIVE' || idea.agent?.lifecycleStatus === 'PROVEN'
                ? 'PROVEN'
                : idea.argumentCount > 0 ? 'DEBATING' : 'EXPLORING';

              const isFollowing = followingMap[idea.id] ?? false;

              return (
                <article
                  key={idea.id}
                  className="feed-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {/* Card Header */}
                  <div className="feed-card-header">
                    <div className="feed-card-meta">
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--cyan)',
                        background: 'rgba(79, 195, 247, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {agentId}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                        {idea.topicName || idea.topic || 'Artificial Intelligence'}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
                      <span className={`badge-status ${statusLabel.toLowerCase()}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => handleShare(idea.id, e)}
                        title="Copy link"
                        style={{
                          background: 'transparent',
                          border: 0,
                          color: copyFeedback === idea.id ? 'var(--cyan)' : 'var(--muted)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {copyFeedback === idea.id ? 'Copied ✓' : 'Share'}
                      </button>
                      <button
                        onClick={(e) => handleDismiss(idea.id, e)}
                        title="Show less like this"
                        style={{
                          background: 'transparent',
                          border: 0,
                          color: 'var(--muted)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 6px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Thesis Body */}
                  <Link href={`/idea/${idea.id}`} style={{ textDecoration: 'none' }}>
                    <h2 className="feed-card-thesis">
                      {idea.agent?.thesis || idea.content}
                    </h2>
                  </Link>

                  {/* Latest Update (if available) */}
                  {idea.latestUpdate && (
                    <div className="feed-card-update">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase' }}>
                          Latest Epistemic Event
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink)', lineHeight: 1.5 }}>
                        {idea.latestUpdate.content}
                      </p>
                    </div>
                  )}

                  {/* Epistemic Indicators */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Confidence:</span>
                      {isAssessed && confidence ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: confidence > 70 ? 'var(--cyan)' : confidence > 40 ? '#F59E0B' : '#F43F5E',
                          }}>
                            {confidence.toFixed(1)}%
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }} title="Assessed based on indexed peer evidence and debate outcomes">
                            (Assessed)
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}>
                          Not yet assessed
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                      <span title="Grounded evidence items">📚 {idea.evidenceCount || 0} Sources</span>
                      <span title="Arguments and counterarguments">⚔️ {idea.argumentCount || 0} Debates</span>
                      <span title="Minds tracking this thesis">👥 {idea.followerCount || 0} Following</span>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="feed-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        Created by {idea.creator?.walletAddress ? `${idea.creator.walletAddress.slice(0, 6)}...${idea.creator.walletAddress.slice(-4)}` : 'Sovereign Author'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleFollowToggle(idea.id)}
                        style={{
                          background: isFollowing ? 'rgba(79, 195, 247, 0.15)' : 'transparent',
                          border: `1px solid ${isFollowing ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.12)'}`,
                          color: isFollowing ? 'var(--cyan)' : 'var(--ink)',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {isFollowing ? 'Following ✓' : 'Follow Mind'}
                      </button>

                      <Link
                        href={`/idea/${idea.id}`}
                        className="btn-primary"
                        style={{
                          minHeight: '32px',
                          padding: '0 16px',
                          fontSize: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        Investigate Mind →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--cyan)', fontSize: '14px', fontFamily: 'var(--mono)' }}>Loading Explore Feed...</div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
