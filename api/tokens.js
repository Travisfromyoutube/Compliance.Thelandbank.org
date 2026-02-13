/**
 * /api/tokens — Consolidated access-token router.
 *
 * Routes by ?action= query parameter (or defaults to CRUD):
 *   GET  ?action=verify&token=xxx  — Verify a buyer token (was /api/verify-token)
 *   GET                            — List tokens (was /api/access-tokens GET)
 *   POST                           — Create a token (was /api/access-tokens POST)
 *   DELETE ?id=xxx                  — Revoke a token (was /api/access-tokens DELETE)
 *
 * Consolidated to stay within Vercel Hobby plan's 12-function limit.
 */

import prisma from '../src/lib/db.js';
import { generateToken, defaultExpiration } from '../src/lib/tokenGenerator.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';

export default async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, POST, DELETE, OPTIONS' })) return;

  try {
    // Route: GET ?action=verify — buyer token verification (public)
    if (req.method === 'GET' && req.query.action === 'verify') {
      if (!(await applyRateLimit(rateLimiters.tokenVerify, req, res))) return;
      return handleVerify(req, res);
    }

    // All other operations require admin auth
    const apiKey = process.env.ADMIN_API_KEY;
    if (apiKey) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${apiKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Route: GET — list tokens (admin)
    if (req.method === 'GET') {
      return handleList(req, res);
    }

    // Route: POST — create token (admin)
    if (req.method === 'POST') {
      if (!(await applyRateLimit(rateLimiters.tokenCreate, req, res))) return;
      return handleCreate(req, res);
    }

    // Route: DELETE — revoke token (admin)
    if (req.method === 'DELETE') {
      return handleRevoke(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('/api/tokens error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/* ── Verify a buyer access token ──────────────────────── */

async function handleVerify(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token parameter is required' });
  }

  const accessToken = await prisma.accessToken.findUnique({
    where: { token },
    include: {
      property: {
        select: {
          id: true,
          parcelId: true,
          address: true,
          programType: true,
          dateSold: true,
        },
      },
      buyer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!accessToken) {
    return res.status(404).json({ valid: false, error: 'Invalid access link' });
  }

  if (accessToken.revokedAt) {
    return res.status(403).json({ valid: false, error: 'This access link has been revoked' });
  }

  if (new Date() > accessToken.expiresAt) {
    return res.status(403).json({ valid: false, error: 'This access link has expired' });
  }

  return res.status(200).json({
    valid: true,
    property: {
      id: accessToken.property.id,
      parcelId: accessToken.property.parcelId,
      address: accessToken.property.address,
      programType: accessToken.property.programType,
      dateSold: accessToken.property.dateSold
        ? accessToken.property.dateSold.toISOString().slice(0, 10)
        : null,
    },
    buyer: {
      firstName: accessToken.buyer.firstName,
      lastName: accessToken.buyer.lastName,
      email: accessToken.buyer.email || '',
    },
    tokenId: accessToken.id,
  });
}

/* ── List tokens ──────────────────────────────────────── */

async function handleList(req, res) {
  const { propertyId } = req.query;
  const where = {};
  if (propertyId) where.propertyId = propertyId;

  const tokens = await prisma.accessToken.findMany({
    where,
    include: {
      property: { select: { address: true, parcelId: true, programType: true } },
      buyer: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return res.status(200).json(tokens);
}

/* ── Create a new token ───────────────────────────────── */

async function handleCreate(req, res) {
  const { propertyId, expirationDays = 30 } = req.body;

  if (!propertyId) {
    return res.status(400).json({ error: 'propertyId is required' });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, buyerId: true, address: true },
  });

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const token = generateToken(10);
  const expiresAt = defaultExpiration(expirationDays);

  const accessToken = await prisma.accessToken.create({
    data: {
      token,
      propertyId: property.id,
      buyerId: property.buyerId,
      expiresAt,
    },
  });

  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const url = `${appUrl}/submit?token=${token}`;

  return res.status(201).json({
    id: accessToken.id,
    token: accessToken.token,
    url,
    propertyId: accessToken.propertyId,
    buyerId: accessToken.buyerId,
    expiresAt: accessToken.expiresAt.toISOString(),
    createdAt: accessToken.createdAt.toISOString(),
  });
}

/* ── Revoke a token ───────────────────────────────────── */

async function handleRevoke(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id query parameter is required' });
  }

  const accessToken = await prisma.accessToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return res.status(200).json({ success: true, id: accessToken.id, revokedAt: accessToken.revokedAt });
}
