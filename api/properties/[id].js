/**
 * GET /api/properties/:id — single property with full relations.
 *
 * Returns property + buyer + program + communications + submissions.
 * Communications are sorted newest-first.
 */

import prisma from '../../src/lib/db.js';
import { rateLimiters, applyRateLimit } from '../../src/lib/rateLimit.js';
import { cors } from '../_cors.js';
import { validateOrReject } from '../../src/lib/validate.js';
import { patchPropertyBody } from '../../src/lib/schemas.js';
import { requireAuth } from '../../src/lib/auth.js';
import { withSentry } from '../../src/lib/sentry.js';
import { log } from '../../src/lib/logger.js';

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, PATCH, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.general, req, res))) return;

  const session = await requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  /* ── GET — fetch single property ─────────────────────── */
  if (req.method === 'GET') {
    try {
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          buyer: true,
          program: true,
          communications: {
            orderBy: { sentAt: 'desc' },
            include: { documents: true },
          },
          submissions: {
            orderBy: { createdAt: 'desc' },
            include: { documents: true },
          },
        },
      });

      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Flatten communications to match frontend shape
      const comms = property.communications.map((c) => ({
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
      }));

      const result = {
        id: property.id,
        parcelId: property.parcelId,
        address: property.address,
        buyerName: `${property.buyer.firstName} ${property.buyer.lastName}`.trim(),
        buyerEmail: property.buyer.email || '',
        organization: property.buyer.organization || '',
        topNote: property.buyer.topNote || null,
        buyerStatus: property.buyer.buyerStatus || null,
        programType: property.programType,
        dateSold: property.dateSold.toISOString().slice(0, 10),
        offerType: property.offerType || '',
        purchaseType: property.purchaseType || '',
        occupancyDeadline: property.occupancyDeadline?.toISOString().slice(0, 10) || null,
        insuranceDueDate: property.insuranceDueDate?.toISOString().slice(0, 10) || null,
        insuranceReceived: property.insuranceReceived,
        occupancyEstablished: property.occupancyEstablished,
        minimumHoldExpiry: property.minimumHoldExpiry?.toISOString().slice(0, 10) || null,
        dateProofOfInvestProvided: property.dateProofOfInvestProvided?.toISOString().slice(0, 10) || null,
        compliance1stAttempt: property.compliance1stAttempt?.toISOString().slice(0, 10) || null,
        compliance2ndAttempt: property.compliance2ndAttempt?.toISOString().slice(0, 10) || null,
        lastContactDate: property.lastContactDate?.toISOString().slice(0, 10) || null,
        scopeOfWorkApproved: property.scopeOfWorkApproved,
        buildingPermitObtained: property.buildingPermitObtained,
        rehabDeadline: property.rehabDeadline?.toISOString().slice(0, 10) || null,
        percentComplete: property.percentComplete,
        demoFinalCertDate: property.demoFinalCertDate?.toISOString().slice(0, 10) || null,
        complianceType: property.complianceType || null,
        extras: property.extras || null,
        enforcementLevel: property.enforcementLevel,
        status: property.status,
        communications: comms,
        submissions: property.submissions,
      };

      res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
      return res.status(200).json(result);
    } catch (error) {
      log.error('property_get_failed', { propertyId: id, error: error.message });
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /* ── PATCH — update property fields ──────────────────── */
  if (req.method === 'PATCH') {
    try {
      const updates = validateOrReject(patchPropertyBody, req.body, res);
      if (!updates) return;

      // Whitelist of updatable fields
      const allowed = [
        'enforcementLevel', 'status', 'percentComplete',
        'compliance1stAttempt', 'compliance2ndAttempt', 'lastContactDate',
        'insuranceReceived', 'occupancyEstablished',
        'dateProofOfInvestProvided', 'demoFinalCertDate',
        'scopeOfWorkApproved', 'buildingPermitObtained',
        'extras',
      ];

      const data = {};
      for (const key of allowed) {
        if (key in updates) {
          // Convert date strings to Date objects
          if (['compliance1stAttempt', 'compliance2ndAttempt', 'lastContactDate',
               'dateProofOfInvestProvided', 'demoFinalCertDate'].includes(key) && updates[key]) {
            data[key] = new Date(updates[key]);
          } else {
            data[key] = updates[key];
          }
        }
      }

      const updated = await prisma.property.update({
        where: { id },
        data,
      });

      return res.status(200).json({ success: true, property: updated });
    } catch (error) {
      log.error('property_patch_failed', { propertyId: id, error: error.message });
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
