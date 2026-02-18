/**
 * FileMaker Data API client for Vercel serverless functions.
 *
 * Handles session-token auth, request formatting, and FM-specific
 * error codes. Session tokens are cached in Upstash Redis (14-min TTL)
 * to avoid login/logout per request. Circuit breaker backs off after
 * 3 consecutive failures.
 *
 * Features:
 *   - Script-mode writes (entrymode/prohibitmode) to bypass FM field validation
 *   - Portal pagination for related record fetches
 *   - Container field URL resolution (hosted FM returns temp URLs)
 *   - Layout metadata discovery for TBD_ field name resolution
 *   - Duplicate record support
 *   - FM error code classification (auth, validation, not-found, etc.)
 *
 * Env vars required:
 *   FM_SERVER_URL  - base URL (e.g. https://fm.example.com or Cloudflare Tunnel URL)
 *   FM_DATABASE    - FileMaker database name
 *   FM_USERNAME    - Data API account username
 *   FM_PASSWORD    - Data API account password
 *
 * Optional (for session caching):
 *   UPSTASH_REDIS_REST_URL   - from Task 03
 *   UPSTASH_REDIS_REST_TOKEN - from Task 03
 */

import { Redis } from '@upstash/redis';

const FM_API_VERSION = 'v1';

/* ── Redis session cache ──────────────────────────────────── */

const FM_SESSION_KEY = 'fm:session';
const SESSION_TTL_SECONDS = 840; // 14 minutes (FM expires at 15)

const FM_CIRCUIT_KEY = 'fm:circuit';
const CIRCUIT_OPEN_DURATION_SECONDS = 300; // 5 minutes
const FAILURE_THRESHOLD = 3;

/* ── FM error code classification ──────────────────────────
 * Common Data API error codes. Used by fmRequest() to attach
 * a category to thrown errors so callers can branch without
 * memorizing numeric codes.
 * Ref: https://help.claris.com/en/pro-help/content/error-codes.html
 * ──────────────────────────────────────────────────────────── */

export const FM_ERROR = Object.freeze({
  NO_RECORDS:       '401',  // No records match the request
  RECORD_MISSING:   '101',  // Record is missing
  FIELD_MISSING:    '102',  // Field is missing
  LAYOUT_MISSING:   '105',  // Layout is missing
  VALIDATION:       '500',  // Date value does not meet validation entry options
  VALIDATION_RANGE: '503',  // Value in field is not within the range
  SESSION_EXPIRED:  '952',  // Session token is invalid or expired
  FILE_LOCKED:      '301',  // Record is locked by another user
  RECORD_LOCKED:    '306',  // Record modification ID does not match
});

/**
 * Classify an FM error code into a category for conditional handling.
 * @param {string} code - FM error code string
 * @returns {'auth'|'not_found'|'validation'|'conflict'|'unknown'}
 */
export function classifyFMError(code) {
  if (code === '952' || code === '212') return 'auth';
  if (code === '401' || code === '101' || code === '105') return 'not_found';
  if (code >= '500' && code <= '511') return 'validation';
  if (code === '301' || code === '306') return 'conflict';
  return 'unknown';
}

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

  // No cached token - create a new session
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
  if (!config) throw new Error('FileMaker not configured - missing FM_* env vars');

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
    // Best-effort - don't throw on logout failure
  }
}

/* ── Core request helper ────────────────────────────────── */

/**
 * Make an authenticated request to the FM Data API.
 *
 * @param {string} token   - session token from login()
 * @param {string} method  - HTTP method
 * @param {string} path    - path after /databases/{db}/ (e.g. "layouts/MyLayout/records")
 * @param {object} [body]  - request body (will be JSON-serialized)
 * @returns {object}       - parsed response.response object
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
    err.fmCategory = classifyFMError(code);
    throw err;
  }

  return data.response;
}

/* ── Write options ──────────────────────────────────────── */

/**
 * Default write options for portal-to-FM operations.
 * entrymode: "script" bypasses FM field validation rules.
 * prohibitmode: "script" ignores "prohibit modification" settings.
 *
 * These are essential for API writes because FM validation rules
 * are designed for human data entry, not programmatic access.
 * Without them, auto-enter serial numbers, required field checks,
 * and range validations can silently reject API writes.
 */
const DEFAULT_WRITE_OPTS = Object.freeze({
  entrymode: 'script',
  prohibitmode: 'script',
});

/**
 * Build a write request body with fieldData + optional FM options.
 *
 * @param {object} fieldData - FM field names to values
 * @param {object} [opts] - { entrymode, prohibitmode, modId, portalData, script }
 * @returns {object} request body for FM Data API
 */
function buildWriteBody(fieldData, opts = {}) {
  const body = { fieldData };

  // Entry/prohibit modes - default to "script" for API writes
  const entrymode = opts.entrymode ?? DEFAULT_WRITE_OPTS.entrymode;
  const prohibitmode = opts.prohibitmode ?? DEFAULT_WRITE_OPTS.prohibitmode;
  if (entrymode) body.entrymode = entrymode;
  if (prohibitmode) body.prohibitmode = prohibitmode;

  // Modification ID for optimistic locking (update only)
  if (opts.modId) body.modId = opts.modId;

  // Portal data for creating/updating related records
  if (opts.portalData) body.portalData = opts.portalData;

  // FM script triggers (pre-request, pre-sort, after)
  if (opts.script) body['script'] = opts.script;
  if (opts.scriptParam) body['script.param'] = opts.scriptParam;
  if (opts.preRequestScript) body['script.prerequest'] = opts.preRequestScript;
  if (opts.preRequestParam) body['script.prerequest.param'] = opts.preRequestParam;
  if (opts.preSortScript) body['script.presort'] = opts.preSortScript;
  if (opts.preSortParam) body['script.presort.param'] = opts.preSortParam;

  return body;
}

/* ── CRUD operations ────────────────────────────────────── */

/**
 * Get all records from a layout (paginated).
 *
 * @param {string} token
 * @param {string} layout - FM layout name
 * @param {object} [opts] - { limit, offset, sort, portals, portalLimits }
 *
 * Portal pagination:
 *   portals: ['BuyerPortal'] - portal names to include
 *   portalLimits: { BuyerPortal: { offset: 1, limit: 50 } }
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

  // Portal configuration - specify which portals to include and their pagination
  if (opts.portals) {
    params.set('portal', JSON.stringify(
      Array.isArray(opts.portals) ? opts.portals : [opts.portals]
    ));
  }
  if (opts.portalLimits) {
    for (const [portalName, pl] of Object.entries(opts.portalLimits)) {
      if (pl.offset) params.set(`_offset.${portalName}`, pl.offset);
      if (pl.limit) params.set(`_limit.${portalName}`, pl.limit);
    }
  }

  // Response layout - retrieve data in a different layout context
  if (opts.responseLayout) {
    params.set('layout.response', opts.responseLayout);
  }

  const qs = params.toString();
  const path = `layouts/${encodeURIComponent(layout)}/records${qs ? `?${qs}` : ''}`;
  return fmRequest(token, 'GET', path);
}

/**
 * Get a single record by FM recordId.
 *
 * @param {string} token
 * @param {string} layout
 * @param {string} recordId
 * @param {object} [opts] - { portals, portalLimits, responseLayout }
 */
export async function getRecord(token, layout, recordId, opts = {}) {
  const params = new URLSearchParams();

  if (opts.portals) {
    params.set('portal', JSON.stringify(
      Array.isArray(opts.portals) ? opts.portals : [opts.portals]
    ));
  }
  if (opts.portalLimits) {
    for (const [portalName, pl] of Object.entries(opts.portalLimits)) {
      if (pl.offset) params.set(`_offset.${portalName}`, pl.offset);
      if (pl.limit) params.set(`_limit.${portalName}`, pl.limit);
    }
  }
  if (opts.responseLayout) {
    params.set('layout.response', opts.responseLayout);
  }

  const qs = params.toString();
  const path = `layouts/${encodeURIComponent(layout)}/records/${recordId}${qs ? `?${qs}` : ''}`;
  return fmRequest(token, 'GET', path);
}

/**
 * Find records matching a query.
 *
 * @param {string} token
 * @param {string} layout
 * @param {Array<object>} query - FM find criteria, e.g. [{ ParcelID: "41-06-..." }]
 * @param {object} [opts]       - { sort, limit, offset, portals, portalLimits, responseLayout }
 */
export async function findRecords(token, layout, query, opts = {}) {
  const body = { query };
  if (opts.sort) body.sort = Array.isArray(opts.sort) ? opts.sort : [opts.sort];
  if (opts.limit) body.limit = String(opts.limit);
  if (opts.offset) body.offset = String(opts.offset);

  // Portal configuration for find requests
  if (opts.portals) {
    body.portal = Array.isArray(opts.portals) ? opts.portals : [opts.portals];
  }
  if (opts.portalLimits) {
    for (const [portalName, pl] of Object.entries(opts.portalLimits)) {
      if (pl.offset) body[`offset.${portalName}`] = String(pl.offset);
      if (pl.limit) body[`limit.${portalName}`] = String(pl.limit);
    }
  }
  if (opts.responseLayout) {
    body['layout.response'] = opts.responseLayout;
  }

  const path = `layouts/${encodeURIComponent(layout)}/_find`;
  return fmRequest(token, 'POST', path, body);
}

/**
 * Create a new record.
 *
 * Uses script-mode entry by default to bypass FM field validation,
 * which is designed for human data entry and can reject API writes.
 *
 * @param {string} token
 * @param {string} layout
 * @param {object} fieldData - FM field names to values
 * @param {object} [opts] - { entrymode, prohibitmode, portalData, script, scriptParam }
 * @returns {{ recordId: string, modId: string }}
 */
export async function createRecord(token, layout, fieldData, opts = {}) {
  const path = `layouts/${encodeURIComponent(layout)}/records`;
  return fmRequest(token, 'POST', path, buildWriteBody(fieldData, opts));
}

/**
 * Update an existing record.
 *
 * Uses script-mode entry by default. Pass modId for optimistic locking -
 * FM returns error 306 if the record was modified since you last read it.
 *
 * @param {string} token
 * @param {string} layout
 * @param {string} recordId - FM internal record ID
 * @param {object} fieldData - only fields to update
 * @param {object} [opts] - { entrymode, prohibitmode, modId, portalData, script }
 */
export async function updateRecord(token, layout, recordId, fieldData, opts = {}) {
  const path = `layouts/${encodeURIComponent(layout)}/records/${recordId}`;
  return fmRequest(token, 'PATCH', path, buildWriteBody(fieldData, opts));
}

/**
 * Duplicate an existing record.
 *
 * @param {string} token
 * @param {string} layout
 * @param {string} recordId - FM record ID to duplicate
 * @returns {{ recordId: string, modId: string }}
 */
export async function duplicateRecord(token, layout, recordId) {
  const path = `layouts/${encodeURIComponent(layout)}/records/${recordId}`;
  return fmRequest(token, 'POST', path);
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
 * @param {string} fieldName - container field name
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
 * Returns field names, types, value lists, and portal info.
 */
export async function getLayoutMetadata(token, layout) {
  const path = `layouts/${encodeURIComponent(layout)}`;
  return fmRequest(token, 'GET', path);
}

/**
 * Discover all field names on a layout, organized by type.
 * This is the primary tool for resolving TBD_ field names -
 * run this with real FM credentials and compare against the field map.
 *
 * @param {string} token
 * @param {string} layout
 * @returns {{ fields: Array<{name,type,result}>, portals: object, valueLists: object }}
 */
export async function discoverLayoutFields(token, layout) {
  const meta = await getLayoutMetadata(token, layout);

  const fields = (meta.fieldMetaData || []).map((f) => ({
    name: f.name,
    type: f.type,        // Normal, Calculation, Summary
    result: f.result,    // Text, Number, Date, Time, Timestamp, Container
    maxRepeat: f.maxRepeat,
    global: f.global === 'Yes',
    autoEnter: f.autoEnter === 'Yes',
  }));

  // Portal metadata - shows which portals exist and their fields
  const portals = {};
  if (meta.portalMetaData) {
    for (const [portalName, portalFields] of Object.entries(meta.portalMetaData)) {
      portals[portalName] = (portalFields || []).map((f) => ({
        name: f.name,
        type: f.type,
        result: f.result,
      }));
    }
  }

  // Value lists - useful for understanding checkbox/radio constraints
  const valueLists = {};
  if (meta.valueLists) {
    for (const vl of meta.valueLists) {
      valueLists[vl.name] = vl.values?.map((v) => v.value) || [];
    }
  }

  // Categorize fields by result type for easy scanning
  const byType = {
    text: fields.filter((f) => f.result === 'Text'),
    number: fields.filter((f) => f.result === 'Number'),
    date: fields.filter((f) => f.result === 'Date'),
    time: fields.filter((f) => f.result === 'Time'),
    timestamp: fields.filter((f) => f.result === 'Timestamp'),
    container: fields.filter((f) => f.result === 'Container'),
  };

  return { fields, byType, portals, valueLists };
}

/* ── Container field handling ──────────────────────────────
 * When FM is hosted on FileMaker Server/Cloud, container field
 * values in API responses are temporary URLs (~15 min lifetime).
 * When opened locally, only the filename is returned.
 *
 * These helpers detect container URLs and download the content
 * for re-storage in your own blob storage (Vercel Blob).
 * ──────────────────────────────────────────────────────────── */

/**
 * Check if a value looks like a hosted FM container URL.
 * Hosted FM returns URLs like: https://fm.example.com/Streaming_SSL/...
 *
 * @param {string} value - field value from FM response
 * @returns {boolean}
 */
export function isContainerUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('https://') && value.includes('/Streaming_SSL/');
}

/**
 * Download a file from an FM container field URL.
 * Container URLs are temporary (~15 min) and require the session token.
 *
 * @param {string} token - FM session token (used as Bearer auth)
 * @param {string} containerUrl - the temporary URL from the FM response
 * @returns {Promise<{ buffer: Buffer, contentType: string, filename: string }>}
 */
export async function downloadContainerField(token, containerUrl) {
  const res = await fetch(containerUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`FM container download failed (${res.status}): ${containerUrl}`);
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream';

  // FM sets Content-Disposition header with the original filename
  const disposition = res.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"';\n]+)/i);
  const filename = filenameMatch
    ? decodeURIComponent(filenameMatch[1])
    : `container-${Date.now()}`;

  const buffer = Buffer.from(await res.arrayBuffer());

  return { buffer, contentType, filename };
}

/**
 * Extract container field URLs from an FM record's fieldData.
 * Scans all fields and returns those that look like container URLs,
 * paired with their field names.
 *
 * @param {object} fieldData - FM record fieldData
 * @returns {Array<{ fieldName: string, url: string }>}
 */
export function extractContainerUrls(fieldData) {
  const containers = [];
  for (const [fieldName, value] of Object.entries(fieldData)) {
    if (isContainerUrl(value)) {
      containers.push({ fieldName, url: value });
    }
  }
  return containers;
}

/* ── Portal record helpers ─────────────────────────────────
 * GCLBA stores buyers as portal (related) records on the property
 * layout. The default portal limit is 50 records. These helpers
 * make it easy to fetch all portal records with pagination.
 * ──────────────────────────────────────────────────────────── */

/**
 * Fetch all portal records for a given record, paginating if needed.
 * FM's default portal limit is 50; this fetches in pages until exhausted.
 *
 * @param {string} token
 * @param {string} layout
 * @param {string} recordId - FM record ID
 * @param {string} portalName - portal object name or related table name
 * @param {number} [pageSize=50] - records per page
 * @returns {Promise<Array<object>>} all portal records
 */
export async function getAllPortalRecords(token, layout, recordId, portalName, pageSize = 50) {
  const allRecords = [];
  let offset = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getRecord(token, layout, recordId, {
      portals: [portalName],
      portalLimits: { [portalName]: { offset, limit: pageSize } },
    });

    const portalData = result.data?.[0]?.portalData?.[portalName] || [];
    allRecords.push(...portalData);

    if (portalData.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  return allRecords;
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
    const err = new Error('FileMaker circuit breaker is open - FM appears to be down. Serving from local cache.');
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
