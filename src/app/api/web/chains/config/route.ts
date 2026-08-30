// ============================================================================
// MINDCAST — Web Chains Configuration API
// Returns dynamic chain configuration and token mappings from manifest.json
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getManifestConfig } from '@/lib/blockchain/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = getManifestConfig();
    
    // Ensure the response structure is returned with correct status
    return NextResponse.json(config, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[API] Get chains config error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chains configuration', details: error.message },
      { status: 500 }
    );
  }
}
