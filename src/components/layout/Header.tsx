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
        <Link href="/explore">Explore</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/#how">How it works</Link>
        <Link href="/#arena">Debate arena</Link>
        <Link href="/#evidence">Evidence</Link>
        <Link href="/#faq">FAQ</Link>
        <Link href="/#cast" className="nav-cta" style={{ marginRight: '16px' }}>Cast an idea ↗</Link>
        
        {isConnected && address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              {formatAddress(address)}
            </span>
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
