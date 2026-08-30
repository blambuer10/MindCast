'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrackRecord {
  predictionAccuracy: number;
  calibrationScore: number;
  evidenceQuality: number;
  debatePerformance: number;
  mindSuccessRate: number;
  totalFollowers: number;
}

interface MindEntry {
  ideaId: string;
  agentId: string | null;
  content: string;
  thesis: string | null;
  ideaStatus: string;
  confidence: number;
  credibility: number;
  predictionAccuracy: number;
  lifecycleStatus: string;
  estimatedValue: number;
  creatorAllocation: number;
  evidenceCount: number;
  argumentCount: number;
  debateCount: number;
  followerCount: number;
  predictionCount: number;
  correctPredictions: number;
  createdAt: string;
  momentum: number;
}

interface PortfolioEntry {
  mindId: string;
  thesis: string;
  allocationPercentage: number;
  allocationStatus: string;
  confidence: number;
  credibility: number;
  estimatedValue: number;
  lifecycleStatus: string;
  createdAt: string;
}

interface PaymentEntry {
  id: string;
  ideaId: string;
  ideaContent: string | null;
  chain: string;
  txHash: string;
  amount: string;
  token: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
}

interface FollowEntry {
  ideaId: string;
  content: string;
  agentId: string | null;
  confidence: number;
  credibility: number;
  estimatedValue: number;
  lifecycleStatus: string;
  creatorWallet: string;
  followedAt: string;
}

interface ActivityEntry {
  type: string;
  eventType: string;
  content: string;
  source?: string;
  agentId?: string;
  thesis?: string;
  confidenceBefore?: number;
  confidenceAfter?: number;
  txHash?: string;
  chain?: string;
  createdAt: string;
}

interface ProfileData {
  exists: boolean;
  address: string;
  reputation: number;
  joinedAt?: string;
  trackRecord: TrackRecord;
  minds: MindEntry[];
  portfolio: PortfolioEntry[];
  payments: PaymentEntry[];
  following: FollowEntry[];
  activity: ActivityEntry[];
  stats: {
    totalMinds: number;
    trendingMinds: number;
    activeMinds: number;
    provenMinds: number;
    totalPortfolioValue: number;
  };
}

type ProfileTab = 'overview' | 'minds' | 'transactions' | 'following' | 'activity';

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const shortAddr = address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/creators/${address}/activity`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [address]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-container" style={{ maxWidth: '860px' }}>
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-4)' }}></div>
            Loading creator profile...
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="page-container" style={{ maxWidth: '860px' }}>
          <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
            <h3 className="empty-state-title">Profile not found</h3>
            <p className="empty-state-text">No creator found for this address.</p>
          </div>
        </main>
      </>
    );
  }

  const rep = profile.reputation;

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '860px' }}>

        {/* ─── Creator Identity ───────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)' }}>
            {/* Avatar */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, hsl(${(rep * 2.4) % 360}, 60%, 45%), hsl(${((rep * 2.4) + 60) % 360}, 50%, 35%))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.9)',
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.1)',
            }}>
              {address.slice(2, 4).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--parchment)',
                }}>
                  @{address.slice(2, 8).toLowerCase()}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted)',
                }}>
                  {shortAddr}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
                {/* Reputation Badge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '10px',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '1.5px',
                    color: 'var(--muted)',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}>
                    Creator Reputation
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 800,
                    color: rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--accent)' : 'var(--muted)',
                    lineHeight: 1,
                  }}>
                    {rep}
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--parchment)' }}>
                      {profile.stats.totalMinds}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Minds</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--signal)' }}>
                      {profile.stats.trendingMinds}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Trending</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success)' }}>
                      {profile.stats.activeMinds}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Active</div>
                  </div>
                </div>
              </div>

              {profile.joinedAt && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 'var(--space-3)' }}>
                  Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Navigation Tabs ─────────────────────────────────────── */}
        <div className="feed-tabs" style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)' }}>
          {([
            { key: 'overview', label: 'Track Record' },
            { key: 'minds', label: `My Minds (${profile.stats.totalMinds})` },
            { key: 'transactions', label: `Transactions (${profile.payments.length})` },
            { key: 'following', label: `Following (${profile.following.length})` },
            { key: 'activity', label: `Activity (${profile.activity.length})` },
          ] as { key: ProfileTab; label: string }[]).map(t => (
            <button
              key={t.key}
              className={`feed-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: TRACK RECORD (Overview)                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Ideas with Confidence Bars */}
            {profile.minds.filter(m => m.ideaStatus === 'PUBLISHED').length > 0 && (
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <h3 style={{
                  fontSize: '10px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1.5px',
                  color: 'var(--muted)',
                  marginBottom: 'var(--space-5)',
                  fontWeight: 600,
                }}>
                  Ideas
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {profile.minds.filter(m => m.ideaStatus === 'PUBLISHED').map(m => (
                    <Link
                      key={m.ideaId}
                      href={`/idea/${m.ideaId}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--parchment)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: '6px',
                          }}>
                            {m.content}
                          </div>
                          {/* Confidence Bar */}
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${m.confidence}%`,
                              height: '100%',
                              background: m.confidence >= 70
                                ? 'var(--success)'
                                : m.confidence >= 40
                                  ? 'var(--accent)'
                                  : 'var(--error)',
                              borderRadius: '3px',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-lg)',
                          fontWeight: 700,
                          color: m.confidence >= 70
                            ? 'var(--success)'
                            : m.confidence >= 40
                              ? 'var(--accent)'
                              : 'var(--muted)',
                          minWidth: '40px',
                          textAlign: 'right',
                        }}>
                          {m.confidence}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Creator Track Record */}
            <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
              <h3 style={{
                fontSize: '10px',
                textTransform: 'uppercase' as const,
                letterSpacing: '1.5px',
                color: 'var(--muted)',
                marginBottom: 'var(--space-5)',
                fontWeight: 600,
              }}>
                Creator Track Record
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <TrackRecordRow label="Prediction Accuracy" value={`${profile.trackRecord.predictionAccuracy}%`} score={profile.trackRecord.predictionAccuracy} />
                <TrackRecordRow label="Calibration" value={String(profile.trackRecord.calibrationScore)} score={profile.trackRecord.calibrationScore} />
                <TrackRecordRow label="Evidence Quality" value={String(profile.trackRecord.evidenceQuality)} score={profile.trackRecord.evidenceQuality} />
                <TrackRecordRow label="Debate Performance" value={String(profile.trackRecord.debatePerformance)} score={profile.trackRecord.debatePerformance} />
                <TrackRecordRow label="Mind Success Rate" value={`${profile.trackRecord.mindSuccessRate}%`} score={profile.trackRecord.mindSuccessRate} />
                <TrackRecordRow
                  label="Followers"
                  value={profile.trackRecord.totalFollowers >= 1000
                    ? `${(profile.trackRecord.totalFollowers / 1000).toFixed(1)}K`
                    : String(profile.trackRecord.totalFollowers)
                  }
                  score={Math.min(100, profile.trackRecord.totalFollowers * 5)}
                />
              </div>
            </div>

            {/* Portfolio Summary */}
            {(profile.portfolio.length > 0 || profile.minds.some(m => m.agentId)) && (
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <h3 style={{
                  fontSize: '10px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1.5px',
                  color: 'var(--muted)',
                  marginBottom: 'var(--space-5)',
                  fontWeight: 600,
                }}>
                  Portfolio
                </h3>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 800,
                  color: 'var(--success)',
                  marginBottom: 'var(--space-4)',
                }}>
                  ${profile.stats.totalPortfolioValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 'var(--space-4)' }}>
                  Total Value
                </div>

                {profile.minds.filter(m => m.agentId).slice(0, 5).map(m => (
                  <div key={m.ideaId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--violet)',
                        fontWeight: 600,
                      }}>
                        {m.agentId?.slice(0, 9) || 'MIND-????'}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--parchment)',
                      }}>
                        {m.creatorAllocation}%
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--success)',
                      fontWeight: 600,
                    }}>
                      ${Math.round(m.estimatedValue * m.creatorAllocation / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: MY MINDS                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'minds' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {profile.minds.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <h3 className="empty-state-title">No Minds yet.</h3>
                <p className="empty-state-text">Cast your first idea to create a Mind.</p>
                <Link href="/#cast" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Cast an Idea</Link>
              </div>
            ) : (
              profile.minds.map(m => (
                <Link key={m.ideaId} href={`/idea/${m.ideaId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card card-interactive" style={{
                    padding: 'var(--space-5)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--violet)',
                        fontWeight: 600,
                      }}>
                        {m.agentId || 'MIND-????'}
                      </span>
                      <span className="badge" style={{
                        background: m.ideaStatus === 'PUBLISHED' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                        color: m.ideaStatus === 'PUBLISHED' ? 'var(--success)' : 'var(--muted)',
                        fontSize: '10px',
                      }}>
                        {m.lifecycleStatus || m.ideaStatus}
                      </span>
                    </div>

                    <p style={{
                      color: 'var(--parchment)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: 'var(--space-4)',
                      lineHeight: 1.5,
                    }}>
                      &ldquo;{m.content}&rdquo;
                    </p>

                    {/* Mind Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <MetricCell label="Confidence" value={`${m.confidence}%`} color={m.confidence >= 70 ? 'var(--success)' : m.confidence >= 40 ? 'var(--accent)' : 'var(--muted)'} />
                      <MetricCell label="Credibility" value={String(m.credibility)} color="var(--parchment)" />
                      <MetricCell label="Momentum" value={String(m.momentum)} color="var(--signal)" />
                      <MetricCell label="Value" value={`$${Math.round(m.estimatedValue).toLocaleString()}`} color="var(--success)" />
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: 'var(--space-4)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--muted)',
                    }}>
                      <span>{m.evidenceCount} evidence</span>
                      <span>·</span>
                      <span>{m.argumentCount} arguments</span>
                      <span>·</span>
                      <span>{m.debateCount} debates</span>
                      <span>·</span>
                      <span>{m.followerCount} followers</span>
                      <span>·</span>
                      <span>Shares: {m.creatorAllocation}%</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: TRANSACTIONS                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <div className="animate-fade-in">
            {profile.payments.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <h3 className="empty-state-title">No transactions yet.</h3>
                <p className="empty-state-text">Publish a Mind to make your first on-chain transaction.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--parchment)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Amount</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Network</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Transaction</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Mind</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.payments.map(p => {
                        const scanBase = p.chain === 'base' ? 'https://basescan.org' : 'https://sepolia.basescan.org';
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                              <span className="badge" style={{
                                background: p.status === 'CONFIRMED' ? 'rgba(74,222,128,0.15)' : 'rgba(234,179,8,0.15)',
                                color: p.status === 'CONFIRMED' ? 'var(--success)' : 'var(--accent)',
                                fontSize: '10px',
                              }}>
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--parchment)', fontFamily: 'var(--font-mono)' }}>
                              {p.amount} {p.token}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)' }}>
                              {p.chain === 'base' ? 'Base Mainnet' : 'Base Sepolia'}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                              {p.txHash ? (
                                <a
                                  href={`${scanBase}/tx/${p.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--signal)', textDecoration: 'none' }}
                                >
                                  {p.txHash.slice(0, 10)}...{p.txHash.slice(-6)} ↗
                                </a>
                              ) : (
                                <span style={{ color: 'var(--muted)' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                              {p.ideaId && (
                                <Link href={`/idea/${p.ideaId}`} style={{ color: 'var(--signal)', textDecoration: 'none', fontSize: '11px' }}>
                                  View Mind →
                                </Link>
                              )}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)' }}>
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: FOLLOWING                                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'following' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {profile.following.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <h3 className="empty-state-title">Not following any Minds yet.</h3>
                <p className="empty-state-text">Explore the Noosphere and follow Minds that resonate with you.</p>
                <Link href="/explore" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Explore Minds</Link>
              </div>
            ) : (
              profile.following.map(f => (
                <Link key={f.ideaId} href={`/idea/${f.ideaId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card card-interactive" style={{
                    padding: 'var(--space-4)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--violet)', fontWeight: 600 }}>
                            {f.agentId || 'MIND-????'}
                          </span>
                          <span className="badge" style={{
                            fontSize: '9px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--muted)',
                          }}>
                            {f.lifecycleStatus}
                          </span>
                        </div>
                        <p style={{ color: 'var(--parchment)', fontSize: 'var(--text-sm)', margin: 0 }}>
                          &ldquo;{f.content}&rdquo;
                        </p>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 'var(--space-2)' }}>
                          by {f.creatorWallet ? `${f.creatorWallet.slice(0, 6)}...${f.creatorWallet.slice(-4)}` : 'Unknown'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '70px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: f.confidence >= 70 ? 'var(--success)' : 'var(--accent)' }}>
                          {f.confidence}%
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase' as const }}>Confidence</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: ACTIVITY TIMELINE                                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <div className="animate-fade-in">
            {profile.activity.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <h3 className="empty-state-title">No activity yet.</h3>
                <p className="empty-state-text">Activity will appear here as your Minds gather evidence and evolve.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {profile.activity.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'rgba(255,255,255,0.01)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    {/* Event Icon */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: getEventColor(a.eventType),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}>
                      {getEventIcon(a.eventType)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span className="badge" style={{
                          fontSize: '9px',
                          background: 'rgba(56,189,248,0.1)',
                          color: 'var(--signal)',
                        }}>
                          {a.eventType}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {formatTimeAgo(a.createdAt)}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--parchment)',
                        margin: 0,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                      }}>
                        {a.content}
                      </p>
                      {a.confidenceBefore != null && a.confidenceAfter != null && (
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          Confidence: {Math.round(a.confidenceBefore)}% → {Math.round(a.confidenceAfter)}%
                          <span style={{
                            color: a.confidenceAfter > a.confidenceBefore ? 'var(--success)' : 'var(--error)',
                            marginLeft: '6px',
                          }}>
                            {a.confidenceAfter > a.confidenceBefore ? '▲' : '▼'}
                            {Math.abs(Math.round(a.confidenceAfter - a.confidenceBefore))}
                          </span>
                        </div>
                      )}
                      {a.txHash && (
                        <a
                          href={`${a.chain === 'base' ? 'https://basescan.org' : 'https://sepolia.basescan.org'}/tx/${a.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '10px', color: 'var(--signal)', textDecoration: 'none', marginTop: '4px', display: 'inline-block' }}
                        >
                          View on BaseScan ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────

function TrackRecordRow({ label, value, score }: { label: string; value: string; score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', minWidth: '160px' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, score)}%`,
          height: '100%',
          background: score >= 70
            ? 'var(--success)'
            : score >= 40
              ? 'var(--accent)'
              : 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        color: score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--accent)' : 'var(--muted)',
        minWidth: '50px',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEventIcon(type: string): string {
  const map: Record<string, string> = {
    EVIDENCE_FOUND: '🔍',
    EVIDENCE_ANALYZED: '📊',
    CONFIDENCE_UPDATED: '📈',
    PREDICTION_MADE: '🎯',
    DEBATE_STARTED: '⚔️',
    DEBATE_COMPLETED: '🏆',
    THESIS_REFINED: '✨',
    PAYMENT_CONFIRMED: '✅',
    PAYMENT_PENDING: '⏳',
    MIND_BORN: '🧠',
    LIFECYCLE_TRANSITION: '🔄',
  };
  return map[type] || '📋';
}

function getEventColor(type: string): string {
  const map: Record<string, string> = {
    EVIDENCE_FOUND: 'rgba(56,189,248,0.15)',
    EVIDENCE_ANALYZED: 'rgba(56,189,248,0.15)',
    CONFIDENCE_UPDATED: 'rgba(74,222,128,0.15)',
    PREDICTION_MADE: 'rgba(251,191,36,0.15)',
    DEBATE_STARTED: 'rgba(239,68,68,0.15)',
    DEBATE_COMPLETED: 'rgba(168,85,247,0.15)',
    THESIS_REFINED: 'rgba(168,85,247,0.15)',
    PAYMENT_CONFIRMED: 'rgba(74,222,128,0.15)',
    PAYMENT_PENDING: 'rgba(251,191,36,0.15)',
    MIND_BORN: 'rgba(56,189,248,0.15)',
    LIFECYCLE_TRANSITION: 'rgba(168,85,247,0.15)',
  };
  return map[type] || 'rgba(255,255,255,0.05)';
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
