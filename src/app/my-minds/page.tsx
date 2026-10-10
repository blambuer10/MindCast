'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import { useWallet } from '@/hooks/useWallet';
import type { IdeaWithMind } from '@/lib/types';

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
      // 1. Fetch created ideas
      const createdRes = await fetch(`/api/ideas?tab=my-minds&walletAddress=${address}`);
      if (createdRes.ok) {
        const cData = await createdRes.json();
        setCreatedMinds(cData.ideas || []);
      }

      // 2. Fetch followed ideas
      const followedRes = await fetch(`/api/ideas?tab=following&walletAddress=${address}`);
      if (followedRes.ok) {
        const fData = await followedRes.json();
        setFollowedMinds(fData.ideas || []);
      }
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
          ) : (
            <div>
              {activeTab === 'created' ? (
                createdMinds.length > 0 ? (
                  createdMinds.map((mind) => (
                    <Panel key={mind.id} style={{ marginBottom: '12px' }}>
                      <Link href={`/idea/${mind.id}`} style={{ fontWeight: 700, fontSize: '16px' }}>
                        {mind.content}
                      </Link>
                      <p style={{ color: 'var(--mute)', fontSize: '13px', margin: '6px 0 0' }}>
                        Created on {new Date(mind.createdAt).toLocaleDateString()}
                      </p>
                    </Panel>
                  ))
                ) : (
                  <div className="empty">
                    You haven&apos;t created any Minds yet.
                    <div style={{ marginTop: '12px' }}>
                      <Link href="/create" className="pri">Create a Mind</Link>
                    </div>
                  </div>
                )
              ) : followedMinds.length > 0 ? (
                followedMinds.map((mind) => (
                  <Panel key={mind.id} style={{ marginBottom: '12px' }}>
                    <Link href={`/idea/${mind.id}`} style={{ fontWeight: 700, fontSize: '16px' }}>
                      {mind.content}
                    </Link>
                    <p style={{ color: 'var(--mute)', fontSize: '13px', margin: '6px 0 0' }}>
                      Confidence: {mind.agent?.confidence ?? 'N/A'}%
                    </p>
                  </Panel>
                ))
              ) : (
                <div className="empty">
                  You are not following any Minds yet.
                </div>
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
