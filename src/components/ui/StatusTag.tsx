import React from 'react';
import type { Status } from '@/types/mind';
import { STATUS_COLORS } from '@/lib/scoring';

interface StatusTagProps {
  status: Status;
  className?: string;
}

export default function StatusTag({ status, className = '' }: StatusTagProps) {
  const color = STATUS_COLORS[status] || '#8899A6';
  return (
    <span
      className={`tag ${className}`}
      style={{ ['--c' as any]: color }}
    >
      {status}
    </span>
  );
}
