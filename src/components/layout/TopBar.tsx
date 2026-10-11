'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../ui/ThemeToggle';
import NoosMark from '../ui/NoosMark';
import { 
  HomeIcon, 
  ChartIcon, 
  ChatIcon, 
  BoltIcon, 
  ArenaIcon, 
  CompassIcon, 
  BookIcon, 
  UserIcon,
  PlusIcon
} from '../ui/Icons';
import { useWallet } from '@/hooks/useWallet';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/explore', label: 'Explore', icon: CompassIcon },
  { href: '/charts', label: 'Charts', icon: ChartIcon },
  { href: '/reactions', label: 'AI reactions', icon: ChatIcon },
  { href: '/battles', label: 'VS battles', icon: BoltIcon },
  { href: '/arena', label: 'Arena', icon: ArenaIcon },
  { href: '/my-minds', label: 'My Minds', icon: UserIcon },
];

export default function TopBar({ title, actions }: TopBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected, address, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <>
      <header className="top">
        <div className="top-left-group">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Logo on mobile / title */}
          <Link href="/" className="top-mobile-logo" aria-label="MINDCAST">
            <NoosMark size={22} glow />
          </Link>

          <h1 id="ttl" className="top-title">{title}</h1>
        </div>

        <div className="top-actions">
          {actions}
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <Link href="/" className="logo" onClick={() => setIsDrawerOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <NoosMark size={26} glow />
                <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.06em', color: 'var(--ink)' }}>MINDCAST</span>
              </Link>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="mobile-drawer-nav" aria-label="Mobile Navigation Drawer">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <IconComponent />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div style={{ padding: '16px 8px 8px' }}>
              <Link
                href="/create"
                className="pri"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '9999px',
                  fontSize: '15px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
                onClick={() => setIsDrawerOpen(false)}
              >
                <PlusIcon className="i" />
                <span>Create a Mind</span>
              </Link>
            </div>

            <div style={{ marginTop: 'auto', padding: '16px 8px 24px', borderTop: '1px solid var(--line)' }}>
              {isConnected && address ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    href={`/profile/${address}`}
                    className="ghost"
                    style={{ width: '100%', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <UserIcon className="i" />
                    <span>{formatAddress(address)}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { disconnect(); setIsDrawerOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--mute)', fontSize: '12px', cursor: 'pointer', padding: '6px' }}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="ghost"
                  style={{ width: '100%', fontSize: '13px' }}
                  onClick={() => { connect(); setIsDrawerOpen(false); }}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
