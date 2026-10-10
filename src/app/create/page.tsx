'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import CreateMindWorkflow from '@/components/minds/CreateMindWorkflow';

function CreateMindContent() {
  const searchParams = useSearchParams();
  const initialClaim = searchParams.get('claim') || searchParams.get('content') || '';

  return (
    <div className="pad" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <CreateMindWorkflow initialContent={initialClaim} />
    </div>
  );
}

export default function CreateMindPage() {
  return (
    <AppShell title="Create a Mind">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <CreateMindContent />
      </Suspense>
    </AppShell>
  );
}
