// ============================================================================
// MINDCAST — Token Metadata Generator
// ============================================================================
// Automatically extracts a punchy, market-ready Token Name and 3-6 letter
// Ticker symbol ($TICKER) from any thesis, similar to Pump.fun / Virtuals.

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'will',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'to',
  'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'just', 'should', 'now', 'that', 'this', 'these', 'those', 'with',
  'for', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'by', 'of', 'at', 'off', 'we', 'our', 'you', 'it'
]);

export interface TokenMeta {
  tokenName: string;
  tokenTicker: string;
}

export function generateTokenMetadata(thesis: string): TokenMeta {
  if (!thesis || !thesis.trim()) {
    return {
      tokenName: 'Cognitive Mind',
      tokenTicker: 'MIND'
    };
  }

  const cleanText = thesis
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanText
    .split(' ')
    .filter(w => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));

  // If specific premier thesis matches
  if (thesis.toLowerCase().includes('cognitive capital') || thesis.toLowerCase().includes('autonomous cognitive')) {
    return {
      tokenName: 'Autonomous Cognitive Capital',
      tokenTicker: 'ACC'
    };
  }

  if (words.length === 0) {
    return {
      tokenName: 'Mind Share',
      tokenTicker: 'MIND'
    };
  }

  // 1. Determine Token Name (Up to 3-4 significant title-cased words)
  const nameWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  let tokenName = nameWords.join(' ');
  if (!tokenName.toLowerCase().includes('mind') && !tokenName.toLowerCase().includes('capital') && !tokenName.toLowerCase().includes('network') && nameWords.length < 3) {
    tokenName += ' Protocol';
  }

  // 2. Determine Ticker Symbol (3-5 capital letters)
  let ticker = '';
  if (nameWords.length >= 3) {
    // Acronym: e.g. Autonomous Cognitive Capital -> ACC
    ticker = nameWords.map(w => w.charAt(0).toUpperCase()).join('').slice(0, 5);
  } else if (nameWords.length === 2) {
    // First 2 letters of word 1 + first 2 of word 2
    ticker = (nameWords[0].slice(0, 2) + nameWords[1].slice(0, 2)).toUpperCase();
  } else {
    // First 4 consonants/letters of the word
    ticker = words[0].slice(0, 4).toUpperCase();
  }

  // Clean ticker
  ticker = ticker.replace(/[^A-Z0-9]/g, '');
  if (ticker.length < 3) {
    ticker = (ticker + 'MIND').slice(0, 4);
  } else if (ticker.length > 5) {
    ticker = ticker.slice(0, 5);
  }

  return {
    tokenName: tokenName.slice(0, 32),
    tokenTicker: ticker
  };
}
