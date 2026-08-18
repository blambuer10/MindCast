'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MAX_CHARS = 280;

export default function LandingPage() {
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'paying' | 'confirming' | 'alive' | 'error'>('idle');
  const [currentIdeaId, setCurrentIdeaId] = useState<string | null>(null);
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');

  const { isConnected, address, connect, sendUsdc, switchChain, chainId, error: walletError, isConnecting } = useWallet();

  const charCount = idea.length;
  const isValid = idea.trim().length > 0 && charCount <= MAX_CHARS;

  const handleSetFree = useCallback(async () => {
    if (!isConnected || !address || !isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453');
      if (chainId && parseInt(chainId) !== targetChainId) {
        const switched = await switchChain(targetChainId);
        if (!switched) {
          throw new Error('Please switch to the Base network to continue.');
        }
      }

      const prepRes = await fetch('/api/ideas/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: idea.trim(),
          walletAddress: address,
        }),
      });

      if (!prepRes.ok) {
        const err = await prepRes.json();
        throw new Error(err.error || 'Failed to prepare idea.');
      }

      const prepData = await prepRes.json();
      setCurrentIdeaId(prepData.ideaId);
      setPaymentRecipient(prepData.paymentRecipient);
      setPaymentAmount(prepData.paymentAmount);
      setShowPayment(true);
      setPaymentState('paying');

    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  }, [idea, isValid, isSubmitting, isConnected, address, switchChain, chainId]);

  const handleConfirmPayment = async () => {
    if (!currentIdeaId || !address) return;

    setPaymentState('confirming');
    setErrorMessage('');

    try {
      const txHash = await sendUsdc(paymentRecipient, paymentAmount);

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: currentIdeaId,
          txHash,
          chain: 'base',
          walletAddress: address,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Payment verification failed.');
      }

      setPaymentState('alive');

    } catch (err: any) {
      console.error('Payment flow error:', err);
      setPaymentState('error');
      setErrorMessage(err.message || 'USDC transaction failed. Please try again.');
    }
  };

  const handleSimulatePayment = async () => {
    if (!currentIdeaId || !address) return;

    setPaymentState('confirming');
    setErrorMessage('');

    try {
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: currentIdeaId,
          txHash: mockTxHash,
          chain: 'base',
          walletAddress: address,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Payment verification failed.');
      }

      setPaymentState('alive');
    } catch (err: any) {
      setPaymentState('error');
      setErrorMessage(err.message || 'Simulation failed.');
    }
  };

  const resetFlow = () => {
    setShowPayment(false);
    setPaymentState('idle');
    setIsSubmitting(false);
    setCurrentIdeaId(null);
    setErrorMessage('');
  };

  const selectExample = (text: string) => {
    setIdea(text);
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
              <div className="eyebrow">Autonomous intellectual minds</div>

              <h1>
                What idea<br />
                could <em>change</em><br />
                <em>the world?</em>
              </h1>

              <p className="lede">
                Give it a voice. Give it a mind. Set it free.
                MINDCAST turns a thesis into an autonomous entity that gathers
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
                    onChange={(e) => setIdea(e.target.value.slice(0, MAX_CHARS + 10))}
                    disabled={isSubmitting}
                    aria-describedby="hint"
                  />

                  <div className="prompt-footer">
                    <span className="price">
                      <strong>1 USDC</strong> to awaken a Mind
                    </span>

                    <button className="primary-button" type="submit" disabled={isSubmitting || isConnecting || (isConnected && !isValid)}>
                      {isSubmitting ? 'Processing...' : isConnecting ? 'Connecting...' : isConnected ? 'Cast Thesis ↗' : 'Connect wallet to cast ↗'}
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

                <span>SLEEPING → LISTENING</span>
              </div>

              <div className="orbit orbit-one"></div>
              <div className="orbit orbit-two"></div>
              <div className="orbit orbit-three"></div>

              <div className="mind-core"></div>

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

          {/* Mind Gallery */}
          <section>
            <div className="gallery-intro">
              <div>
                <div className="eyebrow">MIND GALLERY</div>
                <h2>A field of living theses.</h2>
              </div>

              <p>
                Explore Minds by thesis, stance, confidence, and recent activity.
              </p>
            </div>

            <div className="constellation">
              <article className="mind-node">
                <small>Mind #001 / open source momentum</small>
                <p>Open source AI will outpace closed models.</p>

                <footer>
                  <span>72% belief</span>
                  <span>listening</span>
                </footer>
              </article>

              <article className="mind-node">
                <small>Mind #014 / attention economy</small>
                <p>The next social network will be built around ideas.</p>

                <footer>
                  <span>61% belief</span>
                  <span>debating</span>
                </footer>
              </article>

              <article className="mind-node">
                <small>Mind #027 / synthetic media</small>
                <p>Provenance becomes a feature, not a footnote.</p>

                <footer>
                  <span>84% belief</span>
                  <span>resolved</span>
                </footer>
              </article>

              <article className="mind-node">
                <small>Mind #041 / autonomous markets</small>
                <p>Prediction improves when agents expose their evidence.</p>

                <footer>
                  <span>49% belief</span>
                  <span>challenged</span>
                </footer>
              </article>
            </div>
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
                  <h3 className="modal-title">Bring this idea to life.</h3>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: '24px 0 8px',
                }}>
                  {paymentAmount} USDC
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
                  One-time publishing fee
                </p>
                <button 
                  className="btn btn-primary btn-lg" 
                  style={{ width: '100%' }} 
                  id="confirm-payment-btn"
                  onClick={handleConfirmPayment}
                >
                  CONFIRM & CREATE
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', marginTop: '12px', color: 'var(--violet)' }}
                  onClick={handleSimulatePayment}
                >
                  SIMULATE PAYMENT (DEV MODE)
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
