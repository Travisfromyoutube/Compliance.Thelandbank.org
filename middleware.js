/**
 * Vercel Edge Middleware — lightweight API route protection.
 *
 * Public routes (buyer-facing):
 *   /api/verify-token, /api/submissions, /api/upload
 *
 * Protected routes (admin):
 *   All other /api/* endpoints require Authorization: Bearer {ADMIN_API_KEY}
 *
 * When ADMIN_API_KEY is not set, all routes are open (prototype mode).
 */

export const config = {
  matcher: '/api/:path*',
};

const PUBLIC_PATHS = [
  '/api/verify-token',
  '/api/submissions',
  '/api/upload',
];

export default function middleware(req) {
  const apiKey = process.env.ADMIN_API_KEY;

  // If no API key configured, skip auth (prototype mode)
  if (!apiKey) return;

  const url = new URL(req.url);

  // Allow public (buyer-facing) endpoints without auth
  if (PUBLIC_PATHS.some((p) => url.pathname.startsWith(p))) return;

  // Allow CORS preflight
  if (req.method === 'OPTIONS') return;

  // Allow cron job auth (uses CRON_SECRET, not ADMIN_API_KEY)
  if (url.pathname.startsWith('/api/cron/')) return;

  // Check admin API key
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
