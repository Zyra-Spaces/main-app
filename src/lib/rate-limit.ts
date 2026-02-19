/**
 * Simple in-memory rate limiter
 * For production, use Redis-based solution like @upstash/ratelimit
 */

const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  const record = requests.get(key);

  if (!record || now > record.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  requests.set(key, record);
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Route-specific rate limiters
 */
export const rateLimiters = {
  waitlist: (identifier: string) => rateLimit(identifier, 5, 60000), // 5/min
  feedback: (identifier: string) => rateLimit(identifier, 10, 60000), // 10/min
  projectCreation: (identifier: string) => rateLimit(identifier, 3, 3600000), // 3/hour
  upvote: (identifier: string) => rateLimit(identifier, 30, 60000), // 30/min
} as const;
