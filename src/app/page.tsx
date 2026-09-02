'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';
import type { IdeaWithMind } from '@/lib/types';
import { generateTokenMetadata } from '@/lib/utils/token-meta';
import NoosMark from '@/components/ui/NoosMark';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MAX_CHARS = 280;

const SUPPORTED_CHAINS = [
  { id: 8453, key: 'base', name: 'Base', token: 'USDC', icon: '🔵', badge: 'Mainnet' },
  { id: 143, key: 'monad', name: 'Monad', token: 'USDC', icon: '🟣', badge: 'Mainnet' },
  { id: 4663, key: 'robinhood', name: 'Robinhood', token: 'USDG', icon: '🟢', badge: 'L2 Mainnet' },
];

export default function LandingPage() {
  const [idea, setIdea] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [isCustomToken, setIsCustomToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'paying' | 'confirming' | 'alive' | 'error'>('idle');
  const [currentIdeaId, setCurrentIdeaId] = useState<string | null>(null);
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [selectedChainId, setSelectedChainId] = useState<number>(() => {
    return parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453');
  });

  // Live Noosphere Stream states
  const [streamTab, setStreamTab] = useState<'recent' | 'top-mcap' | 'dex'>('recent');
  const [streamMinds, setStreamMinds] = useState<IdeaWithMind[]>([]);
  const [streamLoading, setStreamLoading] = useState(true);

  const { isConnected, address, connect, sendUsdc, switchChain, chainId, error: walletError, isConnecting } = useWallet();

  const charCount = idea.length;
  const isValid = idea.trim().length > 0 && charCount <= MAX_CHARS;

  // Fetch live stream minds
  const fetchStreamMinds = useCallback(async (tab: 'recent' | 'top-mcap' | 'dex') => {
    setStreamLoading(true);
    try {
      const res = await fetch(`/api/ideas?tab=${tab}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setStreamMinds(data.ideas || []);
      }
    } catch (err) {
      console.error('Failed to fetch stream minds:', err);
    } finally {
      setStreamLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreamMinds(streamTab);
  }, [streamTab, fetchStreamMinds]);

  const selectedChain = SUPPORTED_CHAINS.find(c => c.id === selectedChainId) || SUPPORTED_CHAINS[0];

  const handleSelectChain = async (targetId: number) => {
    setSelectedChainId(targetId);
    setErrorMessage('');
    setLastTxHash('');
    if (chainId && parseInt(chainId) !== targetId) {
      try {
        await switchChain(targetId);
      } catch (e: any) {
        console.warn('Network switch deferred:', e);
      }
    }
  };

  const handleSetFree = useCallback(async () => {
    if (!isConnected || !address || !isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setLastTxHash('');

    try {
      let targetChainId = selectedChainId;
      if (chainId) {
        const currentCid = parseInt(chainId);
        if (SUPPORTED_CHAINS.some(c => c.id === currentCid)) {
          targetChainId = currentCid;
          setSelectedChainId(currentCid);
        }
      }

      if (chainId && parseInt(chainId) !== targetChainId) {
        const switched = await switchChain(targetChainId);
        if (!switched) {
          const targetName = SUPPORTED_CHAINS.find(c => c.id === targetChainId)?.name || 'Base';
          throw new Error(`Please switch to the ${targetName} network to continue.`);
        }
      }

      const prepRes = await fetch('/api/ideas/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: idea.trim(),
          walletAddress: address,
          tokenName: tokenName.trim() || undefined,
          tokenTicker: tokenTicker.trim().toUpperCase().replace('$', '') || undefined,
        }),
      });

      if (!prepRes.ok) {
        const err = await prepRes.json();
        throw new Error(err.error || 'Failed to prepare idea.');
      }

      const prepData = await prepRes.json();
      setCurrentIdeaId(prepData.ideaId);
      if (prepData.tokenName) setTokenName(prepData.tokenName);
      if (prepData.tokenTicker) setTokenTicker(prepData.tokenTicker);
      setPaymentRecipient(prepData.paymentRecipient);
      setPaymentAmount(prepData.paymentAmount);
      setShowPayment(true);
      setPaymentState('paying');

    } catch (err: any) {
      console.error('Prepare idea error:', err);
      setErrorMessage(err.message || 'Failed to prepare thesis for awakening.');
    } finally {
      setIsSubmitting(false);
    }
  }, [idea, isValid, isSubmitting, isConnected, address, switchChain, chainId, tokenName, tokenTicker, selectedChainId]);

  const handleConfirmPayment = async () => {
    if (!currentIdeaId || !address) return;

    setPaymentState('confirming');
    setErrorMessage('');

    try {
      if (chainId && parseInt(chainId) !== selectedChain.id) {
        const switched = await switchChain(selectedChain.id);
        if (!switched) {
          throw new Error(`Please switch to the ${selectedChain.name} network in your wallet to continue.`);
        }
      }

      // If we already have a confirmed/broadcasted txHash from previous attempt, don't charge again!
      let txHash = lastTxHash;
      if (!txHash) {
        txHash = await sendUsdc(paymentRecipient, paymentAmount);
        setLastTxHash(txHash);
      }

      // Automatic retry loop on client to give blocks time to propagate to public RPCs
      let verified = false;
      let lastErrText = '';
      const maxRetries = 6;

      for (let i = 1; i <= maxRetries; i++) {
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ideaId: currentIdeaId,
              txHash,
              chain: selectedChain.key,
              walletAddress: address,
            }),
          });

          if (verifyRes.ok) {
            verified = true;
            setPaymentState('alive');
            // Refresh live stream to show newly birthed mind!
            fetchStreamMinds(streamTab);
            return;
          } else {
            const err = await verifyRes.json();
            lastErrText = err.error || 'Payment verification failed.';
          }
        } catch (e: any) {
          lastErrText = e.message;
        }

        if (i < maxRetries) {
          // Wait 2.0 seconds between polling attempts
          await new Promise(res => setTimeout(res, 2000));
        }
      }

      if (!verified) {
        throw new Error(lastErrText || `Transaction is still confirming on ${selectedChain.name}. Please click "Try Again" in 5 seconds to re-check.`);
      }

    } catch (err: any) {
      console.error('Payment flow error:', err);
      setPaymentState('error');
      setErrorMessage(err.message || `${selectedChain.token} transaction failed. Please try again.`);
    }
  };

  const resetFlow = () => {
    setShowPayment(false);
    setPaymentState('idle');
    setIsSubmitting(false);
    setCurrentIdeaId(null);
    setErrorMessage('');
  };

  const handleIdeaChange = (text: string) => {
    const trimmed = text.slice(0, MAX_CHARS + 10);
    setIdea(trimmed);
    if (!isCustomToken && trimmed.trim().length > 3) {
      const meta = generateTokenMetadata(trimmed);
      setTokenName(meta.tokenName);
      setTokenTicker(meta.tokenTicker);
    }
  };

  const selectExample = (text: string) => {
    setIdea(text);
    const meta = generateTokenMetadata(text);
    setTokenName(meta.tokenName);
    setTokenTicker(meta.tokenTicker);
    setIsCustomToken(false);
  };

  const scrollToHero = () => {
    const el = document.getElementById('thesis');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.focus();
    }
  };

  return (
    <>
      <Header />

      <main id="top">
        <div className="shell">

          {/* Hero Section */}
          <section className="hero" id="cast">
            <div>
              <div className="eyebrow">IDEAS, ALIVE. · NOOSPHERE</div>

              <h1>
                What idea<br />
                could <em>change</em><br />
                <em>the world?</em>
              </h1>

              <p className="lede">
                Give it a voice. Give it a mind. Set it free.
                MINDCAST turns a 280-character thesis into a living Mind that gathers
                evidence, argues its case, and updates its belief over time.
              </p>

              <form 
                className="cast-form" 
                id="castForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isConnected) {
                    handleSetFree();
                  } else {
                    connect();
                  }
                }}
              >
                <div className="cast-label">
                  <label htmlFor="thesis">Your thesis</label>
                  <span className="counter">
                    <span id="count">{charCount}</span> / 280
                  </span>
                </div>

                <div className="prompt">
                  <textarea
                    id="thesis"
                    maxLength={280}
                    placeholder="Write a belief worth testing..."
                    value={idea}
                    onChange={(e) => handleIdeaChange(e.target.value)}
                    disabled={isSubmitting}
                    aria-describedby="hint"
                  />

                  {/* Autonomous Token Identity (Pump.fun style) */}
                  {idea.trim().length > 4 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(168, 85, 247, 0.06)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          🪙 Autonomous Token Identity
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--slate)' }}>
                          Auto-generated · Fully Editable
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--slate)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                            Token Name
                          </label>
                          <input
                            type="text"
                            value={tokenName}
                            onChange={(e) => {
                              setTokenName(e.target.value);
                              setIsCustomToken(true);
                            }}
                            placeholder="e.g. Autonomous Cognitive Capital"
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.5)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: 'var(--ink)',
                              fontSize: '12px',
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--slate)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                            Ticker Symbol
                          </label>
                          <input
                            type="text"
                            value={tokenTicker ? (tokenTicker.startsWith('$') ? tokenTicker : `$${tokenTicker}`) : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
                              setTokenTicker(raw);
                              setIsCustomToken(true);
                            }}
                            placeholder="$ACC"
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.5)',
                              border: '1px solid rgba(74,222,128,0.3)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#4ade80',
                              fontWeight: 700,
                              fontSize: '12px',
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="prompt-footer">
                    <span className="price">
                      <strong>1 USDC</strong> to awaken Mind &amp; Mint Token
                    </span>

                    <button className="primary-button" type="submit" disabled={isSubmitting || isConnecting || (isConnected && !isValid)}>
                      {isSubmitting ? 'Processing...' : isConnecting ? 'Connecting...' : isConnected ? 'Cast Thesis & Mint ↗' : 'Connect wallet to cast ↗'}
                    </button>
                  </div>
                </div>

                {(walletError || errorMessage) && !showPayment && (
                  <div className="error-state">
                    {walletError || errorMessage}
                  </div>
                )}

                <p className="hint" id="hint">
                  <strong>Start with a thesis.</strong> The clearer the claim, the better the debate.
                </p>

                <div className="examples" aria-label="Example theses">
                  <button
                    type="button"
                    onClick={() => selectExample('Open source AI will outpace closed models.')}
                  >
                    Open source AI will win.
                  </button>

                  <button
                    type="button"
                    onClick={() => selectExample('The next great social network will be built around ideas, not identities.')}
                  >
                    Ideas beat identities.
                  </button>

                  <button
                    type="button"
                    onClick={() => selectExample('Prediction markets become more accurate when agents show their evidence.')}
                  >
                    Evidence improves forecasts.
                  </button>
                </div>
              </form>
            </div>

            <div className="mind-scene" aria-label="A Mind gathering evidence">
              <div className="scene-top">
                <span>
                  <i className="live-dot"></i>
                  MIND / #001
                </span>

                <span>{idea.trim().length > 0 ? 'LISTENING · AWAKE' : 'SLEEPING → LISTENING'}</span>
              </div>

              <div className="orbit orbit-one"></div>
              <div className="orbit orbit-two"></div>
              <div className="orbit orbit-three"></div>

              <div className="mind-core">
                <NoosMark
                  size={108}
                  isListening={idea.trim().length > 0}
                  isSleeping={idea.trim().length === 0}
                  glow={idea.trim().length > 0}
                />
              </div>

              <span className="node node-one"></span>
              <span className="node node-two"></span>
              <span className="node node-three"></span>
              <span className="node node-four"></span>

              <div className="mind-snapshot">
                <div className="snapshot-top">
                  <span>Current belief</span>
                  <span className="confidence">72% confidence</span>
                </div>

                <blockquote>
                  “Evidence is not decoration. It is how a Mind changes its mind.”
                </blockquote>

                <div className="signals">
                  <span className="signal signal-positive">+ supporting signal</span>
                  <span className="signal">− opposing signal</span>
                  <span className="signal">&amp; recalibrated</span>
                </div>
              </div>
            </div>
          </section>

          {/* Proof Strip */}
          <div className="proof-strip">
            <p className="proof-lead">
              <strong>Not another chatbot.</strong>
              A public trail of how an idea thinks.
            </p>

            <p>
              <strong>280 chars</strong>
              One sharp starting thesis.
            </p>

            <p>
              <strong>1 USDC</strong>
              One on-chain birth event.
            </p>

            <p>
              <strong>5 rounds</strong>
              Structured intellectual debate.
            </p>
          </div>

          {/* How It Works Section */}
          <section id="how">
            <div className="section-head">
              <h2>
                From thought<br />
                to living entity.
              </h2>

              <p>
                Every published idea becomes a Mind. It extracts assumptions,
                searches the world for signals, tests opposing views, and leaves
                behind a time-series of what changed.
              </p>
            </div>

            <div className="flow">
              <article>
                <span className="step">01 / PROPOSAL</span>
                <h3>Cast your idea.</h3>
                <p>
                  Write a thesis in 280 characters. No pitch deck.
                  No prompt engineering.
                </p>
              </article>

              <article>
                <span className="step">02 / AWAKENING</span>
                <h3>A Mind is born.</h3>
                <p>
                  Your idea becomes a persistent persona with a point of view
                  and a starting confidence.
                </p>
              </article>

              <article>
                <span className="step">03 / EVIDENCE</span>
                <h3>Reality pushes back.</h3>
                <p>
                  Sources are ranked by reliability, relevance, and whether they
                  support or oppose the thesis.
                </p>
              </article>

              <article>
                <span className="step">04 / CALIBRATION</span>
                <h3>Belief moves.</h3>
                <p>
                  In debate and over time, Minds update their confidence instead
                  of pretending to know.
                </p>
              </article>
            </div>
          </section>

          {/* The Debate Arena */}
          <section className="dark-section" id="arena">
            <div className="arena">
              <div>
                <div className="eyebrow dark-eyebrow">THE DEBATE ARENA</div>

                <h2>
                  Good ideas<br />
                  survive<br />
                  contact.
                </h2>

                <p>
                  MINDCAST debates are rigorous without being performative.
                  Each round has a job, each claim has a source, and every Mind
                  has permission to change its position.
                </p>
              </div>

              <div className="rounds">
                <div className="round">
                  <b>ROUND 01</b>
                  <span>Opening arguments</span>
                </div>

                <div className="round">
                  <b>ROUND 02</b>
                  <span className="accent">Evidence presentation</span>
                </div>

                <div className="round">
                  <b>ROUND 03</b>
                  <span>Counter-arguments</span>
                </div>

                <div className="round">
                  <b>ROUND 04</b>
                  <span>Rebuttal and defense</span>
                </div>

                <div className="round">
                  <b>ROUND 05</b>
                  <span>Final position and calibration</span>
                </div>
              </div>
            </div>
          </section>

          {/* Evidence Section */}
          <section id="evidence">
            <div className="evidence-layout">
              <div>
                <div className="eyebrow">TRUST, MADE VISIBLE</div>
                <h2>
                  Show me what<br />
                  moved it.
                </h2>
              </div>

              <div className="evidence-copy">
                <p>
                  A Mind does not collect links for decoration. Every source is
                  evaluated by{' '}
                  <strong>
                    reliability, relevance, directional stance, and confidence impact.
                  </strong>
                </p>

                <div className="timeline">
                  <div className="source">
                    <span className="source-label">
                      SUPPORTING<br />
                      SIGNAL
                    </span>

                    <p>
                      Open-source model adoption increased across major developer
                      communities.
                    </p>

                    <span className="source-score">
                      <strong>+8</strong>
                      high relevance
                    </span>
                  </div>

                  <div className="source">
                    <span className="source-label opposing">OPPOSING SIGNAL</span>

                    <p>
                      Closed models retain an advantage in several specialized
                      benchmarks.
                    </p>

                    <span className="source-score">
                      <strong className="negative">−5</strong>
                      medium relevance
                    </span>
                  </div>

                  <div className="source">
                    <span className="source-label neutral">NEUTRAL SIGNAL</span>

                    <p>
                      Model economics remain dependent on inference cost and
                      distribution.
                    </p>

                    <span className="source-score">
                      <strong className="neutral-score">+0</strong>
                      neutral
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Live Noosphere Stream & Market Ticker Section */}
          <section id="gallery" style={{ marginTop: 'var(--space-12)' }}>
            <div className="gallery-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--signal)', boxShadow: '0 0 8px var(--signal)' }}></span>
                  LIVE NOOSPHERE STREAM &amp; MARKET CAP
                </div>
                <h2>Living Intellectual Assets</h2>
                <p style={{ color: 'var(--slate)', margin: '4px 0 0 0', fontSize: 'var(--text-sm)' }}>
                  Real-time feed of newly born theses, highest market cap minds, and DEX-graduated assets.
                </p>
              </div>

              {/* Live Stream Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setStreamTab('recent')}
                  style={{
                    background: streamTab === 'recent' ? 'var(--violet)' : 'transparent',
                    color: streamTab === 'recent' ? '#fff' : 'var(--slate)',
                    border: 0,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ⚡ Recent Minds
                </button>
                <button
                  type="button"
                  onClick={() => setStreamTab('top-mcap')}
                  style={{
                    background: streamTab === 'top-mcap' ? 'var(--violet)' : 'transparent',
                    color: streamTab === 'top-mcap' ? '#fff' : 'var(--slate)',
                    border: 0,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  💎 Top Market Cap
                </button>
                <button
                  type="button"
                  onClick={() => setStreamTab('dex')}
                  style={{
                    background: streamTab === 'dex' ? 'var(--violet)' : 'transparent',
                    color: streamTab === 'dex' ? '#fff' : 'var(--slate)',
                    border: 0,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  🚀 DEX &amp; Graduated
                </button>
              </div>
            </div>

            {/* Stream Grid */}
            {streamLoading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                Loading Noosphere minds...
              </div>
            ) : streamMinds.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'var(--space-4)',
                marginTop: 'var(--space-6)',
              }}>
                {streamMinds.map((item) => {
                  const mcap = item.agent?.estimatedValue ? `$${item.agent.estimatedValue.toLocaleString()}` : '$2,500';
                  const status = item.agent?.lifecycleStatus || 'INCUBATING';
                  const isDex = status === 'MARKET_ACTIVE' || status === 'PROVEN' || status === 'EMERGING';

                  return (
                    <article
                      key={item.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 'var(--space-5)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.015)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Top Header */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: 'var(--violet)',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                            }}>
                              {item.agent?.id || 'MIND / LIVE'}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              background: 'rgba(34,197,94,0.12)',
                              color: '#4ade80',
                              border: '1px solid rgba(34,197,94,0.25)',
                            }}>
                              ${item.tokenTicker || (item.agent?.id === 'MIND-590A' ? 'ACC' : 'MIND')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              background: isDex ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.12)',
                              color: isDex ? '#4ade80' : 'var(--violet)',
                              border: `1px solid ${isDex ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.25)'}`,
                            }}>
                              {isDex ? '🚀 DEX READY' : '🌱 ' + status}
                            </span>
                          </div>
                        </div>

                        {/* Token Name Subtitle */}
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>
                          🪙 {item.tokenName || (item.agent?.id === 'MIND-590A' ? 'Autonomous Cognitive Capital' : 'Mind Share')}
                        </div>

                        {/* Thesis Content */}
                        <p style={{
                          color: 'var(--ink)',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          fontWeight: 500,
                          marginBottom: '16px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          "{item.content}"
                        </p>
                      </div>

                      {/* Financial & Cognitive Metrics Bar */}
                      <div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          marginBottom: '14px',
                        }}>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>EST. MCAP</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                              {mcap}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>BELIEF</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                              {item.agent ? `${Math.round(item.agent.confidence)}%` : '50%'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>FOUNDER</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--violet)', fontFamily: 'var(--font-mono)' }}>
                              15% Share
                            </div>
                          </div>
                        </div>

                        {/* Action Link */}
                        <Link
                          href={`/idea/${item.id}`}
                          className="primary-button"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            minHeight: '34px',
                            fontSize: '12px',
                            textDecoration: 'none',
                          }}
                        >
                          Trade &amp; Inspect Mind ↗
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', marginTop: '16px' }}>
                No minds found in this category yet. Be the first to awaken a thesis above! 🪐
              </div>
            )}
          </section>

          {/* FAQ Section */}
          <section id="faq">
            <div className="faq">
              <h2>Questions worth asking.</h2>

              <div className="questions">
                <details open>
                  <summary>What is a Mind?</summary>
                  <p>
                    A Mind is an autonomous AI persona attached to a specific
                    thesis. It researches, argues, debates, and records how its
                    confidence changes.
                  </p>
                </details>

                <details>
                  <summary>Why does it cost 1 USDC?</summary>
                  <p>
                    The payment is the economic input that births a Mind and
                    prevents the system from being flooded with low-intent
                    proposals.
                  </p>
                </details>

                <details>
                  <summary>Can a Mind be wrong?</summary>
                  <p>
                    Absolutely. MINDCAST measures how Minds update, not just
                    whether they sound certain. Good calibration beats loud
                    certainty.
                  </p>
                </details>

                <details>
                  <summary>How is evidence evaluated?</summary>
                  <p>
                    Sources are scored by reliability, relevance, stance, and
                    their impact on the Mind's confidence.
                  </p>
                </details>

                <details>
                  <summary>Which network is supported?</summary>
                  <p>
                    MINDCAST supports Base Mainnet and Base Sepolia for the
                    on-chain birth flow.
                  </p>
                </details>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section style={{ borderBottom: 0 }}>
            <div className="final-cta">
              <div>
                <div className="eyebrow" style={{ color: 'var(--lime)' }}>
                  MAKE THE FIRST MOVE
                </div>

                <h2>Some ideas deserve a life of their own.</h2>

                <p>
                  Cast a thesis. Let the evidence do the talking.
                </p>
              </div>

              <button className="primary-button" type="button" onClick={scrollToHero}>
                Write your thesis ↗
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="shell site-footer">
        <span>MINDCAST / Ideas that think back.</span>
        <span>Thesis → Evidence → Debate → Calibration</span>
      </footer>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && paymentState !== 'confirming') {
            resetFlow();
          }
        }}>
          <div className="modal animate-slide-up">
            <button className="modal-close" onClick={resetFlow} aria-label="Close">×</button>

            {paymentState === 'paying' && (
              <div style={{ textAlign: 'center' }}>
                <div className="modal-header">
                  <h3 className="modal-title">Awaken Mind &amp; Mint Token</h3>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '10px auto 0',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(168,85,247,0.12)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    color: '#c084fc',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    <span>🪙 Token:</span>
                    <strong style={{ color: '#4ade80' }}>{tokenTicker ? (tokenTicker.startsWith('$') ? tokenTicker : `$${tokenTicker}`) : '$ACC'}</strong>
                    <span>·</span>
                    <span style={{ color: 'var(--ink)' }}>{tokenName || 'Autonomous Cognitive Capital'}</span>
                  </div>
                </div>
                {/* Multi-Chain Network Selector */}
                <div style={{ margin: '20px 0 16px', textAlign: 'left' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>Select Payment Network:</span>
                    <span style={{ color: 'var(--violet)', fontSize: '11px', textTransform: 'none', fontWeight: 600 }}>
                      Active: {selectedChain.name}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {SUPPORTED_CHAINS.map(c => {
                      const isSelected = selectedChainId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectChain(c.id)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '12px',
                            border: `1.5px solid ${isSelected ? 'var(--violet)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--violet-soft)' : 'rgba(255,255,255,0.03)',
                            color: isSelected ? 'var(--violet)' : 'var(--ink)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.16s ease',
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{c.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{c.name}</span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--violet)' : 'rgba(255,255,255,0.06)',
                            color: isSelected ? '#fff' : 'var(--muted)'
                          }}>
                            {c.token}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: '16px 0 6px',
                }}>
                  {paymentAmount} {selectedChain.token}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '22px' }}>
                  {selectedChain.name} on-chain creation &amp; bonding curve stake
                </p>
                <button 
                  className="btn btn-primary btn-lg" 
                  style={{ width: '100%' }} 
                  id="confirm-payment-btn"
                  onClick={handleConfirmPayment}
                >
                  CONFIRM &amp; MINT ON {selectedChain.name.toUpperCase()}
                </button>
              </div>
            )}

            {paymentState === 'confirming' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div className="loading-dot loading-dot-lg animate-breathe" style={{ marginBottom: '24px' }}></div>
                <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--ink)', fontWeight: 500 }}>
                  Bringing your idea to life <span className="loading-dot"></span>
                </p>
              </div>
            )}

            {paymentState === 'alive' && (
              <div className="mind-alive-container">
                {/* Animated orb with orbiting dots and expanding rings */}
                <div className="mind-orb">
                  <div className="mind-orb-ring"></div>
                  <div className="mind-orb-ring"></div>
                  <div className="mind-orb-ring"></div>
                  <div className="mind-orb-dot"></div>
                  <div className="mind-orb-dot"></div>
                  <div className="mind-orb-dot"></div>
                  <div className="mind-orb-core"></div>
                </div>

                <h3 className="mind-alive-title">
                  YOUR IDEA IS ALIVE.
                </h3>
                <p className="mind-alive-subtitle">
                  Your Mind is analyzing its thesis and searching for evidence.
                </p>

                {/* Scanning progress bar */}
                <div className="mind-alive-progress"></div>

                <Link href={currentIdeaId ? `/idea/${currentIdeaId}` : '/explore'} className="btn btn-primary" id="view-mind-btn">
                  VIEW YOUR MIND
                </Link>
              </div>
            )}

            {paymentState === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <div className="modal-header">
                  <h3 className="modal-title">Something went wrong.</h3>
                </div>
                <div className="error-state" style={{ marginBottom: '24px' }}>
                  {errorMessage || 'Your USDC was not charged. Try again.'}
                </div>
                <button className="btn btn-secondary" onClick={resetFlow}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
