'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../ui/ThemeToggle';
import NoosMark from '../ui/NoosMark';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} aria-label="MINDCAST Home">
          <NoosMark size={24} glow />
          <span style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: '15px', color: 'var(--ink)' }}>MINDCAST</span>
        </Link>
        <span style={{ color: 'var(--line)', fontSize: '16px', userSelect: 'none' }}>/</span>
        <h1 id="ttl" style={{ fontSize: '16px', margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{title}</h1>
      </div>
      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
