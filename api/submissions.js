/**
 * POST /api/submissions — buyer compliance submission.
 *
 * Accepts the form data from BuyerSubmission.jsx:
 *   { token|tokenId, parcelId?, type, formData, documents }
 *
 * Buyer-mode requests must include a valid, unexpired access token.
 * Admin-mode requests may authenticate with Authorization header + parcelId.
 *
 * Creates a Submission record and optional Document metadata records.
 * Returns confirmation ID for the buyer.
 */

import prisma from '../src/lib/db.js';
import { isConfigured, withSession, createRecord } from '../src/lib/filemakerClient.js';
import {
  toFM,
  PROPERTY_FIELD_MAP,
  BUYER_FIELD_MAP,
  SUBMISSION_FIELD_MAP,
  joinNameForFM,
  getLayouts,
  normalizeParcelId,
} from '../src/config/filemakerFieldMap.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { validateOrReject } from '../src/lib/validate.js';
import { submissionBody } from '../src/lib/schemas.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, POST, OPTIONS' })) return;

  /* ── GET — list submissions (admin) ──────────────────── */
  if (req.method === 'GET') {
    const session = await requireAuth(req, res);
    if (!session) return;

    try {
      const { propertyId, status } = req.query;
      const where = {};
      if (propertyId) where.propertyId = propertyId;
      if (status) where.status = status;

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          property: { select: { address: true, parcelId: true, programType: true } },
          buyer: { select: { firstName: true, lastName: true, email: true } },
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
      return res.status(200).json(submissions);
    } catch (error) {
      log.error('submissions_list_failed', { error: error.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /* ── POST — new buyer submission ─────────────────────── */
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await applyRateLimit(rateLimiters.submission, req, res))) return;

  try {
    const data = validateOrReject(submissionBody, req.body, res);
    if (!data) return;
    const { parcelId, token, tokenId, type, formData, documents } = data;

    // If an auth header is present, validate it and allow admin-mode submission.
    // Buyer-mode submissions must include a valid access token.
    const hasAuthHeader = req.headers.authorization?.startsWith('Bearer ');
    let session = null;
    if (hasAuthHeader) {
      session = await requireAuth(req, res);
      if (!session) return;
    }

    let property = null;
    let validatedToken = null;

    if (token || tokenId) {
      const where = token ? { token } : { id: tokenId };
      validatedToken = await prisma.accessToken.findUnique({
        where,
        include: {
          property: { include: { buyer: true } },
        },
      });

      if (!validatedToken) {
        return res.status(403).json({ error: 'Invalid access link' });
      }
      if (validatedToken.revokedAt) {
        return res.status(403).json({ error: 'This access link has been revoked' });
      }
      if (new Date() > validatedToken.expiresAt) {
        return res.status(403).json({ error: 'This access link has expired' });
      }

      property = validatedToken.property;

      // If parcelId is provided, it must match token-bound property to prevent spoofing.
      if (parcelId && normalizeParcelId(parcelId) !== normalizeParcelId(property.parcelId)) {
        log.warn('submission_parcel_mismatch', {
          tokenId: validatedToken.id,
          providedParcelId: parcelId,
          tokenParcelId: property.parcelId,
        });
        return res.status(403).json({ error: 'Submission does not match access link property' });
      }
    } else if (session) {
      if (!parcelId) {
        return res.status(400).json({ error: 'parcelId is required for admin submissions' });
      }

      property = await prisma.property.findUnique({
        where: { parcelId },
        include: { buyer: true },
      });

      if (!property) {
        return res.status(404).json({ error: `No property found for parcel ${parcelId}` });
      }
    } else {
      return res.status(401).json({ error: 'Valid access token is required' });
    }

    // Create submission + document records in a transaction
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          type,
          formData,
          status: 'received',
          propertyId: property.id,
          buyerId: property.buyerId,
        },
      });

      // Create document records with optional blob URLs
      if (documents.length > 0) {
        await tx.document.createMany({
          data: documents.map((doc) => ({
            filename: doc.filename,
            mimeType: doc.mimeType || 'application/octet-stream',
            sizeBytes: doc.sizeBytes || 0,
            category: doc.category || 'document',
            slot: doc.slot || null,
            blobUrl: doc.blobUrl || null,
            submissionId: sub.id,
            propertyId: property.id,
          })),
        });
      }

      return sub;
    });

    log.info('submission_created', {
      confirmationId: submission.confirmationId,
      parcelId: property.parcelId,
      tokenId: validatedToken?.id || null,
      mode: validatedToken ? 'buyer_token' : 'admin',
    });

    // Fire-and-forget: push to FileMaker if configured
    if (isConfigured()) {
      pushToFileMaker(submission.id, property.parcelId, property).catch((err) => {
        log.warn('fm_push_failed', { submissionId: submission.id, error: err.message });
      });
    }

    return res.status(201).json({
      success: true,
      confirmationId: submission.confirmationId,
      submissionId: submission.id,
      timestamp: submission.createdAt.toISOString(),
      fmSync: isConfigured() ? 'queued' : 'not_configured',
    });
  } catch (error) {
    log.error('submission_create_failed', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ── Fire-and-forget FM push ────────────────────────────── */

async function pushToFileMaker(submissionId, parcelId, property) {
  const layouts = getLayouts();

  await withSession(async (token) => {
    // Build submission fields using the field maps — no hardcoded FM names
    const submissionFields = toFM({
      type: 'progress',
      status: 'received',
      confirmationId: submissionId,
      createdAt: new Date(),
    }, SUBMISSION_FIELD_MAP);

    // Add parcel context
    submissionFields[PROPERTY_FIELD_MAP.parcelId] = parcelId;

    // Add buyer context via toFM() — automatically skips TBD fields
    const buyerFields = toFM({
      email: property.buyer?.email || '',
      fullName: joinNameForFM(
        property.buyer?.firstName,
        property.buyer?.lastName,
      ),
    }, BUYER_FIELD_MAP);
    Object.assign(submissionFields, buyerFields);

    await createRecord(token, layouts.submissions, submissionFields);
    log.info('fm_push_submission_synced', { submissionId });
  });
}
