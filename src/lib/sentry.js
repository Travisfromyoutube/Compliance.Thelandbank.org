/**
 * Sentry error monitoring for Vercel serverless functions.
 *
 * Initializes once per cold start and exports:
 *   - withSentry(handler) - wraps API route with error capture
 *   - captureError(err, ctx) - manually report a caught error
 *
 * When SENTRY_DSN is not set, operates as a no-op (dev/prototype mode).
 */

import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of requests get performance tracing
    enableLogs: true,
    beforeSend(event) {
      // Scrub sensitive data before sending to Sentry
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Wrap an API handler with Sentry error capture.
 * Catches unhandled errors, reports them, and returns 500.
 *
 * Usage:
 *   export default withSentry(async function handler(req, res) { ... });
 */
export function withSentry(handler) {
  return async function wrappedHandler(req, res) {
    initSentry();

    try {
      return await handler(req, res);
    } catch (err) {
      console.error(JSON.stringify({
        event: 'unhandled_api_error',
        error: err.message,
        stack: err.stack,
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      }));

      Sentry.captureException(err, {
        extra: {
          path: req.url,
          method: req.method,
          query: req.query,
        },
      });

      // Flush Sentry events before serverless function shuts down
      await Sentry.flush(2000);

      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

/**
 * Manually capture an error with context (for caught errors).
 */
export function captureError(err, context = {}) {
  console.error(JSON.stringify({
    event: 'captured_error',
    error: err.message,
    ...context,
    timestamp: new Date().toISOString(),
  }));

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { extra: context });
  }
}
