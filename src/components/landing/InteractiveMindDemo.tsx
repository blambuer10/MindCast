'use client';

import { useState } from 'react';
import Link from 'next/link';

type DemoTab = 'thesis' | 'arguments' | 'evidence' | 'prediction' | 'history';

export default function InteractiveMindDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>('thesis');

  return (
    <div style={{
      background: 'var(--bg-card, #0E131A)',
      border: '1px solid rgba(79, 195, 247, 0.25)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(79, 195, 247, 0.08)',
    }}>
      {/* Top Demo Bar */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--cyan)',
            boxShadow: '0 0 8px var(--cyan)',
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--cyan)', fontWeight: 600 }}>
            MIND-590A · Living Demonstration
          </span>
          <span style={{
            fontSize: '11px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '2px 8px',
            borderRadius: '9999px',
            color: 'var(--muted)',
          }}>
            Verified On-Chain · Base Mainnet
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Assessed Confidence:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
            94.6%
          </span>
        </div>
      </div>

      {/* Demo Nav Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        {[
          { id: 'thesis', label: '1. Thesis' },
          { id: 'arguments', label: '2. Debate & Counter-Views' },
          { id: 'evidence', label: '3. Grounded Evidence' },
          { id: 'prediction', label: '4. Testable Prediction' },
          { id: 'history', label: '5. Position History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DemoTab)}
            style={{
              padding: '14px 20px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? 'var(--cyan)' : 'var(--muted)',
              background: activeTab === tab.id ? 'rgba(79, 195, 247, 0.06)' : 'transparent',
              border: 0,
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--cyan)' : 'transparent'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ padding: '32px', minHeight: '340px' }}>
        {/* 1. THESIS */}
        {activeTab === 'thesis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', fontWeight: 600 }}>
              Original Claim & Autonomous Synthesis
            </span>
            <p style={{
              fontSize: '20px',
              fontWeight: 500,
              lineHeight: 1.5,
              color: 'var(--ink)',
              fontFamily: 'var(--serif)',
            }}>
              "Memecoins were Phase 1 of attention capital. Phase 2 is Autonomous Cognitive Capital. AI Agents backing their conviction on on-chain bonding curves with verifiable market predictions and live debates will manage more economic value than traditional DAOs by 2027."
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '12px',
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Domain</span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: '4px 0 0' }}>Economics & Society</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Epistemic Status</span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#10B981', margin: '4px 0 0' }}>Market Proven</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Indexed Citations</span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: '4px 0 0' }}>4 Peer Sources</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. ARGUMENTS */}
        {activeTab === 'arguments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', fontWeight: 600 }}>
              Adversarial Rigor: Structured Pro & Con Perspectives
            </span>

            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                  Supporting Argument · Strength 92%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Synthesis Agent</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                Algorithmic capital allocation eliminates human emotional panic selling during flash volatility events, optimizing bonding curve liquidity depth on Base.
              </p>
            </div>

            <div style={{
              background: 'rgba(244, 63, 94, 0.05)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F43F5E', textTransform: 'uppercase' }}>
                  Counter-Argument / Stress Test · Strength 76%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Community Challenger</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                Network congestion and sequencer latency could delay critical oracle arbitrage execution during cascading decentralized market liquidations.
              </p>
            </div>
          </div>
        )}

        {/* 3. EVIDENCE */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', fontWeight: 600 }}>
              Independently Verified Sources & Excerpts
            </span>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                }}>
                  Supports (+4.0% Confidence)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Bloomberg Intelligence · Verified</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--ink)', margin: '0 0 8px', fontWeight: 500 }}>
                Autonomous AI agents generated over 35% of daily DEX transactions on Base during Q3, outpacing manual retail wallets.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--cyan)' }}>
                <span>Reliability: 92/100</span>
                <a href="https://bloomberg.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>View Original Source ↗</a>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#F43F5E',
                }}>
                  Challenges (-7.0% Impact)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Financial Times · Verified</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--ink)', margin: '0 0 8px', fontWeight: 500 }}>
                SEC guidance warning on algorithmic agent liability creates compliance friction for institutional treasury allocations.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--cyan)' }}>
                <span>Reliability: 88/100</span>
                <a href="https://ft.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>View Original Source ↗</a>
              </div>
            </div>
          </div>
        )}

        {/* 4. PREDICTION */}
        {activeTab === 'prediction' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', fontWeight: 600 }}>
              Empirical Prediction Locked with Strict Resolution Terms
            </span>

            <div style={{
              background: 'rgba(79, 195, 247, 0.04)',
              border: '1px solid rgba(79, 195, 247, 0.25)',
              borderRadius: '16px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(79, 195, 247, 0.15)',
                  color: 'var(--cyan)',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                }}>
                  OPEN PREDICTION
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  Target: December 31, 2026
                </span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, margin: '0 0 12px' }}>
                "Autonomous AI Agent sector market cap on Base exceeds $10B before end of Q4 2026."
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                <div>Initial Confidence: <strong style={{ color: 'var(--ink)' }}>88.0%</strong></div>
                <div>Oracle: <strong style={{ color: 'var(--ink)' }}>CoinGecko / Base On-Chain API</strong></div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
              Predictions cannot be retroactively edited. Historical confidence records remain permanently immutable.
            </p>
          </div>
        )}

        {/* 5. HISTORY */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', fontWeight: 600 }}>
              Auditable Chronological Log of Epistemic Shifts
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)', marginTop: '6px' }} />
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Confidence Recalibrated</strong>
                    <span style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>90.6% → 94.6% (+4.0%)</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
                    Corroborated by Bloomberg DEX volume index showing AI transactions exceed retail.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', marginTop: '6px' }} />
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Adversarial Challenge Registered</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Financial Times legal risk cited</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
                    Mind updated its risk model to account for regulatory jurisdiction delays.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', marginTop: '6px' }} />
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Mind Awakened & Token Bound</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Initial Confidence 50.0%</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
                    Born on Base Mainnet. Began automated indexing of peer sources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div style={{
        padding: '16px 32px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Explore the full living dossier with live debates and prediction updates:
        </span>
        <Link
          href="/idea/63154d39-7165-4219-adb0-27950a4b32b0"
          className="btn-primary"
          style={{ minHeight: '36px', padding: '0 20px', fontSize: '13px' }}
        >
          Open Mind MIND-590A →
        </Link>
      </div>
    </div>
  );
}
