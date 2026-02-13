/**
 * POST /api/email — email operations.
 *
 * Body.action determines the operation:
 *   action: "send"        — send a single compliance email
 *   action: "send-batch"  — batch send up to 50 emails
 *   action: "preview"     — render template previews without sending
 */

import prisma from '../src/lib/db.js';
import { sendEmail } from '../src/lib/emailSender.js';
import { computeComplianceTimingServer } from '../src/lib/computeDueNow.server.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { validateOrReject } from '../src/lib/validate.js';
import { sendEmailBody, batchEmailBody } from '../src/lib/schemas.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'POST, OPTIONS' })) return;
  if (!(await applyRateLimit(rateLimiters.emailSend, req, res))) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await requireAuth(req, res);
  if (!session) return;

  const action = req.body?.action || req.query?.action;

  try {
    if (action === 'send-batch') return await handleSendBatch(req, res);
    if (action === 'preview') return await handlePreview(req, res);
    return await handleSend(req, res);
  } catch (error) {
    log.error('email_action_failed', { action, error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/* ── Single send ─────────────────────────────────────────── */
async function handleSend(req, res) {
  const data = validateOrReject(sendEmailBody, req.body, res);
  if (!data) return;
  const { propertyId, to, subject, body, templateId, templateName, action: emailAction } = data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, buyerId: true },
  });

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const emailResult = await sendEmail({ to, subject, body });

  const communication = await prisma.communication.create({
    data: {
      propertyId: property.id,
      buyerId: property.buyerId,
      templateId: templateId || null,
      templateName: templateName || null,
      action: emailAction || null,
      channel: 'email',
      recipientEmail: to,
      subject,
      bodyText: body,
      status: emailResult.success ? 'sent' : 'failed',
      providerMessageId: emailResult.messageId || null,
      sentAt: emailResult.success ? new Date() : null,
      approvedAt: new Date(),
    },
  });

  if (emailResult.success) {
    const updates = { lastContactDate: new Date() };
    if (emailAction === 'ATTEMPT_1') updates.compliance1stAttempt = new Date();
    if (emailAction === 'ATTEMPT_2') updates.compliance2ndAttempt = new Date();

    await prisma.property.update({
      where: { id: propertyId },
      data: updates,
    });
  }

  return res.status(200).json({
    success: emailResult.success,
    communicationId: communication.id,
    messageId: emailResult.messageId,
    mode: emailResult.mode,
    error: emailResult.error || null,
  });
}

/* ── Batch send ──────────────────────────────────────────── */
async function handleSendBatch(req, res) {
  const data = validateOrReject(batchEmailBody, req.body, res);
  if (!data) return;
  const { emails } = data;

  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < emails.length; i++) {
    const { propertyId, to, subject, body, templateId, templateName, action: emailAction } = emails[i];

    if (!propertyId || !to || !subject || !body) {
      results.push({ index: i, propertyId: propertyId || null, success: false, error: 'Missing required fields' });
      failedCount++;
      continue;
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, buyerId: true },
    });

    if (!property) {
      results.push({ index: i, propertyId, success: false, error: 'Property not found' });
      failedCount++;
      continue;
    }

    const emailResult = await sendEmail({ to, subject, body });

    const communication = await prisma.communication.create({
      data: {
        propertyId: property.id,
        buyerId: property.buyerId,
        templateId: templateId || null,
        templateName: templateName || null,
        action: emailAction || null,
        channel: 'email',
        recipientEmail: to,
        subject,
        bodyText: body,
        status: emailResult.success ? 'sent' : 'failed',
        providerMessageId: emailResult.messageId || null,
        sentAt: emailResult.success ? new Date() : null,
        approvedAt: new Date(),
      },
    });

    if (emailResult.success) {
      const updates = { lastContactDate: new Date() };
      if (emailAction === 'ATTEMPT_1') updates.compliance1stAttempt = new Date();
      if (emailAction === 'ATTEMPT_2') updates.compliance2ndAttempt = new Date();

      await prisma.property.update({
        where: { id: propertyId },
        data: updates,
      });

      sentCount++;
    } else {
      failedCount++;
    }

    results.push({
      index: i,
      propertyId,
      success: emailResult.success,
      communicationId: communication.id,
      messageId: emailResult.messageId,
      mode: emailResult.mode,
      error: emailResult.error || null,
    });

    if (i < emails.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return res.status(200).json({
    total: emails.length,
    sent: sentCount,
    failed: failedCount,
    results,
  });
}

/* ── Preview ─────────────────────────────────────────────── */
async function handlePreview(req, res) {
  const { propertyIds, templateId, action: emailAction, template: inlineTemplate } = req.body;

  if (!propertyIds?.length) {
    return res.status(400).json({ error: 'propertyIds array is required' });
  }

  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    include: {
      buyer: true,
      communications: {
        where: { status: 'sent' },
        select: { action: true, status: true },
      },
    },
  });

  let templateVariant;
  let templateName;

  if (inlineTemplate) {
    templateVariant = inlineTemplate;
    templateName = inlineTemplate.name || 'Custom';
  } else if (templateId) {
    const dbTemplate = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
    if (!dbTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }
    templateVariant = dbTemplate.variants[emailAction];
    templateName = dbTemplate.name;
    if (!templateVariant) {
      return res.status(400).json({ error: `Template has no ${emailAction} variant` });
    }
  } else {
    return res.status(400).json({ error: 'templateId or template object is required' });
  }

  const today = new Date();

  const previews = properties.map((p) => {
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

    const buyerName = `${p.buyer?.firstName || ''} ${p.buyer?.lastName || ''}`.trim();
    const buyerEmail = p.buyer?.email || '';

    const vars = {
      '{BuyerName}': buyerName,
      '{PropertyAddress}': p.address,
      '{DueDate}': timing.dueDate || '',
      '{DaysOverdue}': String(timing.daysOverdue || 0),
      '{ProgramType}': timing.programLabel || p.programType,
      '{BuyerEmail}': buyerEmail,
    };

    let renderedSubject = templateVariant.subject || '';
    let renderedBody = templateVariant.body || '';

    const missingVars = [];
    Object.entries(vars).forEach(([key, val]) => {
      const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
      renderedSubject = renderedSubject.replace(regex, val || key);
      renderedBody = renderedBody.replace(regex, val || key);
      if (!val && key !== '{DaysOverdue}') missingVars.push(key);
    });

    return {
      propertyId: p.id,
      address: p.address,
      buyerName,
      buyerEmail,
      subject: renderedSubject,
      body: renderedBody,
      missingVars,
      hasEmail: !!buyerEmail,
    };
  });

  return res.status(200).json({
    templateName,
    action: emailAction,
    previews,
  });
}
