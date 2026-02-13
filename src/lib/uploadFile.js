/**
 * Upload a File to Vercel Blob via the server-side put() endpoint.
 *
 * Sends the raw file body to /api/upload with filename in a header.
 * The server streams it directly to Vercel Blob storage.
 *
 * @param {File} file — the File object from an <input> or drag-and-drop
 * @param {{ accessToken?: string }} [opts]
 * @returns {Promise<{ url: string, pathname: string }>}
 */
export async function uploadFile(file, opts = {}) {
  const tokenFromUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null;
  const accessToken = opts.accessToken || tokenFromUrl;

  const headers = {
    'content-type': file.type || 'application/octet-stream',
    'x-filename': file.name,
  };
  if (accessToken) {
    headers['x-access-token'] = accessToken;
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: file,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }

  return res.json();
}
