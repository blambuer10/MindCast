// ============================================================================
// MINDCAST — Content Moderation, Semantic Coherence & Anti-Abuse Engine
// Supports Multilingual Submissions (EN, TR, DE, FR, ES, RU, JA, ZH, etc.)
// Rejects Gibberish, Keyboard Smashes, and Non-Theses
// ============================================================================

export interface ModerationResult {
  ok: boolean;
  reason?: string;
  sanitizedContent?: string;
}

/**
 * Checks whether a word or string is keyboard-smash / gibberish.
 * Multilingual aware: supports Latin (EN, TR, ES, FR, DE), Cyrillic, CJK, Arabic, etc.
 */
function isGibberish(text: string): { gibberish: boolean; reason?: string } {
  // Check for CJK characters (Chinese, Japanese Kanji/Kana, Korean Hangul)
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || [];
  if (cjkMatches.length >= 6) {
    // CJK ideograms contain dense semantic meaning per character
    return { gibberish: false };
  }

  // Check for Cyrillic (Russian, etc.)
  const cyrillicLetters = text.toLowerCase().match(/[\u0400-\u04ff]/g) || [];
  if (cyrillicLetters.length >= 8) {
    const cyrillicVowels = text.toLowerCase().match(/[аеёиоуыэюя]/g) || [];
    if (cyrillicVowels.length / cyrillicLetters.length < 0.12) {
      return {
        gibberish: true,
        reason: 'Input contains random Cyrillic consonant mashing without vowels.'
      };
    }
    return { gibberish: false };
  }

  // Check for Arabic
  const arabicMatches = text.match(/[\u0600-\u06ff]/g) || [];
  if (arabicMatches.length >= 8) {
    return { gibberish: false };
  }

  // Latin and Extended Latin (Turkish, German, French, Spanish, etc.)
  // Extended vowels include: a e i o u y and diacritics (ı, ö, ü, ä, é, è, ê, á, ó, etc.)
  const latinLetters = text.toLowerCase().replace(/[^a-zçğıöşüäëïöüÿáéíóúýàèìòùâêîôûãñõåæø]/gu, '');

  if (latinLetters.length === 0) {
    return { gibberish: true, reason: 'Text contains no recognizable words or letters.' };
  }

  // 1. Vowel-to-consonant check for Latin-based languages
  const vowels = latinLetters.match(/[aeiouyàáâäæãåāăąèéêëēėęěìíîïīįòóôöõøōœùúûüūůűųýÿıöü]/gu) || [];
  const vowelRatio = vowels.length / latinLetters.length;

  if (latinLetters.length >= 8 && vowelRatio < 0.11) {
    return {
      gibberish: true,
      reason: 'Input appears to be random consonants or keyboard-mashing (e.g. no valid vowels detected).'
    };
  }

  // 2. Consecutive consonants check (> 4 consecutive non-vowels in a single word)
  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    const cleanWord = w.replace(/[^a-zçğıöşüäëïöüÿáéíóúýàèìòùâêîôûãñõåæø]/gu, '');
    if (cleanWord.length > 5 && !/[aeiouyàáâäæãåāăąèéêëēėęěìíîïīįòóôöõøōœùúûüūůűųýÿıöü]/u.test(cleanWord)) {
      return {
        gibberish: true,
        reason: `Word "${w}" contains no vowels and appears to be random keys.`
      };
    }
    // Check for 5+ consecutive consonants in Latin (excluding words with valid diacritic clusters)
    if (/[bcdfghjklmnpqrstvwxzçşğ]{5,}/iu.test(cleanWord)) {
      return {
        gibberish: true,
        reason: `Word "${w}" appears to be keyboard mash.`
      };
    }
  }

  // 3. Repeated character spam (e.g. "aaaaa", "111111", "haaaaaha")
  if (/(.)\1{4,}/.test(text)) {
    return {
      gibberish: true,
      reason: 'Repeated character spam detected.'
    };
  }

  // 4. Common keyboard walk sequences
  const keyboardSmashPatterns = [
    /asdf/i,
    /sdfg/i,
    /dfgh/i,
    /fghj/i,
    /ghjk/i,
    /hjkl/i,
    /qwer/i,
    /wert/i,
    /zxcv/i,
    /xcvb/i,
    /cvbn/i,
    /vbnm/i,
    /vcx/i,
    /cxz/i,
    /xzv/i,
    /svcx/i,
  ];

  let smashHits = 0;
  for (const pat of keyboardSmashPatterns) {
    if (pat.test(latinLetters)) {
      smashHits++;
    }
  }
  if (smashHits >= 2 && latinLetters.length < 25) {
    return {
      gibberish: true,
      reason: 'Random keyboard-walk pattern detected.'
    };
  }

  return { gibberish: false };
}

export function moderateContent(content: string): ModerationResult {
  if (!content) {
    return { ok: false, reason: 'Idea thesis cannot be empty.' };
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'Idea thesis cannot be whitespace only.' };
  }

  // Strip dangerous HTML/Script injection tags
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  if (sanitized.length === 0) {
    return { ok: false, reason: 'Thesis contains disallowed HTML markup.' };
  }

  // Check CJK length threshold
  const isCjk = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(sanitized);

  // Minimum length for a meaningful thesis (12 chars for alphabetical, 6 for CJK)
  if (!isCjk && sanitized.length < 12) {
    return {
      ok: false,
      reason: 'A living Mind requires a substantive thesis statement (e.g. "Autonomous agents will outpace traditional DAOs by 2027").'
    };
  }
  if (isCjk && sanitized.length < 6) {
    return {
      ok: false,
      reason: 'Thesis statement is too short to formulate a testable claim.'
    };
  }

  if (sanitized.length > 360) {
    return { ok: false, reason: 'Idea thesis must be 360 characters or less for clear thesis formulation.' };
  }

  // Word count check — must have at least 3 distinct words (or CJK ideograms)
  if (!isCjk) {
    const words = sanitized.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length < 3) {
      return {
        ok: false,
        reason: 'A Mind requires a structured, debatable claim with at least 3 words, not a single word or fragment.'
      };
    }
  }

  // Gibberish / keyboard-smash check
  const gibberishCheck = isGibberish(sanitized);
  if (gibberishCheck.gibberish) {
    return {
      ok: false,
      reason: `Invalid idea input: ${gibberishCheck.reason} MINDCAST agents only investigate genuine hypotheses and substantive ideas.`
    };
  }

  // Financial Scam & Spam Detection
  const blockedPatterns = [
    /\b(buy\s*now|free\s*money|click\s*here|earn\s*\$|guaranteed\s*return|100x\s*gem|airdrop\s*claim)\b/i,
    /\b(send\s*eth|send\s*usdc|double\s*your\s*crypto|private\s*key|seed\s*phrase)\b/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(sanitized)) {
      return { ok: false, reason: 'Content flagged by anti-spam and community integrity filters.' };
    }
  }

  return {
    ok: true,
    sanitizedContent: sanitized
  };
}
