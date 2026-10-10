'use client';

import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="top">
      <h1 id="ttl">{title}</h1>
      <div className="top-actions">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
