/**
 * /api/templates — CRUD for email templates.
 *
 * GET    — list all templates
 * POST   — create a new template
 * PUT    — update an existing template (requires id in body)
 * DELETE — delete a template (requires ?id= query param)
 */

import prisma from '../src/lib/db.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { validateOrReject } from '../src/lib/validate.js';
import { createTemplateBody, updateTemplateBody } from '../src/lib/schemas.js';
import { requireAuth } from '../src/lib/auth.js';

export default async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, POST, PUT, DELETE, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.general, req, res))) return;

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    /* ── GET — list all templates ──────────────────────── */
    if (req.method === 'GET') {
      const templates = await prisma.emailTemplate.findMany({
        orderBy: { createdAt: 'desc' },
      });
      // Edge cache: 1 hr fresh, serve stale up to 2 hr while revalidating
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
      return res.status(200).json(templates);
    }

    /* ── POST — create template ────────────────────────── */
    if (req.method === 'POST') {
      const data = validateOrReject(createTemplateBody, req.body, res);
      if (!data) return;
      const { name, programTypes, variants, isActive } = data;

      const template = await prisma.emailTemplate.create({
        data: { name, programTypes, variants, isActive },
      });

      return res.status(201).json(template);
    }

    /* ── PUT — update template ─────────────────────────── */
    if (req.method === 'PUT') {
      const validated = validateOrReject(updateTemplateBody, req.body, res);
      if (!validated) return;
      const { id, name, programTypes, variants, isActive } = validated;

      const data = {};
      if (name !== undefined) data.name = name;
      if (programTypes !== undefined) data.programTypes = programTypes;
      if (variants !== undefined) data.variants = variants;
      if (isActive !== undefined) data.isActive = isActive;

      const template = await prisma.emailTemplate.update({
        where: { id },
        data,
      });

      return res.status(200).json(template);
    }

    /* ── DELETE — remove template ──────────────────────── */
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id query param is required' });
      }

      await prisma.emailTemplate.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`${req.method} /api/templates error:`, error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
