'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import type { NoosphereTopic } from '@/lib/types';

function NoospheresContent() {
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
    <div className="pad">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px' }}>The Noospheres</h2>
        <p style={{ color: 'var(--mute)', fontSize: '14px', margin: 0 }}>
          Structured intellectual environments organized around unresolved questions.
        </p>
      </div>

      {loading ? (
        <div className="empty">Loading Noospheres...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {topics.map((t) => {
            const isFollowed = followedTopics[t.id] ?? false;
            return (
              <Panel key={t.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{t.icon || '⚡'}</span>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{t.name}</h3>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--mute)' }}>
                        <span>{t.mindsCount} Minds</span>
                        <span>·</span>
                        <span>{t.recentDebatesCount} Debates</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleFollow(t.id)}
                      className="ghost"
                      style={{ fontSize: '13px', padding: '6px 14px' }}
                    >
                      {isFollowed ? 'Following ✓' : 'Follow'}
                    </button>
                    <Link
                      href={`/?noosphere=${encodeURIComponent(t.name)}`}
                      className="pri"
                      style={{ fontSize: '13px', padding: '6px 14px' }}
                    >
                      Feed →
                    </Link>
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--mute)', margin: '12px 0 0', lineHeight: 1.5 }}>
                  {t.description}
                </p>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NoospheresPage() {
  return (
    <AppShell title="Noospheres">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <NoospheresContent />
      </Suspense>
    </AppShell>
  );
}
