/**
 * GET /api/compliance — server-computed compliance data.
 *
 * Query params:
 *   ?type=due-now       — compliance queue sorted by urgency (default)
 *   ?type=exceptions    — properties with data quality issues
 *   ?program=Featured Homes  — filter by program type (due-now only)
 *   ?dueOnly=true       — only return properties where isDueNow is true (due-now only)
 */

import prisma from '../src/lib/db.js';
import { computeComplianceTimingServer } from '../src/lib/computeDueNow.server.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const type = req.query.type || 'due-now';

  try {
    if (type === 'exceptions') return await handleExceptions(req, res);
    return await handleDueNow(req, res);
  } catch (error) {
    console.error(`GET /api/compliance?type=${type} error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/* ── Due Now ─────────────────────────────────────────────── */
async function handleDueNow(req, res) {
  const { program, dueOnly } = req.query;

  const where = {};
  if (program) where.programType = program;

  const properties = await prisma.property.findMany({
    where,
    include: {
      buyer: true,
      communications: {
        where: { status: 'sent' },
        select: { action: true, status: true, sentAt: true },
      },
    },
    orderBy: { dateSold: 'asc' },
  });

  const today = new Date();

  const results = properties
    .map((p) => {
      const flat = {
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
      };
      return computeComplianceTimingServer(flat, today);
    })
    .filter((t) => !t.error);

  const filtered = dueOnly === 'true'
    ? results.filter((t) => t.isDueNow)
    : results;

  filtered.sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Edge cache: 5 min fresh, serve stale up to 10 min while revalidating
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  return res.status(200).json({
    count: filtered.length,
    computedAt: today.toISOString(),
    queue: filtered,
  });
}

/* ── Exceptions ──────────────────────────────────────────── */
async function handleExceptions(req, res) {
  const properties = await prisma.property.findMany({
    where: { status: { not: 'closed' } },
    include: {
      buyer: true,
      _count: { select: { communications: true } },
    },
  });

  const exceptions = [];
  const today = new Date();

  for (const p of properties) {
    const issues = [];

    if (!p.buyer?.email || p.buyer.email.trim() === '') {
      issues.push({ type: 'missing_email', message: 'No buyer email on file' });
    }

    if (p.enforcementLevel > 0 && !p.compliance1stAttempt) {
      issues.push({ type: 'missing_1st_attempt', message: 'Enforcement active but no 1st attempt recorded' });
    }

    if (p.compliance1stAttempt && !p.compliance2ndAttempt && p.enforcementLevel >= 2) {
      issues.push({ type: 'missing_2nd_attempt', message: 'Level 2+ but no 2nd attempt recorded' });
    }

    if (p.enforcementLevel > 0 && p._count.communications === 0) {
      issues.push({ type: 'no_communications', message: 'Active enforcement with no communications logged' });
    }

    if (p.lastContactDate) {
      const daysSinceContact = Math.floor((today - new Date(p.lastContactDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceContact > 60) {
        issues.push({ type: 'stale_contact', message: `Last contact was ${daysSinceContact} days ago` });
      }
    }

    if (issues.length > 0) {
      exceptions.push({
        id: p.id,
        parcelId: p.parcelId,
        address: p.address,
        buyerName: `${p.buyer?.firstName || ''} ${p.buyer?.lastName || ''}`.trim(),
        buyerEmail: p.buyer?.email || '',
        programType: p.programType,
        enforcementLevel: p.enforcementLevel,
        issues,
      });
    }
  }

  exceptions.sort((a, b) => b.issues.length - a.issues.length);

  // Edge cache: 5 min fresh, serve stale up to 10 min while revalidating
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  return res.status(200).json({
    count: exceptions.length,
    computedAt: today.toISOString(),
    exceptions,
  });
}
