// ============================================================================
// MINDCAST — Content Moderation & Anti-Abuse Engine
// ============================================================================

export interface ModerationResult {
  ok: boolean;
  reason?: string;
  sanitizedContent?: string;
}

export function moderateContent(content: string): ModerationResult {
  if (!content) {
    return { ok: false, reason: 'Idea thesis cannot be empty.' };
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'Idea thesis cannot be whitespace only.' };
  }

  if (trimmed.length < 8) {
    return { ok: false, reason: 'Idea thesis must be at least 8 characters long to formulate a testable claim.' };
  }

  if (trimmed.length > 280) {
    return { ok: false, reason: 'Idea thesis must be 280 characters or less.' };
  }

  // Strip dangerous HTML/Script injection tags
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '');

  if (sanitized.trim().length === 0) {
    return { ok: false, reason: 'Thesis contains disallowed HTML markup.' };
  }

  // Financial Scam & Spam Detection
  const blockedPatterns = [
    /\b(buy\s*now|free\s*money|click\s*here|earn\s*\$|guaranteed\s*return|100x\s*gem|airdrop\s*claim)\b/i,
    /\b(send\s*eth|send\s*usdc|double\s*your\s*crypto|private\s*key|seed\s*phrase)\b/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: 'Content flagged by anti-spam and community integrity filters.' };
    }
  }

  return {
    ok: true,
    sanitizedContent: sanitized.trim()
  };
}
