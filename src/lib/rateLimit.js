/**
 * Rate limiting via Upstash Redis.
 *
 * Uses a sliding window algorithm. When UPSTASH_REDIS_REST_URL is not set,
 * rate limiting is disabled (dev/prototype mode) and all requests pass.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis = null;

function getRedis() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * Create a rate limiter for a specific endpoint.
 *
 * @param {object} opts
 * @param {string} opts.prefix   - unique prefix for this limiter (e.g. "token_verify")
 * @param {number} opts.limit    - max requests per window
 * @param {string} opts.window   - window duration (e.g. "1 m", "5 m", "1 h")
 * @returns {Ratelimit|null}
 */
export function createLimiter({ prefix, limit, window }) {
  const r = getRedis();
  if (!r) return null;

  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `rl:${prefix}`,
  });
}

/**
 * Pre-configured limiters for each endpoint category.
 */
export const rateLimiters = {
  /** Buyer token verification - 10 requests per minute per IP */
  tokenVerify: createLimiter({ prefix: 'token_verify', limit: 10, window: '1 m' }),

  /** Buyer submission - 5 requests per minute per IP */
  submission: createLimiter({ prefix: 'submission', limit: 5, window: '1 m' }),

  /** File upload - 10 requests per minute per IP */
  upload: createLimiter({ prefix: 'upload', limit: 10, window: '1 m' }),

  /** Token creation (admin) - 20 requests per minute per IP */
  tokenCreate: createLimiter({ prefix: 'token_create', limit: 20, window: '1 m' }),

  /** FileMaker sync trigger - 2 requests per 5 minutes per IP */
  fmSync: createLimiter({ prefix: 'fm_sync', limit: 2, window: '5 m' }),

  /** Email send - 10 requests per minute per IP */
  emailSend: createLimiter({ prefix: 'email_send', limit: 10, window: '1 m' }),

  /** General API - 60 requests per minute per IP (fallback) */
  general: createLimiter({ prefix: 'general', limit: 60, window: '1 m' }),
};

/**
 * Apply rate limiting to a request. Returns true if allowed, false if blocked.
 * Sends 429 response automatically if blocked.
 *
 * @param {Ratelimit|null} limiter - one of the rateLimiters above
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<boolean>} true if request is allowed
 */
export async function applyRateLimit(limiter, req, res) {
  if (!limiter) return true;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      });
      return false;
    }

    return true;
  } catch (err) {
    // Fail open if Redis is down - log and allow
    console.error('Rate limit check failed:', err.message);
    return true;
  }
}
