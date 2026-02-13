import { z } from 'zod';

// ── Shared primitives ──────────────────────────────────────

/** CUID format (Prisma default IDs) */
const cuidish = z.string().min(1).max(100);

/** Parcel ID: digits with optional dashes/dots */
export const parcelIdSchema = z.string().regex(/^[\d.\-]+$/, 'Invalid parcel ID format');

/** Access token: URL-safe string */
export const tokenSchema = z.string().min(5).max(500);

/** Pagination (offset-based — existing pattern) */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ── Token endpoints ────────────────────────────────────────

export const verifyTokenQuery = z.object({
  action: z.literal('verify'),
  token: tokenSchema,
});

export const createTokenBody = z.object({
  propertyId: cuidish,
  expirationDays: z.number().int().min(1).max(365).optional().default(30),
});

export const revokeTokenQuery = z.object({
  id: cuidish,
});

// ── Submissions ────────────────────────────────────────────

export const submissionBody = z.object({
  parcelId: parcelIdSchema.optional(),
  token: tokenSchema.optional(),
  tokenId: cuidish.optional(),
  type: z.enum(['progress', 'final', 'monthly']).optional().default('progress'),
  formData: z.record(z.unknown()).optional().default({}),
  documents: z.array(z.object({
    filename: z.string().min(1),
    mimeType: z.string().optional(),
    sizeBytes: z.number().int().min(0).optional(),
    category: z.enum(['photo', 'document', 'receipt']).optional(),
    slot: z.string().optional(),
    blobUrl: z.string().url().optional(),
  })).optional().default([]),
}).refine(
  (data) => Boolean(data.parcelId || data.token || data.tokenId),
  { message: 'parcelId or token is required' },
);

// ── Email ──────────────────────────────────────────────────

export const sendEmailBody = z.object({
  propertyId: cuidish,
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  templateId: z.string().optional(),
  templateName: z.string().optional(),
  action: z.string().optional(),
});

export const batchEmailBody = z.object({
  action: z.literal('send-batch'),
  emails: z.array(sendEmailBody).min(1).max(50),
});

export const previewEmailBody = z.object({
  propertyIds: z.array(cuidish).min(1).max(100),
  templateId: z.string().optional(),
  template: z.object({
    name: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
}).passthrough();

// ── FileMaker push ─────────────────────────────────────────

export const fmPushBody = z.object({
  type: z.enum(['submission', 'communication']),
  recordId: cuidish,
});

// ── Templates ──────────────────────────────────────────────

export const createTemplateBody = z.object({
  name: z.string().min(1).max(200),
  programTypes: z.array(z.string()).min(1),
  variants: z.record(z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
  })),
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateBody = z.object({
  id: cuidish,
  name: z.string().min(1).max(200).optional(),
  programTypes: z.array(z.string()).optional(),
  variants: z.record(z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
  })).optional(),
  isActive: z.boolean().optional(),
});

// ── Notes ──────────────────────────────────────────────────

export const createNoteBody = z.object({
  propertyId: cuidish,
  body: z.string().min(1).max(10000),
  creator: z.string().max(200).optional(),
  visibility: z.enum(['internal', 'external']).optional().default('internal'),
});

// ── Property PATCH ─────────────────────────────────────────

export const patchPropertyBody = z.object({
  enforcementLevel: z.number().int().min(0).max(4).optional(),
  status: z.enum(['active', 'compliant', 'defaulted', 'closed']).optional(),
  percentComplete: z.number().int().min(0).max(100).optional(),
  compliance1stAttempt: z.string().optional().nullable(),
  compliance2ndAttempt: z.string().optional().nullable(),
  lastContactDate: z.string().optional().nullable(),
  insuranceReceived: z.boolean().optional(),
  occupancyEstablished: z.enum(['Yes', 'No', 'Unsure']).optional(),
  dateProofOfInvestProvided: z.string().optional().nullable(),
  demoFinalCertDate: z.string().optional().nullable(),
  scopeOfWorkApproved: z.boolean().optional(),
  buildingPermitObtained: z.boolean().optional(),
  extras: z.record(z.unknown()).optional().nullable(),
}).strict();

// ── Upload ─────────────────────────────────────────────────

export const ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'csv'];
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
