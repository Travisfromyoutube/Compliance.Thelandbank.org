/**
 * GET /api/export - data export endpoints.
 *
 * Query params:
 *   ?type=filemaker         - structured export for FileMaker sync (default)
 *   ?type=communications    - full communication log export
 *   ?format=csv|json        - output format (default: json)
 *   ?from=2025-01-01        - filter by date range (communications only)
 *   ?to=2025-12-31
 */

import prisma from '../src/lib/db.js';
import { computeComplianceTimingServer } from '../src/lib/computeDueNow.server.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.general, req, res))) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await requireAuth(req, res);
  if (!session) return;

  const type = req.query.type || 'filemaker';

  // Exports must always reflect current data - never serve stale
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (type === 'communications') return await handleCommunicationsExport(req, res);
    return await handleFilemakerExport(req, res);
  } catch (error) {
    log.error('export_failed', { type, error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── CSV helper ──────────────────────────────────────────── */
function rowsToCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    ),
  ];
  return csvLines.join('\n');
}

/* ── FileMaker export ────────────────────────────────────── */
async function handleFilemakerExport(req, res) {
  const format = req.query.format || 'json';

  const properties = await prisma.property.findMany({
    include: {
      buyer: true,
      communications: {
        where: { status: 'sent' },
        select: { action: true, status: true, sentAt: true },
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, status: true },
      },
    },
    orderBy: { dateSold: 'desc' },
  });

  const today = new Date();

  const rows = properties.map((p) => {
    const timing = computeComplianceTimingServer({
      id: p.id,
      parcelId: p.parcelId,
      address: p.address,
      programType: p.programType,
      dateSold: p.dateSold,
      compliance1stAttempt: p.compliance1stAttempt,
      compliance2ndAttempt: p.compliance2ndAttempt,
      lastContactDate: p.lastContactDate,
      enforcementLevel: p.enforcementLevel,
      buyer: p.buyer,
      communications: p.communications,
    }, today);

    return {
      parcelId: p.parcelId,
      address: p.address,
      buyerFirstName: p.buyer?.firstName || '',
      buyerLastName: p.buyer?.lastName || '',
      buyerEmail: p.buyer?.email || '',
      programType: p.programType,
      dateSold: p.dateSold.toISOString().slice(0, 10),
      enforcementLevel: p.enforcementLevel,
      status: p.status,
      currentAction: timing.currentAction || '',
      dueDate: timing.dueDate || '',
      daysOverdue: timing.daysOverdue || 0,
      isDueNow: timing.isDueNow || false,
      nextAction: timing.nextAction || '',
      nextDueDate: timing.nextDueDate || '',
      lastContactDate: p.lastContactDate?.toISOString().slice(0, 10) || '',
      lastSubmissionDate: p.submissions[0]?.createdAt?.toISOString().slice(0, 10) || '',
      compliance1stAttempt: p.compliance1stAttempt?.toISOString().slice(0, 10) || '',
      compliance2ndAttempt: p.compliance2ndAttempt?.toISOString().slice(0, 10) || '',
      percentComplete: p.percentComplete,
      insuranceReceived: p.insuranceReceived,
      occupancyEstablished: p.occupancyEstablished,
    };
  });

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="filemaker-export-${today.toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(rowsToCsv(rows));
  }

  return res.status(200).json({
    exportedAt: today.toISOString(),
    count: rows.length,
    records: rows,
  });
}

/* ── Communications export ───────────────────────────────── */
async function handleCommunicationsExport(req, res) {
  const { format = 'json', from, to } = req.query;

  const where = {};
  if (from || to) {
    where.sentAt = {};
    if (from) where.sentAt.gte = new Date(from);
    if (to) where.sentAt.lte = new Date(to + 'T23:59:59');
  }

  const communications = await prisma.communication.findMany({
    where,
    include: {
      property: { select: { parcelId: true, address: true, programType: true } },
      buyer: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = communications.map((c) => ({
    id: c.id,
    parcelId: c.property?.parcelId || '',
    address: c.property?.address || '',
    programType: c.property?.programType || '',
    buyerName: `${c.buyer?.firstName || ''} ${c.buyer?.lastName || ''}`.trim(),
    buyerEmail: c.buyer?.email || '',
    recipientEmail: c.recipientEmail || '',
    channel: c.channel,
    templateName: c.templateName || '',
    action: c.action || '',
    subject: c.subject || '',
    status: c.status,
    sentAt: c.sentAt?.toISOString().slice(0, 10) || '',
    createdAt: c.createdAt.toISOString(),
  }));

  const today = new Date();

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="communications-export-${today.toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(rowsToCsv(rows));
  }

  return res.status(200).json({
    exportedAt: today.toISOString(),
    count: rows.length,
    records: rows,
  });
}
