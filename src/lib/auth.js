/**
 * Clerk authentication utility for Vercel serverless functions.
 *
 * Verifies the Clerk session JWT from the Authorization header.
 * When CLERK_SECRET_KEY is not set, auth is disabled (prototype mode).
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

  // If no Clerk secret configured, skip auth (prototype mode)
  if (!secretKey) return { prototype: true };

  const authHeader = req.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!sessionToken) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  try {
    const session = await verifyToken(sessionToken, {
      secretKey,
    });
    return session;
  } catch (err) {
    console.error('Clerk auth failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
}
