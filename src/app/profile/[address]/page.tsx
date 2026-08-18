'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import type { Idea } from '@/lib/types';

interface PortfolioStats {
  createdMinds: number;
  provenMinds: number;
  marketReadyMinds: number;
  avgCredibility: number;
  avgAccuracy: number;
  totalFollowers: number;
  estimatedValue: number;
}

export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  const shortAddr = address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

  useEffect(() => {
    async function fetchCreatorData() {
      try {
        const [ideasRes, portfolioRes] = await Promise.all([
          fetch(`/api/creators/${address}/ideas`),
          fetch(`/api/creators/${address}/minds`),
        ]);
        if (ideasRes.ok) {
          const result = await ideasRes.json();
          setIdeas(result.ideas || []);
        }
        if (portfolioRes.ok) {
          const result = await portfolioRes.json();
          setPortfolio(result);
        }
      } catch (err) {
        console.error('Failed to fetch creator data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCreatorData();
  }, [address]);

  return (
    <>
      <Header />
      <main className="page-container" style={{ maxWidth: '800px' }}>
        <div className="profile-header animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="profile-avatar">
            {address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <span className="label">Creator</span>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--parchment)',
              marginTop: 'var(--space-1)',
            }}>
              {shortAddr}
            </h2>
          </div>
        </div>

        {/* Mind Portfolio */}
        {portfolio && (
          <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-10)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', color: 'var(--parchment)', marginBottom: 'var(--space-4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              🪐 Mind Portfolio
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-4)', borderRadius: '4px', textAlign: 'center' }}>
                <span className="label" style={{ fontSize: '10px' }}>Total Portfolio Value</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--success)', marginTop: 'var(--space-2)' }}>
                  ${Math.round(portfolio.estimatedValue).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-4)', borderRadius: '4px', textAlign: 'center' }}>
                <span className="label" style={{ fontSize: '10px' }}>Average Credibility</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--parchment)', marginTop: 'var(--space-2)' }}>
                  {Math.round(portfolio.avgCredibility)}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 'var(--space-2)', textAlign: 'center', fontSize: 'var(--text-xs)' }}>
              <div>
                <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Created</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--parchment)', fontSize: 'var(--text-sm)' }}>{portfolio.createdMinds}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Proven</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--parchment)', fontSize: 'var(--text-sm)' }}>{portfolio.provenMinds}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Market Ready</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--parchment)', fontSize: 'var(--text-sm)' }}>{portfolio.marketReadyMinds}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Accuracy</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success)', fontSize: 'var(--text-sm)' }}>{Math.round(portfolio.avgAccuracy * 100)}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', marginBottom: '2px' }}>Followers</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--parchment)', fontSize: 'var(--text-sm)' }}>{portfolio.totalFollowers}</div>
              </div>
            </div>
          </div>
        )}

        <div className="section-header">
          <span className="section-title">Ideas</span>
        </div>

        {loading ? (
          <div className="skeleton" style={{ width: '100%', height: '100px' }}></div>
        ) : ideas.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <h3 className="empty-state-title">No ideas yet.</h3>
            <p className="empty-state-text">This creator hasn&apos;t cast any ideas yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {ideas.map((idea) => (
              <Link key={idea.id} href={`/idea/${idea.id}`} className="card card-interactive" style={{ textDecoration: 'none', color: 'inherit' }}>
                <p style={{ color: 'var(--parchment)' }}>{idea.content}</p>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 'var(--space-2)', display: 'block' }}>
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
