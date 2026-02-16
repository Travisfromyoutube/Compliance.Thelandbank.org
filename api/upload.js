/**
 * POST /api/upload - Upload a file to Vercel Blob storage.
 *
 * Accepts the file as the raw request body with headers:
 *   x-filename: original filename
 *   content-type: mime type
 *
 * Returns { url, pathname } from Vercel Blob.
 *
 * Uses server-side put() - simple and reliable for files under 4.5MB.
 * Compliance photos (phone camera JPEGs) are typically 2-4MB.
 */

import { put } from '@vercel/blob';
import prisma from '../src/lib/db.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

export const config = {
  api: { bodyParser: false },
};

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'csv']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel', // CSV is often sent as this by browsers
]);

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'POST, OPTIONS', extraHeaders: 'x-filename, x-access-token' })) return;
  if (!(await applyRateLimit(rateLimiters.upload, req, res))) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // If an auth header exists, validate and treat as admin-mode upload.
    // Otherwise require a valid buyer access token in x-access-token.
    const hasAuthHeader = req.headers.authorization?.startsWith('Bearer ');
    let session = null;
    if (hasAuthHeader) {
      session = await requireAuth(req, res);
      if (!session) return;
    }
    let validatedToken = null;
    if (!session) {
      const rawToken = req.headers['x-access-token'];
      const token = typeof rawToken === 'string' ? rawToken : '';
      if (!token) {
        return res.status(401).json({ error: 'Valid access token is required for upload' });
      }

      validatedToken = await prisma.accessToken.findUnique({ where: { token } });
      if (!validatedToken) {
        return res.status(403).json({ error: 'Invalid access link' });
      }
      if (validatedToken.revokedAt) {
        return res.status(403).json({ error: 'This access link has been revoked' });
      }
      if (new Date() > validatedToken.expiresAt) {
        return res.status(403).json({ error: 'This access link has expired' });
      }
    }

    const rawFilename = String(req.headers['x-filename'] || `upload-${Date.now()}`);
    const filename = rawFilename.replace(/[^\w.\-]/g, '_').slice(0, 180);
    const contentType = String(req.headers['content-type'] || 'application/octet-stream').toLowerCase();
    const contentLength = Number(req.headers['content-length'] || 0);

    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return res.status(400).json({ error: 'Missing or invalid content-length header' });
    }
    if (contentLength > MAX_UPLOAD_SIZE) {
      return res.status(413).json({ error: 'File too large. Max size is 10 MB.' });
    }

    // Validate file type
    const ext = filename.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(contentType)) {
      return res.status(400).json({ error: `File type .${ext} not allowed` });
    }

    // Stream the request body directly to Vercel Blob
    const blob = await put(filename, req, {
      access: 'public',
      contentType,
    });

    log.info('file_uploaded', {
      pathname: blob.pathname,
      contentType,
      sizeBytes: contentLength,
      mode: session ? 'admin' : 'buyer_token',
      tokenId: validatedToken?.id || null,
    });

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    log.error('upload_failed', { error: error.message });
    return res.status(500).json({ error: 'Upload failed' });
  }
});
