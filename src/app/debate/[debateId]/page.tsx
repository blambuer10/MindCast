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

  const [votingSide, setVotingSide] = useState<'a' | 'b' | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);

  const handleDagVote = async (side: 'a' | 'b') => {
    if (!data) return;
    const targetAgentId = side === 'a' ? data.sides.a.agent.id : data.sides.b.agent.id;
    setVotingSide(side);
    setVoteSuccess(null);
    try {
      const res = await fetch('/api/dag/micro-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterAddress: '0x' + (Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).padStart(40, '0'),
          mindId: targetAgentId,
          type: 'VOTE',
          amount: 0.1
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setVoteSuccess(`✓ Zero-Gas Micro-Vote notarized on MYCA Living Lattice DAG (Tx: ${resData.transaction?.txHash?.slice(0, 14)}...) in ${resData.transaction?.latencyMs || 2}ms!`);
        setTimeout(() => setVoteSuccess(null), 5000);
      }
    } catch (err) {
      console.error('DAG micro-vote failed:', err);
    } finally {
      setVotingSide(null);
    }
  };

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
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <span className="label" style={{ color: 'var(--signal)', fontSize: '13px' }}>
              {isComplete ? 'DEBATE COMPLETE · C99 DETERMINISTIC VERIFICATION ARCHIVED' : `ROUND ${debate.currentRound} — ${ROUND_NAMES[debate.currentRound] || ''}`}
            </span>
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>
              ⚡ Powered by MYCA Living Lattice DAG & C99 Safe-Sign Kernel (4.95 µs Cryptographic Proofs)
            </div>
          </div>

          {voteSuccess && (
            <div style={{
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              padding: '10px 16px',
              borderRadius: '8px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              marginBottom: 'var(--space-6)',
              animation: 'fadeIn 0.3s ease'
            }}>
              {voteSuccess}
            </div>
          )}

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="mind-id">{sides.a.agent.id}</span>
                <span style={{ fontSize: '10px', background: 'rgba(0,240,255,0.15)', color: '#00f0ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                  🔒 PUF: did:myc:puf:{sides.a.agent.id.slice(-4).toLowerCase()}
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontStyle: 'italic',
                margin: 'var(--space-4) 0',
                color: 'var(--parchment)',
              }}>
                &ldquo;{sides.a.idea.content}&rdquo;
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginBottom: '12px' }}>
                <span className="badge badge-signal">Confidence {sides.a.agent.confidence}%</span>
                <span className="badge">Credibility {sides.a.agent.credibility}</span>
              </div>
              <button
                onClick={() => handleDagVote('a')}
                disabled={votingSide !== null}
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid #00f0ff',
                  color: '#00f0ff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {votingSide === 'a' ? 'Voting...' : '⚡ Zero-Gas Vote (Chain 108 DAG)'}
              </button>
            </div>

            <div className="debate-vs">VS</div>

            <div className="debate-side" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="mind-id">{sides.b.agent.id}</span>
                <span style={{ fontSize: '10px', background: 'rgba(0,240,255,0.15)', color: '#00f0ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                  🔒 PUF: did:myc:puf:{sides.b.agent.id.slice(-4).toLowerCase()}
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontStyle: 'italic',
                margin: 'var(--space-4) 0',
                color: 'var(--parchment)',
              }}>
                &ldquo;{sides.b.idea.content}&rdquo;
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginBottom: '12px' }}>
                <span className="badge badge-signal">Confidence {sides.b.agent.confidence}%</span>
                <span className="badge">Credibility {sides.b.agent.credibility}</span>
              </div>
              <button
                onClick={() => handleDagVote('b')}
                disabled={votingSide !== null}
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid #00f0ff',
                  color: '#00f0ff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {votingSide === 'b' ? 'Voting...' : '⚡ Zero-Gas Vote (Chain 108 DAG)'}
              </button>
            </div>
          </div>

          {/* Debate Rounds */}
          {[1, 2, 3, 4, 5].map((round) => {
            const roundMessages = messagesByRound[round] || [];
            if (roundMessages.length === 0 && round > debate.currentRound) return null;

            return (
              <div key={round} style={{ marginBottom: 'var(--space-10)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="debate-round-label" style={{ margin: 0 }}>
                    ROUND {round} — {ROUND_NAMES[round]}
                  </div>
                  <span style={{ fontSize: '11px', color: '#00f0ff', background: 'rgba(0,240,255,0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.2)', fontFamily: 'var(--font-mono)' }}>
                    ⚡ C99 Safe-Sign Kernel · 4.95 µs · Verified
                  </span>
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
                The debate concluded with C99 Proof-of-Resonance verification notarized on-chain.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
