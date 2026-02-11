/**
 * Upload a File to Vercel Blob via the client-upload pattern.
 *
 * Uses @vercel/blob/client to get a signed URL from /api/upload,
 * then uploads directly from the browser to Vercel Blob storage.
 *
 * @param {File} file — the File object from an <input> or drag-and-drop
 * @returns {Promise<{ url: string, pathname: string }>}
 */
import { upload } from '@vercel/blob/client';

export async function uploadFile(file) {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });

  return { url: blob.url, pathname: blob.pathname };
}
