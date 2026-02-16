/**
 * GET /api/communications - communication records.
 *
 * Query params:
 *   ?id=xxx            - fetch a single communication by ID (returns full details)
 *   ?propertyId=xxx    - filter by property
 *   ?status=sent       - filter by status
 *   ?from=2025-01-01   - filter by sentAt >= date
 *   ?to=2025-12-31     - filter by sentAt <= date
 *   ?limit=50          - pagination limit (default 100)
 *   ?offset=0          - pagination offset
 */

import prisma from '../src/lib/db.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.general, req, res))) return;

  // ── AUDIT PROTECTION: Communications are append-only ──
  // Per SECURITY.md: "Audit log is append-only - no updates or deletes via API."
  // Communications are created via /api/email (POST). This endpoint is read-only.
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed - audit records are immutable' });
  }

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    // ── Single record lookup ──────────────────────────────
    if (req.query.id) {
      const communication = await prisma.communication.findUnique({
        where: { id: req.query.id },
        include: {
          property: { select: { address: true, parcelId: true, programType: true } },
          buyer: { select: { firstName: true, lastName: true, email: true } },
          documents: true,
        },
      });

      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }

      return res.status(200).json({
        id: communication.id,
        date: (communication.sentAt || communication.createdAt).toISOString().slice(0, 10),
        timestamp: (communication.sentAt || communication.createdAt).toISOString(),
        type: communication.channel,
        template: communication.templateName,
        templateId: communication.templateId,
        action: communication.action,
        subject: communication.subject,
        body: communication.bodyText,
        status: communication.status,
        recipientEmail: communication.recipientEmail,
        approvedAt: communication.approvedAt?.toISOString() || null,
        providerMessageId: communication.providerMessageId,
        propertyAddress: communication.property?.address || '',
        parcelId: communication.property?.parcelId || '',
        programType: communication.property?.programType || '',
        buyerName: `${communication.buyer?.firstName || ''} ${communication.buyer?.lastName || ''}`.trim(),
        documents: communication.documents,
      });
    }

    // ── List with filters ─────────────────────────────────
    const { propertyId, status, from, to, limit = '100', offset = '0' } = req.query;

    const where = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

    if (from || to) {
      where.sentAt = {};
      if (from) where.sentAt.gte = new Date(from);
      if (to) where.sentAt.lte = new Date(to + 'T23:59:59');
    }

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          property: { select: { address: true, parcelId: true, programType: true } },
          buyer: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit, 10), 500),
        skip: parseInt(offset, 10),
      }),
      prisma.communication.count({ where }),
    ]);

    const result = communications.map((c) => ({
      id: c.id,
      date: (c.sentAt || c.createdAt).toISOString().slice(0, 10),
      timestamp: (c.sentAt || c.createdAt).toISOString(),
      type: c.channel,
      template: c.templateName,
      templateId: c.templateId,
      action: c.action,
      subject: c.subject,
      body: c.bodyText,
      status: c.status,
      recipientEmail: c.recipientEmail,
      approvedAt: c.approvedAt?.toISOString() || null,
      providerMessageId: c.providerMessageId,
      // Nested info
      propertyAddress: c.property?.address || '',
      parcelId: c.property?.parcelId || '',
      programType: c.property?.programType || '',
      buyerName: `${c.buyer?.firstName || ''} ${c.buyer?.lastName || ''}`.trim(),
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      communications: result,
    });
  } catch (error) {
    log.error('communications_failed', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});
