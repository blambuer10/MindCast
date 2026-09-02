// ============================================================================
// MINDCAST — Payment Verification API Route
// ============================================================================
// POST /api/payments/verify — Verify a payment and publish the idea

import { NextRequest, NextResponse } from 'next/server';
import {
  findOrCreateUser,
  getIdea,
  createPayment,
  getPaymentByTxHash,
  updatePaymentStatus,
  publishIdea,
} from '@/lib/database/queries';
import { birthMind } from '@/lib/ai/mind-engine';
import { PaymentStatus } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ideaId, txHash, chain, walletAddress } = body;

    // Rate Limiting Protection
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`payments-verify-${ip}-${walletAddress}`, 5, 60000);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many payment verification requests. Please wait.' },
        { status: 429 }
      );
    }
    if (!ideaId || !txHash || !chain || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaId, txHash, chain, walletAddress' },
        { status: 400 }
      );
    }

    // ─── Duplicate Check ───
    const existingPayment = getPaymentByTxHash(chain, txHash);
    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction already used. Duplicate payments are not allowed.' },
        { status: 409 }
      );
    }

    // ─── Idea Validation ───
    const idea = getIdea(ideaId);
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    if (idea.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Idea has already been processed' },
        { status: 400 }
      );
    }

    // ─── User ───
    const user = findOrCreateUser(walletAddress);

    // ─── Create Payment Record ───
    const recipientAddress = process.env.PAYMENT_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000000';
    const tokenSymbol = chain === 'robinhood' ? 'USDG' : 'USDC';
    const payment = createPayment({
      userId: user.id,
      ideaId,
      chain,
      txHash,
      amount: process.env.PAYMENT_AMOUNT || '1',
      token: tokenSymbol,
      recipient: recipientAddress,
      status: PaymentStatus.VERIFYING,
    });

    // ─── Payment Verification ───
    const { verifyOnChainPayment } = await import('@/lib/blockchain/verifier');
    let isVerified = false;
    let verificationError = '';
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      updatePaymentStatus(payment.id, PaymentStatus.FAILED);
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }
    const verResult = await verifyOnChainPayment(txHash);
    isVerified = verResult.success;
    verificationError = verResult.error || '';

    if (!isVerified) {
      updatePaymentStatus(payment.id, PaymentStatus.FAILED);
      return NextResponse.json(
        { error: `Payment verification failed: ${verificationError}` },
        { status: 400 }
      );
    }

    // ─── Confirm Payment ───
    updatePaymentStatus(payment.id, PaymentStatus.CONFIRMED);

    // Track analytics event
    const { trackEvent } = await import('@/lib/analytics/tracker');
    trackEvent('payment_confirmed', user.id, { ideaId, txHash });

    // ─── Birth the Mind ───
    try {
      // Initialize OpenAI provider
      await import('@/lib/ai/openai');
    } catch {
      // Provider may not be available; mind-engine handles fallback
    }

    const agent = await birthMind(idea.id, idea.content);

    // ─── Publish the Idea ───
    publishIdea(idea.id, agent.id);

    // ─── Initialize Unique Token Asset ───
    const { createMindAsset } = await import('@/lib/database/queries');
    createMindAsset(agent.id, 15.0, 70.0, 10.0, 5.0, idea.tokenName || undefined, idea.tokenTicker || undefined);

    return NextResponse.json({
      status: PaymentStatus.CONFIRMED,
      ideaId: idea.id,
      agentId: agent.id,
      tokenName: idea.tokenName,
      tokenTicker: idea.tokenTicker,
    });

  } catch (error) {
    console.error('[API] Payment verify error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
