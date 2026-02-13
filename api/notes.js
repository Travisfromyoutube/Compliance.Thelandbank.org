/**
 * GET /api/notes — list notes for a property.
 * POST /api/notes — create a new note.
 *
 * Query params (GET):
 *   ?propertyId=xxx    — filter by property (required)
 *   ?visibility=internal — filter by visibility
 *   ?limit=50          — pagination limit (default 100)
 *   ?offset=0          — pagination offset
 */

import prisma from '../src/lib/db.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { validateOrReject } from '../src/lib/validate.js';
import { createNoteBody } from '../src/lib/schemas.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, POST, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.general, req, res))) return;

  // ── AUDIT PROTECTION: Notes are append-only ───────────
  // Per SECURITY.md: "Audit log is append-only — no updates or deletes via API."
  // Only GET (read) and POST (create) are allowed. PUT/PATCH/DELETE are blocked.
  if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed — audit records are immutable' });
  }

  const session = await requireAuth(req, res);
  if (!session) return;

  // ── GET: List notes ────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { propertyId, visibility, limit = '100', offset = '0' } = req.query;

      if (!propertyId) {
        return res.status(400).json({ error: 'propertyId is required' });
      }

      const where = { propertyId };
      if (visibility) where.visibility = visibility;

      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit, 10), 500),
          skip: parseInt(offset, 10),
        }),
        prisma.note.count({ where }),
      ]);

      const result = notes.map((n) => ({
        id: n.id,
        body: n.body,
        creator: n.creator,
        visibility: n.visibility,
        createdAt: n.createdAt.toISOString(),
      }));

      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
      return res.status(200).json({ total, notes: result });
    } catch (error) {
      log.error('notes_list_failed', { error: error.message });
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  // ── POST: Create note ──────────────────────────────────
  if (req.method === 'POST') {
    try {
      const data = validateOrReject(createNoteBody, req.body, res);
      if (!data) return;
      const { propertyId, body, creator, visibility } = data;

      const note = await prisma.note.create({
        data: {
          propertyId,
          body,
          creator: creator || 'Staff',
          visibility: visibility || 'internal',
        },
      });

      return res.status(201).json({
        id: note.id,
        body: note.body,
        creator: note.creator,
        visibility: note.visibility,
        createdAt: note.createdAt.toISOString(),
      });
    } catch (error) {
      log.error('note_create_failed', { error: error.message });
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
