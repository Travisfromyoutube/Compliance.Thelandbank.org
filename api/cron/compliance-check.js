/**
 * GET /api/cron/compliance-check — Daily compliance monitoring.
 *
 * Invoked by Vercel Cron at 8 AM Eastern (1 PM UTC), Mon-Fri.
 * Authenticated via CRON_SECRET bearer token.
 *
 * 1. Fetches all active properties with buyers and communications
 * 2. Runs computeBatchTiming() to find overdue properties
 * 3. Sends a staff digest email summarizing what needs attention
 */

import prisma from '../../src/lib/db.js';
import { computeBatchTiming } from '../../src/lib/computeDueNow.server.js';
import { sendEmail } from '../../src/lib/emailSender.js';
import { withSentry } from '../../src/lib/sentry.js';
import { log } from '../../src/lib/logger.js';

const CRON_SECRET = process.env.CRON_SECRET;
const STAFF_EMAIL = process.env.STAFF_DIGEST_EMAIL || 'compliance@thelandbank.org';

export default withSentry(async function handler(req, res) {
  /* ── Auth ──────────────────────────────────────────── */
  const isProduction = process.env.NODE_ENV === 'production'
    || process.env.VERCEL_ENV === 'production';

  if (!CRON_SECRET && isProduction) {
    return res.status(503).json({ error: 'CRON_SECRET is not configured' });
  }

  if (CRON_SECRET) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    /* ── 1. Fetch all active properties ──────────────── */
    const properties = await prisma.property.findMany({
      where: { status: { not: 'closed' } },
      include: {
        buyer: true,
        communications: {
          where: { status: 'sent' },
          select: { action: true, status: true, sentAt: true },
        },
      },
    });

    /* ── 2. Compute compliance timing ────────────────── */
    const today = new Date();
    const flattened = properties.map((p) => ({
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
      buyerEmail: p.buyer?.email || '',
      communications: p.communications,
    }));

    const allTiming = computeBatchTiming(flattened, today);
    const dueNow = allTiming.filter((t) => t.isDueNow);
    const overdue30 = allTiming.filter((t) => t.daysOverdue >= 30);

    /* ── 3. Build digest ─────────────────────────────── */
    const digest = {
      date: today.toISOString().slice(0, 10),
      totalActive: properties.length,
      dueNowCount: dueNow.length,
      overdue30Count: overdue30.length,
      topUrgent: dueNow.slice(0, 10).map((t) => ({
        address: t.address,
        program: t.programLabel,
        action: t.currentAction,
        daysOverdue: t.daysOverdue,
        buyerName: t.buyerName,
      })),
    };

    /* ── 4. Send digest email ────────────────────────── */
    if (dueNow.length > 0) {
      const urgentList = digest.topUrgent
        .map((p) => `  • ${p.address} (${p.program}) — ${p.action}, ${p.daysOverdue} days overdue`)
        .join('\n');

      const body = [
        `GCLBA Compliance Digest — ${digest.date}`,
        '',
        `Properties needing action: ${digest.dueNowCount}`,
        `Properties 30+ days overdue: ${digest.overdue30Count}`,
        `Total active properties: ${digest.totalActive}`,
        '',
        'Most urgent:',
        urgentList,
        '',
        `View full queue: ${process.env.APP_URL || 'https://compliance-thelandbank-org.vercel.app'}/action-queue`,
      ].join('\n');

      await sendEmail({
        to: STAFF_EMAIL,
        subject: `[GCLBA] ${digest.dueNowCount} properties need compliance action — ${digest.date}`,
        body,
      });
    }

    log.info('cron_compliance_check_complete', { dueNow: dueNow.length, overdue30: overdue30.length, totalActive: properties.length });

    return res.status(200).json({
      success: true,
      ...digest,
    });
  } catch (error) {
    log.error('cron_compliance_check_failed', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});
