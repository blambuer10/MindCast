import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics/tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, userId, metadata } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'eventName is required' }, { status: 400 });
    }

    trackEvent(eventName, userId || null, metadata || {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Analytics track error:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
