/**
 * POST /api/upload — Upload a file to Vercel Blob storage.
 *
 * Accepts a single file via multipart/form-data.
 * Returns the public blob URL for persistence in Document records.
 *
 * Uses client-upload pattern (handleUploadBody) to support files
 * larger than the 4.5MB serverless body limit.
 */

import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type
        const ext = pathname.split('.').pop().toLowerCase();
        const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'csv'];
        if (!allowed.includes(ext)) {
          throw new Error(`File type .${ext} not allowed`);
        }

        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/csv', 'application/octet-stream',
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB max
          tokenPayload: JSON.stringify({ uploadedAt: Date.now() }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log(`[UPLOAD] File stored: ${blob.url} (${blob.pathname})`);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return res.status(400).json({ error: error.message });
  }
}
