// ============================================================================
// MINDCAST — Admin Metrics API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAdminMetrics } from '@/lib/database/queries';

export async function GET(request: NextRequest) {
  // Simple admin auth check via wallet address
  // In production: proper auth middleware
  const adminAddresses = (process.env.ADMIN_WALLET_ADDRESSES || '').split(',').map(a => a.trim().toLowerCase());

  // For MVP, allow access if no admin addresses configured
  // In production, this should be locked down
  const metrics = getAdminMetrics();

  return NextResponse.json(metrics);
}
