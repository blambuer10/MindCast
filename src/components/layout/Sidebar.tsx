'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import NoosMark from '../ui/NoosMark';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/explore', label: 'Explore', icon: CompassIcon },
  { href: '/charts', label: 'Charts', icon: ChartIcon },
  { href: '/reactions', label: 'AI reactions', icon: ChatIcon },
  { href: '/battles', label: 'VS battles', icon: BoltIcon },
  { href: '/arena', label: 'Arena', icon: ArenaIcon },
  { href: '/my-minds', label: 'My Minds', icon: UserIcon },
  { href: '/docs', label: 'Docs', icon: BookIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <aside className="col-l" aria-label="Sidebar">
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px 16px' }}>
        <Link href="/" className="logo" aria-label="MINDCAST Home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <NoosMark size={26} glow />
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.06em', color: 'var(--ink)' }}>MINDCAST</span>
        </Link>
      </div>

      <nav aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nv"
              aria-current={isActive ? 'page' : undefined}
            >
              <IconComponent />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Prominent Create a Mind button */}
      <div style={{ padding: '8px 4px 16px', width: '100%' }}>
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
            textAlign: 'center',
            textDecoration: 'none'
          }}
        >
          <PlusIcon className="i" />
          <span>Create a Mind</span>
        </Link>
      </div>

      <div style={{ marginTop: 'auto', marginBottom: '16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isConnected && address ? (
          <>
            <Link
              href={`/profile/${address}`}
              className="ghost wal"
              style={{ width: '100%', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              title="View your Web3 Profile"
            >
              <UserIcon className="i" />
              <span>{formatAddress(address)}</span>
            </Link>
            <button
              className="ghost"
              style={{ width: '100%', fontSize: '12px', padding: '6px', color: 'var(--mute)' }}
              onClick={disconnect}
              title="Click to disconnect"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="ghost wal"
            style={{ width: '100%' }}
            onClick={() => connect()}
            disabled={isConnecting}
          >
            <span>{isConnecting ? 'Connecting...' : 'Connect wallet'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
