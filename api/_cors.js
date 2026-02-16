/**
 * CORS whitelist utility for API routes.
 *
 * Checks the request Origin against ALLOWED_ORIGINS.
 * - In production: only the live domain is allowed.
 * - In development: localhost on common ports is allowed.
 * - Additional origins can be added via CORS_ORIGINS env var (comma-separated).
 *
 * Usage in any API handler:
 *   import { cors } from './_cors.js';
 *   // At top of handler:
 *   if (cors(req, res)) return;   // handles OPTIONS preflight + blocks bad origins
 */

const ALLOWED_ORIGINS = [
  'https://compliance-thelandbank-org.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// Allow additional origins via env var (comma-separated)
if (process.env.CORS_ORIGINS) {
  ALLOWED_ORIGINS.push(
    ...process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  );
}

/**
 * Apply CORS headers and handle preflight.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ methods?: string, extraHeaders?: string }} opts
 * @returns {boolean} true if the request was fully handled (OPTIONS or blocked origin)
 */
export function cors(req, res, opts = {}) {
  const origin = req.headers.origin || '';
  const methods = opts.methods || 'GET, POST, OPTIONS';
  const headers = opts.extraHeaders
    ? `Content-Type, Authorization, ${opts.extraHeaders}`
    : 'Content-Type, Authorization';

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    // Server-to-server calls (cron, CLI) have no Origin header - allow them
    // but don't set ACAO so browsers still block cross-origin
  } else {
    // Origin present but not whitelisted - block
    res.setHeader('Vary', 'Origin');
    return res.status(403).json({ error: 'Origin not allowed' }) || true;
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
