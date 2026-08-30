'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useWallet } from '@/hooks/useWallet';

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
    <header className="shell topbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--paper)' }}>
      <Link href="/" className="brand">
        <span className="brand-mark"></span>
        <span>MINDCAST</span>
      </Link>

      <nav className="nav" aria-label="Main navigation">
        <Link href="/">Noosphere</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/#arena">Debates</Link>
        <Link href="/docs">Docs</Link>
        {isConnected && address && (
          <Link href={`/profile/${address}`}>Profile</Link>
        )}
        <a
          href="/#cast"
          className="nav-cta"
          style={{ marginRight: '16px', cursor: 'pointer' }}
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.location.pathname === '/') {
              e.preventDefault();
              const castSection = document.getElementById('cast') || document.getElementById('thesis');
              if (castSection) {
                castSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                  const textarea = document.getElementById('thesis') as HTMLTextAreaElement | null;
                  if (textarea) {
                    textarea.focus();
                  }
                }, 400);
              }
            }
          }}
        >
          Cast an idea ↗
        </a>
        
        {isConnected && address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href={`/profile/${address}`}
              id="header-profile-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onClick={(e) => {
                if (typeof window !== 'undefined') {
                  // Direct navigation fallback ensures instant jump
                  window.location.href = `/profile/${address}`;
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
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
            </Link>
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
      </nav>
    </header>
  );
}
