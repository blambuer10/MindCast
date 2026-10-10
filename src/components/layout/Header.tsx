'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useWallet } from '@/hooks/useWallet';

import NoosMark from '@/components/ui/NoosMark';

// ─── Header Component ─────────────────────────────────────────────────────
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="shell topbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
      <Link href="/" className="brand" aria-label="MINDCAST · IDEAS, ALIVE.">
        <NoosMark size={30} glow={scrolled} />
        <div className="brand-text-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          <span className="brand-name" style={{ fontFamily: 'var(--sans)', fontWeight: 700, letterSpacing: '0.14em', fontSize: '15px', color: 'var(--ink)' }}>
            MINDCAST
          </span>
          <span className="brand-tagline" style={{ fontFamily: 'var(--sans)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--violet)', textTransform: 'uppercase' }}>
            IDEAS, ALIVE.
          </span>
        </div>
      </Link>

      <nav className="nav" aria-label="Main navigation">
        <Link href="/explore" style={{ fontWeight: 600 }}>Explore</Link>
        <Link href="/noospheres">Noospheres</Link>
        <Link href={isConnected && address ? `/profile/${address}` : '/my-minds'}>My Minds</Link>
        <Link href="/activity">Activity</Link>
        <Link href="/#market">Market</Link>
        <Link
          href="/create"
          id="nav-create-mind-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '36px',
            padding: '0 16px',
            borderRadius: '9999px',
            background: '#4FC3F7',
            color: '#05070A',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 0 16px rgba(79, 195, 247, 0.35)',
            border: '1px solid #4FC3F7',
            cursor: 'pointer',
          }}
        >
          + Create a Mind
        </Link>
      </nav>
        
        {isConnected && address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href={`/profile/${address}`}
              id="header-profile-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined') {
                  window.location.href = `/profile/${address}`;
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              {/* Mini Avatar */}
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(240, 60%, 45%), hsl(300, 50%, 35%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.9)',
              }}>
                {address.slice(2, 4).toUpperCase()}
              </div>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink)',
              }}>
                {formatAddress(address)}
              </span>
            </a>
            <button
              className="primary-button"
              style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}
              onClick={disconnect}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="primary-button"
            id="nav-connect-wallet"
            style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}
            onClick={() => connect()}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
    </header>
  );
}
