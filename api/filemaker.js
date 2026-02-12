/**
 * /api/filemaker — Consolidated FileMaker API router.
 *
 * Routes by ?action= query parameter:
 *   GET  ?action=status  — Connection health check (was /api/filemaker/status)
 *   GET  ?action=sync    — Pull FM records into Neon (was /api/filemaker/sync)
 *   POST ?action=push    — Push portal record to FM (was /api/filemaker/push)
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

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
      return handleSync(req, res);
    case 'push':
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      return handlePush(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

/* ══════════════════════════════════════════════════════════
 *  STATUS — Connection health check
 * ══════════════════════════════════════════════════════════ */

async function handleStatus(req, res) {
  const includeMeta = req.query.meta === 'true';

  if (!isConfigured()) {
    const portalCount = await prisma.property.count().catch(() => 0);

    return res.status(200).json({
      connected: false,
      configured: false,
      reason: 'FileMaker environment variables not set',
      hint: 'Set FM_SERVER_URL, FM_DATABASE, FM_USERNAME, FM_PASSWORD',
      portal: { recordCount: portalCount },
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
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('FM status check error:', error);

    const portalCount = await prisma.property.count().catch(() => 0);

    return res.status(200).json({
      connected: false,
      configured: true,
      error: error.message,
      fmCode: error.fmCode || null,
      latencyMs: Date.now() - startTime,
      portal: { recordCount: portalCount },
      lastChecked: new Date().toISOString(),
    });
  }
}

/* ══════════════════════════════════════════════════════════
 *  SYNC — Pull FM records into Neon
 * ══════════════════════════════════════════════════════════ */

async function handleSync(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'FileMaker not configured',
      hint: 'Set FM_SERVER_URL, FM_DATABASE, FM_USERNAME, FM_PASSWORD env vars',
    });
  }

  const limit = parseInt(req.query.limit, 10) || 100;
  const dryRun = req.query.dryRun === 'true';
  const stats = { synced: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const layouts = getLayouts();

    const fmData = await withSession(async (token) => {
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
    });

    console.log(`FM sync: fetched ${fmData.length} records from FileMaker`);

    if (dryRun) {
      const preview = fmData.slice(0, 5).map((r) => ({
        fmRecordId: r.recordId,
        fieldData: r.fieldData,
        mapped: fromFM(r.fieldData, PROPERTY_FIELD_MAP),
      }));

      return res.status(200).json({
        dryRun: true,
        totalFmRecords: fmData.length,
        preview,
        message: 'Dry run — no records written. Remove ?dryRun=true to sync.',
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
              },
            });
            buyerId = newBuyer.id;
          }
        } else {
          const newBuyer = await prisma.buyer.create({
            data: {
              firstName: buyerData.firstName || 'Unknown',
              lastName: buyerData.lastName || 'Buyer',
            },
          });
          buyerId = newBuyer.id;
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

        // Build property data for upsert
        const { parcelId, status, ...restPropertyData } = propertyData;

        const upsertData = {
          address: restPropertyData.address || '',
          programType: restPropertyData.programType || programKey,
          dateSold: restPropertyData.dateSold || new Date(),
          enforcementLevel: restPropertyData.enforcementLevel ?? 0,
          status: status || 'active',
          percentComplete: restPropertyData.percentComplete ?? 0,
          insuranceReceived: restPropertyData.insuranceReceived ?? false,
          occupancyEstablished: restPropertyData.occupancyEstablished ?? false,
          scopeOfWorkApproved: restPropertyData.scopeOfWorkApproved ?? false,
          buildingPermitObtained: restPropertyData.buildingPermitObtained ?? false,
          bondRequired: restPropertyData.bondRequired ?? false,
          buyerId,
          programId,
        };

        // Add optional date fields only if they have values
        const optionalDates = [
          'occupancyDeadline', 'insuranceDueDate', 'minimumHoldExpiry',
          'dateProofOfInvestProvided', 'compliance1stAttempt', 'compliance2ndAttempt',
          'lastContactDate', 'rehabDeadline', 'demoFinalCertDate',
          'referredToLISC', 'liscRecommendReceived', 'liscRecommendSale',
        ];
        for (const field of optionalDates) {
          if (restPropertyData[field]) {
            upsertData[field] = restPropertyData[field];
          }
        }

        // Add optional string fields
        if (restPropertyData.offerType) upsertData.offerType = restPropertyData.offerType;
        if (restPropertyData.purchaseType) upsertData.purchaseType = restPropertyData.purchaseType;
        if (restPropertyData.complianceType) upsertData.complianceType = restPropertyData.complianceType;
        if (restPropertyData.bondAmount) upsertData.bondAmount = restPropertyData.bondAmount;

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

    console.log(`FM sync complete: ${stats.synced} synced (${stats.created} new, ${stats.updated} updated), ${stats.skipped} skipped, ${stats.errors.length} errors`);

    return res.status(200).json({
      ...stats,
      dryRun: false,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('FM sync error:', error);
    return res.status(500).json({ error: 'FileMaker sync failed', message: error.message });
  }
}

/* ══════════════════════════════════════════════════════════
 *  PUSH — Push a portal record to FileMaker
 * ══════════════════════════════════════════════════════════ */

async function handlePush(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'FileMaker not configured',
      hint: 'Set FM_SERVER_URL, FM_DATABASE, FM_USERNAME, FM_PASSWORD env vars',
    });
  }

  const { type, recordId } = req.body;

  if (!type || !recordId) {
    return res.status(400).json({ error: 'type and recordId are required' });
  }

  try {
    const layouts = getLayouts();

    if (type === 'submission') return await pushSubmission(recordId, layouts, res);
    if (type === 'communication') return await pushCommunication(recordId, layouts, res);

    return res.status(400).json({ error: `Unknown type: ${type}. Use 'submission' or 'communication'.` });
  } catch (error) {
    console.error(`FM push (${type}) error:`, error);
    return res.status(500).json({ error: 'FileMaker push failed', message: error.message });
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

    // Add buyer context via toFM() — automatically skips TBD fields
    const buyerFields = toFM({
      email: submission.property.buyer?.email || '',
      fullName: joinNameForFM(
        submission.property.buyer?.firstName,
        submission.property.buyer?.lastName,
      ),
    }, BUYER_FIELD_MAP);
    Object.assign(submissionFields, buyerFields);

    // Document counts (these field names are TBD — will be set when layout is created)
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
        console.warn('FM: could not update property lastContactDate:', err.message);
      }
    }

    return { fmRecordId: fmResult.recordId };
  });

  console.log(`FM push: submission ${submissionId} → FM record ${result.fmRecordId}`);

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

  console.log(`FM push: communication ${communicationId} → FM record ${result.fmRecordId}`);

  return res.status(200).json({
    success: true,
    type: 'communication',
    portalId: communicationId,
    fmRecordId: result.fmRecordId,
  });
}
