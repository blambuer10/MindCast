'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';

const AUTHORIZED_ADMIN_WALLET = '0x33f18d0bd613a2afa4694a8aaa6b1daf4febdbd2'.toLowerCase();

// ============================================================================
// Types
// ============================================================================
interface AnalyticsData {
  timestamp: string;
  overview: {
    totalUsers: number;
    totalMinds: number;
    totalStakes: number;
    totalPayments: number;
    totalRevenue: number;
    totalArguments: number;
    totalDebates: number;
    totalEvidence: number;
    avgReputation: number;
    activeMinds: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  revenueTimeline: Array<{ date: string; revenue: number; tx_count: number }>;
  stakesTimeline: Array<{ date: string; count: number; volume: number }>;
  reputationDistribution: Array<{ label: string; min: number; max: number; count: number; color: string }>;
  topUsers: Array<{
    id: string;
    wallet_address: string;
    username: string;
    display_name: string;
    avatar_url: string;
    reputation: number;
    created_at: string;
    minds_count: number;
    arguments_count: number;
    stakes_count: number;
    total_staked: number;
    payments_count: number;
  }>;
  mindsByStatus: Array<{ status: string; count: number; color: string }>;
  stakesBySide: { support: number; challenge: number };
  topMinds: Array<{
    id: string;
    thesis: string;
    status: string;
    created_at: string;
    creator_name: string;
    creator_wallet: string;
    credibility: number;
    prediction_accuracy: number;
    lifecycle_status: string;
    estimated_value: number;
    evidence_count: number;
    debate_count: number;
    follower_count: number;
    argument_count: number;
  }>;
  recentActivity: Array<{
    type: string;
    created_at: string;
    amount: number;
    side: string;
    token: string;
    username: string;
    wallet_address: string;
    context: string;
  }>;
  userActivityMap: Array<{
    username: string;
    display_name: string;
    reputation: number;
    minds: number;
    arguments: number;
    stakes: number;
    payments: number;
    follows: number;
  }>;
  paymentsByChain: Array<{ chain: string; count: number; volume: number }>;
}

// ============================================================================
// Mini SVG Chart Components (no external deps)
// ============================================================================

function MiniBarChart({ data, color = '#4ade80', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (!data.length) return <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(8, Math.min(24, (280 / data.length) - 2));
  const w = data.length * (barWidth + 4) + 20;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMinYMid meet">
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 30);
        return (
          <g key={i}>
            <rect
              x={10 + i * (barWidth + 4)}
              y={height - 20 - barH}
              width={barWidth}
              height={barH}
              rx={3}
              fill={color}
              opacity={0.85}
            >
              <title>{d.label}: {d.value}</title>
            </rect>
            {data.length <= 15 && (
              <text
                x={10 + i * (barWidth + 4) + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="8"
              >
                {d.label.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function AreaChart({ data, color = '#38bdf8', height = 140 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (!data.length) return <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 400;
  const pad = 10;
  const chartH = height - 30;

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = pad + chartH - (d.value / max) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad + chartH} L ${points[0].x} ${pad + chartH} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.8">
          <title>{p.label}: {p.value}</title>
        </circle>
      ))}
    </svg>
  );
}

function DonutChart({ segments, size = 140, label }: { segments: Array<{ label?: string; status?: string; value?: number; count?: number; color: string }>; size?: number; label?: string }) {
  const normSegments = (segments || []).map(seg => ({
    label: seg.label || seg.status || '',
    value: seg.value ?? seg.count ?? 0,
    color: seg.color,
  }));
  const total = normSegments.reduce((s, seg) => s + seg.value, 0);
  if (!total) return <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>No data</div>;

  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;
  const cx = size / 2;
  const cy = size / 2;
  let currentAngle = -90;

  const arcs = normSegments.map((seg) => {
    const angle = (seg.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const ix1 = cx + innerRadius * Math.cos(startRad);
    const iy1 = cy + innerRadius * Math.sin(startRad);
    const ix2 = cx + innerRadius * Math.cos(endRad);
    const iy2 = cy + innerRadius * Math.sin(endRad);

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    return { ...seg, path, percentage: ((seg.value / total) * 100).toFixed(1) };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc, i) => (
          <path key={i} d={arc.path} fill={arc.color} opacity="0.85" stroke="rgba(0,0,0,0.3)" strokeWidth="1">
            <title>{arc.label}: {arc.value} ({arc.percentage}%)</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--parchment)" fontSize="16" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--muted)" fontSize="9">{label || 'Total'}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {arcs.map((arc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: arc.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--parchment)' }}>{arc.label}</span>
            <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{arc.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapRow({ data, maxVal, color = '#4ade80' }: { data: number[]; maxVal: number; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {data.map((v, i) => {
        const opacity = maxVal > 0 ? Math.max(0.08, v / maxVal) : 0.08;
        return (
          <div
            key={i}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '3px',
              background: color,
              opacity,
              transition: 'opacity 0.2s',
            }}
            title={`${v}`}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Analytics Page
// ============================================================================
export default function AnalyticsPage() {
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet();
  const isAdmin = isConnected && !!address && address.toLowerCase() === AUTHORIZED_ADMIN_WALLET;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'minds' | 'activity'>('overview');
  const [lastRefreshed, setLastRefreshed] = useState('');

  async function fetchAnalytics() {
    if (!isAdmin || !address) return;
    try {
      const res = await fetch(`/api/admin/analytics?wallet=${address}&t=${Date.now()}`, {
        headers: { 'x-admin-wallet': address }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && address) {
      setLoading(true);
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 15000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setData(null);
    }
  }, [isAdmin, address]);

  // Derived chart data
  const userGrowthChart = useMemo(() => {
    if (!data?.userGrowth) return [];
    return data.userGrowth.map(d => ({ label: d.date, value: d.count }));
  }, [data?.userGrowth]);

  const revenueChart = useMemo(() => {
    if (!data?.revenueTimeline) return [];
    return data.revenueTimeline.map(d => ({ label: d.date, value: d.revenue }));
  }, [data?.revenueTimeline]);

  const stakesChart = useMemo(() => {
    if (!data?.stakesTimeline) return [];
    return data.stakesTimeline.map(d => ({ label: d.date, value: d.volume || d.count }));
  }, [data?.stakesTimeline]);

  const stakesSideDonut = useMemo(() => {
    if (!data?.stakesBySide) return [];
    return [
      { label: 'Support', value: data.stakesBySide.support, color: '#4ade80' },
      { label: 'Challenge', value: data.stakesBySide.challenge, color: '#f472b6' },
    ];
  }, [data?.stakesBySide]);

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-8)', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(15, 23, 42, 0.95) 100%)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '16px' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto var(--space-4)', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              🔒
            </div>
            
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--parchment)', marginBottom: 'var(--space-2)', fontFamily: 'var(--font-display)' }}>
              Restricted Analytics Portal
            </h1>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
              This analytics console is secured. Access is granted exclusively to the authorized administrator wallet.
            </p>

            {!isConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>⚡ Connect Admin Wallet</span>
                </button>
                <Link href="/" className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
                  Return to Home
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--error)' }}>
                  Connected: {address?.slice(0, 8)}...{address?.slice(-6)} (Unauthorized)
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    onClick={connect}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: 'var(--text-xs)' }}
                  >
                    Switch Wallet
                  </button>
                  <Link href="/" className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
                    Return to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>
                📊 Analytics Dashboard
              </h1>
              <span style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(168,85,247,0.2))',
                color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.3)',
                fontSize: '10px',
                padding: '3px 10px',
                borderRadius: '20px',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}>
                ● REAL-TIME
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
              Platform-wide user analytics, Mind performance, on-chain metrics, and ecosystem health monitoring.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/admin" style={{ color: 'var(--signal)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
              ← Command Center
            </Link>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              {lastRefreshed || '...'}
            </span>
            <button
              onClick={() => { setLoading(true); fetchAnalytics(); }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--parchment)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ── SECTION TABS ── */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: 'rgba(255,255,255,0.03)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          width: 'fit-content',
        }}>
          {[
            { key: 'overview', icon: '📈', label: 'Overview & Growth' },
            { key: 'users', icon: '👥', label: 'User Intelligence' },
            { key: 'minds', icon: '🧠', label: 'Mind Analytics' },
            { key: 'activity', icon: '⚡', label: 'Live Activity Feed' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeSection === tab.key
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(168,85,247,0.15))'
                  : 'transparent',
                color: activeSection === tab.key ? 'var(--parchment)' : 'var(--muted)',
                fontSize: '12px',
                fontWeight: activeSection === tab.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>📊</div>
            Loading analytics engine...
          </div>
        ) : null}

        {/* ================================================================= */}
        {/* SECTION 1: OVERVIEW & GROWTH                                       */}
        {/* ================================================================= */}
        {activeSection === 'overview' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Total Users', value: data.overview.totalUsers, icon: '👥', color: '#4ade80', delta: '+32' },
                { label: 'Active Minds', value: data.overview.activeMinds, icon: '🧠', color: '#38bdf8', delta: `/${data.overview.totalMinds}` },
                { label: 'Total Stakes', value: data.overview.totalStakes, icon: '🎯', color: '#a78bfa', delta: '' },
                { label: 'Protocol Revenue', value: `$${data.overview.totalRevenue.toFixed(2)}`, icon: '💰', color: '#f59e0b', delta: 'USDC' },
                { label: 'Arguments', value: data.overview.totalArguments, icon: '⚔️', color: '#f472b6', delta: '' },
                { label: 'Evidence Pieces', value: data.overview.totalEvidence, icon: '📋', color: '#14b8a6', delta: '' },
                { label: 'Avg Reputation', value: data.overview.avgReputation, icon: '⭐', color: '#eab308', delta: '/100' },
                { label: 'Debates', value: data.overview.totalDebates, icon: '🏟️', color: '#6366f1', delta: '' },
              ].map((kpi, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    fontSize: '48px',
                    opacity: 0.06,
                  }}>{kpi.icon}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 500 }}>{kpi.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color, fontFamily: 'var(--font-mono)' }}>
                    {kpi.value}
                  </div>
                  {kpi.delta && (
                    <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {kpi.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>

              {/* User Growth */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>User Growth</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>New registrations by day</p>
                  </div>
                  <span style={{ fontSize: '20px' }}>📈</span>
                </div>
                <MiniBarChart data={userGrowthChart} color="#4ade80" height={130} />
              </div>

              {/* Revenue */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Revenue Timeline</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>USDC inflow per day</p>
                  </div>
                  <span style={{ fontSize: '20px' }}>💰</span>
                </div>
                <AreaChart data={revenueChart} color="#f59e0b" height={130} />
              </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

              {/* Stakes Volume */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Stakes Volume</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>USDC staked per day</p>
                </div>
                <AreaChart data={stakesChart} color="#a78bfa" height={120} />
              </div>

              {/* Minds by Status */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Minds by Status</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>Lifecycle distribution</p>
                </div>
                <DonutChart segments={data.mindsByStatus} label="Minds" />
              </div>

              {/* Stakes Sentiment */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Stake Sentiment</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>Support vs Challenge ratio</p>
                </div>
                <DonutChart segments={stakesSideDonut} label="Stakes" size={120} />
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                      {data.stakesBySide.support}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Support</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#f472b6', fontFamily: 'var(--font-mono)' }}>
                      {data.stakesBySide.challenge}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Challenge</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reputation Distribution */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Reputation Distribution</h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>User reputation scores breakdown</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                {data.reputationDistribution.map((bucket, i) => {
                  const maxC = Math.max(...data.reputationDistribution.map(b => b.count), 1);
                  const h = (bucket.count / maxC) * 80;
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', color: 'var(--parchment)', fontWeight: 600, marginBottom: '4px' }}>{bucket.count}</div>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '50px',
                          height: `${h}px`,
                          background: bucket.color,
                          borderRadius: '4px 4px 0 0',
                          opacity: 0.85,
                          transition: 'height 0.5s ease',
                        }}
                        title={`${bucket.label}: ${bucket.count} users`}
                      />
                      <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>{bucket.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: USER INTELLIGENCE                                       */}
        {/* ================================================================= */}
        {activeSection === 'users' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

            {/* Top Users Leaderboard */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--parchment)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  🏆 Top Contributors Leaderboard
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                  Ranked by composite score: Minds ×10 + Arguments ×5 + Stakes ×3 + Payments ×8
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>User</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Wallet</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Rep</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Minds</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Arguments</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Stakes</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>Total Staked</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUsers.map((user, i) => {
                      const score = user.minds_count * 10 + user.arguments_count * 5 + user.stakes_count * 3 + user.payments_count * 8;
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                      return (
                        <tr key={user.id} style={{
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: i < 3 ? `rgba(${i === 0 ? '234,179,8' : i === 1 ? '148,163,184' : '205,127,50'},0.03)` : 'transparent',
                        }}>
                          <td style={{ padding: '10px 12px', fontSize: '14px' }}>{medal}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${['#4ade80', '#38bdf8', '#a78bfa', '#f472b6', '#f59e0b'][i % 5]}, transparent)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--parchment)',
                                overflow: 'hidden',
                              }}>
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  (user.username || '?')[0].toUpperCase()
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--parchment)' }}>
                                  {user.display_name || user.username || 'Anonymous'}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            <a
                              href={`https://basescan.org/address/${user.wallet_address}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--signal)', textDecoration: 'none' }}
                            >
                              {user.wallet_address?.slice(0, 6)}...{user.wallet_address?.slice(-4)} ↗
                            </a>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              background: user.reputation >= 95 ? 'rgba(6,182,212,0.15)' : user.reputation >= 90 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                              color: user.reputation >= 95 ? '#06b6d4' : user.reputation >= 90 ? '#4ade80' : 'var(--parchment)',
                            }}>
                              {user.reputation}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{user.minds_count}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{user.arguments_count}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{user.stakes_count}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
                            ${Number(user.total_staked || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(168,85,247,0.15))',
                              color: '#38bdf8',
                            }}>
                              {score}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Activity Heatmap */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--parchment)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  🗺️ User Activity Heatmap
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                  Intensity map across Minds, Arguments, Stakes, Payments, and Follows per user
                </p>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '10px', color: 'var(--muted)' }}>
                {['Minds', 'Arguments', 'Stakes', 'Payments', 'Follows'].map((label, i) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--muted)', fontWeight: 500, minWidth: '120px' }}>User</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>🧠</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>⚔️</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>🎯</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>💰</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>👁️</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted)', fontWeight: 500 }}>Rep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.userActivityMap.map((u, i) => {
                      const maxActivity = Math.max(
                        ...data.userActivityMap.map(x => Math.max(x.minds, x.arguments, x.stakes, x.payments, x.follows)),
                        1
                      );
                      const cellStyle = (val: number, color: string) => ({
                        padding: '6px 8px',
                        textAlign: 'center' as const,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: val > 0 ? color : 'rgba(255,255,255,0.1)',
                        background: val > 0 ? `${color}${Math.round(Math.min(0.3, (val / maxActivity) * 0.3) * 255).toString(16).padStart(2, '0')}` : 'transparent',
                      });

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '6px 8px', color: 'var(--parchment)', fontWeight: 500 }}>
                            @{u.username}
                          </td>
                          <td style={cellStyle(u.minds, '#4ade80')}>{u.minds}</td>
                          <td style={cellStyle(u.arguments, '#38bdf8')}>{u.arguments}</td>
                          <td style={cellStyle(u.stakes, '#a78bfa')}>{u.stakes}</td>
                          <td style={cellStyle(u.payments, '#f59e0b')}>{u.payments}</td>
                          <td style={cellStyle(u.follows, '#f472b6')}>{u.follows}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', color: u.reputation >= 95 ? '#06b6d4' : u.reputation >= 90 ? '#4ade80' : 'var(--muted)' }}>
                            {u.reputation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 3: MIND ANALYTICS                                          */}
        {/* ================================================================= */}
        {activeSection === 'minds' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

            {/* Top Performing Minds */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--parchment)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  🧠 Top Performing Minds
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                  Ranked by evidence, debates, followers, and argument count
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.topMinds.map((mind, i) => {
                  const totalActivity = mind.evidence_count + mind.debate_count + mind.follower_count + mind.argument_count;
                  const maxActivity = Math.max(...data.topMinds.map(m => m.evidence_count + m.debate_count + m.follower_count + m.argument_count), 1);
                  const barWidth = (totalActivity / maxActivity) * 100;

                  return (
                    <div
                      key={mind.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Progress bar background */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${barWidth}%`,
                        background: 'linear-gradient(90deg, rgba(56,189,248,0.06), rgba(168,85,247,0.03))',
                        transition: 'width 0.5s ease',
                      }} />

                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>#{i + 1}</span>
                            <span style={{ fontWeight: 600, color: 'var(--parchment)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {mind.thesis?.slice(0, 80)}{(mind.thesis?.length || 0) > 80 ? '...' : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: 'var(--muted)' }}>
                            <span>by @{mind.creator_name || 'unknown'}</span>
                            <span style={{ color: '#4ade80' }}>📋 {mind.evidence_count} evidence</span>
                            <span style={{ color: '#38bdf8' }}>🏟️ {mind.debate_count} debates</span>
                            <span style={{ color: '#a78bfa' }}>⚔️ {mind.argument_count} args</span>
                            <span style={{ color: '#f472b6' }}>👁️ {mind.follower_count} followers</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                          {mind.credibility && (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: 'rgba(74,222,128,0.1)',
                              color: '#4ade80',
                              fontFamily: 'var(--font-mono)',
                            }}>
                              Cred: {mind.credibility}
                            </span>
                          )}
                          <Link
                            href={`/idea/${mind.id}`}
                            style={{ color: 'var(--signal)', textDecoration: 'none', fontSize: '11px', fontWeight: 600 }}
                          >
                            Open ↗
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {data.topMinds.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    No minds created yet.
                  </div>
                )}
              </div>
            </div>

            {/* Minds Status + Payments by Chain */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Mind Lifecycle Overview</h3>
                <DonutChart segments={data.mindsByStatus} label="Minds" size={150} />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--parchment)', fontWeight: 600 }}>Payments by Chain</h3>
                {data.paymentsByChain.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.paymentsByChain.map((chain, i) => {
                      const maxVol = Math.max(...data.paymentsByChain.map(c => c.volume || 1));
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--parchment)', fontWeight: 500 }}>{chain.chain}</span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                              {chain.count} txns · ${Number(chain.volume || 0).toFixed(2)}
                            </span>
                          </div>
                          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }}>
                            <div style={{
                              height: '100%',
                              borderRadius: '3px',
                              width: `${((chain.volume || 0) / maxVol) * 100}%`,
                              background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>No payment data</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 4: LIVE ACTIVITY FEED                                      */}
        {/* ================================================================= */}
        {activeSection === 'activity' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--parchment)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    ⚡ Live Platform Activity
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                    Real-time feed of stakes, payments, arguments, and interactions
                  </p>
                </div>
                <span style={{
                  background: 'rgba(74,222,128,0.15)',
                  color: '#4ade80',
                  fontSize: '10px',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  animation: 'pulse 2s infinite',
                }}>
                  ● STREAMING
                </span>
              </div>

              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.recentActivity.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    No activity recorded yet.
                  </div>
                ) : (
                  data.recentActivity.map((activity, i) => {
                    const typeConfig: Record<string, { icon: string; color: string; verb: string }> = {
                      stake: { icon: '🎯', color: '#a78bfa', verb: 'staked' },
                      payment: { icon: '💰', color: '#f59e0b', verb: 'paid' },
                      argument: { icon: '⚔️', color: '#38bdf8', verb: 'argued' },
                    };
                    const config = typeConfig[activity.type] || { icon: '📌', color: 'var(--muted)', verb: 'acted' };

                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.03)',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: `${config.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          flexShrink: 0,
                        }}>
                          {config.icon}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: 'var(--parchment)', lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 600, color: config.color }}>
                              @{activity.username || activity.wallet_address?.slice(0, 8) || 'anon'}
                            </span>
                            {' '}{config.verb}{' '}
                            {activity.amount > 0 && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                ${activity.amount} {activity.token}
                              </span>
                            )}
                            {activity.side && activity.type === 'stake' && (
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600,
                                background: activity.side === 'SUPPORT' ? 'rgba(74,222,128,0.15)' : 'rgba(244,114,182,0.15)',
                                color: activity.side === 'SUPPORT' ? '#4ade80' : '#f472b6',
                                marginLeft: '4px',
                              }}>
                                {activity.side}
                              </span>
                            )}
                          </div>
                          {activity.context && (
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {activity.context.slice(0, 100)}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {new Date(activity.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
