'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/layout/Header';
import type { Debate, DebateMessage, Agent, Idea } from '@/lib/types';

const ROUND_NAMES: Record<number, string> = {
  1: 'Opening Arguments',
  2: 'Evidence',
  3: 'Counterargument',
  4: 'Rebuttal',
  5: 'Final Position',
};

interface DebateSide {
  agent: Agent;
  idea: Idea;
}

interface DebatePageData {
  debate: Debate;
  messages: DebateMessage[];
  sides: { a: DebateSide; b: DebateSide };
}

export default function DebatePage({ params }: { params: Promise<{ debateId: string }> }) {
  const { debateId } = use(params);
  const [data, setData] = useState<DebatePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = data ? `Check out this Mind debate on MINDCAST: "${data.sides.a.idea.content}" vs "${data.sides.b.idea.content}"` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchDebate() {
      try {
        const res = await fetch(`/api/debates/${debateId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch debate:', err);
      }
      setLoading(false);
    }
    fetchDebate();
  }, [debateId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-container">
          <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
            <div className="loading-text" style={{ justifyContent: 'center' }}>
              <span className="loading-dot"></span>
              Loading debate
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className="page-container">
          <div className="empty-state">
            <h3 className="empty-state-title">Debate not found.</h3>
          </div>
        </main>
      </>
    );
  }

  const { debate, messages, sides } = data;
  const isComplete = debate.status === 'COMPLETED';

  // Group messages by round
  const messagesByRound: Record<number, DebateMessage[]> = {};
  messages.forEach((m) => {
    if (!messagesByRound[m.round]) messagesByRound[m.round] = [];
    messagesByRound[m.round].push(m);
  });

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '1000px' }}>
        <div className="animate-fade-in">
          {/* Debate Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <span className="label" style={{ color: 'var(--signal)' }}>
              {isComplete ? 'DEBATE COMPLETE' : `ROUND ${debate.currentRound} — ${ROUND_NAMES[debate.currentRound] || ''}`}
            </span>
          </div>

          {/* Social Share Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-10)' }}>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share Debate
            </a>
            <button
              onClick={handleCopyLink}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>

          {/* VS Header */}
          <div className="debate-arena" style={{ marginBottom: 'var(--space-12)' }}>
            <div className="debate-side" style={{ textAlign: 'center' }}>
              <span className="mind-id">{sides.a.agent.id}</span>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontStyle: 'italic',
                margin: 'var(--space-4) 0',
                color: 'var(--parchment)',
              }}>
                &ldquo;{sides.a.idea.content}&rdquo;
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
                <span className="badge badge-signal">Confidence {sides.a.agent.confidence}%</span>
                <span className="badge">Credibility {sides.a.agent.credibility}</span>
              </div>
            </div>

            <div className="debate-vs">VS</div>

            <div className="debate-side" style={{ textAlign: 'center' }}>
              <span className="mind-id">{sides.b.agent.id}</span>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontStyle: 'italic',
                margin: 'var(--space-4) 0',
                color: 'var(--parchment)',
              }}>
                &ldquo;{sides.b.idea.content}&rdquo;
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
                <span className="badge badge-signal">Confidence {sides.b.agent.confidence}%</span>
                <span className="badge">Credibility {sides.b.agent.credibility}</span>
              </div>
            </div>
          </div>

          {/* Debate Rounds */}
          {[1, 2, 3, 4, 5].map((round) => {
            const roundMessages = messagesByRound[round] || [];
            if (roundMessages.length === 0 && round > debate.currentRound) return null;

            return (
              <div key={round} style={{ marginBottom: 'var(--space-10)' }}>
                <div className="debate-round-label">
                  ROUND {round} — {ROUND_NAMES[round]}
                </div>

                {roundMessages.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                    {roundMessages.map((msg) => (
                      <div key={msg.id} className="card" style={{
                        borderColor: msg.agentId === sides.a.agent.id
                          ? 'rgba(79,195,247,0.2)'
                          : 'rgba(239,83,80,0.2)',
                      }}>
                        <span className="mind-id" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
                          {msg.agentId}
                        </span>
                        <p style={{ color: 'var(--parchment)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <div className="loading-text" style={{ justifyContent: 'center' }}>
                      <span className="loading-dot"></span>
                      The Minds are thinking
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Debate Result */}
          {isComplete && (
            <div className="card card-elevated animate-slide-up" style={{
              textAlign: 'center',
              padding: 'var(--space-10)',
              border: '1px solid var(--signal-dim)',
            }}>
              <span className="label" style={{ color: 'var(--signal)', marginBottom: 'var(--space-4)', display: 'block' }}>
                DEBATE COMPLETE
              </span>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontStyle: 'italic',
                color: 'var(--slate)',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}>
                The debate surfaced stronger and weaker arguments, evidence, and unresolved questions.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
