/**
 * /api/filemaker - Consolidated FileMaker API router.
 *
 * Routes by ?action= query parameter:
 *   GET  ?action=status  - Connection health check (was /api/filemaker/status)
 *   GET  ?action=sync    - Pull FM records into Neon (was /api/filemaker/sync)
 *   POST ?action=push    - Push portal record to FM (was /api/filemaker/push)
 *
 * Consolidated to stay within Vercel Hobby plan's 12-function limit.
 */

import prisma from '../src/lib/db.js';
import {
  withSession,
  getRecords,
  findRecords,
  createRecord,
  updateRecord,
  getLayoutMetadata,
  isConfigured,
  isCircuitOpen,
} from '../src/lib/filemakerClient.js';
import {
  toFM,
  fromFM,
  PROPERTY_FIELD_MAP,
  BUYER_FIELD_MAP,
  SUBMISSION_FIELD_MAP,
  COMMUNICATION_FIELD_MAP,
  joinNameForFM,
  getLayouts,
} from '../src/config/filemakerFieldMap.js';
import { toDisplayName } from '../src/lib/programTypeMapper.js';
import { rateLimiters, applyRateLimit } from '../src/lib/rateLimit.js';
import { cors } from './_cors.js';
import { validateOrReject } from '../src/lib/validate.js';
import { fmPushBody } from '../src/lib/schemas.js';
import { requireAuth } from '../src/lib/auth.js';
import { withSentry } from '../src/lib/sentry.js';
import { log } from '../src/lib/logger.js';

// Present in FM mapping but not persisted in current Prisma model.
const UNSUPPORTED_PROPERTY_FIELDS = new Set(['foreclosureYear', 'propertyClass']);

export default withSentry(async function handler(req, res) {
  if (cors(req, res, { methods: 'GET, POST, OPTIONS' })) return;

  const session = await requireAuth(req, res);
  if (!session) return;

  const action = req.query.action;

  if (!action) {
    return res.status(400).json({
      error: 'Missing ?action= parameter',
      valid: ['status', 'sync', 'push'],
    });
  }

  switch (action) {
    case 'status':
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      return handleStatus(req, res);
    case 'sync':
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      if (!(await applyRateLimit(rateLimiters.fmSync, req, res))) return;
      return handleSync(req, res);
    case 'push':
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      return handlePush(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
});

/* ══════════════════════════════════════════════════════════
 *  STATUS - Connection health check
 * ══════════════════════════════════════════════════════════ */

async function handleStatus(req, res) {
  const includeMeta = req.query.meta === 'true';
  const circuitOpen = await isCircuitOpen();
  const syncMeta = await prisma.syncMetadata.findUnique({ where: { id: 'singleton' } }).catch(() => null);

  // Static field mapping - always available regardless of FM connection
  const staticFieldMapping = {
    mappedFields: Object.keys(PROPERTY_FIELD_MAP).length,
    portalFields: Object.keys(PROPERTY_FIELD_MAP),
    fmFields: Object.values(PROPERTY_FIELD_MAP),
  };

  if (!isConfigured()) {
    const portalCount = await prisma.property.count().catch(() => 0);

    return res.status(200).json({
      connected: false,
      configured: false,
      reason: 'FileMaker environment variables not set',
      hint: 'Set FM_SERVER_URL, FM_DATABASE, FM_USERNAME, FM_PASSWORD',
      portal: { recordCount: portalCount },
      fieldMapping: staticFieldMapping,
      circuitBreaker: { open: circuitOpen },
      syncMetadata: syncMeta ? {
        lastSyncAt: syncMeta.lastSyncAt.toISOString(),
        lastFullSync: syncMeta.lastFullSync.toISOString(),
        recordsSynced: syncMeta.recordsSynced,
        status: syncMeta.status,
      } : null,
      lastChecked: new Date().toISOString(),
    });
  }

  const layouts = getLayouts();
  const startTime = Date.now();

  try {
    const fmStatus = await withSession(async (token) => {
      const result = await getRecords(token, layouts.properties, { limit: 1 });

      const response = {
        fmRecordCount: result.dataInfo?.totalRecordCount ?? 0,
        database: result.dataInfo?.database ?? null,
        layout: result.dataInfo?.layout ?? null,
        table: result.dataInfo?.table ?? null,
      };

      if (includeMeta) {
        try {
          const meta = await getLayoutMetadata(token, layouts.properties);
          response.fieldMetadata = meta.fieldMetaData?.map((f) => ({
            name: f.name,
            type: f.type,
            result: f.result,
            maxRepeat: f.maxRepeat,
          }));
        } catch {
          response.fieldMetadata = null;
          response.metaError = 'Could not fetch layout metadata';
        }
      }

      return response;
    });

    const portalCount = await prisma.property.count().catch(() => 0);

    return res.status(200).json({
      connected: true,
      configured: true,
      latencyMs: Date.now() - startTime,
      fileMaker: {
        recordCount: fmStatus.fmRecordCount,
        database: fmStatus.database,
        layout: fmStatus.layout,
        table: fmStatus.table,
      },
      portal: { recordCount: portalCount },
      sync: {
        inSync: fmStatus.fmRecordCount === portalCount,
        fmRecords: fmStatus.fmRecordCount,
        portalRecords: portalCount,
        delta: fmStatus.fmRecordCount - portalCount,
      },
      fieldMapping: {
        mappedFields: Object.keys(PROPERTY_FIELD_MAP).length,
        portalFields: Object.keys(PROPERTY_FIELD_MAP),
        fmFields: Object.values(PROPERTY_FIELD_MAP),
      },
      ...(fmStatus.fieldMetadata && { fieldMetadata: fmStatus.fieldMetadata }),
      ...(fmStatus.metaError && { metaError: fmStatus.metaError }),
      circuitBreaker: { open: circuitOpen },
      syncMetadata: syncMeta ? {
        lastSyncAt: syncMeta.lastSyncAt.toISOString(),
        lastFullSync: syncMeta.lastFullSync.toISOString(),
        recordsSynced: syncMeta.recordsSynced,
        status: syncMeta.status,
      } : null,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    log.error('fm_status_check_failed', { error: error.message, fmCode: error.fmCode });

    const portalCount = await prisma.property.count().catch(() => 0);

    return res.status(200).json({
      connected: false,
      configured: true,
      error: error.message,
      fmCode: error.fmCode || null,
      circuitBreaker: { open: error.circuitOpen || circuitOpen },
      latencyMs: Date.now() - startTime,
      portal: { recordCount: portalCount },
      fieldMapping: staticFieldMapping,
      syncMetadata: syncMeta ? {
        lastSyncAt: syncMeta.lastSyncAt.toISOString(),
        lastFullSync: syncMeta.lastFullSync.toISOString(),
        recordsSynced: syncMeta.recordsSynced,
        status: syncMeta.status,
      } : null,
      lastChecked: new Date().toISOString(),
    });
  }
}

/* ══════════════════════════════════════════════════════════
 *  SYNC - Pull FM records into Neon (incremental delta)
 *
 *  Default mode is 'delta' - only pulls records modified
 *  since the last successful sync. Use ?mode=full to pull
 *  all records (will time out in serverless for large DBs).
 * ══════════════════════════════════════════════════════════ */

async function handleSync(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'FileMaker not configured',
      hint: 'Set FM_SERVER_URL, FM_DATABASE, FM_USERNAME, FM_PASSWORD env vars',
    });
  }

  const mode = ['delta', 'full'].includes(req.query.mode) ? req.query.mode : 'delta';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 1000);
  const dryRun = req.query.dryRun === 'true';

  // Get or create sync metadata (singleton row)
  let syncMeta = await prisma.syncMetadata.findUnique({ where: { id: 'singleton' } });
  if (!syncMeta) {
    syncMeta = await prisma.syncMetadata.create({
      data: { id: 'singleton', lastSyncAt: new Date(0) },
    });
  }

  // Prevent concurrent syncs
  if (syncMeta.status === 'running') {
    return res.status(409).json({
      error: 'Sync already in progress',
      startedAt: syncMeta.updatedAt,
    });
  }

  // Mark sync as running
  await prisma.syncMetadata.update({
    where: { id: 'singleton' },
    data: { status: 'running', errorMessage: null },
  });

  const stats = { synced: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const layouts = getLayouts();

    const fmData = await withSession(async (token) => {
      if (mode === 'full') {
        // Full sync - paginate through all records
        // WARNING: Will time out on Vercel for large datasets.
        // Use for initial seed or from a long-running environment.
        const allRecords = [];
        let offset = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const result = await getRecords(token, layouts.properties, { limit, offset });
            if (result.data && result.data.length > 0) {
              allRecords.push(...result.data);
              offset += result.data.length;
              hasMore = result.data.length === limit;
            } else {
              hasMore = false;
            }
          } catch (err) {
            if (err.fmCode === '401') {
              hasMore = false;
            } else {
              throw err;
            }
          }
        }

        return allRecords;
      }

      // Delta sync - only records modified since last sync
      const fmDate = formatDateForFM(syncMeta.lastSyncAt);

      try {
        const findResult = await findRecords(token, layouts.properties, [
          { ModificationTimestamp: `>=${fmDate}` },
        ], { limit });
        return findResult.data || [];
      } catch (err) {
        // FM error 401 = no records match (not an auth failure)
        if (err.fmCode === '401') {
          return [];
        }
        throw err;
      }
    });

    log.info('fm_sync_fetched', { mode, records: fmData.length });

    if (dryRun) {
      // Reset status since we're not actually syncing
      await prisma.syncMetadata.update({
        where: { id: 'singleton' },
        data: { status: 'idle' },
      });

      const preview = fmData.slice(0, 5).map((r) => ({
        fmRecordId: r.recordId,
        fieldData: r.fieldData,
        mapped: fromFM(r.fieldData, PROPERTY_FIELD_MAP),
      }));

      return res.status(200).json({
        dryRun: true,
        mode,
        totalFmRecords: fmData.length,
        preview,
        message: 'Dry run - no records written. Remove ?dryRun=true to sync.',
      });
    }

    // Ensure we have a default program record for each program type
    const programCache = {};
    const existingPrograms = await prisma.program.findMany();
    for (const p of existingPrograms) {
      programCache[p.key] = p.id;
    }

    // Process each FM record
    for (const fmRecord of fmData) {
      try {
        const propertyData = fromFM(fmRecord.fieldData, PROPERTY_FIELD_MAP);
        const buyerData = fromFM(fmRecord.fieldData, BUYER_FIELD_MAP);

        // Normalize programType from rule key to display name (UI expects display names)
        if (propertyData.programType) {
          propertyData.programType = toDisplayName(propertyData.programType);
        }

        if (!propertyData.parcelId) {
          stats.skipped++;
          stats.errors.push({ fmRecordId: fmRecord.recordId, error: 'Missing ParcelID' });
          continue;
        }

        // Resolve or create buyer
        let buyerId;
        if (buyerData.email) {
          const existingBuyer = await prisma.buyer.findFirst({
            where: { email: buyerData.email },
          });

          if (existingBuyer) {
            buyerId = existingBuyer.id;
            await prisma.buyer.update({
              where: { id: existingBuyer.id },
              data: {
                firstName: buyerData.firstName || existingBuyer.firstName,
                lastName: buyerData.lastName || existingBuyer.lastName,
                phone: buyerData.phone || existingBuyer.phone,
                organization: buyerData.organization || existingBuyer.organization,
                topNote: buyerData.topNote ?? existingBuyer.topNote,
                buyerStatus: buyerData.buyerStatus ?? existingBuyer.buyerStatus,
              },
            });
          } else {
            const newBuyer = await prisma.buyer.create({
              data: {
                firstName: buyerData.firstName || 'Unknown',
                lastName: buyerData.lastName || '',
                email: buyerData.email,
                phone: buyerData.phone,
                organization: buyerData.organization,
                topNote: buyerData.topNote || null,
                buyerStatus: buyerData.buyerStatus || null,
              },
            });
            buyerId = newBuyer.id;
          }
        } else {
          // No email - reuse existing buyer linked to this property if possible
          const existingProp = await prisma.property.findUnique({
            where: { parcelId: propertyData.parcelId },
            select: { buyerId: true, buyer: true },
          });

          if (existingProp?.buyerId) {
            buyerId = existingProp.buyerId;
            await prisma.buyer.update({
              where: { id: buyerId },
              data: {
                firstName: buyerData.firstName || existingProp.buyer?.firstName,
                lastName: buyerData.lastName || existingProp.buyer?.lastName,
                topNote: buyerData.topNote ?? existingProp.buyer?.topNote,
                buyerStatus: buyerData.buyerStatus ?? existingProp.buyer?.buyerStatus,
              },
            });
          } else if (buyerData.firstName && buyerData.lastName) {
            // Fallback: try name match to avoid duplicates
            const nameMatch = await prisma.buyer.findFirst({
              where: { firstName: buyerData.firstName, lastName: buyerData.lastName },
            });
            if (nameMatch) {
              buyerId = nameMatch.id;
              await prisma.buyer.update({
                where: { id: buyerId },
                data: {
                  topNote: buyerData.topNote ?? nameMatch.topNote,
                  buyerStatus: buyerData.buyerStatus ?? nameMatch.buyerStatus,
                },
              });
            } else {
              const newBuyer = await prisma.buyer.create({
                data: {
                  firstName: buyerData.firstName,
                  lastName: buyerData.lastName,
                  topNote: buyerData.topNote || null,
                  buyerStatus: buyerData.buyerStatus || null,
                },
              });
              buyerId = newBuyer.id;
            }
          } else {
            const newBuyer = await prisma.buyer.create({
              data: {
                firstName: buyerData.firstName || 'Unknown',
                lastName: buyerData.lastName || 'Buyer',
                topNote: buyerData.topNote || null,
                buyerStatus: buyerData.buyerStatus || null,
              },
            });
            buyerId = newBuyer.id;
          }
        }

        // Resolve program
        const programKey = propertyData.programType || 'FeaturedHomes';
        let programId = programCache[programKey];
        if (!programId) {
          const byLabel = existingPrograms.find(
            (p) => p.label === programKey || p.key === programKey
          );
          programId = byLabel?.id;
        }
        if (!programId) {
          stats.skipped++;
          stats.errors.push({
            fmRecordId: fmRecord.recordId,
            parcelId: propertyData.parcelId,
            error: `Unknown program type: ${programKey}`,
          });
          continue;
        }

        // Build property data for upsert - spread all fromFM() fields with explicit defaults
        const { parcelId, status, ...restPropertyData } = propertyData;

        const upsertData = {
          ...restPropertyData,
          // Explicit defaults for required/core fields
          address: restPropertyData.address || '',
          programType: restPropertyData.programType || programKey,
          dateSold: restPropertyData.dateSold || new Date(),
          enforcementLevel: restPropertyData.enforcementLevel ?? 0,
          status: status || 'active',
          percentComplete: restPropertyData.percentComplete ?? 0,
          insuranceReceived: restPropertyData.insuranceReceived ?? false,
          occupancyEstablished: restPropertyData.occupancyEstablished ?? 'No',
          scopeOfWorkApproved: restPropertyData.scopeOfWorkApproved ?? false,
          buildingPermitObtained: restPropertyData.buildingPermitObtained ?? false,
          bondRequired: restPropertyData.bondRequired ?? false,
          buyerId,
          programId,
        };

        // Strip unsupported and null/undefined keys to avoid Prisma write errors
        for (const key of Object.keys(upsertData)) {
          if (UNSUPPORTED_PROPERTY_FIELDS.has(key)) {
            delete upsertData[key];
            continue;
          }
          if (upsertData[key] === null || upsertData[key] === undefined) {
            delete upsertData[key];
          }
        }

        // Upsert on parcelId
        const existing = await prisma.property.findUnique({ where: { parcelId } });

        if (existing) {
          await prisma.property.update({ where: { parcelId }, data: upsertData });
          stats.updated++;
        } else {
          await prisma.property.create({ data: { parcelId, ...upsertData } });
          stats.created++;
        }

        stats.synced++;
      } catch (err) {
        stats.errors.push({ fmRecordId: fmRecord.recordId, error: err.message });
      }
    }

    log.info('fm_sync_complete', { mode, ...stats, errorCount: stats.errors.length });

    // Update sync metadata - mark idle with new timestamp
    await prisma.syncMetadata.update({
      where: { id: 'singleton' },
      data: {
        status: 'idle',
        lastSyncAt: new Date(),
        ...(mode === 'full' ? { lastFullSync: new Date() } : {}),
        recordsSynced: fmData.length,
      },
    });

    return res.status(200).json({
      ...stats,
      mode,
      dryRun: false,
      syncedAt: new Date().toISOString(),
      syncMetadata: {
        lastSyncAt: new Date().toISOString(),
        lastFullSync: syncMeta.lastFullSync?.toISOString?.() || null,
      },
    });
  } catch (error) {
    // Mark sync as failed so it can be retried
    await prisma.syncMetadata.update({
      where: { id: 'singleton' },
      data: { status: 'failed', errorMessage: error.message },
    }).catch(() => { /* best effort */ });

    log.error('fm_sync_failed', { error: error.message });
    return res.status(500).json({ error: 'FileMaker sync failed', stats });
  }
}

/**
 * Format a JS Date to FileMaker's modification timestamp format.
 * FM expects: MM/DD/YYYY HH:MM:SS
 */
function formatDateForFM(date) {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}`;
}

/* ══════════════════════════════════════════════════════════
 *  PUSH - Push a portal record to FileMaker
 * ══════════════════════════════════════════════════════════ */

async function handlePush(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'FileMaker not configured',
      hint: 'Set FM_SERVER_URL, FM_DATABASE, FM_USERNAME, FM_PASSWORD env vars',
    });
  }

  const data = validateOrReject(fmPushBody, req.body, res);
  if (!data) return;
  const { type, recordId } = data;

  try {
    const layouts = getLayouts();

    if (type === 'submission') return await pushSubmission(recordId, layouts, res);
    if (type === 'communication') return await pushCommunication(recordId, layouts, res);

    return res.status(400).json({ error: `Unknown type: ${type}. Use 'submission' or 'communication'.` });
  } catch (error) {
    log.error('fm_push_failed', { type, error: error.message });
    return res.status(500).json({ error: 'FileMaker push failed' });
  }
}

async function pushSubmission(submissionId, layouts, res) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      property: { include: { buyer: true } },
      documents: true,
    },
  });

  if (!submission) {
    return res.status(404).json({ error: `Submission ${submissionId} not found` });
  }

  const result = await withSession(async (token) => {
    const parcelId = submission.property.parcelId;
    let fmPropertyRecordId = null;

    try {
      const findResult = await findRecords(token, layouts.properties, [
        { [PROPERTY_FIELD_MAP.parcelId]: parcelId },
      ]);
      if (findResult.data && findResult.data.length > 0) {
        fmPropertyRecordId = findResult.data[0].recordId;
      }
    } catch (err) {
      if (err.fmCode !== '401') throw err;
    }

    const submissionFields = toFM({
      type: submission.type,
      status: submission.status,
      confirmationId: submission.confirmationId,
      createdAt: submission.createdAt,
    }, SUBMISSION_FIELD_MAP);

    // Add parcel context
    submissionFields[PROPERTY_FIELD_MAP.parcelId] = parcelId;

    // Add buyer context via toFM() - automatically skips TBD fields
    const buyerFields = toFM({
      email: submission.property.buyer?.email || '',
      fullName: joinNameForFM(
        submission.property.buyer?.firstName,
        submission.property.buyer?.lastName,
      ),
    }, BUYER_FIELD_MAP);
    Object.assign(submissionFields, buyerFields);

    // Document counts (these field names are TBD - will be set when layout is created)
    const photos = submission.documents.filter((d) => d.category === 'photo');
    const docs = submission.documents.filter((d) => d.category === 'document');
    const receipts = submission.documents.filter((d) => d.category === 'receipt');
    submissionFields.Photo_Count = String(photos.length);
    submissionFields.Document_Count = String(docs.length);
    submissionFields.Receipt_Count = String(receipts.length);

    const fmResult = await createRecord(token, layouts.submissions, submissionFields);

    if (fmPropertyRecordId) {
      try {
        await updateRecord(token, layouts.properties, fmPropertyRecordId, {
          [PROPERTY_FIELD_MAP.lastContactDate]: toFM({ lastContactDate: new Date() }, PROPERTY_FIELD_MAP)[PROPERTY_FIELD_MAP.lastContactDate],
        });
      } catch (err) {
        log.warn('fm_push_lastcontact_failed', { error: err.message });
      }
    }

    return { fmRecordId: fmResult.recordId };
  });

  log.info('fm_push_submission', { submissionId, fmRecordId: result.fmRecordId });

  return res.status(200).json({
    success: true,
    type: 'submission',
    portalId: submissionId,
    fmRecordId: result.fmRecordId,
  });
}

async function pushCommunication(communicationId, layouts, res) {
  const comm = await prisma.communication.findUnique({
    where: { id: communicationId },
    include: { property: true, buyer: true },
  });

  if (!comm) {
    return res.status(404).json({ error: `Communication ${communicationId} not found` });
  }

  const result = await withSession(async (token) => {
    const commFields = toFM({
      action: comm.action,
      channel: comm.channel,
      recipientEmail: comm.recipientEmail,
      subject: comm.subject,
      bodyText: comm.bodyText,
      status: comm.status,
      sentAt: comm.sentAt,
      templateName: comm.templateName,
    }, COMMUNICATION_FIELD_MAP);

    commFields[PROPERTY_FIELD_MAP.parcelId] = comm.property?.parcelId || '';
    commFields[PROPERTY_FIELD_MAP.address] = comm.property?.address || '';

    const fmResult = await createRecord(token, layouts.communications, commFields);
    return { fmRecordId: fmResult.recordId };
  });

  log.info('fm_push_communication', { communicationId, fmRecordId: result.fmRecordId });

  return res.status(200).json({
    success: true,
    type: 'communication',
    portalId: communicationId,
    fmRecordId: result.fmRecordId,
  });
}
