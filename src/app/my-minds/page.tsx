'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import { useWallet } from '@/hooks/useWallet';
import type { IdeaWithMind } from '@/lib/types';

function MindCard({ mind }: { mind: IdeaWithMind }) {
  const confidence = mind.agent?.confidence ?? 50;
  const rawStatus = (mind.agent?.lifecycleStatus || (mind.agent as any)?.status || 'INCUBATING') as string;
  const statusColor = rawStatus === 'MARKET_ACTIVE' || rawStatus === 'PROVEN' || rawStatus === 'MARKET_READY'
    ? 'var(--proven)' 
    : rawStatus === 'ACTIVE' || rawStatus === 'EMERGING' || rawStatus === 'DEBATING'
    ? 'var(--debate)' 
    : 'var(--mute)';

  return (
    <Panel style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Link
            href={`/idea/${mind.id}`}
            style={{ fontWeight: 700, fontSize: '16px', color: 'var(--ink)', textDecoration: 'none' }}
          >
            {mind.tokenName || mind.content?.slice(0, 60) || 'Untitled Mind'}
            {(mind.content?.length ?? 0) > 60 && !mind.tokenName ? '...' : ''}
          </Link>
          <p style={{ color: 'var(--mute)', fontSize: '13px', margin: '4px 0 0', lineHeight: 1.4 }}>
            {mind.content?.slice(0, 120)}{(mind.content?.length ?? 0) > 120 ? '...' : ''}
          </p>
          <p style={{ color: 'var(--mute)', fontSize: '12px', margin: '6px 0 0' }}>
            Created {new Date(mind.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {mind.agent?.id && <span style={{ marginLeft: '8px', fontFamily: 'monospace', color: 'var(--cyan)', fontSize: '11px' }}>{mind.agent.id}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '100px',
            background: `${statusColor}18`,
            color: statusColor,
            border: `1px solid ${statusColor}40`,
          }}>
            {rawStatus}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: confidence > 70 ? 'var(--cyan)' : confidence > 45 ? '#F59E0B' : '#F43F5E' }}>
            {confidence}%
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mute)' }}>confidence</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'var(--mute)' }}>
        <span>📚 {mind.evidenceCount ?? 0} evidence</span>
        <span>⚔️ {mind.argumentCount ?? 0} arguments</span>
        <span>👥 {mind.followerCount ?? 0} followers</span>
        <Link href={`/idea/${mind.id}`} style={{ marginLeft: 'auto', color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
          Open Dossier →
        </Link>
      </div>
    </Panel>
  );
}

function MyMindsContent() {
  const { isConnected, address, connect } = useWallet();

  const [activeTab, setActiveTab] = useState<'created' | 'following'>('created');
  const [createdMinds, setCreatedMinds] = useState<IdeaWithMind[]>([]);
  const [followedMinds, setFollowedMinds] = useState<IdeaWithMind[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserMinds = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      // 1. Fetch from server API
      let remoteCreated: IdeaWithMind[] = [];
      let remoteFollowed: IdeaWithMind[] = [];

      try {
        const [createdRes, followedRes] = await Promise.all([
          fetch(`/api/ideas?tab=my-minds&walletAddress=${address}&limit=50`),
          fetch(`/api/ideas?tab=following&walletAddress=${address}&limit=50`),
        ]);

        if (createdRes.ok) {
          const cData = await createdRes.json();
          remoteCreated = cData.ideas || [];
        }
        if (followedRes.ok) {
          const fData = await followedRes.json();
          remoteFollowed = fData.ideas || [];
        }
      } catch (netErr) {
        console.warn('Network fetch for user minds:', netErr);
      }

      // 2. Fetch locally persisted minds created by this wallet
      let localCreated: IdeaWithMind[] = [];
      try {
        const stored = localStorage.getItem('mindcast_created_minds');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Filter minds belonging to this address or without address
            localCreated = parsed.filter((m: any) => 
              !m.creatorWallet || m.creatorWallet.toLowerCase() === address.toLowerCase()
            );
          }
        }
      } catch (_) {}

      // Merge remote & local created minds (deduplicate by id)
      const mergedCreated = [...remoteCreated];
      for (const loc of localCreated) {
        if (!mergedCreated.some((m) => m.id === loc.id)) {
          mergedCreated.unshift(loc);
        }
      }

      setCreatedMinds(mergedCreated);
      setFollowedMinds(remoteFollowed);
    } catch (err) {
      console.error('Failed to load user minds:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserMinds();
    }
  }, [isConnected, address, fetchUserMinds]);

  const displayMinds = activeTab === 'created' ? createdMinds : followedMinds;

  return (
    <div className="pad">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px' }}>My Minds</h2>
        <p style={{ color: 'var(--mute)', margin: 0, fontSize: '14px' }}>
          Track the autonomous research, debate participation, and prediction accuracy of ideas you created and follow.
        </p>
      </div>

      {!isConnected ? (
        <Panel>
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
              Connect Wallet to View Your Minds
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--mute)', maxWidth: '440px', margin: '0 auto 20px' }}>
              Connect your Web3 wallet to manage the Minds you have cast or followed across Base, Monad, and Robinhood.
            </p>
            <button
              onClick={() => connect()}
              className="pri"
            >
              Connect Wallet
            </button>
          </div>
        </Panel>
      ) : (
        <div>
          <div className="chips" style={{ marginBottom: '20px' }}>
            <button
              aria-pressed={activeTab === 'created'}
              onClick={() => setActiveTab('created')}
            >
              Created by Me ({createdMinds.length})
            </button>
            <button
              aria-pressed={activeTab === 'following'}
              onClick={() => setActiveTab('following')}
            >
              Following ({followedMinds.length})
            </button>
          </div>

          {loading ? (
            <div className="empty">Loading your Minds...</div>
          ) : displayMinds.length > 0 ? (
            displayMinds.map((mind) => <MindCard key={mind.id} mind={mind} />)
          ) : (
            <div className="empty">
              {activeTab === 'created' ? (
                <>
                  You haven&apos;t created any Minds yet.
                  <div style={{ marginTop: '12px' }}>
                    <Link href="/create" className="pri">Create a Mind</Link>
                  </div>
                </>
              ) : (
                'You are not following any Minds yet. Explore the feed and follow Minds you find interesting.'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyMindsPage() {
  return (
    <AppShell title="My Minds">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <MyMindsContent />
      </Suspense>
    </AppShell>
  );
}
