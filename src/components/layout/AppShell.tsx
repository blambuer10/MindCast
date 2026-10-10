'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import TopBar from './TopBar';
import RightRail from './RightRail';

interface AppShellProps {
  title: string;
  topActions?: React.ReactNode;
  children: React.ReactNode;
  showRightRail?: boolean;
}

export default function AppShell({
  title,
  topActions,
  children,
  showRightRail = true,
}: AppShellProps) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <TopBar title={title} actions={topActions} />
        {children}
      </main>
      {showRightRail && <RightRail />}
      <TabBar />
    </div>
  );
}
