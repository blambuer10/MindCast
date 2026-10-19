import { PythPriceData } from './types';
import { getSolanaConfig } from './config';

/**
 * Fetch real-time price feed from Pyth Hermes API
 * @param feedId 32-byte hex feed ID (e.g. SOL/USD)
 */
export async function getPythPrice(feedId?: string): Promise<PythPriceData | null> {
  const config = getSolanaConfig();
  const id = feedId || config.pythFeeds.solUsd;

  try {
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${id}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 10 } });
    if (!res.ok) {
      throw new Error(`Hermes API error: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.parsed || data.parsed.length === 0) {
      return null;
    }

    const priceObj = data.parsed[0].price;
    const rawPrice = Number(priceObj.price);
    const expo = Number(priceObj.expo);
    const confidence = Number(priceObj.conf) * Math.pow(10, expo);
    const actualPrice = rawPrice * Math.pow(10, expo);

    return {
      id,
      price: actualPrice,
      confidence,
      expo,
      publishTime: priceObj.publish_time,
      formattedPrice: `$${actualPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
    };
  } catch (error) {
    console.error('[Pyth] Failed to fetch Pyth price:', error);
    return null;
  }
}

/**
 * Check if a market target condition is met based on Pyth price
 */
export function evaluateMarketOutcome(
  targetPrice: number,
  actualPrice: number,
  isBullTargetHigher: boolean = true
): 'BULL_WON' | 'BEAR_WON' {
  if (isBullTargetHigher) {
    return actualPrice >= targetPrice ? 'BULL_WON' : 'BEAR_WON';
  } else {
    return actualPrice <= targetPrice ? 'BULL_WON' : 'BEAR_WON';
  }
}
