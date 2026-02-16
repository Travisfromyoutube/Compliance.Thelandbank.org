/**
 * GET /api/properties - list properties with buyer info.
 *
 * Supports cursor-based pagination for scalability:
 *   ?limit=50                  - page size (default: all, max: 200)
 *   ?cursor=<id>               - fetch records after this property ID
 *
 * When limit is provided, returns paginated response:
 *   { data: [...], nextCursor, hasMore, total }
 *
 * When limit is omitted, returns flat array (backwards compatible).
 *
 * Filter params:
 *   ?program=Featured Homes   - filter by programType
 *   ?status=active             - filter by status
 *   ?level=2                   - filter by enforcementLevel
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const { program, status, level, cursor, limit: limitParam } = req.query;

    const where = {};
    if (program) where.programType = program;
    if (status) where.status = status;
    if (level !== undefined) where.enforcementLevel = parseInt(level, 10);

    // Pagination: opt-in via ?limit=N. Without it, returns all (backwards compatible).
    const isPaginated = limitParam !== undefined;
    const pageSize = isPaginated ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200) : undefined;

    const findArgs = {
      where,
      include: {
        buyer: true,
        program: true,
        communications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            action: true,
            channel: true,
            status: true,
            sentAt: true,
            subject: true,
            templateName: true,
            createdAt: true,
          },
        },
        _count: {
          select: { communications: true, submissions: true },
        },
      },
      orderBy: { dateSold: 'desc' },
    };

    // Cursor pagination: fetch pageSize + 1 to detect hasMore
    if (isPaginated) {
      findArgs.take = pageSize + 1;
      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1; // Skip the cursor record itself
      }
    }

    const properties = await prisma.property.findMany(findArgs);

    // Flatten to match the shape the frontend expects
    // Edge cache: 30s fresh, serve stale up to 5 min while revalidating
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');

    const result = properties.map((p) => ({
      id: p.id,
      parcelId: p.parcelId,
      address: p.address,
      buyerName: `${p.buyer.firstName} ${p.buyer.lastName}`.trim(),
      buyerEmail: p.buyer.email || '',
      organization: p.buyer.organization || '',
      topNote: p.buyer.topNote || null,
      buyerStatus: p.buyer.buyerStatus || null,
      programType: p.programType,
      dateSold: p.dateSold.toISOString().slice(0, 10),
      offerType: p.offerType || '',
      purchaseType: p.purchaseType || '',
      // Compliance fields (dates as ISO strings or null)
      occupancyDeadline: p.occupancyDeadline?.toISOString().slice(0, 10) || null,
      insuranceDueDate: p.insuranceDueDate?.toISOString().slice(0, 10) || null,
      insuranceReceived: p.insuranceReceived,
      occupancyEstablished: p.occupancyEstablished,
      minimumHoldExpiry: p.minimumHoldExpiry?.toISOString().slice(0, 10) || null,
      dateProofOfInvestProvided: p.dateProofOfInvestProvided?.toISOString().slice(0, 10) || null,
      compliance1stAttempt: p.compliance1stAttempt?.toISOString().slice(0, 10) || null,
      compliance2ndAttempt: p.compliance2ndAttempt?.toISOString().slice(0, 10) || null,
      lastContactDate: p.lastContactDate?.toISOString().slice(0, 10) || null,
      scopeOfWorkApproved: p.scopeOfWorkApproved,
      buildingPermitObtained: p.buildingPermitObtained,
      rehabDeadline: p.rehabDeadline?.toISOString().slice(0, 10) || null,
      percentComplete: p.percentComplete,
      demoFinalCertDate: p.demoFinalCertDate?.toISOString().slice(0, 10) || null,
      complianceType: p.complianceType || null,
      extras: p.extras || null,
      enforcementLevel: p.enforcementLevel,
      status: p.status,
      // Physical details
      bedrooms: p.bedrooms,
      baths: p.baths,
      sqFt: p.sqFt,
      yearBuilt: p.yearBuilt,
      stories: p.stories,
      garageSize: p.garageSize,
      basementSize: p.basementSize,
      lotSize: p.lotSize,
      school: p.school,
      // FM metadata
      soldStatus: p.soldStatus || null,
      gclbOwned: p.gclbOwned,
      sev: p.sev,
      availability: p.availability || null,
      flintAreaName: p.flintAreaName || null,
      parcelIdDashed: p.parcelIdDashed || null,
      minimumBid: p.minimumBid,
      category: p.category || null,
      conditions: p.conditions || null,
      // Buyer metadata
      buyerPhone: p.buyer.phone || '',
      // FM sale fields
      bondRequired: p.bondRequired,
      bondAmount: p.bondAmount,
      referredToLISC: p.referredToLISC?.toISOString().slice(0, 10) || null,
      liscRecommendReceived: p.liscRecommendReceived?.toISOString().slice(0, 10) || null,
      liscRecommendSale: p.liscRecommendSale?.toISOString().slice(0, 10) || null,
      // Communications (last 5)
      communications: p.communications.map((c) => ({
        ...c,
        sentAt: c.sentAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
      // Counts
      communicationCount: p._count.communications,
      submissionCount: p._count.submissions,
    }));

    // Backwards compatible: flat array when no limit, paginated envelope when limit is set
    if (!isPaginated) {
      return res.status(200).json(result);
    }

    const hasMore = result.length > pageSize;
    if (hasMore) result.pop(); // Remove the extra probe record
    const nextCursor = hasMore ? result[result.length - 1]?.id : null;

    // Count total only on first page (cursor not set) to avoid extra query on every page
    const total = !cursor ? await prisma.property.count({ where }) : undefined;

    return res.status(200).json({
      data: result,
      nextCursor,
      hasMore,
      ...(total !== undefined && { total }),
    });
  } catch (error) {
    log.error('properties_list_failed', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});
