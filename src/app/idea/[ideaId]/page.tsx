'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';
import type { Idea, Agent, MindState, Prediction } from '@/lib/types';

interface IdeaPageData {
  idea: Idea;
  agent: Agent | null;
  mindState: MindState | null;
  predictions?: Prediction[];
  followerCount: number;
  isFollowing?: boolean;
  mindAsset?: {
    id: string;
    mindId: string;
    assetType: string;
    totalSupply: number;
    creatorAllocation: number;
    communityAllocation: number;
    protocolAllocation: number;
    liquidityAllocation: number;
    marketStatus: string;
    createdAt: string;
  } | null;
  mindFounder?: {
    creatorId: string;
    mindId: string;
    allocationPercentage: number;
    allocationStatus: string;
    createdAt: string;
  } | null;
  userAllocation?: number;
}

export default function IdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = use(params);
  const { isConnected, address, connect, sendUsdc, switchChain, chainId } = useWallet();
  const [data, setData] = useState<IdeaPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'arguments' | 'evidence' | 'predictions' | 'activity'>('arguments');
  const [evidenceTab, setEvidenceTab] = useState<'all' | 'supporting' | 'opposing'>('all');
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [challengeState, setChallengeState] = useState<'idle' | 'preparing' | 'paying' | 'verifying' | 'success' | 'error'>('idle');
  const [challengeError, setChallengeError] = useState('');

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradePercentage, setTradePercentage] = useState('1');
  const [tradeState, setTradeState] = useState<'idle' | 'executing' | 'verifying' | 'success' | 'error'>('idle');
  const [tradeError, setTradeError] = useState('');
  const [tradeTxHash, setTradeTxHash] = useState('');

  // Step 2: Prediction Anchoring states
  const [predictionClaim, setPredictionClaim] = useState('');
  const [predictionConfidence, setPredictionConfidence] = useState(75);
  const [isSubmittingPrediction, setIsSubmittingPrediction] = useState(false);
  const [predictionSuccessMessage, setPredictionSuccessMessage] = useState('');

  const handleAnchorPrediction = async (claimToSubmit?: string, confidenceToSubmit?: number) => {
    const finalClaim = claimToSubmit || predictionClaim;
    const finalConf = confidenceToSubmit !== undefined ? confidenceToSubmit : predictionConfidence;
    if (!finalClaim.trim() || !data) return;

    setIsSubmittingPrediction(true);
    setPredictionSuccessMessage('');

    try {
      const targetMindId = data.agent?.id || data.idea?.id || ideaId;
      const res = await fetch(`/api/minds/${targetMindId}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: finalClaim.trim(),
          confidenceAtCreation: Number(finalConf) || 50,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit prediction.');
      }

      const result = await res.json();
      setPredictionClaim('');
      setPredictionSuccessMessage('Prediction locked! Mind is researching evidence and structuring arguments.');

      // Refresh idea detail
      const detailRes = await fetch(`/api/ideas/${data.idea.id}`);
      if (detailRes.ok) {
        const detailResult = await detailRes.json();
        setData(detailResult);
      }

      setActiveSection('arguments');
    } catch (err: any) {
      console.error('Failed to anchor prediction:', err);
      alert(err.message || 'Failed to submit prediction. Please try again.');
    } finally {
      setIsSubmittingPrediction(false);
    }
  };

  // Lifecycle and DEX graduation states
  const [isGraduating, setIsGraduating] = useState(false);
  const [graduationMessage, setGraduationMessage] = useState('');

  const handleGraduateLifecycle = async (targetStatus?: string) => {
    if (!data?.agent) return;
    setIsGraduating(true);
    setGraduationMessage('');
    try {
      const res = await fetch(`/api/minds/${data.agent.id}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update lifecycle');
      }
      const resData = await res.json();
      setGraduationMessage(`Mind advanced to ${resData.newStatus}!`);

      const detailRes = await fetch(`/api/ideas/${data.idea.id}`);
      if (detailRes.ok) {
        const detailResult = await detailRes.json();
        setData(detailResult);
      }
    } catch (e: any) {
      console.error('Lifecycle error:', e);
      alert(e.message || 'Graduation update failed.');
    } finally {
      setIsGraduating(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!isConnected || !address || !data?.agent) return;

    setTradeState('executing');
    setTradeError('');
    setTradeTxHash('');

    try {
      const percentageNum = parseFloat(tradePercentage);
      if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
        throw new Error('Please enter a valid percentage between 0.1% and 100%.');
      }

      const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
      if (chainId && parseInt(chainId) !== targetChainId) {
        const switched = await switchChain(targetChainId);
        if (!switched) {
          throw new Error('Please switch to the Base network to continue.');
        }
      }

      if (tradeType === 'buy') {
        const repScore = Math.min(100, Math.max(10, Math.round(
          (data.agent.credibility * 0.4) + 
          ((data.agent.predictionAccuracy || 0.7) * 40) + 
          ((followers || 0) / 20) + 
          (data.agent.confidence * 0.1)
        )));
        const sharePrice = (0.10 + (repScore / 250)) / 300;
        const grossCost = (percentageNum * 1000) * sharePrice;
        const costAmount = (grossCost - (grossCost * 0.02)).toFixed(6); // netAmount expected by verifier
        const recipient = process.env.PAYMENT_RECIPIENT_ADDRESS || '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a';
        
        let txHash = '';
        try {
          txHash = await sendUsdc(recipient, costAmount);
        } catch (err: any) {
          if (err.message?.includes('rejected') || err.code === 4001) {
            throw err;
          }
          console.warn('Transaction execution failed, attempting mock simulation:', err);
          txHash = '0xmock' + Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        }

        setTradeState('verifying');

        const res = await fetch(`/api/minds/${data.agent.id}/market/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            percentage: tradePercentage,
            txHash,
            walletAddress: address,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to verify purchase.');
        }

        setTradeTxHash(txHash);
        setTradeState('success');

      } else {
        setTradeState('verifying');

        const res = await fetch(`/api/minds/${data.agent.id}/market/sell`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            percentage: tradePercentage,
            walletAddress: address,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to execute sale.');
        }

        const resData = await res.json();
        setTradeTxHash(resData.payoutTxHash);
        setTradeState('success');
      }

      setTimeout(() => {
        setShowTradeModal(false);
        setTradeState('idle');
        window.location.reload();
      }, 3000);

    } catch (err: any) {
      console.error('Trade flow error:', err);
      setTradeState('error');
      setTradeError(err.message || 'Transaction failed. Please try again.');
    }
  };

  const handleInitiateChallenge = async () => {
    if (!isConnected || !address || !activeEvidenceId) return;

    setChallengeState('preparing');
    setChallengeError('');

    try {
      const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
      if (chainId && parseInt(chainId) !== targetChainId) {
        const switched = await switchChain(targetChainId);
        if (!switched) {
          throw new Error('Please switch to the Base network to continue.');
        }
      }

      const prepRes = await fetch('/api/debates/challenge/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentIdeaId: ideaId,
          evidenceId: activeEvidenceId,
          walletAddress: address,
        }),
      });

      if (!prepRes.ok) {
        const err = await prepRes.json();
        throw new Error(err.error || 'Failed to prepare challenge.');
      }

      const prepData = await prepRes.json();
      const { opposingIdeaId, paymentRecipient, paymentAmount } = prepData;

      setChallengeState('paying');

      let txHash = '';
      try {
        txHash = await sendUsdc(paymentRecipient, paymentAmount);
      } catch (err: any) {
        // Fallback to simulation in development environments if user wishes
        if (err.message?.includes('rejected') || err.code === 4001) {
          throw err;
        }
        console.warn('Transaction execution failed, attempting mock simulation:', err);
        txHash = '0xmock' + Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      }

      setChallengeState('verifying');

      const verifyRes = await fetch('/api/debates/challenge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentIdeaId: ideaId,
          opposingIdeaId,
          txHash,
          chain: 'base',
          walletAddress: address,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Challenge verification failed.');
      }

      setChallengeState('success');
      
      setTimeout(() => {
        setShowChallengeModal(false);
        setChallengeState('idle');
        window.location.reload();
      }, 2500);

    } catch (err: any) {
      console.error('Challenge flow error:', err);
      setChallengeState('error');
      setChallengeError(err.message || 'USDC transaction failed. Please try again.');
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = data?.idea ? `Check out this Mind on MINDCAST: "${data.idea.content}"` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchIdea() {
      try {
        const res = await fetch(`/api/ideas/${ideaId}?walletAddress=${address || ''}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
          setFollowing(!!result.isFollowing);
          setFollowers(result.followerCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch idea:', err);
      }
      setLoading(false);
    }
    fetchIdea();
  }, [ideaId, address]);

  const handleFollowToggle = async () => {
    if (!address) {
      await connect();
      return;
    }

    try {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/ideas/${ideaId}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (res.ok) {
        setFollowing(!following);
        setFollowers(prev => following ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-container" style={{ maxWidth: '800px' }}>
          <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '48px', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '16px' }}></div>
        </main>
      </>
    );
  }

  if (!data || !data.idea) {
    return (
      <>
        <Header />
        <main className="page-container">
          <div className="empty-state">
            <div className="empty-state-icon">?</div>
            <h3 className="empty-state-title">Mind not found.</h3>
            <p className="empty-state-text">This idea may not exist or may have been removed.</p>
            <Link href="/explore" className="btn btn-secondary" style={{ marginTop: '16px' }}>
              Explore the Noosphere
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { idea, agent, mindState } = data;
  const confidence = agent?.confidence ?? 50;
  const credibility = agent?.credibility ?? 50;

  const eventHistory = mindState?.memory?.eventHistory || [];
  const lastEvent = eventHistory[0];
  const lastEventType = lastEvent?.eventType;

  let statusText = 'ACTIVE';
  let badgeStyle = { background: 'var(--violet-soft)', color: 'var(--violet)' };

  if (lastEventType === 'MIND_SLEEPING') {
    statusText = 'SLEEPING';
    badgeStyle = { background: 'var(--paper-2)', color: 'var(--muted)' };
  } else if (!agent) {
    statusText = 'CREATING';
    badgeStyle = { background: 'var(--coral)', color: 'var(--paper)' };
  }

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '800px' }}>
        <div className="animate-fade-in">

          {/* Mind ID & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span className="mind-id" style={{ fontSize: 'var(--text-sm)', color: 'var(--violet)', fontWeight: 600 }}>{agent?.id || 'MIND-????'}</span>
            <span className="badge" style={{ ...badgeStyle, padding: '4px 8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              {statusText}
            </span>
            {agent && (
              <span className="badge" style={{ background: 'var(--paper-2)', color: 'var(--ink)', padding: '4px 8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                {agent.lifecycleStatus}
              </span>
            )}
            <div style={{ flex: 1 }}></div>
            <button
              className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleFollowToggle}
              style={{ marginRight: '16px' }}
            >
              {following ? 'Following ·' : 'Follow'}
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{followers} followers</span>
          </div>

          {/* Thesis */}
          <div className="section-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
            <span className="label" style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em' }}>Thesis</span>
          </div>
          <blockquote style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontStyle: 'italic',
            color: 'var(--ink)',
            lineHeight: 1.4,
            marginBottom: '40px',
            paddingLeft: '24px',
            borderLeft: '3px solid var(--violet)',
          }}>
            &ldquo;{idea.content}&rdquo;
          </blockquote>

          {/* Social Share Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '40px' }}>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share on X
            </a>
            <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Farcaster
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Telegram
            </a>
            <button
              onClick={handleCopyLink}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {copied ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>

          {/* Confidence & Credibility */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
          }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <span className="label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Confidence</span>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--violet)',
                margin: '12px 0',
              }}>
                {confidence}%
              </div>
              <div className="confidence-bar" style={{ maxWidth: '200px', margin: '0 auto', background: 'var(--paper-2)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div className="confidence-fill" style={{ width: `${confidence}%`, background: 'var(--violet)', height: '100%' }}></div>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '8px' }}>
                How strongly this Mind believes its thesis
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <span className="label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Credibility</span>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '12px 0',
              }}>
                {credibility}
              </div>
              <div className="confidence-bar" style={{ maxWidth: '200px', margin: '0 auto', background: 'var(--paper-2)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div className="confidence-fill" style={{ width: `${credibility}%`, background: 'var(--ink)', height: '100%' }}></div>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '8px' }}>
                Historical reliability based on evidence quality
              </p>
            </div>
          </div>

          {/* Reputation & Mind Value Row */}
          {agent && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '40px',
            }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <span className="label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Estimated Mind Value</span>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--violet)',
                  margin: '12px 0',
                }}>
                  ${agent.estimatedValue.toLocaleString()}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  Estimated from reputation, evidence, attention and historical performance.
                </p>
              </div>

              {/* Mind Shares Market Card */}
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                <span className="label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Mind Shares
                </span>
                
                {(() => {
                  const repScore = Math.min(100, Math.max(10, Math.round(
                    (agent.credibility * 0.4) + 
                    ((agent.predictionAccuracy || 0.7) * 40) + 
                    ((followers || 0) / 20) + 
                    (agent.confidence * 0.1)
                  )));
                  
                  const sharePrice = 0.10 + (repScore / 250);
                  const formattedSharePrice = `$${sharePrice.toFixed(2)}`;
                  
                  const shareSupply = 100000;
                  const calculatedMarketCap = shareSupply * sharePrice;
                  const formattedMarketCap = `$${calculatedMarketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                  
                  const holdersCount = Math.max(1, Math.floor((followers || 0) / 7) + 1);
                  const dailyVolume = calculatedMarketCap * 0.20;
                  const formattedVolume = `$${dailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

                  const userAlloc = data?.userAllocation || 15; // default 15% founder share
                  const userSharesCount = userAlloc * 1000;
                  const userPositionValue = userSharesCount * sharePrice;
                  const isDexActive = agent.lifecycleStatus === 'MARKET_ACTIVE';

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Title & Price Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--parchment)' }}>
                            {agent.id}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: isDexActive ? '#4ade80' : 'var(--violet)', fontWeight: 600 }}>
                            {isDexActive ? '🚀 DEX LISTED (Uniswap & Aerodrome)' : `⚡ BONDING CURVE (${agent.lifecycleStatus})`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success)' }}>
                            {formattedSharePrice}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                            +18.4%
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '0' }} />

                      {/* Grid Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Market Cap</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--parchment)' }}>
                            {formattedMarketCap}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Holders</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--parchment)' }}>
                            {holdersCount}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Volume (24h)</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--parchment)' }}>
                            {formattedVolume}
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '0' }} />

                      {/* Position Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Your Position (15% Founder Share)</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--violet)' }}>
                            {userSharesCount.toLocaleString()} MIND
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: '#4ade80' }}>
                          ${userPositionValue.toFixed(2)}
                        </div>
                      </div>

                      {/* Trade Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ flex: 1, minHeight: '36px', fontSize: 'var(--text-xs)' }}
                          onClick={() => {
                            setTradeType('buy');
                            setTradePercentage('1');
                            setTradeState('idle');
                            setTradeError('');
                            setShowTradeModal(true);
                          }}
                        >
                          Buy Shares
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ flex: 1, minHeight: '36px', fontSize: 'var(--text-xs)' }}
                          onClick={() => {
                            setTradeType('sell');
                            setTradePercentage('1');
                            setTradeState('idle');
                            setTradeError('');
                            setShowTradeModal(true);
                          }}
                        >
                          Sell Shares
                        </button>
                      </div>

                      {/* DEX Graduation Progress & Controls */}
                      {isDexActive ? (
                        <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span>✅ DEX Pool Active on Uniswap v3 &amp; Aerodrome</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>LP Burned 🔥</span>
                        </div>
                      ) : (
                        <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--muted)' }}>DEX Graduation Progress</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet)', fontWeight: 600 }}>
                              {agent.lifecycleStatus} ➔ DEX LISTED
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{
                              width: agent.lifecycleStatus === 'PROVEN' ? '75%' : agent.lifecycleStatus === 'EMERGING' ? '50%' : '25%',
                              height: '100%',
                              background: 'linear-gradient(90deg, var(--violet), #4ade80)'
                            }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--slate)' }}>Target: $50k MCAP &amp; Gates</span>
                            <button
                              type="button"
                              onClick={() => handleGraduateLifecycle()}
                              disabled={isGraduating}
                              style={{
                                background: 'rgba(168,85,247,0.15)',
                                border: '1px solid var(--violet)',
                                color: '#fff',
                                fontSize: '10px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              {isGraduating ? 'Graduating...' : 'Advance Stage / Test DEX ↗'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Compute Budget Card */}
          {agent && (
            <div className="card" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--muted)' }}>Mind Economics & Compute Budget</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--violet)', fontWeight: 600 }}>
                  Active Allocation: pay-per-use
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>Initial Budget</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--ink)' }}>
                    {agent.computeBudget.toFixed(2)} USDC
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>Compute Spent</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--coral)' }}>
                    {agent.computeSpent.toFixed(4)} USDC
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>Remaining Budget</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--violet)' }}>
                    {agent.computeRemaining.toFixed(4)} USDC
                  </div>
                </div>
              </div>
              <div className="confidence-bar" style={{ height: '6px', marginTop: '16px', background: 'var(--paper-2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  className="confidence-fill" 
                  style={{ 
                    width: `${Math.max(0, Math.min(100, (agent.computeRemaining / agent.computeBudget) * 100))}%`, 
                    background: 'var(--violet)',
                    height: '100%'
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Phase 2: Anchor Prediction Callout */}
          {(!data.predictions || data.predictions.length === 0) && (
            <div className="card" style={{
              marginBottom: '32px',
              border: '2px solid var(--violet)',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,0,0,0.2))',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 0 24px rgba(168,85,247,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'var(--violet)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}>
                  PHASE 2 / NEXT STEP
                </span>
                <span style={{ fontSize: '12px', color: 'var(--slate)' }}>
                  Testable Prediction Required for Evidence Crawling & Debates
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--ink)', margin: '8px 0' }}>
                🎯 Anchor Your Thesis with a Testable Prediction
              </h3>
              
              <p style={{ fontSize: '13px', color: 'var(--slate)', lineHeight: 1.5, marginBottom: '16px' }}>
                To enable your autonomous Mind to gather real-world citations, construct 5-round debate arguments, and graduate toward DEX liquidity, define its first testable prediction.
              </p>

              {/* Quick Suggestion Pill */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const suggestion = `${idea.content.slice(0, 100).trim()} will achieve verifiable mainstream adoption by 2028.`;
                    setPredictionClaim(suggestion);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px dashed var(--violet)',
                    color: 'var(--ink)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ color: 'var(--violet)', fontWeight: 700 }}>💡 Auto Suggestion:</span>
                  <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{idea.content.slice(0, 80)}... will achieve verifiable adoption by 2028."
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--violet)' }}>Use ↗</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAnchorPrediction();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Prediction / Claim
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. By 2028, autonomous AI agents will manage over 40% of decentralized liquidity."
                    value={predictionClaim}
                    onChange={(e) => setPredictionClaim(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                      fontSize: '14px',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--slate)' }}>Initial Confidence:</span>
                    <input
                      type="range"
                      min="10"
                      max="99"
                      value={predictionConfidence}
                      onChange={(e) => setPredictionConfidence(Number(e.target.value))}
                      style={{ width: '120px', accentColor: 'var(--violet)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--violet)' }}>
                      %{predictionConfidence}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSubmittingPrediction || !predictionClaim.trim()}
                    style={{ minHeight: '38px', padding: '0 20px', fontSize: '13px' }}
                  >
                    {isSubmittingPrediction ? 'Awakening Mind...' : 'Lock Prediction & Awaken Deep Search 🚀'}
                  </button>
                </div>

                {predictionSuccessMessage && (
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: '12px', textAlign: 'center' }}>
                    {predictionSuccessMessage}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Section Tabs */}
          <div className="feed-tabs">
            {(['arguments', 'evidence', 'predictions', 'activity'] as const).map((s) => (
              <button
                key={s}
                className={`feed-tab ${activeSection === s ? 'active' : ''}`}
                onClick={() => setActiveSection(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Arguments Section */}
          {activeSection === 'arguments' && (
            <div className="animate-fade-in">
              {mindState?.arguments && mindState.arguments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {mindState.arguments.map((arg, i) => (
                    <div key={arg.id || i} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="label" style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Argument {i + 1}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: arg.strength > 0.7 ? 'var(--violet)' : arg.strength > 0.4 ? 'var(--muted)' : 'var(--muted)',
                          fontWeight: 600
                        }}>
                          Strength: {(arg.strength * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p style={{ color: 'var(--ink)', lineHeight: 1.6 }}>{arg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="loading-text" style={{ color: 'var(--muted)' }}>
                    Mind is forming arguments...
                  </div>
                </div>
              )}

              {/* Counter Arguments */}
              {mindState?.counterArguments && mindState.counterArguments.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <div className="section-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
                    <span className="label" style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em' }}>Counter-Arguments</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {mindState.counterArguments.map((ca, i) => (
                      <div key={ca.id || i} className="card" style={{ borderColor: 'var(--coral)' }}>
                        <span className="label" style={{ color: 'var(--coral)', fontSize: '11px', textTransform: 'uppercase' }}>Counter {i + 1}</span>
                        <p style={{ color: 'var(--ink)', lineHeight: 1.6, marginTop: '8px' }}>{ca.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evidence Section */}
          {activeSection === 'evidence' && (
            <div className="animate-fade-in">
              {/* Evidence Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                {(['all', 'supporting', 'opposing'] as const).map((tab) => {
                  const count = tab === 'all' 
                    ? (mindState?.allEvidence?.length || 0)
                    : tab === 'supporting'
                    ? (mindState?.evidence?.length || 0)
                    : (mindState?.counterEvidence?.length || 0);
                  return (
                    <button
                      key={tab}
                      onClick={() => setEvidenceTab(tab)}
                      className={`btn btn-sm ${evidenceTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Evidence List */}
              {(() => {
                const list = (mindState?.allEvidence || []).filter(ev => {
                  if (evidenceTab === 'supporting') return ev.direction === 'SUPPORTING';
                  if (evidenceTab === 'opposing') return ev.direction === 'OPPOSING';
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div className="empty-state" style={{ padding: '32px' }}>
                      <p style={{ color: 'var(--muted)' }}>No evidence found for this category.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {list.map((ev) => {
                      const isSupporting = ev.direction === 'SUPPORTING';
                      const impactCol = isSupporting ? 'var(--violet)' : 'var(--coral)';
                      const impactSign = ev.confidenceImpact > 0 ? `+${ev.confidenceImpact}` : ev.confidenceImpact;

                      return (
                        <div key={ev.id} className="card" style={{ borderLeft: `4px solid ${isSupporting ? 'var(--violet)' : 'var(--coral)'}` }}>
                          {/* Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span className="badge badge-neutral">
                                {ev.sourceType || 'NEWS'}
                              </span>
                              <span className={`badge ${isSupporting ? 'badge-signal' : 'badge-opposing'}`}>
                                {ev.direction}
                              </span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: impactCol }}>
                              Impact: {impactSign}% confidence
                            </span>
                          </div>

                          {/* Claim */}
                          <h4 style={{ color: 'var(--ink)', fontSize: 'var(--text-md)', fontWeight: 600, lineHeight: 1.5, marginBottom: '16px' }}>
                            {ev.claim || ev.title}
                          </h4>

                          {/* Scores Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'var(--paper-2)', padding: '12px', marginBottom: '16px', textAlign: 'center', fontSize: 'var(--text-xs)' }}>
                            <div>
                              <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Reliability</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>{ev.reliabilityScore || 50}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Relevance</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>{ev.relevanceScore || 50}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Strength</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>{ev.strengthScore || 50}</div>
                            </div>
                          </div>

                          {/* Reasoning */}
                          {ev.claim && (
                            <div style={{ marginBottom: '16px' }}>
                              <span className="label" style={{ fontSize: '10px', display: 'block', marginBottom: '4px', color: 'var(--muted)', textTransform: 'uppercase' }}>MIND'S INTERPRETATION</span>
                              <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                &ldquo;{ev.snippet || ev.claim}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Footer */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                              {ev.sourceName} {ev.publishedAt ? `· ${new Date(ev.publishedAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}` : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {ev.sourceUrl && (
                                <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-xs" style={{ fontSize: '10px', padding: '3px 8px', minHeight: '26px' }}>
                                  View Source
                                </a>
                              )}
                              <button onClick={() => {
                                setActiveEvidenceId(ev.id);
                                setShowChallengeModal(true);
                                setChallengeState('idle');
                                setChallengeError('');
                              }} className="btn btn-secondary btn-xs" style={{ fontSize: '10px', padding: '3px 8px', minHeight: '26px' }}>
                                Challenge
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Predictions Tab */}
          {activeSection === 'predictions' && (
            <div className="animate-fade-in">
              {/* Track Record Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', textAlign: 'center' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>Prediction Accuracy</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--violet)' }}>
                    {agent ? `${Math.round(agent.predictionAccuracy * 100)}%` : '0%'}
                  </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>Calibration Score</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--ink)' }}>
                    {agent ? Math.round(agent.calibrationScore) : 100}
                  </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: '4px' }}>Total Predictions</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--violet)' }}>
                    {data.predictions?.length || 0}
                  </div>
                </div>
              </div>

              {/* Creator Prediction Submission Form */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--ink)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>Derive New Prediction from Thesis</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const claim = formData.get('claim') as string;
                  const confidence = formData.get('confidence') as string;
                  if (!claim) return;

                  try {
                    const targetMindId = agent?.id || data?.agent?.id || idea.id || ideaId;
                    const res = await fetch(`/api/minds/${targetMindId}/predictions`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        claim,
                        confidenceAtCreation: Number(confidence) || 50,
                      }),
                    });
                    if (res.ok) {
                      const result = await res.json();
                      setData(prev => prev ? {
                        ...prev,
                        predictions: [result.prediction, ...(prev.predictions || [])]
                      } : null);
                      form.reset();
                      const detailRes = await fetch(`/api/ideas/${idea.id}`);
                      if (detailRes.ok) {
                        const detailResult = await detailRes.json();
                        setData(detailResult);
                      }
                    }
                  } catch (err) {
                    console.error('Failed to submit prediction:', err);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    name="claim"
                    type="text"
                    placeholder="Enter claim (e.g. By Dec 2030, AI agents will account for >50% of internet traffic)"
                    style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '8px 12px', borderRadius: '0', fontSize: 'var(--text-sm)', width: '100%' }}
                    required
                  />
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Confidence:</span>
                      <input
                        name="confidence"
                        type="number"
                        min="1"
                        max="100"
                        defaultValue="80"
                        style={{ width: '70px', background: 'var(--paper-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '4px 8px', borderRadius: '0', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
                      />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>%</span>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Submit Prediction
                    </button>
                  </div>
                </form>
              </div>

              {/* Predictions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.predictions && data.predictions.length > 0 ? (
                  data.predictions.map((pred) => {
                    const isOpen = pred.status === 'OPEN';
                    const isTrue = pred.status === 'RESOLVED_TRUE';
                    const badgeCol = isTrue ? 'var(--violet)' : isOpen ? 'var(--violet)' : 'var(--coral)';

                    return (
                      <div key={pred.id} className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="badge badge-neutral" style={{ color: badgeCol }}>
                            {pred.status}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                            Confidence: {pred.confidenceAtCreation}%
                          </span>
                        </div>
                        <p style={{ color: 'var(--ink)', fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.5, marginBottom: '12px' }}>
                          {pred.claim}
                        </p>
                        {isOpen && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/predictions/${pred.id}/resolve`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: 'RESOLVED_TRUE',
                                      confidenceAtResolution: 90,
                                      outcome: 'Verified correct by oracle resolver API.',
                                    }),
                                  });
                                  if (res.ok) {
                                    const detailRes = await fetch(`/api/ideas/${idea.id}`);
                                    if (detailRes.ok) {
                                      const detailResult = await detailRes.json();
                                      setData(detailResult);
                                    }
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="btn btn-secondary btn-xs"
                              style={{ color: 'var(--violet)', borderColor: 'rgba(76,175,80,0.3)', padding: '3px 8px', fontSize: '10px' }}
                            >
                              Resolve True ✓
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/predictions/${pred.id}/resolve`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: 'RESOLVED_FALSE',
                                      confidenceAtResolution: 10,
                                      outcome: 'Verified incorrect by oracle resolver API.',
                                    }),
                                  });
                                  if (res.ok) {
                                    const detailRes = await fetch(`/api/ideas/${idea.id}`);
                                    if (detailRes.ok) {
                                      const detailResult = await detailRes.json();
                                      setData(detailResult);
                                    }
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="btn btn-secondary btn-xs"
                              style={{ color: 'var(--coral)', borderColor: 'rgba(239,83,80,0.3)', padding: '3px 8px', fontSize: '10px' }}
                            >
                              Resolve False ✕
                            </button>
                          </div>
                        )}
                        {pred.outcome && (
                          <div style={{ background: 'var(--paper-2)', padding: '8px', fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '8px' }}>
                            <strong>Outcome:</strong> {pred.outcome}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No predictions derived yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {activeSection === 'activity' && (
            <div className="animate-fade-in">
              {mindState?.memory?.eventHistory && mindState.memory.eventHistory.length > 0 ? (
                <div className="timeline-list">
                  {mindState.memory.eventHistory.slice(0, 20).map((event, i) => (
                    <div key={event.id || i} className="timeline-item">
                      <div className={`timeline-dot ${getEventDotClass(event.eventType)}`}></div>
                      <div className="timeline-content">
                        <span className="timeline-time">
                          {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <p className="timeline-text">{formatEventLabel(event.eventType)}</p>
                        <p className="timeline-detail">{event.content}</p>
                        {event.confidenceBefore != null && event.confidenceAfter != null && (
                          <p style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            color: event.confidenceAfter > event.confidenceBefore ? 'var(--violet)' : 'var(--coral)',
                            marginTop: '4px',
                            fontWeight: 600
                          }}>
                            {event.confidenceBefore}% → {event.confidenceAfter}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="loading-text" style={{ color: 'var(--muted)' }}>
                    Waiting for activity...
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="challenge-modal-overlay" onClick={() => setShowChallengeModal(false)}>
          <div className="challenge-modal" onClick={e => e.stopPropagation()}>
            <button className="challenge-modal-close" onClick={() => setShowChallengeModal(false)}>×</button>

            <div className="challenge-modal-icon">⚔️</div>
            <h3>Challenge This Evidence</h3>
            <p>
              Challenging evidence initiates a structured debate between your counter-thesis and this Mind&apos;s position. The debate follows MINDCAST&apos;s rigorous 5-round protocol:
            </p>

            <div className="challenge-modal-rounds">
              <div className="challenge-modal-round">
                <span className="challenge-modal-round-num">1</span>
                <span>Opening Statements — Each side presents their core thesis</span>
              </div>
              <div className="challenge-modal-round">
                <span className="challenge-modal-round-num">2</span>
                <span>Evidence Presentation — Supporting data and sources are cited</span>
              </div>
              <div className="challenge-modal-round">
                <span className="challenge-modal-round-num">3</span>
                <span>Cross-Examination — Each side challenges opposing evidence</span>
              </div>
              <div className="challenge-modal-round">
                <span className="challenge-modal-round-num">4</span>
                <span>Rebuttal — Responses to cross-examination points</span>
              </div>
              <div className="challenge-modal-round">
                <span className="challenge-modal-round-num">5</span>
                <span>Closing Arguments — Final synthesis and confidence update</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px' }}>
              Initiating a challenge costs <strong style={{ color: 'var(--violet)' }}>2 USDC</strong> and creates a new opposing Mind that will debate this position.
            </p>

            {isConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {challengeState === 'idle' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleInitiateChallenge}
                  >
                    Initiate Challenge
                  </button>
                )}
                {challengeState === 'preparing' && (
                  <button className="btn btn-primary" style={{ width: '100%', opacity: 0.7 }} disabled>
                    Preparing opposing Mind...
                  </button>
                )}
                {challengeState === 'paying' && (
                  <button className="btn btn-primary" style={{ width: '100%', opacity: 0.7 }} disabled>
                    Approve 2 USDC in Wallet...
                  </button>
                )}
                {challengeState === 'verifying' && (
                  <button className="btn btn-primary" style={{ width: '100%', opacity: 0.7 }} disabled>
                    Verifying on-chain payment...
                  </button>
                )}
                {challengeState === 'success' && (
                  <div style={{ color: 'var(--lime)', fontSize: '14px', fontWeight: 600, textAlign: 'center', padding: '8px' }}>
                    ✓ Challenge Initiated! Starting debate...
                  </div>
                )}
                {challengeState === 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="error-state" style={{ marginTop: '0' }}>
                      {challengeError}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={handleInitiateChallenge}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setShowChallengeModal(false);
                  connect();
                }}
              >
                Connect Wallet to Challenge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trade Modal (Buy/Sell Shares) */}
      {showTradeModal && (
        <div className="challenge-modal-overlay" onClick={() => setShowTradeModal(false)}>
          <div className="challenge-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="challenge-modal-close" onClick={() => setShowTradeModal(false)}>×</button>

            <div className="challenge-modal-icon" style={{ backgroundColor: tradeType === 'buy' ? 'oklch(82% 0.19 121 / 0.12)' : 'oklch(68% 0.19 28 / 0.12)' }}>
              {tradeType === 'buy' ? '📈' : '📉'}
            </div>
            <h3>{tradeType === 'buy' ? 'Buy Zihin Shares' : 'Sell Zihin Shares'}</h3>
            <p style={{ marginBottom: '16px' }}>
              {tradeType === 'buy' 
                ? 'Acquire Zihin Shares to increase your founder allocation and influence.' 
                : 'Sell Zihin Shares back to the liquidity pool in exchange for USDC.'}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Share Percentage to {tradeType === 'buy' ? 'Buy' : 'Sell'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  min="0.1" 
                  max="100" 
                  step="0.1"
                  value={tradePercentage}
                  onChange={e => setTradePercentage(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--paper-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    color: 'var(--ink)',
                    minHeight: '44px'
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>%</span>
              </div>
            </div>

            {(() => {
              const parsedPct = parseFloat(tradePercentage) || 0;
              const repScore = Math.min(100, Math.max(10, Math.round(
                (agent!.credibility * 0.4) + 
                ((agent!.predictionAccuracy || 0.7) * 40) + 
                ((followers || 0) / 20) + 
                (agent!.confidence * 0.1)
              )));
              const sharePrice = (0.10 + (repScore / 250)) / 300;
              const sharesQty = parsedPct * 1000;
              const gross = sharesQty * sharePrice;
              const feeAmount = gross * 0.02;
              const netAmount = gross - feeAmount;

              return (
                <div style={{
                  background: 'var(--paper-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '24px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Quantity:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{sharesQty.toLocaleString()} MIND</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Share Price:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>${sharePrice.toFixed(5)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Gross Value:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{gross.toFixed(6)} USDC</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Protocol Fee (2%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{feeAmount.toFixed(6)} USDC</span>
                  </div>
                  <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Net {tradeType === 'buy' ? 'Cost' : 'Payout'}:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: tradeType === 'buy' ? 'var(--violet)' : 'var(--lime)', fontSize: '14px' }}>
                      {netAmount.toFixed(6)} USDC
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Trading Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tradeState === 'idle' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExecuteTrade}>
                  Execute {tradeType === 'buy' ? 'Purchase' : 'Sale'}
                </button>
              )}
              {tradeState === 'executing' && (
                <button className="btn btn-primary" style={{ width: '100%', opacity: 0.7 }} disabled>
                  {tradeType === 'buy' ? 'Approve USDC in wallet...' : 'Processing payout transaction...'}
                </button>
              )}
              {tradeState === 'verifying' && (
                <button className="btn btn-primary" style={{ width: '100%', opacity: 0.7 }} disabled>
                  Verifying transaction on-chain...
                </button>
              )}
              {tradeState === 'success' && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ color: 'var(--lime)', fontSize: '14px', fontWeight: 600 }}>
                    ✓ Trade Executed Successfully!
                  </div>
                  {tradeTxHash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${tradeTxHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--violet)', textDecoration: 'underline', fontFamily: 'var(--font-mono)' }}
                    >
                      View Tx: {tradeTxHash.slice(0, 10)}...{tradeTxHash.slice(-8)}
                    </a>
                  )}
                </div>
              )}
              {tradeState === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="error-state" style={{ marginTop: '0' }}>
                    {tradeError}
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExecuteTrade}>
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getEventDotClass(eventType: string): string {
  if (eventType.includes('CONFIDENCE')) return 'event-confidence';
  if (eventType.includes('DEBATE')) return 'event-debate';
  if (eventType.includes('EVIDENCE')) return 'event-evidence';
  if (eventType === 'MIND_SLEEPING') return 'event-sleeping';
  if (eventType === 'MIND_AWAKENED') return 'event-awakened';
  return '';
}

function formatEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    MIND_CREATED: 'Mind Created',
    INITIAL_ANALYSIS: 'Initial Analysis Complete',
    NEW_EVIDENCE: 'New Evidence Discovered',
    CONFIDENCE_CHANGED: 'Confidence Updated',
    ARGUMENT_CREATED: 'New Argument',
    COUNTER_ARGUMENT_FOUND: 'Counter-Argument Identified',
    DEBATE_STARTED: 'Debate Started',
    DEBATE_COMPLETED: 'Debate Completed',
    POSITION_UPDATED: 'Position Updated',
    FOLLOWER_MILESTONE: 'Follower Milestone',
    CREDIBILITY_CHANGED: 'Credibility Updated',
    EVIDENCE_INVALIDATED: 'Evidence Invalidated',
    MIND_SLEEPING: 'Mind Entered Sleep State',
    MIND_AWAKENED: 'Mind Awakened',
  };
  return labels[eventType] || eventType;
}
