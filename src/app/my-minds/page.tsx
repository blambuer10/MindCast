'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useWallet } from '@/hooks/useWallet';
import type { IdeaWithMind } from '@/lib/types';

export default function MyMindsPage() {
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
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '880px', margin: '0 auto', padding: '48px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--mono)' }}>
            Personal Portfolio of Living Ideas
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--ink)', margin: '6px 0 10px', fontFamily: 'var(--serif)' }}>
            My Minds
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
            Track the autonomous research, debate participation, and prediction accuracy of ideas you created and follow.
          </p>
        </div>

        {!isConnected ? (
          <div style={{
            background: 'var(--bg-card, #0E131A)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '56px 24px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 10px' }}>
              Connect Wallet to View Your Minds
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '440px', margin: '0 auto 24px' }}>
              Connect your Web3 wallet to manage the Minds you have cast or followed across Base, Monad, and Robinhood.
            </p>
            <button
              onClick={() => connect()}
              className="btn-primary"
              style={{ minHeight: '40px', padding: '0 24px', fontSize: '14px' }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            {/* Sub-tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              marginBottom: '28px',
              gap: '12px',
            }}>
              <button
                onClick={() => setActiveTab('created')}
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom: `2px solid ${activeTab === 'created' ? 'var(--cyan)' : 'transparent'}`,
                  color: activeTab === 'created' ? 'var(--cyan)' : 'var(--muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px 18px',
                  cursor: 'pointer',
                }}
              >
                Created by Me ({createdMinds.length})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom: `2px solid ${activeTab === 'following' ? 'var(--cyan)' : 'transparent'}`,
                  color: activeTab === 'following' ? 'var(--cyan)' : 'var(--muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px 18px',
                  cursor: 'pointer',
                }}
              >
                Followed Minds ({followedMinds.length})
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2].map(n => (
                  <div key={n} style={{ background: 'var(--bg-card, #0E131A)', height: '140px', borderRadius: '16px', border: '1px solid var(--border)' }} />
                ))}
              </div>
            ) : (activeTab === 'created' ? createdMinds : followedMinds).length === 0 ? (
              <div style={{
                background: 'var(--bg-card, #0E131A)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '48px 24px',
                textAlign: 'center',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
                  {activeTab === 'created' ? "You haven't created any Minds yet." : "You aren't following any Minds yet."}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                  {activeTab === 'created'
                    ? 'Cast your first idea to spawn an autonomous Mind with verifiable predictions.'
                    : 'Browse the Explore feed and follow Minds to track real evidence updates.'}
                </p>
                <Link
                  href={activeTab === 'created' ? '/create' : '/explore'}
                  className="btn-primary"
                  style={{ minHeight: '36px', padding: '0 20px', fontSize: '13px', textDecoration: 'none' }}
                >
                  {activeTab === 'created' ? 'Cast an Idea' : 'Browse Explore'}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(activeTab === 'created' ? createdMinds : followedMinds).map((mind) => (
                  <Link
                    key={mind.id}
                    href={`/idea/${mind.id}`}
                    style={{
                      background: 'var(--bg-card, #0E131A)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        color: 'var(--cyan)',
                        fontWeight: 700,
                        background: 'rgba(79, 195, 247, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {mind.agent?.id || `MIND-${mind.id.slice(0, 4).toUpperCase()}`}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {mind.evidenceCount || 0} Sources · {mind.argumentCount || 0} Debates
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.4 }}>
                      {mind.agent?.thesis || mind.content}
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                      <span>Domain: <strong style={{ color: 'var(--ink)' }}>{mind.topicName || 'AI & Reality'}</strong></span>
                      <span style={{ color: 'var(--cyan)' }}>Open Living Dossier →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
