'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface NetworkInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  status: string;
  blockNumber: number;
  gasPriceGwei: string;
  poolWallet?: string;
  poolEthBalance?: string;
  poolUsdcBalance?: string;
  recipientAddress?: string;
  recipientEthBalance?: string;
  recipientUsdcBalance?: string;
  usdcContract: string;
  error?: string;
}

interface AiInfo {
  provider: string;
  status: string;
  activeModel: string;
  endpoint: string;
  hasApiKey: boolean;
}

interface OverviewData {
  timestamp: string;
  networks: {
    sepolia: NetworkInfo;
    mainnet: NetworkInfo;
    ai: AiInfo;
  };
  metrics: {
    totalUsers: number;
    totalIdeas: number;
    publishedIdeas: number;
    totalDebates: number;
    activeDebates: number;
    totalEvidence: number;
    totalEvents: number;
    totalPayments: number;
    totalRevenue: number;
  };
  users: Array<{
    id: string;
    wallet_address: string;
    name?: string;
    reputation?: number;
    created_at: string;
    ideas_count: number;
    investments_count: number;
    total_shares_percent: number;
  }>;
  payments: Array<{
    id: string;
    user_id: string;
    idea_id: string;
    chain: string;
    tx_hash: string;
    amount: string;
    token: string;
    recipient: string;
    status: string;
    created_at: string;
    verified_at: string;
    wallet_address?: string;
    idea_content?: string;
  }>;
  minds: Array<{
    id: string;
    thesis: string;
    idea_status: string;
    created_at: string;
    creator_wallet: string;
    agent_id?: string;
    confidence?: number;
    credibility?: number;
    prediction_accuracy?: number;
    lifecycle_status?: string;
    estimated_value?: number;
    market_cap?: string;
    share_price?: string;
    creator_allocation?: number;
    community_allocation?: number;
    evidence_count: number;
    debate_count: number;
    follower_count: number;
  }>;
  logs: {
    agentEvents: Array<{
      id: string;
      agent_id: string;
      event_type: string;
      content: string;
      source?: string;
      created_at: string;
      thesis?: string;
    }>;
    auditLogs: Array<{
      id: string;
      actor_id: string;
      role: string;
      dataset_id: string;
      purpose: string;
      action: string;
      timestamp: string;
      result: string;
    }>;
    topDomains: Array<{
      domain: string;
      source_type: string;
      citation_count: number;
      supporting_count: number;
      opposing_count: number;
      average_reliability: number;
    }>;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'networks' | 'users' | 'transactions' | 'minds' | 'logs'>('networks');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [mindFilter, setMindFilter] = useState('ALL');

  async function fetchOverview() {
    try {
      const res = await fetch(`/api/admin/overview?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = (data?.users || []).filter(u => 
    !userSearch || u.wallet_address?.toLowerCase().includes(userSearch.toLowerCase()) || u.name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredMinds = (data?.minds || []).filter(m => {
    if (mindFilter === 'ALL') return true;
    if (mindFilter === 'PUBLISHED') return m.idea_status === 'PUBLISHED';
    if (mindFilter === 'INCUBATING') return m.lifecycle_status === 'INCUBATING';
    if (mindFilter === 'PROVEN') return m.lifecycle_status === 'PROVEN';
    return true;
  });

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '1200px', padding: 'var(--space-6) var(--space-4)' }}>
        
        {/* Top Header & Refresh Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="page-title" style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>⚡ MindCast Command Center</h1>
              <span className="badge" style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.3)', fontSize: '11px' }}>
                ● LIVE SYNC
              </span>
            </div>
            <p className="page-subtitle" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
              Real-time on-chain infrastructure, Base Mainnet/Sepolia networks, user wallets, and autonomous intelligence telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Refreshed: {lastRefreshed || 'Loading...'}
            </span>
            <button
              onClick={() => { setLoading(true); fetchOverview(); }}
              className="btn btn-secondary"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Global Key Metrics Ribbon */}
        {data?.metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--signal)' }}>{data.metrics.totalUsers}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Users</div>
            </div>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--parchment)' }}>{data.metrics.totalIdeas}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Minds Created</div>
            </div>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--success)' }}>{data.metrics.publishedIdeas}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Published Minds</div>
            </div>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--accent)' }}>${data.metrics.totalRevenue.toFixed(2)}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Protocol Revenue</div>
            </div>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: '#38bdf8' }}>{data.metrics.totalDebates}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Debates ({data.metrics.activeDebates} active)</div>
            </div>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: '#f472b6' }}>{data.metrics.totalEvidence}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Evidence Pieces</div>
            </div>
            <div className="admin-metric" style={{ padding: 'var(--space-3)' }}>
              <div className="admin-metric-value" style={{ fontSize: 'var(--text-xl)', color: '#a78bfa' }}>{data.metrics.totalEvents}</div>
              <div className="admin-metric-label" style={{ fontSize: '11px' }}>Agent Events</div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="feed-tabs" style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)' }}>
          <button
            className={`feed-tab ${activeTab === 'networks' ? 'active' : ''}`}
            onClick={() => setActiveTab('networks')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🌐 Networks (Mainnet & Testnet)
          </button>
          <button
            className={`feed-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            👥 User & Wallet Registry ({data?.users.length || 0})
          </button>
          <button
            className={`feed-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ⚡ On-Chain Payouts & Trades ({data?.payments.length || 0})
          </button>
          <button
            className={`feed-tab ${activeTab === 'minds' ? 'active' : ''}`}
            onClick={() => setActiveTab('minds')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🧠 Minds & Market Directory ({data?.minds.length || 0})
          </button>
          <button
            className={`feed-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📜 Live System Logs ({data?.logs.agentEvents.length || 0})
          </button>
        </div>

        {loading && !data ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-4)' }}></div>
            Loading real-time command center telemetry...
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* TAB 1: NETWORKS (MAINNET & TESTNET + 0G AI)                               */}
        {/* ========================================================================= */}
        {activeTab === 'networks' && data && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
              
              {/* BASE SEPOLIA TESTNET CARD */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'linear-gradient(180deg, rgba(56,189,248,0.03) 0%, rgba(0,0,0,0.2) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--signal)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Active Testnet</span>
                    <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>Base Sepolia (Chain 84532)</h2>
                  </div>
                  <span className="badge" style={{ background: data.networks.sepolia.status === 'healthy' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: data.networks.sepolia.status === 'healthy' ? 'var(--success)' : 'var(--error)' }}>
                    {data.networks.sepolia.status === 'healthy' ? '● ONLINE' : '● OFFLINE'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Latest Block Height:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--parchment)', fontWeight: 600 }}>#{data.networks.sepolia.blockNumber.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Gas Price:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)' }}>{data.networks.sepolia.gasPriceGwei} Gwei</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Pool Wallet (Payout Engine):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--parchment)' }}>
                      {data.networks.sepolia.poolWallet ? `${data.networks.sepolia.poolWallet.slice(0, 8)}...${data.networks.sepolia.poolWallet.slice(-6)}` : 'Not Configured'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Pool Gas Balance:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: Number(data.networks.sepolia.poolEthBalance) > 0.001 ? 'var(--success)' : 'var(--error)' }}>
                      {data.networks.sepolia.poolEthBalance} ETH
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Pool Liquidity (USDC):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 700 }}>
                      ${data.networks.sepolia.poolUsdcBalance} USDC
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>USDC Token Contract:</span>
                    <a 
                      href={`https://sepolia.basescan.org/token/${data.networks.sepolia.usdcContract}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)', textDecoration: 'none' }}
                    >
                      {data.networks.sepolia.usdcContract.slice(0, 6)}...{data.networks.sepolia.usdcContract.slice(-4)} ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* BASE MAINNET CARD */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid rgba(74, 222, 128, 0.3)', background: 'linear-gradient(180deg, rgba(74,222,128,0.03) 0%, rgba(0,0,0,0.2) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Production Mainnet</span>
                    <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>Base Mainnet (Chain 8453)</h2>
                  </div>
                  <span className="badge" style={{ background: data.networks.mainnet.status === 'healthy' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: data.networks.mainnet.status === 'healthy' ? 'var(--success)' : 'var(--error)' }}>
                    {data.networks.mainnet.status === 'healthy' ? '● ONLINE' : '● OFFLINE'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Latest Block Height:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--parchment)', fontWeight: 600 }}>#{data.networks.mainnet.blockNumber.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Network Gas Price:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)' }}>{data.networks.mainnet.gasPriceGwei} Gwei</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Revenue Vault (Recipient):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--parchment)' }}>
                      {data.networks.mainnet.recipientAddress ? `${data.networks.mainnet.recipientAddress.slice(0, 8)}...${data.networks.mainnet.recipientAddress.slice(-6)}` : 'Not Configured'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Vault ETH Balance:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--parchment)' }}>
                      {data.networks.mainnet.recipientEthBalance} ETH
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Vault USDC Holdings:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 700 }}>
                      ${data.networks.mainnet.recipientUsdcBalance} USDC
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>USDC Native Contract:</span>
                    <a 
                      href={`https://basescan.org/token/${data.networks.mainnet.usdcContract}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)', textDecoration: 'none' }}
                    >
                      {data.networks.mainnet.usdcContract.slice(0, 6)}...{data.networks.mainnet.usdcContract.slice(-4)} ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* 0G DECENTRALIZED AI COMPUTE */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(180deg, rgba(168,85,247,0.03) 0%, rgba(0,0,0,0.2) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Decentralized Inference</span>
                    <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>0G Compute Network</h2>
                  </div>
                  <span className="badge" style={{ background: data.networks.ai.status === 'operational' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: data.networks.ai.status === 'operational' ? 'var(--success)' : 'var(--error)' }}>
                    {data.networks.ai.status === 'operational' ? '● OPERATIONAL' : '● KEY MISSING'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Active AI Provider:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--parchment)', fontWeight: 600 }}>{data.networks.ai.provider}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Intelligence Model:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#c084fc' }}>{data.networks.ai.activeModel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Compute Gateway:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>{data.networks.ai.endpoint}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Zero-Knowledge Execution:</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Enabled ✓</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Automated Fact-Checking:</span>
                    <span style={{ color: 'var(--signal)', fontWeight: 600 }}>7/24 Autonomous</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USERS & WALLETS LOG                                                */}
        {/* ========================================================================= */}
        {activeTab === 'users' && data && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>
                  👥 Registered User & Wallet Accounts
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
                  Showing all {filteredUsers.length} user accounts with on-chain wallet addresses and allocations.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search by wallet address..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', color: 'var(--parchment)', fontSize: 'var(--text-xs)', width: '260px' }}
              />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--parchment)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>User / Name</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Wallet Address</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Minds Created</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Investments</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Total Shares %</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Reputation</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--parchment)' }}>
                            {u.name || 'Anonymous User'}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            <a 
                              href={`https://sepolia.basescan.org/address/${u.wallet_address}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: 'var(--signal)', textDecoration: 'none' }}
                            >
                              {u.wallet_address ? `${u.wallet_address.slice(0, 8)}...${u.wallet_address.slice(-6)}` : 'No Wallet'} ↗
                            </a>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {u.ideas_count}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {u.investments_count}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                            {u.total_shares_percent}%
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {u.reputation || 100}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)' }}>
                            {new Date(u.created_at).toLocaleDateString()}
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

        {/* ========================================================================= */}
        {/* TAB 3: ON-CHAIN TRANSACTIONS & PAYOUTS                                     */}
        {/* ========================================================================= */}
        {activeTab === 'transactions' && data && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>
                ⚡ On-Chain Transactions, Publication Fees & Payouts
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
                Real-time record of all publication fees ($5 USDC) and pool payouts on Base Sepolia and Base Mainnet.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--parchment)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Amount</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Network</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Sender Wallet</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Transaction Hash</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Date</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      data.payments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className="badge" style={{ background: p.status === 'CONFIRMED' ? 'rgba(74,222,128,0.15)' : 'rgba(234,179,8,0.15)', color: p.status === 'CONFIRMED' ? 'var(--success)' : 'var(--accent)', fontSize: '10px' }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--parchment)', fontFamily: 'var(--font-mono)' }}>
                            {p.amount} {p.token}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--slate)' }}>
                            {p.chain || 'Base Sepolia'}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {p.wallet_address ? `${p.wallet_address.slice(0, 6)}...${p.wallet_address.slice(-4)}` : p.user_id.slice(0, 8)}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {p.tx_hash ? (
                              <a
                                href={p.chain === 'base' ? `https://basescan.org/tx/${p.tx_hash}` : `https://sepolia.basescan.org/tx/${p.tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--signal)', textDecoration: 'none' }}
                              >
                                {p.tx_hash.slice(0, 10)}...{p.tx_hash.slice(-6)} ↗
                              </a>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>Simulated / Local</span>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)' }}>
                            {new Date(p.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            {p.idea_id && (
                              <Link href={`/idea/${p.idea_id}`} style={{ color: 'var(--signal)', textDecoration: 'none', fontSize: '11px' }}>
                                View Mind →
                              </Link>
                            )}
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

        {/* ========================================================================= */}
        {/* TAB 4: MINDS & MARKET DIRECTORY                                           */}
        {/* ========================================================================= */}
        {activeTab === 'minds' && data && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', margin: 0, fontFamily: 'var(--font-display)' }}>
                  🧠 Minds & Autonomous Agents Directory
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>
                  Showing {filteredMinds.length} Minds with real-time credibility, accuracy, and market valuation.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {['ALL', 'PUBLISHED', 'INCUBATING', 'PROVEN'].map(f => (
                  <button
                    key={f}
                    onClick={() => setMindFilter(f)}
                    className="badge"
                    style={{ 
                      background: mindFilter === f ? 'var(--signal)' : 'rgba(255,255,255,0.05)', 
                      color: mindFilter === f ? '#000' : 'var(--parchment)', 
                      cursor: 'pointer',
                      border: 'none',
                      padding: '4px 10px'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--parchment)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Thesis / Mind</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Credibility</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Accuracy</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Valuation</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Evidence</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Followers</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMinds.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
                          No minds matching selected status.
                        </td>
                      </tr>
                    ) : (
                      filteredMinds.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: '320px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--parchment)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.thesis}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                              Creator: {m.creator_wallet ? `${m.creator_wallet.slice(0, 6)}...${m.creator_wallet.slice(-4)}` : 'Anonymous'}
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className="badge" style={{ 
                              background: m.idea_status === 'PUBLISHED' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                              color: m.idea_status === 'PUBLISHED' ? 'var(--success)' : 'var(--muted)',
                              fontSize: '10px'
                            }}>
                              {m.lifecycle_status || m.idea_status}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {m.credibility || 50}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                            {Math.round((m.prediction_accuracy || 0) * 100)}%
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {m.market_cap ? `$${Number(m.market_cap).toLocaleString()}` : `$${(m.estimated_value || 1000).toLocaleString()}`}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {m.evidence_count}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                            {m.follower_count}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <Link href={`/idea/${m.id}`} style={{ color: 'var(--signal)', textDecoration: 'none', fontWeight: 600 }}>
                              Open ↗
                            </Link>
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

        {/* ========================================================================= */}
        {/* TAB 5: LIVE SYSTEM & AUDIT LOGS                                           */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && data && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Agent Events Stream */}
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--parchment)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-display)' }}>
                🤖 Autonomous Agent Reasoning & Evidence Events
              </h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(15,15,20,0.95)', borderBottom: '1px solid var(--border)' }}>
                      <tr style={{ color: 'var(--parchment)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Event Type</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Event Content</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Source</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.agentEvents.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--muted)' }}>
                            No agent events logged yet.
                          </td>
                        </tr>
                      ) : (
                        data.logs.agentEvents.map((e) => (
                          <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                              <span className="badge font-mono" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--signal)', fontSize: '10px' }}>
                                {e.event_type}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--parchment)', maxWidth: '500px' }}>
                              {e.content}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                              {e.source || '0G Engine'}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                              {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Cited Domains & Governance Logs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
              
              {/* Citations Matrix */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', color: 'var(--parchment)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)' }}>
                  📰 Source Intelligence & Citations Network
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {data.logs.topDomains.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No domain citations logged.</p>
                  ) : (
                    data.logs.topDomains.map((dom, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 'var(--space-2)' }}>
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

              {/* Data Access Governance */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', color: 'var(--parchment)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)' }}>
                  🔒 Data Governance & Access Audit Trail
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {data.logs.auditLogs.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No audit logs recorded.</p>
                  ) : (
                    data.logs.auditLogs.slice(0, 6).map((log, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 'var(--space-2)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--parchment)', fontSize: 'var(--text-xs)' }}>
                            {log.role} → {log.action}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            {log.dataset_id} • {log.purpose}
                          </div>
                        </div>
                        <span className="badge" style={{ 
                          background: log.result === 'SUCCESS' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                          color: log.result === 'SUCCESS' ? 'var(--success)' : 'var(--error)',
                          fontSize: '10px'
                        }}>
                          {log.result}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </>
  );
}
