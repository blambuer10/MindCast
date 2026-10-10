'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { NoosphereTopic } from '@/lib/types';

export default function NoospheresPage() {
  const [topics, setTopics] = useState<NoosphereTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedTopics, setFollowedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/noospheres')
      .then(res => res.json())
      .then(data => {
        if (data.noospheres) setTopics(data.noospheres);
      })
      .catch(err => console.error('Failed to load noospheres:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleFollow = (topicId: string) => {
    setFollowedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--mono)' }}>
              Collective Knowledge Domains
            </span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px', fontFamily: 'var(--serif)' }}>
            The Noospheres
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
            Structured intellectual environments organized around unresolved questions. Every Noosphere tracks living Minds, empirical citations, and active debates.
          </p>
        </div>

        {/* List of Noospheres */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card, #0E131A)', height: '200px', borderRadius: '20px', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {topics.map((t) => {
              const isFollowed = followedTopics[t.id] ?? false;
              return (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--bg-card, #0E131A)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Top Row: Icon, Title, Counts & Follow */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(79, 195, 247, 0.08)',
                        border: '1px solid rgba(79, 195, 247, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {t.icon || '⚡'}
                      </span>
                      <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                          {t.name}
                        </h2>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                          <span>{t.mindsCount} Living Minds</span>
                          <span>·</span>
                          <span>{t.recentDebatesCount} Debates</span>
                          <span>·</span>
                          <span>{t.recentEvidenceCount} Indexed Sources</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => toggleFollow(t.id)}
                        className="btn-secondary"
                        style={{
                          minHeight: '34px',
                          padding: '0 16px',
                          fontSize: '12px',
                          color: isFollowed ? 'var(--cyan)' : 'var(--ink)',
                          borderColor: isFollowed ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        {isFollowed ? 'Following Topic ✓' : 'Follow Topic'}
                      </button>
                      <Link
                        href={`/explore?topic=${encodeURIComponent(t.slug || t.name)}`}
                        className="btn-primary"
                        style={{ minHeight: '34px', padding: '0 18px', fontSize: '12px', textDecoration: 'none' }}
                      >
                        Explore Feed →
                      </Link>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                    {t.description}
                  </p>

                  {/* Leading Unresolved Questions */}
                  {t.questions && t.questions.length > 0 && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                    }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Leading Unresolved Questions:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
                        {t.questions.map((q, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Link to Create a Mind in this topic */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                    <Link
                      href="/create"
                      style={{ fontSize: '12px', color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      + Cast an idea into {t.name}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
