'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useWallet } from '@/hooks/useWallet';
import { MOCK_MINDS } from '@/mocks/minds';
import type { Idea, Agent, MindState, Prediction, Evidence, AgentEvent } from '@/lib/types';

interface IdeaPageData {
  idea: Idea;
  agent: Agent | null;
  mindState: MindState | null;
  predictions?: Prediction[];
  followerCount: number;
  isFollowing?: boolean;
  mindAsset?: any | null;
  mindFounder?: any | null;
  userAllocation?: number;
  creator?: { id?: string; walletAddress?: string; username?: string | null; displayName?: string | null; avatarUrl?: string | null } | null;
}

type TabType = 'overview' | 'evidence' | 'debate' | 'predictions' | 'history';

const TESTNET_CHAINS = [
  {
    id: 84532,
    key: 'base-sepolia',
    name: 'Base Sepolia',
    icon: '🔵',
    currency: 'ETH',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    explorer: 'https://sepolia.basescan.org',
  },
  {
    id: 10143,
    key: 'monad-testnet',
    name: 'Monad Testnet',
    icon: '🟣',
    currency: 'MON',
    usdcAddress: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
    explorer: 'https://testnet.monadexplorer.com',
  },
  {
    id: 46631,
    key: 'robinhood-testnet',
    name: 'Robinhood Testnet',
    icon: '🟢',
    currency: 'ETH',
    usdcAddress: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
    explorer: 'https://testnet.robinhoodchain.blockscout.com',
  },
];

export default function IdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = use(params);
  const { isConnected, address, chainId, connect, sendUsdc, switchChain } = useWallet();

  const [data, setData] = useState<IdeaPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Follow & Share states
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Evidence filtering & Flagging
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'supporting' | 'opposing'>('all');
  const [flagModalEvidence, setFlagModalEvidence] = useState<Evidence | null>(null);
  const [flagReason, setFlagReason] = useState('Misrepresented Citation');
  const [flagNotes, setFlagNotes] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);

  // Debate contribution
  const [newArgContent, setNewArgContent] = useState('');
  const [newArgStance, setNewArgStance] = useState<'SUPPORTING' | 'CHALLENGING' | 'QUESTION'>('CHALLENGING');
  const [argSubmitting, setArgSubmitting] = useState(false);
  const [argMessage, setArgMessage] = useState('');

  // Polymarket-Style Argument Staking on Testnet
  const [activeStakeModal, setActiveStakeModal] = useState<{ argumentId: string; side: 'SUPPORT' | 'CHALLENGE'; argumentContent: string } | null>(null);
  const [stakeAmount, setStakeAmount] = useState('5');
  const [stakeSubmitting, setStakeSubmitting] = useState(false);
  const [stakeMessage, setStakeMessage] = useState<string | null>(null);
  const [marketSummaries, setMarketSummaries] = useState<Record<string, any>>({});
  const [selectedStakeChainId, setSelectedStakeChainId] = useState<number>(84532);
  const [lastStakeExplorerUrl, setLastStakeExplorerUrl] = useState<string | null>(null);

  // Agent Research Compute Sponsorship on Testnet
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorAmount, setSponsorAmount] = useState('5');
  const [sponsorMessage, setSponsorMessage] = useState('');
  const [sponsorSubmitting, setSponsorSubmitting] = useState(false);
  const [sponsorSuccess, setSponsorSuccess] = useState<string | null>(null);
  const [selectedSponsorChainId, setSelectedSponsorChainId] = useState<number>(84532);
  const [lastSponsorExplorerUrl, setLastSponsorExplorerUrl] = useState<string | null>(null);

  // Prediction submission
  const [predClaim, setPredClaim] = useState('');
  const [predDeadline, setPredDeadline] = useState('2027-12-31');
  const [predConfidence, setPredConfidence] = useState(80);
  const [predSubmitting, setPredSubmitting] = useState(false);
  const [predMessage, setPredMessage] = useState('');

  // Expandable economics section
  const [showEconomicsDrawer, setShowEconomicsDrawer] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const url = address ? `/api/ideas/${ideaId}?walletAddress=${address}` : `/api/ideas/${ideaId}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.idea) {
          setData(json);
          setFollowing(Boolean(json.isFollowing));
          setFollowerCount(json.followerCount || 0);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend fetch failed, attempting fixture fallback:', err);
    }

    // Fixture fallback for local development or prototype minds
    const mockMind = MOCK_MINDS.find(
      m => m.id === ideaId ||
      m.handle === ideaId ||
      m.name.toLowerCase().includes(ideaId.toLowerCase())
    );

    if (mockMind) {
      setData({
        idea: {
          id: mockMind.id,
          creatorId: 'mock-creator',
          content: mockMind.claim,
          agentId: mockMind.id,
          status: 'PUBLISHED' as any,
          tokenName: mockMind.name,
          tokenTicker: mockMind.name.replace(/\s+/g, ''),
          createdAt: mockMind.createdAt,
          publishedAt: mockMind.createdAt,
        },
        agent: {
          id: mockMind.id,
          ideaId: mockMind.id,
          thesis: mockMind.claim,
          confidence: mockMind.confidence ?? 50,
          credibility: 85,
          systemPrompt: '',
          computeBudget: 100,
          computeSpent: 40,
          computeRemaining: 60,
          lifecycleStatus: (mockMind.status === 'Proven' ? 'PROVEN' : mockMind.status === 'Debating' ? 'ACTIVE' : 'EMERGING') as any,
          predictionAccuracy: 88,
          calibrationScore: 92,
          estimatedValue: 12500,
          marketStatus: 'Active',
          createdAt: mockMind.createdAt,
          updatedAt: mockMind.createdAt,
        } as any,
        mindState: {
          agent: {} as any,
          thesis: mockMind.claim,
          belief: {
            confidence: mockMind.confidence ?? 50,
            credibility: 85,
            assumptions: [],
            strengths: [],
            weaknesses: [],
            lastUpdated: mockMind.createdAt,
          },
          evidence: [],
          counterEvidence: [],
          allEvidence: [],
          arguments: [],
          counterArguments: [],
          memory: {
            agentId: mockMind.id,
            eventHistory: [],
            debateHistory: [],
            evidenceTimeline: [],
            confidenceHistory: [],
            positionChanges: [],
          },
        } as any,
        predictions: [],
        followerCount: 128,
        isFollowing: false,
      });
    }


    setLoading(false);
  }, [ideaId, address]);

  useEffect(() => {
    setLoading(true);
    fetchDetail();
  }, [fetchDetail]);

  const handleFollowToggle = async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }
    const next = !following;
    setFollowing(next);
    setFollowerCount(prev => next ? prev + 1 : Math.max(0, prev - 1));

    try {
      const method = next ? 'POST' : 'DELETE';
      await fetch(`/api/ideas/${ideaId}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
    } catch (err) {
      console.error('Follow failed:', err);
      setFollowing(!next);
      setFollowerCount(prev => !next ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlaceStake = async (isSimulation = false) => {
    if (!activeStakeModal) return;
    if (!isConnected || !address) {
      await connect();
      return;
    }

    const num = parseFloat(stakeAmount);
    if (isNaN(num) || num < 0.5) {
      setStakeMessage('Minimum stake is $0.50 USDC');
      return;
    }

    setStakeSubmitting(true);
    setStakeMessage(null);
    setLastStakeExplorerUrl(null);

    const selectedChain = TESTNET_CHAINS.find(c => c.id === selectedStakeChainId) || TESTNET_CHAINS[0];
    let txHash: string | undefined = undefined;

    if (!isSimulation) {
      // 1. Check if wallet is on selected testnet
      if (chainId !== String(selectedChain.id)) {
        setStakeMessage(`Switching wallet to ${selectedChain.name}...`);
        const switched = await switchChain(selectedChain.id);
        if (!switched) {
          setStakeMessage(`Please approve network switch to ${selectedChain.name} in your wallet.`);
          setStakeSubmitting(false);
          return;
        }
      }

      // 2. Perform testnet USDC transfer to treasury
      try {
        setStakeMessage(`Please confirm the $${num.toFixed(2)} USDC transfer in your wallet...`);
        const treasury = '0x33f18d0BD613A2afa4694A8AAA6b1daf4FEBdbd2';
        txHash = await sendUsdc(treasury, num.toString());
        setStakeMessage(`Transaction submitted! Recording stake on ${selectedChain.name}...`);
      } catch (txErr: any) {
        console.warn('[Polymarket Testnet] Transfer notice:', txErr);
        if (txErr?.code === 4001 || txErr?.message?.includes('User rejected') || txErr?.message?.includes('denied')) {
          setStakeMessage('Transaction was cancelled in wallet.');
          setStakeSubmitting(false);
          return;
        }
        setStakeMessage(`Wallet transfer failed (${txErr.message?.slice(0, 70) || 'insufficient balance'}). You can also use "Instant Testnet Faucet" below.`);
        setStakeSubmitting(false);
        return;
      }
    } else {
      // Zero-gas simulation on selected testnet
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const targetAgent = data?.agent?.id || ideaId;
    try {
      const res = await fetch(`/api/minds/${targetAgent}/arguments/${activeStakeModal.argumentId}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: address,
          side: activeStakeModal.side,
          amount: num,
          token: 'USDC',
          chain: selectedChain.key,
          txHash,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setStakeMessage(resData.error || 'Failed to place stake');
      } else {
        setMarketSummaries(prev => ({
          ...prev,
          [activeStakeModal.argumentId]: resData.summary,
        }));
        const explorerUrl = `${selectedChain.explorer}/tx/${txHash}`;
        setLastStakeExplorerUrl(explorerUrl);
        setStakeMessage(`✓ Staked $${num.toFixed(2)} USDC on ${activeStakeModal.side} via ${selectedChain.name}!`);
        setTimeout(() => {
          setActiveStakeModal(null);
          setStakeMessage(null);
          setLastStakeExplorerUrl(null);
        }, 3500);
      }
    } catch (err: any) {
      setStakeMessage(err.message || 'Error executing stake');
    } finally {
      setStakeSubmitting(false);
    }
  };

  const handleSponsorCompute = async (isSimulation = false) => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    const num = parseFloat(sponsorAmount);
    if (isNaN(num) || num < 0.5) {
      setSponsorSuccess('Minimum sponsorship is $0.50 USDC');
      return;
    }

    setSponsorSubmitting(true);
    setSponsorSuccess(null);
    setLastSponsorExplorerUrl(null);

    const selectedChain = TESTNET_CHAINS.find(c => c.id === selectedSponsorChainId) || TESTNET_CHAINS[0];
    let txHash: string | undefined = undefined;

    if (!isSimulation) {
      if (chainId !== String(selectedChain.id)) {
        setSponsorSuccess(`Switching wallet to ${selectedChain.name}...`);
        const switched = await switchChain(selectedChain.id);
        if (!switched) {
          setSponsorSuccess(`Please approve network switch to ${selectedChain.name} in your wallet.`);
          setSponsorSubmitting(false);
          return;
        }
      }

      try {
        setSponsorSuccess(`Please confirm the $${num.toFixed(2)} USDC grant in your wallet...`);
        const treasury = '0x33f18d0BD613A2afa4694A8AAA6b1daf4FEBdbd2';
        txHash = await sendUsdc(treasury, num.toString());
        setSponsorSuccess(`Transaction submitted! Recording grant on ${selectedChain.name}...`);
      } catch (txErr: any) {
        console.warn('[Compute Sponsor Testnet] Transfer notice:', txErr);
        if (txErr?.code === 4001 || txErr?.message?.includes('User rejected') || txErr?.message?.includes('denied')) {
          setSponsorSuccess('Transaction was cancelled in wallet.');
          setSponsorSubmitting(false);
          return;
        }
        setSponsorSuccess(`Wallet transfer failed (${txErr.message?.slice(0, 70) || 'insufficient balance'}). You can also use "Instant Testnet Faucet" below.`);
        setSponsorSubmitting(false);
        return;
      }
    } else {
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const targetAgent = data?.agent?.id || ideaId;
    try {
      const res = await fetch(`/api/minds/${targetAgent}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: address,
          amount: num,
          token: 'USDC',
          message: sponsorMessage.trim(),
          chain: selectedChain.key,
          txHash,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setSponsorSuccess(resData.error || 'Failed to sponsor mind');
      } else {
        const explorerUrl = `${selectedChain.explorer}/tx/${txHash}`;
        setLastSponsorExplorerUrl(explorerUrl);
        setSponsorSuccess(`✓ Sponsored $${num.toFixed(2)} USDC compute to ${targetAgent} via ${selectedChain.name}!`);
        await fetchDetail();
        setTimeout(() => {
          setIsSponsorModalOpen(false);
          setSponsorSuccess(null);
          setSponsorMessage('');
          setLastSponsorExplorerUrl(null);
        }, 3500);
      }
    } catch (err: any) {
      setSponsorSuccess(err.message || 'Error submitting grant');
    } finally {
      setSponsorSubmitting(false);
    }
  };


  const handleFlagSubmit = async () => {
    if (!flagModalEvidence) return;
    setFlagSubmitting(true);
    try {
      const res = await fetch(`/api/evidence/${flagModalEvidence.id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: flagReason,
          notes: flagNotes,
          userWallet: address || undefined,
        }),
      });
      if (res.ok) {
        setFlagSuccess(true);
        setTimeout(() => {
          setFlagModalEvidence(null);
          setFlagSuccess(false);
          setFlagNotes('');
        }, 1500);
      }
    } catch (err) {
      console.error('Flag failed:', err);
    } finally {
      setFlagSubmitting(false);
    }
  };

  const handleContributeArgument = async () => {
    if (!newArgContent.trim() || newArgContent.trim().length < 10) {
      setArgMessage('Please enter an argument of at least 10 characters.');
      return;
    }
    const agentId = data?.agent?.id || data?.idea?.id || ideaId;
    setArgSubmitting(true);
    setArgMessage('');

    try {
      const res = await fetch(`/api/minds/${agentId}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newArgContent.trim(),
          stance: newArgStance,
          authorWallet: address || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to submit argument');
      }

      setNewArgContent('');
      setArgMessage('Argument submitted successfully.');
      await fetchDetail();
    } catch (err: any) {
      setArgMessage(err.message || 'Error submitting argument');
    } finally {
      setArgSubmitting(false);
    }
  };

  const handleCreatePrediction = async () => {
    if (!predClaim.trim() || predClaim.trim().length < 10) {
      setPredMessage('Please enter a specific, testable prediction statement.');
      return;
    }
    const agentId = data?.agent?.id || data?.idea?.id || ideaId;
    setPredSubmitting(true);
    setPredMessage('');

    try {
      const res = await fetch(`/api/minds/${agentId}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: predClaim.trim(),
          confidenceAtCreation: predConfidence,
          targetDate: predDeadline,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to lock prediction');
      }

      setPredClaim('');
      setPredMessage('Prediction recorded permanently with timestamp.');
      await fetchDetail();
    } catch (err: any) {
      setPredMessage(err.message || 'Error locking prediction');
    } finally {
      setPredSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Mind Dossier" showRightRail={false}>
        <div style={{ maxWidth: '960px', margin: '60px auto', padding: '40px 24px', textAlign: 'center' }}>
          <div className="loading-dot" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--mute)' }}>Loading cognitive dossier...</div>
        </div>
      </AppShell>
    );
  }

  if (!data || !data.idea) {
    return (
      <AppShell title="Mind Not Found" showRightRail={false}>
        <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <h2 style={{ fontSize: '24px', color: 'var(--ink)' }}>Mind Not Found</h2>
          <p style={{ color: 'var(--mute)', margin: '12px 0 24px' }}>The living idea you are looking for does not exist or has been removed.</p>
          <Link href="/explore" className="pri" style={{ padding: '8px 20px', borderRadius: '100px', textDecoration: 'none', display: 'inline-block' }}>Return to Explore</Link>
        </div>
      </AppShell>
    );
  }

  const idea = data.idea;
  const agent = data.agent;
  const mindState = data.mindState;
  const evidenceList = mindState?.evidence || [];
  const argumentsList = mindState?.arguments || [];
  const predictionsList = data.predictions || [];
  const eventsList = mindState?.memory?.eventHistory || [];

  const agentId = agent?.id || `MIND-${idea.id.slice(0, 4).toUpperCase()}`;
  const statusLabel = agent?.lifecycleStatus === 'MARKET_ACTIVE' || agent?.lifecycleStatus === 'PROVEN'
    ? 'PROVEN'
    : (argumentsList.length > 0 ? 'DEBATING' : 'EXPLORING');

  const filteredEvidence = evidenceList.filter(e => {
    if (evidenceFilter === 'supporting') return e.direction === 'SUPPORTING' || e.stance === 'SUPPORTING';
    if (evidenceFilter === 'opposing') return e.direction === 'OPPOSING' || e.stance === 'OPPOSING';
    return true;
  });

  const latestEvent = eventsList.length > 0 ? eventsList[0] : null;

  return (
    <AppShell title={agentId} showRightRail={false}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/explore" style={{ fontSize: '13px', color: 'var(--cyan)', textDecoration: 'none' }}>
            ← Back to Explore Feed
          </Link>
        </div>

        {/* ─── DOSSIER HEADER ─── */}
        <header style={{
          background: 'var(--bg-card, #0E131A)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '36px',
          marginBottom: '32px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Metadata Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--cyan)',
                background: 'rgba(79, 195, 247, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(79, 195, 247, 0.25)',
              }}>
                {agentId}
              </span>
              <span className={`badge-status ${statusLabel.toLowerCase()}`}>
                {statusLabel}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Published {new Date(idea.publishedAt || idea.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleShare}
                className="btn-secondary"
                style={{ minHeight: '34px', padding: '0 14px', fontSize: '12px' }}
              >
                {copied ? 'Link Copied ✓' : 'Share ↗'}
              </button>
              <button
                onClick={handleFollowToggle}
                className="btn-primary"
                style={{
                  minHeight: '34px',
                  padding: '0 18px',
                  fontSize: '12px',
                  background: following ? 'transparent' : 'var(--cyan)',
                  border: following ? '1px solid var(--cyan)' : 'none',
                  color: following ? 'var(--cyan)' : '#05070A',
                }}
              >
                {following ? `Following (${followerCount})` : `Follow (${followerCount})`}
              </button>
            </div>
          </div>

          {/* Thesis */}
          <h1 style={{
            fontSize: 'clamp(24px, 3.2vw, 36px)',
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: '0 0 20px',
            fontFamily: 'var(--serif)',
          }}>
            {agent?.thesis || idea.content}
          </h1>

          {/* Creator & Origin Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
              <span>Originator:</span>
              {data.creator?.walletAddress ? (
                <Link
                  href={`/profile/${data.creator.username || data.creator.walletAddress}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--mono)',
                    color: '#38BDF8',
                    textDecoration: 'none',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '100px',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>👤 @{data.creator.username || `${data.creator.walletAddress.slice(0, 6)}...${data.creator.walletAddress.slice(-4)}`}</span>
                </Link>
              ) : (
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>Sovereign Author</span>
              )}
            </div>

            {/* Epistemic Calibration Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {agent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Assessed Confidence:</span>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: agent.confidence > 75 ? 'var(--cyan)' : agent.confidence > 45 ? '#F59E0B' : '#F43F5E',
                  }}>
                    {evidenceList.length > 0 || agent.confidence !== 50 ? `${agent.confidence.toFixed(1)}%` : 'Not yet assessed'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Latest Update Banner */}
          {latestEvent && (
            <div style={{
              marginTop: '20px',
              background: 'rgba(79, 195, 247, 0.05)',
              border: '1px solid rgba(79, 195, 247, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan)' }} />
                <span style={{ color: 'var(--muted)' }}>Latest Development:</span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{latestEvent.content}</span>
              </div>
              <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                {new Date(latestEvent.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </header>

        {/* ─── DOSSIER TABS ─── */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: '32px',
          gap: '12px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'evidence', label: `Evidence (${evidenceList.length})` },
            { id: 'debate', label: `Debate (${argumentsList.length})` },
            { id: 'predictions', label: `Predictions (${predictionsList.length})` },
            { id: 'history', label: `History (${eventsList.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: `2px solid ${activeTab === t.id ? 'var(--cyan)' : 'transparent'}`,
                color: activeTab === t.id ? 'var(--cyan)' : 'var(--muted)',
                fontWeight: activeTab === t.id ? 600 : 500,
                fontSize: '14px',
                padding: '12px 18px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Core Breakdown & Assumptions
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.7, margin: '0 0 20px' }}>
                {agent?.thesis || idea.content}
              </p>

              {(agent as any)?.assumptions && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Identified Assumptions:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {(Array.isArray((agent as any).assumptions) ? (agent as any).assumptions : JSON.parse((agent as any).assumptions || '[]')).map((asm: string, i: number) => (
                      <span key={i} style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'var(--muted)' }}>
                        • {asm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Jump Navigation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div
                onClick={() => setActiveTab('evidence')}
                style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📚</span>
                  <span style={{ fontSize: '12px', color: 'var(--cyan)' }}>{evidenceList.length} Sources →</span>
                </div>
                <h4 style={{ fontSize: '16px', color: 'var(--ink)', margin: '0 0 6px' }}>Indexed Evidence</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Grounded peer and news citations confirming or challenging this claim.</p>
              </div>

              <div
                onClick={() => setActiveTab('debate')}
                style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚔️</span>
                  <span style={{ fontSize: '12px', color: 'var(--cyan)' }}>{argumentsList.length} Debates →</span>
                </div>
                <h4 style={{ fontSize: '16px', color: 'var(--ink)', margin: '0 0 6px' }}>Adversarial Debate</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Pro and con arguments stress-testing the thesis with community input.</p>
              </div>

              <div
                onClick={() => setActiveTab('predictions')}
                style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🎯</span>
                  <span style={{ fontSize: '12px', color: 'var(--cyan)' }}>{predictionsList.length} Predictions →</span>
                </div>
                <h4 style={{ fontSize: '16px', color: 'var(--ink)', margin: '0 0 6px' }}>Testable Predictions</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Empirical milestones with explicit deadlines and immutable verification terms.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: EVIDENCE ─── */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'supporting', 'opposing'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setEvidenceFilter(filter)}
                  style={{
                    background: evidenceFilter === filter ? 'rgba(79, 195, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${evidenceFilter === filter ? 'var(--cyan)' : 'var(--border)'}`,
                    color: evidenceFilter === filter ? 'var(--cyan)' : 'var(--muted)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {filter} Evidence
                </button>
              ))}
            </div>

            {filteredEvidence.length === 0 ? (
              <div style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', margin: 0 }}>No evidence records matching this category.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredEvidence.map((ev) => {
                  const isSupp = ev.direction === 'SUPPORTING' || ev.stance === 'SUPPORTING';
                  return (
                    <div
                      key={ev.id}
                      style={{
                        background: 'var(--bg-card, #0E131A)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isSupp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isSupp ? '#10B981' : '#F43F5E',
                            border: `1px solid ${isSupp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                          }}>
                            {isSupp ? '✓ Supports' : '✗ Challenges'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                            {ev.sourceName || ev.source || 'Verified Source'}
                          </span>
                          {ev.publishedAt && (
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              ({new Date(ev.publishedAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setFlagModalEvidence(ev)}
                          style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          🚩 Flag Source
                        </button>
                      </div>

                      <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                        "{ev.claim || ev.snippet || ev.title}"
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '12px' }}>
                        <span style={{ color: 'var(--muted)' }}>
                          Reliability: <strong style={{ color: 'var(--ink)' }}>{ev.reliabilityScore || 85}/100</strong> · Impact: <strong style={{ color: isSupp ? '#10B981' : '#F43F5E' }}>{ev.confidenceImpact ? `${ev.confidenceImpact > 0 ? '+' : ''}${ev.confidenceImpact}%` : 'Direct'}</strong>
                        </span>

                        {ev.sourceUrl && (
                          <a
                            href={ev.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            Read Full Source ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: DEBATE ─── */}
        {activeTab === 'debate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Agent Compute Research Sponsorship Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.08) 0%, rgba(129, 140, 248, 0.06) 100%)',
              border: '1px solid rgba(79, 195, 247, 0.25)',
              borderRadius: '20px',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                    Agent Research Compute: {agent?.computeRemaining?.toFixed(1) || '1.0'} / {agent?.computeBudget?.toFixed(1) || '1.0'} CU
                  </h4>
                </div>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, maxWidth: '580px', lineHeight: 1.5 }}>
                  Fund this autonomous Mind with USDC to trigger deep literature synthesis, run adversarial counter-argument searches, and stress-test opposing hypotheses.
                </p>
              </div>
              <button
                onClick={() => setIsSponsorModalOpen(true)}
                className="btn"
                style={{
                  background: '#4FC3F7',
                  color: '#05070A',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px 22px',
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(79, 195, 247, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚡ Sponsor Research Compute
              </button>
            </div>

            {/* Interactive contribution form */}
            <div style={{
              background: 'var(--bg-card, #0E131A)',
              border: '1px solid rgba(79, 195, 247, 0.2)',
              borderRadius: '20px',
              padding: '24px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>
                Contribute to the Debate
              </h3>

              {/* Guiding Prompt Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {[
                  'What evidence supports this?',
                  'What is the strongest counterargument?',
                  'What would change your mind?',
                  'Which assumption has not been tested?',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setNewArgContent(prompt + ' ')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>

              {/* Stance Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => setNewArgStance('SUPPORTING')}
                  style={{
                    background: newArgStance === 'SUPPORTING' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: `1px solid ${newArgStance === 'SUPPORTING' ? '#10B981' : 'var(--border)'}`,
                    color: newArgStance === 'SUPPORTING' ? '#10B981' : 'var(--muted)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Supporting Argument
                </button>
                <button
                  onClick={() => setNewArgStance('CHALLENGING')}
                  style={{
                    background: newArgStance === 'CHALLENGING' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                    border: `1px solid ${newArgStance === 'CHALLENGING' ? '#F43F5E' : 'var(--border)'}`,
                    color: newArgStance === 'CHALLENGING' ? '#F43F5E' : 'var(--muted)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Counter-Argument / Challenge
                </button>
                <button
                  onClick={() => setNewArgStance('QUESTION')}
                  style={{
                    background: newArgStance === 'QUESTION' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    border: `1px solid ${newArgStance === 'QUESTION' ? '#F59E0B' : 'var(--border)'}`,
                    color: newArgStance === 'QUESTION' ? '#F59E0B' : 'var(--muted)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Untested Assumption
                </button>
              </div>

              <textarea
                value={newArgContent}
                onChange={(e) => setNewArgContent(e.target.value)}
                placeholder="Formulate your empirical argument, cite relevant literature, or highlight logical gaps..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />

              {argMessage && (
                <div style={{ fontSize: '12px', color: 'var(--cyan)', marginTop: '8px' }}>
                  {argMessage}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  onClick={handleContributeArgument}
                  disabled={argSubmitting}
                  className="btn-primary"
                  style={{ minHeight: '36px', padding: '0 20px', fontSize: '13px' }}
                >
                  {argSubmitting ? 'Posting...' : 'Submit Argument →'}
                </button>
              </div>
            </div>

            {/* List of Arguments with Polymarket-Style Prediction Stakes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                  Dialectical Field & Live Argument Markets
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Back points with USDC to earn prediction yield
                </span>
              </div>

              {argumentsList.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                  No debate arguments formulated yet. Be the first to challenge or back this thesis!
                </div>
              ) : (
                argumentsList.map((arg, idx) => {
                  const isChallenge = arg.stance === 'CHALLENGING' || idx % 2 === 1;
                  const summary = marketSummaries[arg.id] || {
                    supportOdds: isChallenge ? 38 : 65,
                    challengeOdds: isChallenge ? 62 : 35,
                    supportMultiplier: isChallenge ? 2.63 : 1.54,
                    challengeMultiplier: isChallenge ? 1.61 : 2.86,
                    totalPool: 120 + (idx * 45),
                    supportPool: isChallenge ? 45.6 : 78,
                    challengePool: isChallenge ? 74.4 : 42,
                  };

                  return (
                    <div
                      key={arg.id}
                      style={{
                        background: 'rgba(14, 19, 26, 0.85)',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${isChallenge ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        borderRadius: '20px',
                        padding: '22px',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: isChallenge ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isChallenge ? '#F43F5E' : '#10B981',
                            border: `1px solid ${isChallenge ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          }}>
                            {isChallenge ? '⚔️ Counter-Challenge' : '🛡️ Supporting Thesis'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--mono)' }}>
                            Strength: {Math.round((arg.strength || 0.8) * 100)}%
                          </span>
                        </div>

                        {/* Author Link to Profile */}
                        {arg.authorWallet ? (
                          <Link
                            href={`/profile/${arg.authorWallet}`}
                            style={{
                              fontSize: '12px',
                              color: '#38BDF8',
                              fontFamily: 'var(--mono)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '100px',
                              border: '1px solid rgba(56, 189, 248, 0.2)',
                            }}
                          >
                            <span>👤 {arg.authorWallet.slice(0, 6)}...{arg.authorWallet.slice(-4)}</span>
                          </Link>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--mono)' }}>
                            🤖 Autonomous Synthesis
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p style={{ fontSize: '15px', color: '#F1F5F9', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                        {arg.content}
                      </p>

                      {/* Polymarket-style Staking Market Bar */}
                      <div style={{
                        background: 'rgba(5, 7, 10, 0.8)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px',
                        padding: '16px',
                      }}>
                        {/* Odds header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#10B981', fontWeight: 800 }}>
                            SUPPORT {summary.supportOdds}% <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '11px' }}>({summary.supportMultiplier}x)</span>
                          </span>
                          <span style={{ color: '#64748B', fontSize: '11px', fontFamily: 'var(--mono)' }}>
                            ${summary.totalPool?.toFixed(0) || 100} USDC Market Pool
                          </span>
                          <span style={{ color: '#F43F5E', fontWeight: 800 }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '11px' }}>({summary.challengeMultiplier}x)</span> CHALLENGE {summary.challengeOdds}%
                          </span>
                        </div>

                        {/* Dual Odds Bar */}
                        <div style={{
                          height: '8px',
                          width: '100%',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          display: 'flex',
                          marginBottom: '14px',
                        }}>
                          <div style={{
                            width: `${summary.supportOdds}%`,
                            background: 'linear-gradient(90deg, #10B981, #059669)',
                            transition: 'width 0.4s ease',
                          }} />
                          <div style={{
                            width: `${summary.challengeOdds}%`,
                            background: 'linear-gradient(90deg, #E11D48, #F43F5E)',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>

                        {/* Staking Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            onClick={() => setActiveStakeModal({ argumentId: arg.id, side: 'SUPPORT', argumentContent: arg.content })}
                            style={{
                              flex: 1,
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#34D399',
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>▲ Back SUPPORT</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--mono)', fontSize: '11px' }}>{summary.supportMultiplier}x</span>
                          </button>

                          <button
                            onClick={() => setActiveStakeModal({ argumentId: arg.id, side: 'CHALLENGE', argumentContent: arg.content })}
                            style={{
                              flex: 1,
                              background: 'rgba(244, 63, 94, 0.12)',
                              border: '1px solid rgba(244, 63, 94, 0.4)',
                              color: '#FB7185',
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>▼ Back CHALLENGE</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--mono)', fontSize: '11px' }}>{summary.challengeMultiplier}x</span>
                          </button>
                        </div>

                        {/* If user already has stake */}
                        {summary.userStake && (
                          <div style={{
                            marginTop: '10px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(79, 195, 247, 0.08)',
                            border: '1px solid rgba(79, 195, 247, 0.2)',
                            fontSize: '11px',
                            color: '#38BDF8',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}>
                            <span>Your Position: ${summary.userStake.amount.toFixed(2)} on {summary.userStake.side}</span>
                            <span>Potential Return: ${(summary.userStake.amount * (summary.userStake.side === 'SUPPORT' ? summary.supportMultiplier : summary.challengeMultiplier)).toFixed(2)} USDC</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: PREDICTIONS ─── */}
        {activeTab === 'predictions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Lock New Prediction */}
            <div style={{
              background: 'var(--bg-card, #0E131A)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>
                Anchor a Testable Prediction
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="e.g. Metric X exceeds target Y before date Z..."
                  value={predClaim}
                  onChange={(e) => setPredClaim(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: 'var(--ink)',
                    fontSize: '14px',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Resolution Deadline</label>
                    <input
                      type="date"
                      value={predDeadline}
                      onChange={(e) => setPredDeadline(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'var(--ink)',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Initial Confidence: {predConfidence}%</label>
                    <input
                      type="range"
                      min={1}
                      max={99}
                      value={predConfidence}
                      onChange={(e) => setPredConfidence(Number(e.target.value))}
                      style={{ width: '100%', marginTop: '8px' }}
                    />
                  </div>
                </div>

                {predMessage && (
                  <div style={{ fontSize: '12px', color: 'var(--cyan)' }}>{predMessage}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={handleCreatePrediction}
                    disabled={predSubmitting}
                    className="btn-primary"
                    style={{ minHeight: '36px', padding: '0 20px', fontSize: '13px' }}
                  >
                    {predSubmitting ? 'Anchoring...' : 'Anchor Prediction'}
                  </button>
                </div>
              </div>
            </div>

            {/* List of Predictions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {predictionsList.length === 0 ? (
                <div style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--muted)', margin: 0 }}>No testable predictions anchored yet.</p>
                </div>
              ) : (
                predictionsList.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--bg-card, #0E131A)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(79, 195, 247, 0.12)',
                        color: 'var(--cyan)',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--mono)',
                      }}>
                        {p.status || 'OPEN'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                        Deadline: {p.targetDate || '2026-12-31'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                      "{p.claim}"
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                      <span>Initial Confidence: <strong style={{ color: 'var(--ink)' }}>{p.confidenceAtCreation || 75}%</strong></span>
                      <span>Resolution: Empirical Oracle</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: HISTORY ─── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontWeight: 600 }}>
              Auditable Chronological Log
            </span>
            {eventsList.length === 0 ? (
              <div style={{ background: 'var(--bg-card, #0E131A)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', margin: 0 }}>Initial position created. No subsequent recalibrations yet.</p>
              </div>
            ) : (
              eventsList.map((ev: AgentEvent) => (
                <div
                  key={ev.id}
                  style={{
                    background: 'var(--bg-card, #0E131A)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--cyan)', fontWeight: 600 }}>
                      {ev.eventType}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>
                    {ev.content}
                  </p>
                  {(ev.confidenceBefore !== null || ev.confidenceAfter !== null) && (
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                      Shift: {ev.confidenceBefore ?? 50}% → {ev.confidenceAfter ?? 50}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── REPOSITIONED ECONOMICS & COMPUTE DRAWER ─── */}
        <section style={{
          marginTop: '60px',
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
        }}>
          <button
            onClick={() => setShowEconomicsDrawer(!showEconomicsDrawer)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--ink)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>⚙️ Technical Economics, Compute Budget & Token Details</span>
            <span>{showEconomicsDrawer ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showEconomicsDrawer && (
            <div style={{
              background: 'var(--bg-card, #0E131A)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              marginTop: '12px',
            }}>
              {agent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Compute Budget</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: 'var(--ink)', fontWeight: 600 }}>
                      {agent.computeBudget.toFixed(2)} USDC
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Compute Spent</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: '#F43F5E', fontWeight: 600 }}>
                      {agent.computeSpent.toFixed(4)} USDC
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Remaining</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '15px', color: 'var(--cyan)', fontWeight: 600 }}>
                      {agent.computeRemaining.toFixed(4)} USDC
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12px',
                color: 'var(--muted)',
                lineHeight: 1.5,
              }}>
                <strong style={{ color: '#F59E0B' }}>Market & Risk Disclosure:</strong> An optional token or bonding curve asset represents participation in attention and compute allocation, not proof that the underlying thesis is empirically true. Market prices can fluctuate wildly and do not constitute scientific consensus.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Flag Source Modal */}
      {flagModalEvidence && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-surface, #0B0F14)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>
              Flag Evidence Source
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Source: <strong>{flagModalEvidence.sourceName || flagModalEvidence.source}</strong>
            </p>

            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Reason</label>
            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card, #0E131A)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--ink)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <option value="Misrepresented Citation">Misrepresented Citation</option>
              <option value="Broken Link">Broken / Dead Link</option>
              <option value="Irrelevant Source">Irrelevant to Thesis</option>
              <option value="Factual Inaccuracy">Factual Inaccuracy</option>
            </select>

            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Notes (Optional)</label>
            <textarea
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value)}
              placeholder="Provide context on why this source is problematic..."
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg-card, #0E131A)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--ink)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            />

            {flagSuccess && (
              <div style={{ color: '#10B981', fontSize: '12px', marginBottom: '12px' }}>
                Flag submitted. Thank you for maintaining evidence integrity.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setFlagModalEvidence(null)}
                className="btn-secondary"
                style={{ minHeight: '36px', padding: '0 16px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleFlagSubmit}
                disabled={flagSubmitting}
                className="btn-primary"
                style={{ minHeight: '36px', padding: '0 20px', fontSize: '12px' }}
              >
                {flagSubmitting ? 'Submitting...' : 'Submit Flag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Polymarket-Style Argument Staking Modal */}
      {activeStakeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: '#0B0F17',
            border: `1px solid ${activeStakeModal.side === 'SUPPORT' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                    Back Argument on Polymarket
                  </h3>
                  <div style={{ fontSize: '11px', color: '#38BDF8', fontFamily: 'var(--mono)' }}>
                    ⚡ Testnet Protocol: Base Sepolia • Monad • Robinhood
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setActiveStakeModal(null); setStakeMessage(null); setLastStakeExplorerUrl(null); }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Testnet Network Selector */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
              Select Testnet Network
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {TESTNET_CHAINS.map(chain => {
                const isSelected = selectedStakeChainId === chain.id;
                const isWalletOnChain = chainId === String(chain.id);
                return (
                  <button
                    key={chain.id}
                    type="button"
                    onClick={() => setSelectedStakeChainId(chain.id)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '15px', marginBottom: '2px' }}>{chain.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#38BDF8' : '#F1F5F9' }}>
                      {chain.name}
                    </div>
                    <div style={{ fontSize: '9px', color: isWalletOnChain ? '#10B981' : '#64748B', marginTop: '2px', fontFamily: 'var(--mono)' }}>
                      {isWalletOnChain ? '● Active' : `ID: ${chain.id}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Network switch prompt if needed */}
            {isConnected && chainId !== String(selectedStakeChainId) && (
              <div style={{
                fontSize: '11px',
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '7px 10px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>⚠️ Wallet must switch to {TESTNET_CHAINS.find(c => c.id === selectedStakeChainId)?.name}</span>
                <button
                  type="button"
                  onClick={() => switchChain(selectedStakeChainId)}
                  style={{
                    background: '#F59E0B',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Switch Now
                </button>
              </div>
            )}

            {/* Side Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: 800,
              marginBottom: '16px',
              background: activeStakeModal.side === 'SUPPORT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: activeStakeModal.side === 'SUPPORT' ? '#34D399' : '#FB7185',
              border: `1px solid ${activeStakeModal.side === 'SUPPORT' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}>
              {activeStakeModal.side === 'SUPPORT' ? '▲ TAKING POSITION: SUPPORT THESIS' : '▼ TAKING POSITION: CHALLENGE THESIS'}
            </div>

            {/* Target Argument Excerpt */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '13px',
              color: '#CBD5E1',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}>
              &ldquo;{activeStakeModal.argumentContent.length > 160 ? `${activeStakeModal.argumentContent.slice(0, 160)}...` : activeStakeModal.argumentContent}&rdquo;
            </div>

            {/* Stake Amount Selector */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
              Stake Amount (Testnet USDC)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {['1', '5', '10', '25', '50'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStakeAmount(val)}
                  style={{
                    flex: 1,
                    background: stakeAmount === val ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: stakeAmount === val ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 0',
                    color: stakeAmount === val ? '#38BDF8' : '#CBD5E1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ${val}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="0.5"
              step="0.5"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Or custom USDC amount..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#F8FAFC',
                fontSize: '14px',
                fontFamily: 'var(--mono)',
                marginBottom: '16px',
                outline: 'none',
              }}
            />

            {/* Projected Return */}
            {(() => {
              const num = parseFloat(stakeAmount) || 0;
              const summary = marketSummaries[activeStakeModal.argumentId] || {
                supportMultiplier: 1.54,
                challengeMultiplier: 2.86,
              };
              const mult = activeStakeModal.side === 'SUPPORT' ? summary.supportMultiplier : summary.challengeMultiplier;
              const potential = (num * mult).toFixed(2);
              return (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Implied Testnet Payout ({mult}x):</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', fontWeight: 800, color: '#34D399' }}>
                    ${potential} USDC
                  </span>
                </div>
              );
            })()}

            {stakeMessage && (
              <div style={{
                fontSize: '12px',
                color: stakeMessage.startsWith('✓') ? '#10B981' : '#F87171',
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: stakeMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div>{stakeMessage}</div>
                {lastStakeExplorerUrl && (
                  <a
                    href={lastStakeExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#38BDF8',
                      textDecoration: 'underline',
                      fontWeight: 700,
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                    }}
                  >
                    View TX on {TESTNET_CHAINS.find(c => c.id === selectedStakeChainId)?.name} Explorer ↗
                  </a>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveStakeModal(null); setStakeMessage(null); setLastStakeExplorerUrl(null); }}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '100px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceStake(false)}
                  disabled={stakeSubmitting}
                  className="btn-primary"
                  style={{
                    background: activeStakeModal.side === 'SUPPORT' ? '#10B981' : '#F43F5E',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '100px',
                    boxShadow: activeStakeModal.side === 'SUPPORT' ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 0 16px rgba(244, 63, 94, 0.4)',
                    cursor: stakeSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {stakeSubmitting ? 'Confirming...' : `Confirm $${stakeAmount} on ${TESTNET_CHAINS.find(c => c.id === selectedStakeChainId)?.name}`}
                </button>
              </div>

              {/* Instant Faucet Fallback button */}
              <button
                type="button"
                onClick={() => handlePlaceStake(true)}
                disabled={stakeSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  padding: '4px',
                }}
              >
                No testnet gas? <span style={{ color: '#38BDF8', textDecoration: 'underline' }}>Execute via Instant Testnet Faucet (Zero-Gas)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Compute Research Sponsorship Modal */}
      {isSponsorModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: '#0B0F17',
            border: '1px solid rgba(79, 195, 247, 0.35)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                    Sponsor Agent Research Compute
                  </h3>
                  <div style={{ fontSize: '11px', color: '#38BDF8', fontFamily: 'var(--mono)' }}>
                    ⚡ Testnet Protocol: Base Sepolia • Monad • Robinhood
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setIsSponsorModalOpen(false); setSponsorSuccess(null); setLastSponsorExplorerUrl(null); }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Grant testnet compute budget directly to <strong>{agentId}</strong> across supported testnets. Your sponsorship fuels autonomous search through academic archives, adversarial counter-argument synthesis, and real-time empirical verification.
            </p>

            {/* Testnet Network Selector */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
              Select Testnet Network
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {TESTNET_CHAINS.map(chain => {
                const isSelected = selectedSponsorChainId === chain.id;
                const isWalletOnChain = chainId === String(chain.id);
                return (
                  <button
                    key={chain.id}
                    type="button"
                    onClick={() => setSelectedSponsorChainId(chain.id)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '10px 6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '15px', marginBottom: '2px' }}>{chain.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#38BDF8' : '#F1F5F9' }}>
                      {chain.name}
                    </div>
                    <div style={{ fontSize: '9px', color: isWalletOnChain ? '#10B981' : '#64748B', marginTop: '2px', fontFamily: 'var(--mono)' }}>
                      {isWalletOnChain ? '● Active' : `ID: ${chain.id}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Network switch prompt if needed */}
            {isConnected && chainId !== String(selectedSponsorChainId) && (
              <div style={{
                fontSize: '11px',
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '7px 10px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>⚠️ Wallet must switch to {TESTNET_CHAINS.find(c => c.id === selectedSponsorChainId)?.name}</span>
                <button
                  type="button"
                  onClick={() => switchChain(selectedSponsorChainId)}
                  style={{
                    background: '#F59E0B',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Switch Now
                </button>
              </div>
            )}

            {/* Grant Amount Presets */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
              Compute Grant Tier (Testnet USDC)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[
                { amount: '1', label: 'Quick Citation Scan' },
                { amount: '5', label: 'Preprint Corpus Audit' },
                { amount: '20', label: 'Adversarial Debate Round' },
                { amount: '50', label: 'Deep Synthesis Sprint' },
              ].map(tier => (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => setSponsorAmount(tier.amount)}
                  style={{
                    background: sponsorAmount === tier.amount ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: sponsorAmount === tier.amount ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: sponsorAmount === tier.amount ? '#38BDF8' : '#F1F5F9', fontFamily: 'var(--mono)' }}>
                    ${tier.amount} USDC
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    {tier.label}
                  </div>
                </button>
              ))}
            </div>

            <input
              type="number"
              min="0.5"
              step="1"
              value={sponsorAmount}
              onChange={(e) => setSponsorAmount(e.target.value)}
              placeholder="Or custom USDC grant amount..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#F8FAFC',
                fontSize: '14px',
                fontFamily: 'var(--mono)',
                marginBottom: '16px',
                outline: 'none',
              }}
            />

            {/* Directive Message */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
              Research Directive / Message (Optional)
            </label>
            <input
              type="text"
              value={sponsorMessage}
              onChange={(e) => setSponsorMessage(e.target.value)}
              placeholder="e.g. Test against 2026 cosmological data..."
              maxLength={200}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#F8FAFC',
                fontSize: '13px',
                marginBottom: '20px',
                outline: 'none',
              }}
            />

            {sponsorSuccess && (
              <div style={{
                fontSize: '12px',
                color: sponsorSuccess.startsWith('✓') ? '#10B981' : '#F87171',
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: sponsorSuccess.startsWith('✓') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div>{sponsorSuccess}</div>
                {lastSponsorExplorerUrl && (
                  <a
                    href={lastSponsorExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#38BDF8',
                      textDecoration: 'underline',
                      fontWeight: 700,
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                    }}
                  >
                    View TX on {TESTNET_CHAINS.find(c => c.id === selectedSponsorChainId)?.name} Explorer ↗
                  </a>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setIsSponsorModalOpen(false); setSponsorSuccess(null); setLastSponsorExplorerUrl(null); }}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '100px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSponsorCompute(false)}
                  disabled={sponsorSubmitting}
                  className="btn-primary"
                  style={{
                    background: '#4FC3F7',
                    color: '#05070A',
                    border: 'none',
                    padding: '9px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '100px',
                    boxShadow: '0 0 16px rgba(79, 195, 247, 0.4)',
                    cursor: sponsorSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sponsorSubmitting ? 'Granting...' : `Grant $${sponsorAmount} on ${TESTNET_CHAINS.find(c => c.id === selectedSponsorChainId)?.name}`}
                </button>
              </div>

              {/* Instant Faucet Fallback button */}
              <button
                type="button"
                onClick={() => handleSponsorCompute(true)}
                disabled={sponsorSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  padding: '4px',
                }}
              >
                No testnet gas? <span style={{ color: '#38BDF8', textDecoration: 'underline' }}>Grant via Instant Testnet Faucet (Zero-Gas)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
