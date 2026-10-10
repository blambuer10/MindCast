'use client';

import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 id="ttl" style={{ fontSize: '16px', margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{title}</h1>
      </div>
      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
