/**
 * FileMaker Data API client for Vercel serverless functions.
 *
 * Handles session-token auth, request formatting, and FM-specific
 * error codes. Session tokens are cached in Upstash Redis (14-min TTL)
 * to avoid login/logout per request. Circuit breaker backs off after
 * 3 consecutive failures.
 *
 * Env vars required:
 *   FM_SERVER_URL  — base URL (e.g. https://fm.example.com or Cloudflare Tunnel URL)
 *   FM_DATABASE    — FileMaker database name
 *   FM_USERNAME    — Data API account username
 *   FM_PASSWORD    — Data API account password
 *
 * Optional (for session caching):
 *   UPSTASH_REDIS_REST_URL   — from Task 03
 *   UPSTASH_REDIS_REST_TOKEN — from Task 03
 */

import { Redis } from '@upstash/redis';

const FM_API_VERSION = 'v1';

/* ── Redis session cache ──────────────────────────────────── */

const FM_SESSION_KEY = 'fm:session';
const SESSION_TTL_SECONDS = 840; // 14 minutes (FM expires at 15)

const FM_CIRCUIT_KEY = 'fm:circuit';
const CIRCUIT_OPEN_DURATION_SECONDS = 300; // 5 minutes
const FAILURE_THRESHOLD = 3;

let redis = null;
function getRedis() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * Get a cached FM session token, or create a new one.
 * Cached in Upstash Redis with a 14-minute TTL.
 * Falls back to a fresh login if Redis is unavailable.
 */
async function getCachedToken() {
  const r = getRedis();

  if (r) {
    try {
      const cached = await r.get(FM_SESSION_KEY);
      if (cached) return cached;
    } catch (err) {
      console.error('Redis get failed, creating fresh FM session:', err.message);
    }
  }

  // No cached token — create a new session
  const token = await login();

  if (r) {
    try {
      await r.set(FM_SESSION_KEY, token, { ex: SESSION_TTL_SECONDS });
    } catch (err) {
      console.error('Redis set failed:', err.message);
    }
  }

  return token;
}

/**
 * Invalidate the cached session (e.g., after a 401 from FM).
 */
async function invalidateCachedToken() {
  const r = getRedis();
  if (r) {
    try { await r.del(FM_SESSION_KEY); } catch { /* best effort */ }
  }
}

/* ── Circuit breaker ──────────────────────────────────────── */

/**
 * Check if the FM circuit breaker is open (FM is down, stop trying).
 */
export async function isCircuitOpen() {
  const r = getRedis();
  if (!r) return false;

  try {
    const failures = await r.get(FM_CIRCUIT_KEY);
    return failures && parseInt(failures, 10) >= FAILURE_THRESHOLD;
  } catch {
    return false;
  }
}

/**
 * Record an FM failure. After FAILURE_THRESHOLD consecutive failures,
 * the circuit opens for CIRCUIT_OPEN_DURATION_SECONDS.
 */
async function recordFailure() {
  const r = getRedis();
  if (!r) return;

  try {
    const count = await r.incr(FM_CIRCUIT_KEY);
    if (count === 1) {
      await r.expire(FM_CIRCUIT_KEY, CIRCUIT_OPEN_DURATION_SECONDS);
    }
  } catch { /* best effort */ }
}

/** Reset failure counter on successful FM operation. */
async function recordSuccess() {
  const r = getRedis();
  if (!r) return;
  try { await r.del(FM_CIRCUIT_KEY); } catch { /* best effort */ }
}

function getConfig() {
  const server = process.env.FM_SERVER_URL;
  const database = process.env.FM_DATABASE;
  const username = process.env.FM_USERNAME;
  const password = process.env.FM_PASSWORD;

  if (!server || !database || !username || !password) {
    return null;
  }

  // Strip trailing slash from server URL
  const baseUrl = `${server.replace(/\/+$/, '')}/fmi/data/${FM_API_VERSION}/databases/${encodeURIComponent(database)}`;

  return { server, database, username, password, baseUrl };
}

/** Check whether FM env vars are configured */
export function isConfigured() {
  return getConfig() !== null;
}

/* ── Session management ─────────────────────────────────── */

/**
 * Login to FileMaker Data API and receive a session token.
 * Token is valid for 15 minutes after last use.
 */
export async function login() {
  const config = getConfig();
  if (!config) throw new Error('FileMaker not configured — missing FM_* env vars');

  const res = await fetch(`${config.baseUrl}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FM login failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.response.token;
}

/** Logout / release session token */
export async function logout(token) {
  const config = getConfig();
  if (!config || !token) return;

  try {
    await fetch(`${config.baseUrl}/sessions/${token}`, {
      method: 'DELETE',
    });
  } catch {
    // Best-effort — don't throw on logout failure
  }
}

/* ── Core request helper ────────────────────────────────── */

/**
 * Make an authenticated request to the FM Data API.
 *
 * @param {string} token   — session token from login()
 * @param {string} method  — HTTP method
 * @param {string} path    — path after /databases/{db}/ (e.g. "layouts/MyLayout/records")
 * @param {object} [body]  — request body (will be JSON-serialized)
 * @returns {object}       — parsed response.response object
 */
async function fmRequest(token, method, path, body = null) {
  const config = getConfig();
  if (!config) throw new Error('FileMaker not configured');

  const url = `${config.baseUrl}/${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  // FM error codes: "0" = OK, anything else = error
  const code = data.messages?.[0]?.code;
  if (code && code !== '0') {
    const msg = data.messages[0].message;
    const err = new Error(`FileMaker error ${code}: ${msg}`);
    err.fmCode = code;
    err.fmMessage = msg;
    throw err;
  }

  return data.response;
}

/* ── CRUD operations ────────────────────────────────────── */

/**
 * Get all records from a layout (paginated).
 *
 * @param {string} token
 * @param {string} layout — FM layout name
 * @param {object} [opts] — { limit, offset, sort }
 */
export async function getRecords(token, layout, opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('_limit', opts.limit);
  if (opts.offset) params.set('_offset', opts.offset);
  if (opts.sort) {
    params.set('_sort', JSON.stringify(
      Array.isArray(opts.sort) ? opts.sort : [opts.sort]
    ));
  }

  const qs = params.toString();
  const path = `layouts/${encodeURIComponent(layout)}/records${qs ? `?${qs}` : ''}`;
  return fmRequest(token, 'GET', path);
}

/**
 * Get a single record by FM recordId.
 */
export async function getRecord(token, layout, recordId) {
  const path = `layouts/${encodeURIComponent(layout)}/records/${recordId}`;
  return fmRequest(token, 'GET', path);
}

/**
 * Find records matching a query.
 *
 * @param {string} token
 * @param {string} layout
 * @param {Array<object>} query — FM find criteria, e.g. [{ ParcelID: "41-06-..." }]
 * @param {object} [opts]       — { sort, limit, offset }
 */
export async function findRecords(token, layout, query, opts = {}) {
  const body = { query };
  if (opts.sort) body.sort = Array.isArray(opts.sort) ? opts.sort : [opts.sort];
  if (opts.limit) body.limit = String(opts.limit);
  if (opts.offset) body.offset = String(opts.offset);

  const path = `layouts/${encodeURIComponent(layout)}/_find`;
  return fmRequest(token, 'POST', path, body);
}

/**
 * Create a new record.
 *
 * @param {string} token
 * @param {string} layout
 * @param {object} fieldData — FM field names → values
 * @returns {{ recordId: string, modId: string }}
 */
export async function createRecord(token, layout, fieldData) {
  const path = `layouts/${encodeURIComponent(layout)}/records`;
  return fmRequest(token, 'POST', path, { fieldData });
}

/**
 * Update an existing record.
 *
 * @param {string} token
 * @param {string} layout
 * @param {string} recordId — FM internal record ID
 * @param {object} fieldData — only fields to update
 */
export async function updateRecord(token, layout, recordId, fieldData) {
  const path = `layouts/${encodeURIComponent(layout)}/records/${recordId}`;
  return fmRequest(token, 'PATCH', path, { fieldData });
}

/**
 * Delete a record.
 */
export async function deleteRecord(token, layout, recordId) {
  const path = `layouts/${encodeURIComponent(layout)}/records/${recordId}`;
  return fmRequest(token, 'DELETE', path);
}

/* ── Container field upload ─────────────────────────────── */

/**
 * Upload a file to a container field.
 *
 * @param {string} token
 * @param {string} layout
 * @param {string} recordId
 * @param {string} fieldName — container field name
 * @param {Buffer|Blob} fileData
 * @param {string} filename
 */
export async function uploadToContainer(token, layout, recordId, fieldName, fileData, filename) {
  const config = getConfig();
  if (!config) throw new Error('FileMaker not configured');

  const url = `${config.baseUrl}/layouts/${encodeURIComponent(layout)}/records/${recordId}/containers/${encodeURIComponent(fieldName)}/1`;

  // Build multipart form
  const formData = new FormData();
  const blob = fileData instanceof Blob ? fileData : new Blob([fileData]);
  formData.append('upload', blob, filename);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FM container upload failed (${res.status}): ${text}`);
  }

  return res.json();
}

/* ── Layout metadata ────────────────────────────────────── */

/**
 * Get field metadata for a layout (useful for mapping validation).
 */
export async function getLayoutMetadata(token, layout) {
  const path = `layouts/${encodeURIComponent(layout)}`;
  return fmRequest(token, 'GET', path);
}

/* ── Convenience: session-scoped operation ──────────────── */

/**
 * Run a callback with a valid FM session token.
 * Uses cached session if available. Retries once on auth failure.
 * Circuit breaker prevents hammering a down FM server.
 *
 * @param {(token: string) => Promise<T>} callback
 * @returns {Promise<T>}
 *
 * @example
 *   const records = await withSession(async (token) => {
 *     return getRecords(token, 'Properties', { limit: 100 });
 *   });
 */
export async function withSession(callback) {
  if (await isCircuitOpen()) {
    const err = new Error('FileMaker circuit breaker is open — FM appears to be down. Serving from local cache.');
    err.circuitOpen = true;
    throw err;
  }

  let token = await getCachedToken();

  try {
    const result = await callback(token);
    await recordSuccess();
    return result;
  } catch (err) {
    // If FM returned 401/expired (code 952), invalidate and retry once
    if (err.fmCode === '952' || err.message?.includes('401')) {
      console.warn('FM session expired, retrying with fresh token');
      await invalidateCachedToken();
      token = await getCachedToken();
      try {
        const result = await callback(token);
        await recordSuccess();
        return result;
      } catch (retryErr) {
        await recordFailure();
        throw retryErr;
      }
    }
    await recordFailure();
    throw err;
  }
}
