/**
 * POST /api/upload — Upload a file to Vercel Blob storage.
 *
 * Accepts the file as the raw request body with headers:
 *   x-filename: original filename
 *   content-type: mime type
 *
 * Returns { url, pathname } from Vercel Blob.
 *
 * Uses server-side put() — simple and reliable for files under 4.5MB.
 * Compliance photos (phone camera JPEGs) are typically 2-4MB.
 */

import { put } from '@vercel/blob';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (cors(req, res, { methods: 'POST, OPTIONS', extraHeaders: 'x-filename' })) return;
  if (!(await applyRateLimit(rateLimiters.upload, req, res))) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const filename = req.headers['x-filename'] || `upload-${Date.now()}`;
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    // Validate file type
    const ext = filename.split('.').pop().toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'csv'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: `File type .${ext} not allowed` });
    }

    // Stream the request body directly to Vercel Blob
    const blob = await put(filename, req, {
      access: 'public',
      contentType,
    });

    console.log(`[UPLOAD] File stored: ${blob.url} (${blob.pathname})`);

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
