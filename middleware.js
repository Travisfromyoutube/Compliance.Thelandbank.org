/**
 * Vercel Edge Middleware — lightweight API route protection.
 *
 * Authentication modes (checked in order):
 *   1. Clerk JWT — when CLERK_SECRET_KEY is set, verifies Bearer token
 *   2. ADMIN_API_KEY — legacy static API key (fallback)
 *   3. Prototype mode — when neither is set, all routes are open
 *
 * Public routes (buyer-facing, always open):
 *   /api/submissions, /api/upload, /api/tokens (verify action)
 *
 * Protected routes (admin):
 *   All other /api/* endpoints
 */

export const config = {
  matcher: '/api/:path*',
};

const PUBLIC_PATHS = [
  '/api/submissions',
  '/api/upload',
];

export default function middleware(req) {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const apiKey = process.env.ADMIN_API_KEY;
  const allowPrototype = process.env.ALLOW_PROTOTYPE_AUTH === 'true';
  const isProduction = process.env.NODE_ENV === 'production'
    || process.env.VERCEL_ENV === 'production';
  const url = new URL(req.url);

  const isPublicPath = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));
  const isTokenVerify = url.pathname === '/api/tokens'
    && req.method === 'GET'
    && url.searchParams.get('action') === 'verify';

  // Allow public (buyer-facing) endpoints without auth
  if (isPublicPath || isTokenVerify) return;

  // No auth configured: fail closed in production unless explicitly allowed.
  if (!clerkSecret && !apiKey) {
    if (isProduction && !allowPrototype) {
      return new Response(JSON.stringify({ error: 'Authentication is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return;
  }

  // Allow CORS preflight
  if (req.method === 'OPTIONS') return;

  // Allow cron job auth (uses CRON_SECRET, not session tokens)
  if (url.pathname.startsWith('/api/cron/')) return;

  // Check for Bearer token (works for both Clerk JWT and ADMIN_API_KEY)
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = auth.slice(7);

  // If Clerk is configured, let the token through to the serverless function
  // where requireAuth() does full JWT verification (Edge can't do async crypto)
  if (clerkSecret) return;

  // Legacy ADMIN_API_KEY check
  if (apiKey && token !== apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
