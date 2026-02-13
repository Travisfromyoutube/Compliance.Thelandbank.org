/**
 * Token generation utilities for buyer access links.
 *
 * Uses Node.js built-in crypto - no extra dependencies.
 * Runs in Vercel serverless functions only (not browser).
 */

import { randomBytes } from 'crypto';

/**
 * Generate a URL-safe random token.
 * @param {number} length - desired character length (default 32)
 * @returns {string} URL-safe alphanumeric token (A-Z, a-z, 0-9, -, _)
 */
export function generateToken(length = 32) {
  const bytes = randomBytes(Math.ceil(length * 0.75));
  return bytes.toString('base64url').slice(0, length);
}

/**
 * Compute a default expiration date.
 * @param {number} days - days from now (default 30)
 * @returns {Date}
 */
export function defaultExpiration(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
