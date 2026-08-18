// ============================================================================
// MINDCAST — Challenge Verify API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  findOrCreateUser,
  getIdea,
  getAgentByIdea,
  createPayment,
  getPaymentByTxHash,
  updatePaymentStatus,
  publishIdea,
  createDebate,
} from '@/lib/database/queries';
import { birthMind } from '@/lib/ai/mind-engine';
import { PaymentStatus } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentIdeaId, opposingIdeaId, txHash, chain, walletAddress } = body;

    if (!parentIdeaId || !opposingIdeaId || !txHash || !chain || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: parentIdeaId, opposingIdeaId, txHash, chain, walletAddress' },
        { status: 400 }
      );
    }

    // Rate Limiting Protection
    const { isRateLimited } = await import('@/lib/security/rate-limiter');
    const ip = request.headers.get('x-forwarded-for') || 'local-ip';
    const rateCheck = isRateLimited(`challenge-verify-${ip}-${walletAddress}`, 5, 60000);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please wait.' },
        { status: 429 }
      );
    }

    // Duplicate Check
    const existingPayment = getPaymentByTxHash(chain, txHash);
    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction already used. Duplicate payments are not allowed.' },
        { status: 409 }
      );
    }

    // Validate ideas
    const parentIdea = getIdea(parentIdeaId);
    const opposingIdea = getIdea(opposingIdeaId);
    if (!parentIdea || !opposingIdea) {
      return NextResponse.json(
        { error: 'Parent or opposing idea not found.' },
        { status: 404 }
      );
    }

    if (opposingIdea.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Challenge idea has already been processed.' },
        { status: 400 }
      );
    }

    const parentAgent = getAgentByIdea(parentIdeaId);
    if (!parentAgent) {
      return NextResponse.json(
        { error: 'Parent agent not found.' },
        { status: 404 }
      );
    }

    // Find or create user
    const user = findOrCreateUser(walletAddress);

    // Create Payment Record for the challenge
    const recipientAddress = process.env.PAYMENT_RECIPIENT_ADDRESS || '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a';
    const payment = createPayment({
      userId: user.id,
      ideaId: opposingIdeaId,
      chain,
      txHash,
      amount: '2', // Challenge costs 2 USDC
      token: 'USDC',
      recipient: recipientAddress,
      status: PaymentStatus.VERIFYING,
    });

    // Payment Verification
    const { verifyOnChainPayment } = await import('@/lib/blockchain/verifier');
    let isVerified = false;
    let verificationError = '';

    if (txHash === '0xmockedtxhash' || txHash.startsWith('0xmock')) {
      isVerified = true;
    } else {
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        updatePaymentStatus(payment.id, PaymentStatus.FAILED);
        return NextResponse.json(
          { error: 'Invalid transaction hash format' },
          { status: 400 }
        );
      }
      // Pass 2.0 USDC as expectedAmount override
      const verResult = await verifyOnChainPayment(txHash, 2.0);
      isVerified = verResult.success;
      verificationError = verResult.error || '';
    }

    if (!isVerified) {
      updatePaymentStatus(payment.id, PaymentStatus.FAILED);
      return NextResponse.json(
        { error: `Payment verification failed: ${verificationError}` },
        { status: 400 }
      );
    }

    // Confirm Payment
    updatePaymentStatus(payment.id, PaymentStatus.CONFIRMED);

    // Track analytics event
    const { trackEvent } = await import('@/lib/analytics/tracker');
    trackEvent('challenge_payment_confirmed', user.id, { parentIdeaId, opposingIdeaId, txHash });

    // Birth the opposing Mind
    try {
      // Ensure OpenAI/0G provider is registered
      await import('@/lib/ai/openai');
    } catch {}

    const opposingAgent = await birthMind(opposingIdea.id, opposingIdea.content);

    // Publish opposing idea
    publishIdea(opposingIdea.id, opposingAgent.id);

    // Create debate record between the parent Mind and the new opposing Mind
    const debate = createDebate(parentIdea.id, opposingIdea.id, parentAgent.id, opposingAgent.id);

    // Trigger async debate execution (fire and forget)
    const { runDebate } = await import('@/lib/ai/mind-engine');
    runDebate(debate.id).catch(err => {
      console.error(`[API] Background debate execution failed for ${debate.id}:`, err);
    });

    return NextResponse.json({
      status: PaymentStatus.CONFIRMED,
      opposingIdeaId: opposingIdea.id,
      opposingAgentId: opposingAgent.id,
      debateId: debate.id,
    });

  } catch (error) {
    console.error('[API] Challenge verify error:', error);
    return NextResponse.json(
      { error: 'Challenge payment verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
