/**
 * TypeScript types for MindCast Solana Anchor program & Pyth settlement.
 */

export type MarketOutcome = 'OPEN' | 'BULL_WON' | 'BEAR_WON' | 'CANCELLED';

export interface SolanaPredictionMarket {
  publicKey: string;
  marketId: string;
  mindA: string;
  mindB: string;
  claim: string;
  pythFeedId: string;
  targetPrice: number;
  priceDecimals: number;
  totalBullStake: number; // in micro-USDC or lamports
  totalBearStake: number;
  startTimestamp: number;
  endTimestamp: number;
  status: MarketOutcome;
  resolvedPrice?: number;
}

export interface UserSolanaStake {
  userWallet: string;
  marketId: string;
  side: 'BULL' | 'BEAR';
  amount: number;
  claimed: boolean;
  timestamp: number;
}

export interface PythPriceData {
  id: string;
  price: number;
  confidence: number;
  expo: number;
  publishTime: number;
  formattedPrice: string;
}
