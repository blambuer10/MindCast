'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface Metrics {
  totalUsers: number;
  totalIdeas: number;
  publishedIdeas: number;
  flaggedIdeas: number;
  totalRevenue: number;
  totalDebates: number;
  activeDebates: number;
  dailyIdeas: number;
  dailyRevenue: number;
}

interface GraduationItem {
  id: string;
  thesis: string;
  currentStatus: string;
  credibility: number;
  predictionAccuracy: number;
  evidenceCount: number;
  debateCount: number;
  followerCount: number;
  eligible: boolean;
  reasons: string[];
}

interface IntelMetrics {
  totalEvents: number;
  totalTopics: number;
  totalSnapshots: number;
  totalSources: number;
  topDomains: any[];
  auditLogs: any[];
  signals: any[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'intelligence'>('metrics');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [graduationQueue, setGraduationQueue] = useState<GraduationItem[]>([]);
  const [intel, setIntel] = useState<IntelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [metricsRes, graduationRes, intelRes] = await Promise.all([
          fetch('/api/admin/metrics'),
          fetch('/api/admin/minds/graduation'),
          fetch('/api/admin/data-intelligence'),
        ]);
        if (metricsRes.ok) {
          setMetrics(await metricsRes.json());
        }
        if (graduationRes.ok) {
          const result = await graduationRes.json();
          setGraduationQueue(result.graduationQueue || []);
        }
        if (intelRes.ok) {
          setIntel(await intelRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
      setLoading(false);
    }
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-container">
          <div className="admin-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="admin-metric">
                <div className="skeleton" style={{ width: '60px', height: '40px', marginBottom: 'var(--space-2)' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '14px' }}></div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  const items = metrics ? [
    { label: 'Total Users', value: metrics.totalUsers },
    { label: 'Total Ideas', value: metrics.totalIdeas },
    { label: 'Published Ideas', value: metrics.publishedIdeas },
    { label: 'Flagged Ideas', value: metrics.flaggedIdeas },
    { label: 'Total Revenue', value: `$${metrics.totalRevenue.toFixed(2)}` },
    { label: 'Total Debates', value: metrics.totalDebates },
    { label: 'Active Debates', value: metrics.activeDebates },
    { label: 'Daily Ideas', value: metrics.dailyIdeas },
    { label: 'Daily Revenue', value: `$${metrics.dailyRevenue.toFixed(2)}` },
  ] : [];

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '900px' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-8)' }}>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform operations & data intelligence controls</p>
        </div>

        {/* Tab Selection */}
        <div className="feed-tabs" style={{ marginBottom: 'var(--space-8)' }}>
          <button
            className={`feed-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            Operational Metrics
          </button>
          <button
            className={`feed-tab ${activeTab === 'intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('intelligence')}
          >
            🪐 Data Intelligence Layer
          </button>
        </div>

        {activeTab === 'metrics' && (
          <>
            <div className="admin-grid" style={{ marginBottom: 'var(--space-10)' }}>
              {items.map((item) => (
                <div key={item.label} className="admin-metric animate-fade-in">
                  <div className="admin-metric-value">{item.value}</div>
                  <div className="admin-metric-label">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Graduation Queue */}
            <div style={{ marginTop: 'var(--space-12)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--parchment)', marginBottom: 'var(--space-6)' }}>
                🎓 Mind Graduation Queue
              </h2>
              <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Mind ID</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Thesis</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Credibility</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Accuracy</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Eligibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graduationQueue.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
                          No minds in incubation/proven state.
                        </td>
                      </tr>
                    ) : (
                      graduationQueue.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                            <Link href={`/idea/${item.id}`} style={{ color: 'var(--signal)', textDecoration: 'none' }}>
                              {item.id.slice(0, 13)}...
                            </Link>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--slate)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.thesis}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className="badge" style={{ background: 'var(--border)', color: 'var(--parchment)', fontSize: '10px' }}>
                              {item.currentStatus}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {item.credibility}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                            {Math.round(item.predictionAccuracy * 100)}%
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            {item.eligible ? (
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Eligible ✓</span>
                            ) : (
                              <div style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>
                                Not Eligible
                                {item.reasons && item.reasons.length > 0 && (
                                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                                    • {item.reasons.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'intelligence' && intel && (
          <div className="animate-fade-in">
            {/* Counts Grids */}
            <div className="admin-grid" style={{ marginBottom: 'var(--space-10)' }}>
              <div className="admin-metric">
                <div className="admin-metric-value" style={{ color: 'var(--signal)' }}>{intel.totalEvents}</div>
                <div className="admin-metric-label">Layer 1 Raw Events</div>
              </div>
              <div className="admin-metric">
                <div className="admin-metric-value">{intel.totalTopics}</div>
                <div className="admin-metric-label">Topics Taxonomy</div>
              </div>
              <div className="admin-metric">
                <div className="admin-metric-value">{intel.totalSnapshots}</div>
                <div className="admin-metric-label">Belief Time-Series</div>
              </div>
              <div className="admin-metric">
                <div className="admin-metric-value" style={{ color: 'var(--success)' }}>{intel.totalSources}</div>
                <div className="admin-metric-label">Citation Sources</div>
              </div>
            </div>

            {/* Middle Grid: Early Signals & Cited Sources */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
              
              {/* Early Signals */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', color: 'var(--parchment)', marginBottom: 'var(--space-4)' }}>
                  📡 Early Topic Signals
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {intel.signals.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No signals detected yet.</p>
                  ) : (
                    intel.signals.slice(0, 4).map((sig, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.01)', padding: 'var(--space-3)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--parchment)' }}>{sig.topic}</span>
                          <span className="badge font-mono" style={{ background: 'rgba(79,195,247,0.1)', color: 'var(--signal)', fontSize: '10px' }}>
                            Strength: {Math.round(sig.strength)}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', display: 'flex', gap: 'var(--space-3)' }}>
                          <span>Velocity: {sig.evidenceVelocity.toFixed(2)}/day</span>
                          <span>Converging Minds: {sig.convergingMindsCount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Citations domains */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', color: 'var(--parchment)', marginBottom: 'var(--space-4)' }}>
                  📰 Source Citations Network
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {intel.topDomains.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No domain citations logged.</p>
                  ) : (
                    intel.topDomains.map((dom, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 'var(--space-2)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--parchment)', fontSize: 'var(--text-xs)' }}>{dom.domain}</div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            Reliability: {Math.round(dom.average_reliability)}%
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                            {dom.citation_count} Citations
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--muted)' }}>
                            +{dom.supporting_count} / -{dom.opposing_count}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Data Access Audit Log */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', color: 'var(--parchment)', marginBottom: 'var(--space-4)' }}>
                🔒 Data Governance & Access Audit Logs
              </h3>
              <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Audited Role</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Dataset ID</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Purpose</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Action</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Timestamp</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intel.auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
                          No data access events logged.
                        </td>
                      </tr>
                    ) : (
                      intel.auditLogs.map((log, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{log.role}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{log.dataset_id}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--slate)' }}>{log.purpose}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{log.action}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: log.result === 'SUCCESS' ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                            {log.result}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
}
