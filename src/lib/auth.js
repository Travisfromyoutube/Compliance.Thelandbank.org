/**
 * Clerk authentication utility for Vercel serverless functions.
 *
 * Verifies authentication from the Authorization header.
 *
 * Modes:
 *   1) Clerk JWT (preferred) when CLERK_SECRET_KEY is set
 *   2) Static ADMIN_API_KEY fallback when CLERK_SECRET_KEY is not set
 *   3) Prototype mode only when explicitly allowed outside production
 *
 * Usage in API handlers:
 *   import { requireAuth } from '../src/lib/auth.js';
 *   const session = await requireAuth(req, res);
 *   if (!session) return; // 401 already sent
 */

import { verifyToken } from '@clerk/backend';

/**
 * Verify Clerk session token from the request.
 * Returns the decoded session payload, or null if auth fails (response already sent).
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {Promise<object|null>}
 */
export async function requireAuth(req, res) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const apiKey = process.env.ADMIN_API_KEY;
  const allowPrototype = process.env.ALLOW_PROTOTYPE_AUTH === 'true';
  const isProduction = process.env.NODE_ENV === 'production'
    || process.env.VERCEL_ENV === 'production';
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // Preferred mode: Clerk JWT validation
  if (secretKey) {
    if (!bearerToken) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }

    try {
      const session = await verifyToken(bearerToken, {
        secretKey,
      });
      return session;
    } catch (err) {
      console.error('Clerk auth failed:', err.message);
      res.status(401).json({ error: 'Invalid or expired session' });
      return null;
    }
  }

  // Fallback mode: static ADMIN_API_KEY
  if (apiKey) {
    if (!bearerToken) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    if (bearerToken !== apiKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    return { apiKey: true };
  }

  // Final fallback: prototype mode only when explicitly allowed
  if (isProduction && !allowPrototype) {
    res.status(503).json({ error: 'Authentication is not configured' });
    return null;
  }

  return { prototype: true };
}
