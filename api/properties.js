/**
 * GET /api/properties — list all properties with buyer info.
 *
 * Query params:
 *   ?program=Featured Homes   — filter by programType
 *   ?status=active             — filter by status
 *   ?level=2                   — filter by enforcementLevel
 */

import prisma from '../src/lib/db.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';

export default async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.general, req, res))) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { program, status, level } = req.query;

    const where = {};
    if (program) where.programType = program;
    if (status) where.status = status;
    if (level !== undefined) where.enforcementLevel = parseInt(level, 10);

    const properties = await prisma.property.findMany({
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
    });

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

    return res.status(200).json(result);
  } catch (error) {
    console.error('GET /api/properties error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
