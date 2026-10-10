'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';

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

interface UserArgumentEntry {
  id: string;
  agent_id: string;
  content: string;
  strength: number;
  stance: 'SUPPORTING' | 'CHALLENGING' | 'QUESTION';
  created_at: string;
  mind_thesis?: string;
  idea_id?: string;
}

interface UserStakeEntry {
  id: string;
  argument_id: string;
  agent_id: string;
  side: 'SUPPORT' | 'CHALLENGE';
  amount: number;
  token: string;
  tx_hash?: string;
  created_at: string;
  argument_content?: string;
  mind_thesis?: string;
  idea_id?: string;
}

interface UserSponsorshipEntry {
  id: string;
  mind_id: string;
  amount: number;
  token: string;
  message?: string;
  tx_hash?: string;
  created_at: string;
  mind_thesis?: string;
  idea_id?: string;
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

interface UserProfileData {
  id: string;
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

interface ProfileData {
  exists: boolean;
  address: string;
  userId?: string;
  user?: UserProfileData;
  reputation: number;
  joinedAt?: string;
  trackRecord: TrackRecord;
  minds: MindEntry[];
  portfolio: PortfolioEntry[];
  payments: PaymentEntry[];
  following: FollowEntry[];
  arguments?: UserArgumentEntry[];
  stakes?: UserStakeEntry[];
  sponsorships?: UserSponsorshipEntry[];
  activity: ActivityEntry[];
  stats: {
    totalMinds: number;
    trendingMinds: number;
    activeMinds: number;
    provenMinds: number;
    totalPortfolioValue: number;
    totalArguments?: number;
    totalStakes?: number;
    totalSponsorships?: number;
  };
}

type ProfileTab = 'overview' | 'minds' | 'arguments' | 'stakes' | 'sponsorships' | 'following' | 'activity';

const AVATAR_PRESETS = [
  { name: 'Cosmic Sage', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80' },
  { name: 'Neural Cyber', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=160&auto=format&fit=crop&q=80' },
  { name: 'Quantum Core', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=160&auto=format&fit=crop&q=80' },
  { name: 'Deep Mind', url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=160&auto=format&fit=crop&q=80' },
];

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const { address: connectedAddress, isConnected } = useWallet();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available?: boolean; reason?: string }>({ checking: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const isOwner = Boolean(
    connectedAddress &&
    (profile?.address?.toLowerCase() === connectedAddress.toLowerCase() ||
     profile?.user?.walletAddress?.toLowerCase() === connectedAddress.toLowerCase())
  );

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/creators/${address}/activity`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.user) {
          setEditUsername(data.user.username || '');
          setEditDisplayName(data.user.displayName || '');
          setEditBio(data.user.bio || '');
          setEditAvatarUrl(data.user.avatarUrl || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Live username uniqueness check
  useEffect(() => {
    if (!isEditModalOpen) return;
    const clean = editUsername.replace(/^@/, '').trim();
    if (!clean) {
      setUsernameStatus({ checking: false });
      return;
    }

    if (clean === (profile?.user?.username || '')) {
      setUsernameStatus({ checking: false, available: true });
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    setUsernameStatus({ checking: true });
    debounceTimer.current = setTimeout(async () => {
      try {
        const curr = connectedAddress || profile?.address || '';
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(clean)}&currentWallet=${encodeURIComponent(curr)}`);
        const json = await res.json();
        setUsernameStatus({ checking: false, available: json.available, reason: json.reason });
      } catch {
        setUsernameStatus({ checking: false });
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [editUsername, isEditModalOpen, profile?.user?.username, connectedAddress, profile?.address]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    const targetWallet = connectedAddress || profile?.address;
    if (!targetWallet) {
      setSaveError('Please connect your wallet to save profile modifications.');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: targetWallet,
          username: editUsername.replace(/^@/, '').trim(),
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          avatarUrl: editAvatarUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to update profile');
      } else {
        setIsEditModalOpen(false);
        // Refresh profile data
        await fetchProfile();
      }
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  }

  const handleCopyWallet = () => {
    if (!profile?.address) return;
    navigator.clipboard.writeText(profile.address);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-container" style={{ maxWidth: '960px' }}>
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--muted)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-4)' }}></div>
            Loading cognitive profile...
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="page-container" style={{ maxWidth: '960px' }}>
          <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
            <h3 className="empty-state-title">Profile not found</h3>
            <p className="empty-state-text">No cognitive identity found for &quot;{address}&quot;.</p>
            <Link href="/explore" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
              Explore Living Minds
            </Link>
          </div>
        </main>
      </>
    );
  }

  const user = profile.user;
  const username = user?.username || null;
  const displayName = user?.displayName || (username ? `@${username}` : null) || `Mind Pioneer`;
  const bio = user?.bio || 'Formulating autonomous agents, evidentiary theses, and prediction stakes on MindCast.';
  const avatarUrl = user?.avatarUrl;
  const rep = profile.reputation;
  const shortAddr = profile.address.length > 10
    ? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`
    : profile.address;

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '960px', paddingBottom: 'var(--space-16)' }}>

        {/* ─── X (Twitter) STYLE PROFILE HERO ─────────────────────────────────── */}
        <div style={{
          background: 'rgba(10, 14, 22, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(79, 195, 247, 0.15)',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: 'var(--space-8)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)',
          position: 'relative'
        }}>
          {/* Cover Banner */}
          <div style={{
            height: '180px',
            width: '100%',
            background: 'linear-gradient(135deg, #091224 0%, #10243E 40%, #0B192C 70%, #050B14 100%)',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            {/* Ambient Nebula Glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '10%',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79, 195, 247, 0.25) 0%, rgba(129, 140, 248, 0.05) 50%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '20px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              MINDCAST NOOSPHERE IDENTITY
            </div>
          </div>

          {/* Profile Header Row */}
          <div style={{ padding: '0 var(--space-8) var(--space-6)', position: 'relative' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '-56px',
              marginBottom: 'var(--space-4)',
              flexWrap: 'wrap',
              gap: 'var(--space-4)'
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '50%',
                  border: '4px solid #05070A',
                  background: avatarUrl
                    ? `url(${avatarUrl}) center/cover no-repeat`
                    : `linear-gradient(135deg, hsl(${(rep * 3) % 360}, 70%, 50%), hsl(${((rep * 3) + 70) % 360}, 65%, 35%))`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(79, 195, 247, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '32px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {!avatarUrl && (username ? username[0].toUpperCase() : profile.address.slice(2, 4).toUpperCase())}
                </div>
                {/* Online / Active Node Indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #05070A',
                  boxShadow: '0 0 8px #10B981'
                }} title="Active Node on MindCast" />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isOwner || isConnected ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn"
                    style={{
                      background: 'rgba(79, 195, 247, 0.12)',
                      border: '1px solid rgba(79, 195, 247, 0.35)',
                      color: '#4FC3F7',
                      fontWeight: 600,
                      fontSize: '13px',
                      padding: '8px 18px',
                      borderRadius: '100px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>✎</span> Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      alert('Connect your wallet to follow or edit profiles.');
                    }}
                    className="btn"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#E0E6ED',
                      fontSize: '13px',
                      padding: '8px 18px',
                      borderRadius: '100px',
                      cursor: 'pointer'
                    }}
                  >
                    + Follow Analyst
                  </button>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Profile link copied to clipboard!');
                  }}
                  className="btn"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#94A3B8',
                    fontSize: '13px',
                    padding: '8px 14px',
                    borderRadius: '100px',
                    cursor: 'pointer'
                  }}
                  title="Share profile"
                >
                  🔗 Share
                </button>
              </div>
            </div>

            {/* User Handle & Names */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#F8FAFC',
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}>
                  {displayName}
                </h1>
                <span style={{
                  background: 'rgba(79, 195, 247, 0.15)',
                  color: '#4FC3F7',
                  border: '1px solid rgba(79, 195, 247, 0.3)',
                  borderRadius: '100px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ✓ Verified Noosphere
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  color: username ? '#38BDF8' : '#94A3B8',
                  fontWeight: 600
                }}>
                  @{username || profile.address.slice(2, 8).toLowerCase()}
                </span>

                <button
                  onClick={handleCopyWallet}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  title="Click to copy address"
                >
                  <span>💼 {shortAddr}</span>
                  <span style={{ fontSize: '10px', color: copiedWallet ? '#10B981' : '#64748B' }}>
                    {copiedWallet ? '✓ Copied' : '📋'}
                  </span>
                </button>

                {profile.joinedAt && (
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    📅 Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            <p style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#CBD5E1',
              margin: '0 0 var(--space-5) 0',
              maxWidth: '720px'
            }}>
              {bio}
            </p>

            {/* High-Level Reputation & Network Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(5, 7, 10, 0.6)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Reputation
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: rep >= 75 ? '#34D399' : rep >= 50 ? '#38BDF8' : '#F59E0B'
                }}>
                  {rep}<span style={{ fontSize: '12px', color: '#64748B' }}>/100</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Living Minds
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#F8FAFC' }}>
                  {profile.stats.totalMinds}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Arguments
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#A78BFA' }}>
                  {profile.stats.totalArguments || profile.arguments?.length || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Prediction Stakes
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#F472B6' }}>
                  {profile.stats.totalStakes || profile.stakes?.length || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Portfolio Value
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#34D399' }}>
                  ${profile.stats.totalPortfolioValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── NAVIGATION TABS ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '12px',
          marginBottom: 'var(--space-6)',
          scrollbarWidth: 'none'
        }}>
          {([
            { key: 'overview', label: 'Overview & Track Record' },
            { key: 'minds', label: `Minds (${profile.stats.totalMinds})` },
            { key: 'arguments', label: `Arguments (${profile.arguments?.length || 0})` },
            { key: 'stakes', label: `Polymarket Stakes (${profile.stakes?.length || 0})` },
            { key: 'sponsorships', label: `Compute Funded (${profile.sponsorships?.length || 0})` },
            { key: 'following', label: `Tracked (${profile.following.length})` },
            { key: 'activity', label: `Activity (${profile.activity.length})` },
          ] as { key: ProfileTab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: activeTab === t.key ? 'rgba(79, 195, 247, 0.15)' : 'transparent',
                border: activeTab === t.key ? '1px solid rgba(79, 195, 247, 0.4)' : '1px solid transparent',
                color: activeTab === t.key ? '#38BDF8' : '#94A3B8',
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: '13px',
                padding: '8px 16px',
                borderRadius: '100px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: OVERVIEW & TRACK RECORD                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Track Record Matrix */}
            <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 14, 22, 0.6)' }}>
              <h3 style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#64748B',
                marginBottom: 'var(--space-5)',
                fontWeight: 700
              }}>
                Cognitive Performance & Calibration
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <TrackRecordRow label="Prediction Accuracy" value={`${profile.trackRecord.predictionAccuracy}%`} score={profile.trackRecord.predictionAccuracy} />
                <TrackRecordRow label="Brier Calibration Score" value={String(profile.trackRecord.calibrationScore)} score={profile.trackRecord.calibrationScore} />
                <TrackRecordRow label="Evidence Verifiability" value={String(profile.trackRecord.evidenceQuality)} score={profile.trackRecord.evidenceQuality} />
                <TrackRecordRow label="Debate Elo Win Rate" value={String(profile.trackRecord.debatePerformance)} score={profile.trackRecord.debatePerformance} />
                <TrackRecordRow label="Mind Resilience Index" value={`${profile.trackRecord.mindSuccessRate}%`} score={profile.trackRecord.mindSuccessRate} />
              </div>
            </div>

            {/* Created Minds Quick Preview */}
            {profile.minds.length > 0 && (
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 14, 22, 0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748B', fontWeight: 700, margin: 0 }}>
                    Active Living Minds
                  </h3>
                  <button onClick={() => setActiveTab('minds')} style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '12px', cursor: 'pointer' }}>
                    View All ({profile.minds.length}) →
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.minds.slice(0, 3).map(m => (
                    <Link key={m.ideaId} href={`/idea/${m.ideaId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.content}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#64748B' }}>
                            <span>🧠 {m.agentId || 'MIND-INIT'}</span>
                            <span>📊 {m.evidenceCount} sources</span>
                            <span>💬 {m.argumentCount} arguments</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '16px',
                            fontWeight: 800,
                            color: m.confidence >= 70 ? '#34D399' : m.confidence >= 40 ? '#38BDF8' : '#F59E0B'
                          }}>
                            {m.confidence}%
                          </span>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>CONFIDENCE</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: CREATED MINDS                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'minds' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.minds.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                No minds created yet.
              </div>
            ) : (
              profile.minds.map(m => (
                <div key={m.ideaId} style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'rgba(10, 14, 22, 0.7)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                    <Link href={`/idea/${m.ideaId}`} style={{ textDecoration: 'none', color: '#F8FAFC', fontSize: '16px', fontWeight: 700, flex: 1 }}>
                      {m.content}
                    </Link>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: m.confidence >= 70 ? '#34D399' : m.confidence >= 40 ? '#38BDF8' : '#F59E0B'
                    }}>
                      {m.confidence}%
                    </span>
                  </div>
                  {m.thesis && (
                    <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: '6px 0 12px 0' }}>
                      &ldquo;{m.thesis}&rdquo;
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#64748B' }}>
                    <span>⚡ ID: <strong style={{ color: '#38BDF8' }}>{m.agentId || 'PENDING'}</strong></span>
                    <span>📈 Valuation: <strong style={{ color: '#34D399' }}>${m.estimatedValue?.toLocaleString()}</strong></span>
                    <span>🔍 Evidence: <strong>{m.evidenceCount}</strong></span>
                    <span>💬 Arguments: <strong>{m.argumentCount}</strong></span>
                    <span>👥 Followers: <strong>{m.followerCount}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ARGUMENTS & TAKES                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'arguments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!profile.arguments || profile.arguments.length === 0) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                No authored arguments or counter-takes recorded yet.
              </div>
            ) : (
              profile.arguments.map(arg => (
                <div key={arg.id} style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(10, 14, 22, 0.7)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '100px',
                      background: arg.stance === 'CHALLENGING' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: arg.stance === 'CHALLENGING' ? '#F87171' : '#34D399',
                      border: arg.stance === 'CHALLENGING' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {arg.stance === 'CHALLENGING' ? '⚔️ CHALLENGE ARGUMENT' : '🛡️ SUPPORTING ARGUMENT'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {new Date(arg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: 1.5, margin: '8px 0' }}>
                    {arg.content}
                  </p>
                  {arg.idea_id && (
                    <Link href={`/idea/${arg.idea_id}`} style={{ fontSize: '12px', color: '#38BDF8', textDecoration: 'none' }}>
                      Target Thesis: {arg.mind_thesis ? `"${arg.mind_thesis.slice(0, 80)}..."` : `View Mind Dossier →`}
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: POLYMARKET-STYLE ARGUMENT STAKES                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stakes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!profile.stakes || profile.stakes.length === 0) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                No market prediction stakes placed yet. Stake on debate arguments to earn prediction yield!
              </div>
            ) : (
              profile.stakes.map(st => (
                <div key={st.id} style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(10, 14, 22, 0.7)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '100px',
                        background: st.side === 'SUPPORT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: st.side === 'SUPPORT' ? '#34D399' : '#F87171',
                      }}>
                        BACKED: {st.side}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {new Date(st.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#F1F5F9', fontWeight: 600 }}>
                      {st.argument_content ? `"${st.argument_content.slice(0, 100)}..."` : `Argument #${st.argument_id.slice(0, 8)}`}
                    </div>
                    {st.idea_id && (
                      <Link href={`/idea/${st.idea_id}`} style={{ fontSize: '12px', color: '#38BDF8', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}>
                        In Mind: {st.agent_id} →
                      </Link>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: '#34D399' }}>
                      ${st.amount.toFixed(2)} {st.token}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Staked Position
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: COMPUTE SPONSORSHIPS                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sponsorships' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!profile.sponsorships || profile.sponsorships.length === 0) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                No compute sponsorships funded yet. Sponsor an AI agent to trigger deep research cycles!
              </div>
            ) : (
              profile.sponsorships.map(sp => (
                <div key={sp.id} style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(10, 14, 22, 0.7)',
                  border: '1px solid rgba(129, 140, 248, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '100px',
                        background: 'rgba(129, 140, 248, 0.15)',
                        color: '#818CF8',
                      }}>
                        ⚡ RESEARCH SPONSOR
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {new Date(sp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {sp.message && (
                      <p style={{ fontSize: '13px', color: '#E2E8F0', fontStyle: 'italic', margin: '4px 0' }}>
                        &ldquo;{sp.message}&rdquo;
                      </p>
                    )}
                    {sp.idea_id && (
                      <Link href={`/idea/${sp.idea_id}`} style={{ fontSize: '12px', color: '#38BDF8', textDecoration: 'none' }}>
                        Funded Agent: {sp.mind_id} →
                      </Link>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: '#818CF8' }}>
                      +${sp.amount.toFixed(2)} {sp.token}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Compute Grant
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: FOLLOWING / TRACKED                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'following' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.following.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                Not following any minds yet.
              </div>
            ) : (
              profile.following.map(f => (
                <div key={f.ideaId} style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(10, 14, 22, 0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <Link href={`/idea/${f.ideaId}`} style={{ textDecoration: 'none', color: '#F1F5F9', fontWeight: 600, fontSize: '14px' }}>
                      {f.content}
                    </Link>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      Creator: {f.creatorWallet.slice(0, 8)}... • Followed {new Date(f.followedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: '#38BDF8' }}>
                    {f.confidence}%
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ACTIVITY                                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profile.activity.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: 'rgba(10,14,22,0.5)', borderRadius: '16px' }}>
                No recent activity recorded.
              </div>
            ) : (
              profile.activity.map((act, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(10, 14, 22, 0.5)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', marginRight: '8px' }}>
                      [{act.eventType}]
                    </span>
                    <span style={{ fontSize: '13px', color: '#CBD5E1' }}>
                      {act.content}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* ─── X-STYLE EDIT PROFILE MODAL ────────────────────────────────────── */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#0B0F17',
            border: '1px solid rgba(79, 195, 247, 0.25)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Edit Cognitive Profile
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} style={{ padding: '20px' }}>
              {saveError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {saveError}
                </div>
              )}

              {/* Unique Username Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                  Unique Handle (Taken only once across the entire network)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748B',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    @
                  </span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="satoshi"
                    maxLength={24}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 32px',
                      background: 'rgba(255,255,255,0.04)',
                      border: usernameStatus.available === true
                        ? '1px solid #10B981'
                        : usernameStatus.available === false
                          ? '1px solid #EF4444'
                          : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '14px',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none'
                    }}
                  />
                  {usernameStatus.checking && (
                    <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#38BDF8' }}>
                      Checking...
                    </span>
                  )}
                </div>
                {/* Status notice */}
                {editUsername.trim() !== '' && (
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    {usernameStatus.available === true && (
                      <span style={{ color: '#10B981' }}>✓ @{editUsername} is available!</span>
                    )}
                    {usernameStatus.available === false && (
                      <span style={{ color: '#EF4444' }}>✗ {usernameStatus.reason}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                    Bio & Intellectual Conviction
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {editBio.length}/280
                  </span>
                </div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="What is your domain of expertise? What are your fundamental theses?"
                  maxLength={280}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Avatar Presets or Custom URL */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
                  Avatar Selection
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {AVATAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatarUrl(p.url)}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: editAvatarUrl === p.url ? '2px solid #38BDF8' : '2px solid rgba(255,255,255,0.1)',
                        background: `url(${p.url}) center/cover no-repeat`,
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: editAvatarUrl === p.url ? '0 0 10px #38BDF8' : 'none'
                      }}
                      title={p.name}
                    />
                  ))}
                </div>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="Or paste custom image URL (https://...)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: '#CBD5E1',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#CBD5E1',
                    padding: '8px 18px',
                    borderRadius: '100px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || usernameStatus.available === false}
                  className="btn"
                  style={{
                    background: '#4FC3F7',
                    border: 'none',
                    color: '#05070A',
                    fontWeight: 700,
                    padding: '8px 24px',
                    borderRadius: '100px',
                    cursor: (isSaving || usernameStatus.available === false) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 16px rgba(79, 195, 247, 0.4)'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Track Record Subcomponent ──────────────────────────────────────────────

function TrackRecordRow({ label, value, score }: { label: string; value: string; score: number }) {
  const normScore = Math.min(100, Math.max(0, score));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '180px', fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${normScore}%`,
          height: '100%',
          background: normScore >= 70 ? '#34D399' : normScore >= 40 ? '#38BDF8' : '#F59E0B',
          borderRadius: '3px',
          transition: 'width 0.4s ease'
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 700,
        color: normScore >= 70 ? '#34D399' : normScore >= 40 ? '#38BDF8' : '#F59E0B',
        minWidth: '50px',
        textAlign: 'right'
      }}>
        {value}
      </span>
    </div>
  );
}
