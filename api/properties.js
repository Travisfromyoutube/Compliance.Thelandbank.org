/**
 * GET /api/properties — list all properties with buyer info.
 *
 * Query params:
 *   ?program=Featured Homes   — filter by programType
 *   ?status=active             — filter by status
 *   ?level=2                   — filter by enforcementLevel
 */

import prisma from '../src/lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
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
