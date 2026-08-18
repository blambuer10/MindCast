// ============================================================================
// MINDCAST — Production rate limiter & DoS protector
// ============================================================================

const rateLimits = new Map<string, Array<{ timestamp: number }>>();

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = rateLimits.get(key) || [];
  
  // Filter out timestamps outside window
  const activeTimestamps = timestamps.filter(t => now - t.timestamp < windowMs);
  
  if (activeTimestamps.length >= limit) {
    return { limited: true, remaining: 0 };
  }
  
  activeTimestamps.push({ timestamp: now });
  rateLimits.set(key, activeTimestamps);
  
  return { limited: false, remaining: limit - activeTimestamps.length };
}
