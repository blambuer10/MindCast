'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CompassIcon, PlusIcon, BoltIcon, ArenaIcon } from '../ui/Icons';
import { useWallet } from '@/hooks/useWallet';

export default function TabBar() {
  const pathname = usePathname();
  const { address } = useWallet();

  const NAV_ITEMS = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/explore', label: 'Explore', icon: CompassIcon },
    { href: '/create', label: 'Create', icon: PlusIcon, isAction: true },
    { href: '/battles', label: 'Battles', icon: BoltIcon },
    { href: '/arena', label: 'Arena', icon: ArenaIcon },
  ];

  return (
    <nav className="tabbar" aria-label="Mobile Navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={item.isAction ? { color: 'var(--accent)', transform: 'scale(1.15)' } : undefined}
          >
            <IconComponent />
          </Link>
        );
      })}
    </nav>
  );
}
