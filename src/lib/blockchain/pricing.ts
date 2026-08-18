// ============================================================================
// MINDCAST — Pricing and Valuation Utility
// ============================================================================

export interface PriceDetails {
  reputation: number;
  pricePerShare: number;
  sharesQuantity: number;
  grossAmount: number;
  fees: number;
  netAmount: number;
}

/**
 * Calculates share price, quantity, gross amount, protocol fees, and net amount
 * dynamically based on the Mind's intellectual track record.
 */
export function calculateTradePrice(
  percentage: number,
  agent: { credibility: number; predictionAccuracy: number; confidence: number },
  followerCount: number
): PriceDetails {
  // Reputation is a 10-100 score driven by actual tracking history
  const reputation = Math.min(100, Math.max(10, Math.round(
    (agent.credibility * 0.4) + 
    ((agent.predictionAccuracy || 0.7) * 40) + 
    ((followerCount || 0) / 20) + 
    (agent.confidence * 0.1)
  )));

  // Price per share is scaled so that a 1% share (1,000 shares) costs roughly ~1.0 USDC
  // at average reputation levels (e.g. 50 reputation) to align with testnet liquidity.
  const pricePerShare = (0.10 + (reputation / 250)) / 300;
  const sharesQuantity = percentage * 1000;
  
  const grossAmount = sharesQuantity * pricePerShare;
  const fees = grossAmount * 0.02; // 2% protocol fee
  const netAmount = grossAmount - fees;

  return {
    reputation,
    pricePerShare,
    sharesQuantity,
    grossAmount,
    fees,
    netAmount
  };
}
