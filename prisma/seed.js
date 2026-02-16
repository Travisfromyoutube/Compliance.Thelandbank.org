/**
 * Seed script - populates Neon Postgres from mockData.js definitions.
 *
 * Run with: npx prisma db seed
 * (configured in package.json prisma.seed)
 *
 * Idempotent: uses upsert on parcelId so re-running is safe.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ── Program definitions (mirrors complianceRules.js) ──── */
const PROGRAMS = [
  {
    key: 'FeaturedHomes',
    label: 'Featured Homes',
    cadence: 'monthly',
    schedule: [
      { day: 30, action: 'ATTEMPT_1', level: 1 },
      { day: 60, action: 'ATTEMPT_2', level: 2 },
      { day: 90, action: 'WARNING', level: 3 },
      { day: 120, action: 'DEFAULT_NOTICE', level: 4 },
    ],
    graceDays: 3,
    uploads: ['Front Exterior', 'Rear Exterior', 'Kitchen', 'Bathroom', 'Living Area', 'Bedroom', 'Basement', 'Active Work Area'],
    docs: ['Permits (if applicable)', 'Contracts (if applicable)'],
  },
  {
    key: 'Ready4Rehab',
    label: 'Ready4Rehab',
    cadence: 'monthly',
    schedule: [
      { day: 30, action: 'ATTEMPT_1', level: 1 },
      { day: 60, action: 'ATTEMPT_2', level: 2 },
      { day: 90, action: 'WARNING', level: 3 },
      { day: 120, action: 'DEFAULT_NOTICE', level: 4 },
    ],
    graceDays: 3,
    uploads: ['Front Exterior', 'Rear Exterior', 'Kitchen', 'Bathroom', 'Living Area', 'Bedroom', 'Basement', 'Active Work Area'],
    docs: ['Permits (if applicable)', 'Contracts (if applicable)'],
  },
  {
    key: 'Demolition',
    label: 'Demolition',
    cadence: 'milestones',
    schedule: [
      { day: 14, action: 'ATTEMPT_1', level: 1 },
      { day: 30, action: 'WARNING', level: 3 },
      { day: 45, action: 'DEFAULT_NOTICE', level: 4 },
    ],
    graceDays: 0,
    uploads: ['Site Before', 'During', 'After'],
    docs: ['Contractor Agreement', 'Disposal Receipt'],
  },
  {
    key: 'VIP',
    label: 'VIP',
    cadence: 'quarterly',
    schedule: [
      { day: 90, action: 'ATTEMPT_1', level: 1 },
      { day: 120, action: 'ATTEMPT_2', level: 2 },
      { day: 150, action: 'WARNING', level: 3 },
      { day: 180, action: 'DEFAULT_NOTICE', level: 4 },
    ],
    graceDays: 5,
    uploads: ['Front Exterior', 'Rear Exterior'],
    docs: ['Insurance Proof'],
  },
];

/* ── Map frontend programType labels to rule keys ──────── */
const LABEL_TO_KEY = {
  'Featured Homes': 'FeaturedHomes',
  'Ready4Rehab': 'Ready4Rehab',
  'Demolition': 'Demolition',
  'VIP': 'VIP',
};

/* ── Mock properties (same 10 from mockData.js) ────────── */
const PROPERTIES = [
  {
    parcelId: '4108454001',
    address: '2120 Sherff Pl, Flint, MI 48503',
    buyerFirst: 'Bruce Bernard', buyerLast: 'Willis', buyerEmail: '',
    programLabel: 'Featured Homes',
    dateSold: '2025-06-15',
    offerType: 'Cash',
    occupancyDeadline: '2025-09-13',
    insuranceDueDate: '2025-07-15',
    insuranceReceived: true,
    occupancyEstablished: 'No',
    minimumHoldExpiry: '2028-06-15',
    compliance1stAttempt: '2025-11-01',
    enforcementLevel: 1,
    comms: [
      { date: '2025-11-01', channel: 'email', template: '1st Request for Proof of Renovations', action: 'ATTEMPT_1', status: 'sent' },
    ],
  },
  {
    parcelId: '4011182022',
    address: '2742 Raskob St, Flint, MI 48504',
    buyerFirst: 'Srinivasu', buyerLast: 'Angadala', buyerEmail: 'srinivasuang@yahoo.com',
    programLabel: 'Ready4Rehab',
    dateSold: '2025-03-10',
    offerType: 'Cash',
    scopeOfWorkApproved: true,
    buildingPermitObtained: true,
    rehabDeadline: '2026-03-10',
    percentComplete: 35,
    compliance1stAttempt: '2025-09-15',
    compliance2ndAttempt: '2025-11-20',
    enforcementLevel: 2,
    comms: [
      { date: '2025-09-15', channel: 'email', template: '1st Request for Proof of Renovations', action: 'ATTEMPT_1', status: 'sent' },
      { date: '2025-11-20', channel: 'email', template: '2nd Request for Proof of Renovations', action: 'ATTEMPT_2', status: 'sent' },
    ],
  },
  {
    parcelId: '4012478008',
    address: '224 W Second Ave, Flint, MI 48502',
    buyerFirst: 'Michael', buyerLast: 'Torres', buyerEmail: 'mtorres@gmail.com',
    programLabel: 'VIP',
    dateSold: '2024-10-25',
    offerType: 'Cash',
    complianceType: 'Renovation',
    enforcementLevel: 1,
    extras: {
      rcDates: {
        RC15:  { due: '2024-11-09', completed: '2024-11-13' },
        RC45:  { due: '2024-12-09', completed: '2025-01-13' },
        RC90:  { due: '2025-01-23', completed: '2025-02-05' },
        RC135: { due: '2025-03-09', completed: '2025-07-23' },
        RC180: { due: '2025-04-23', completed: null },
        RC225: { due: '2025-06-07', completed: null },
        RC270: { due: '2025-07-27', completed: null },
        RC315: { due: '2025-09-05', completed: null },
        RC360: { due: '2025-10-20', completed: null },
      },
      checkIn15Day: { propertyIsSecure: true, cleanedUp: true, lawnMowed: true },
      checkIn45Day: {
        beforePicturesProvided: true, permitsPulled: true,
        estimatesOrContractsProvided: false, estimatedDateOfCompletionGiven: false,
        waterUtilityActivated: false, electricUtilityActivated: false,
        gasUtilityActivated: true, lawnMowed: false, afterPicturesProvided: false,
      },
      completionChecklist: {
        exteriorPhotos: { foundationToRoofRepaired: false, noBoardsOrBlight: false, landscapeMaintained: false },
        interiorPhotos: { bathroom: false, kitchen: false, waterHeater: false, furnace: false },
        allPermitsCompleted: false, cocOrCoo: false, lbaStaffInspectionSatisfied: false,
      },
    },
    comms: [
      { date: '2025-04-25', channel: 'email', template: 'VIP Compliance Check-In', action: 'ATTEMPT_1', status: 'sent' },
    ],
  },
  {
    parcelId: '4003484004',
    address: '3429 Barth St, Flint, MI 48504',
    buyerFirst: 'Trina', buyerLast: 'Townsend', buyerEmail: '',
    programLabel: 'Demolition',
    dateSold: '2025-04-20',
    offerType: 'Cash',
    compliance1stAttempt: '2025-10-20',
    enforcementLevel: 1,
    comms: [
      { date: '2025-10-20', channel: 'mail', template: 'Proof of Demo Investment', action: 'ATTEMPT_1', status: 'sent' },
    ],
  },
  {
    parcelId: '4011278039',
    address: '1914 Barth St, Flint, MI 48504',
    buyerFirst: 'Lawrence', buyerLast: 'Mays', buyerEmail: 'lmays8764@gmail.com',
    programLabel: 'Ready4Rehab',
    dateSold: '2025-01-15',
    offerType: 'Cash',
    dateProofOfInvestProvided: '2025-12-01',
    compliance1stAttempt: '2025-07-20',
    scopeOfWorkApproved: true,
    buildingPermitObtained: true,
    rehabDeadline: '2026-01-15',
    percentComplete: 100,
    enforcementLevel: 0,
    comms: [
      { date: '2025-07-20', channel: 'email', template: '1st Request for Proof of Renovations', action: 'ATTEMPT_1', status: 'sent' },
      { date: '2025-12-01', channel: 'email', template: 'Compliance Completion Confirmation', action: null, status: 'sent' },
    ],
  },
  {
    parcelId: '4024476002',
    address: '1325 Neubert Ave, Flint, MI 48507',
    buyerFirst: 'Nakia', buyerLast: 'Crawford', buyerEmail: 'crawfordnikki2@gmail.com',
    programLabel: 'Featured Homes',
    dateSold: '2025-08-01',
    offerType: 'Cash',
    occupancyDeadline: '2025-10-30',
    insuranceDueDate: '2025-08-31',
    insuranceReceived: true,
    occupancyEstablished: 'Yes',
    minimumHoldExpiry: '2028-08-01',
    enforcementLevel: 0,
    comms: [],
  },
  {
    parcelId: '4625481001',
    address: '606 E Parkway Ave, Flint, MI 48503',
    buyerFirst: 'Leroy', buyerLast: 'Bowling, Jr', buyerEmail: '',
    programLabel: 'Demolition',
    dateSold: '2025-05-10',
    offerType: 'Cash',
    demoFinalCertDate: '2025-11-15',
    compliance1stAttempt: '2025-11-01',
    enforcementLevel: 0,
    comms: [
      { date: '2025-11-01', channel: 'email', template: 'Proof of Demo Investment', action: 'ATTEMPT_1', status: 'sent' },
      { date: '2025-11-15', channel: 'system', template: 'Demo Compliance Completed', action: null, status: 'sent' },
    ],
  },
  {
    parcelId: '4104130036',
    address: '3121 Thom St, Flint, MI 48504',
    buyerFirst: 'Charles', buyerLast: 'Chandler', buyerEmail: 'cchandler644632@gmail.com',
    programLabel: 'Ready4Rehab',
    dateSold: '2025-07-01',
    offerType: 'Cash',
    scopeOfWorkApproved: true,
    buildingPermitObtained: false,
    rehabDeadline: '2026-07-01',
    percentComplete: 10,
    compliance1stAttempt: '2026-01-05',
    enforcementLevel: 0,
    comms: [
      { date: '2026-01-05', channel: 'email', template: '1st Request for Proof of Renovations', action: 'ATTEMPT_1', status: 'sent' },
    ],
  },
  {
    parcelId: '4001253033',
    address: '209 E Jackson Ave, Flint, MI 48505',
    buyerFirst: 'Laquinda', buyerLast: 'Mccraw', buyerEmail: '',
    programLabel: 'VIP',
    dateSold: '2025-09-01',
    offerType: 'Cash',
    complianceType: 'New Build',
    enforcementLevel: 0,
    extras: {
      rcDates: {
        RC15:  { due: '2025-09-16', completed: '2025-09-20' },
        RC45:  { due: '2025-10-16', completed: '2025-10-20' },
        RC90:  { due: '2025-11-30', completed: null },
        RC135: { due: '2026-01-14', completed: null },
        RC180: { due: '2026-02-28', completed: null },
        RC225: { due: '2026-04-14', completed: null },
        RC270: { due: '2026-05-29', completed: null },
        RC315: { due: '2026-07-13', completed: null },
        RC360: { due: '2026-08-27', completed: null },
      },
      checkIn15Day: { propertyIsSecure: true, cleanedUp: true, lawnMowed: true },
      checkIn45Day: {
        beforePicturesProvided: true, permitsPulled: false,
        estimatesOrContractsProvided: false, estimatedDateOfCompletionGiven: false,
        waterUtilityActivated: false, electricUtilityActivated: false,
        gasUtilityActivated: false, lawnMowed: true, afterPicturesProvided: false,
      },
      completionChecklist: {
        exteriorPhotos: { foundationToRoofRepaired: false, noBoardsOrBlight: false, landscapeMaintained: false },
        interiorPhotos: { bathroom: false, kitchen: false, waterHeater: false, furnace: false },
        allPermitsCompleted: false, cocOrCoo: false, lbaStaffInspectionSatisfied: false,
      },
    },
    comms: [],
  },
  {
    parcelId: '4014454026',
    address: '2606 Gibson St, Flint, MI 48503',
    buyerFirst: 'Sammy', buyerLast: 'Laporta', buyerEmail: '',
    programLabel: 'Featured Homes',
    dateSold: '2025-02-20',
    offerType: 'Land Contract',
    occupancyDeadline: '2025-05-21',
    insuranceDueDate: '2025-03-22',
    insuranceReceived: false,
    occupancyEstablished: 'No',
    minimumHoldExpiry: '2028-02-20',
    compliance1stAttempt: '2025-08-25',
    compliance2ndAttempt: '2025-10-30',
    enforcementLevel: 3,
    comms: [
      { date: '2025-08-25', channel: 'email', template: '1st Request for Proof of Renovations', action: 'ATTEMPT_1', status: 'sent' },
      { date: '2025-10-30', channel: 'email', template: '2nd Request for Proof of Renovations', action: 'ATTEMPT_2', status: 'sent' },
      { date: '2026-01-15', channel: 'mail', template: 'Default Notice', action: 'DEFAULT_NOTICE', status: 'sent' },
    ],
  },
  {
    parcelId: '4801307001',
    address: '307 Mason St, Flint, MI 48503',
    buyerFirst: 'Derek', buyerLast: 'Dohrman', buyerEmail: 'Dohrman.Derek@gmail.com',
    programLabel: 'VIP',
    dateSold: '2023-07-26',
    offerType: 'Cash',
    complianceType: 'Renovation',
    enforcementLevel: 0,
    extras: {
      rcDates: {
        RC15:  { due: '2023-08-10', completed: null },
        RC45:  { due: '2023-09-09', completed: null },
        RC90:  { due: '2023-10-24', completed: null },
        RC135: { due: '2023-12-08', completed: null },
        RC180: { due: '2024-01-22', completed: null },
        RC225: { due: '2024-03-07', completed: null },
        RC270: { due: '2024-04-21', completed: null },
        RC315: { due: '2024-06-05', completed: null },
        RC360: { due: '2024-07-21', completed: null },
      },
      checkIn15Day: { propertyIsSecure: false, cleanedUp: false, lawnMowed: false },
      checkIn45Day: {
        beforePicturesProvided: false, permitsPulled: false,
        estimatesOrContractsProvided: false, estimatedDateOfCompletionGiven: false,
        waterUtilityActivated: false, electricUtilityActivated: false,
        gasUtilityActivated: false, lawnMowed: false, afterPicturesProvided: false,
      },
      completionChecklist: {
        exteriorPhotos: { foundationToRoofRepaired: false, noBoardsOrBlight: false, landscapeMaintained: false },
        interiorPhotos: { bathroom: false, kitchen: false, waterHeater: false, furnace: false },
        allPermitsCompleted: false, cocOrCoo: false, lbaStaffInspectionSatisfied: false,
      },
    },
    comms: [],
  },
];

/* ── Main seed function ───────────────────────────────────── */
async function main() {
  console.log('🌱 Seeding database...');

  // 1. Upsert programs
  const programMap = {};
  for (const p of PROGRAMS) {
    const program = await prisma.program.upsert({
      where: { key: p.key },
      update: { label: p.label, cadence: p.cadence, schedule: p.schedule, graceDays: p.graceDays, uploads: p.uploads, docs: p.docs },
      create: { key: p.key, label: p.label, cadence: p.cadence, schedule: p.schedule, graceDays: p.graceDays, uploads: p.uploads, docs: p.docs },
    });
    programMap[p.key] = program.id;
  }
  console.log(`  ✓ ${PROGRAMS.length} programs upserted`);

  // 2. Upsert properties with buyers
  let propCount = 0;
  for (const prop of PROPERTIES) {
    const ruleKey = LABEL_TO_KEY[prop.programLabel];

    // Upsert buyer (keyed by parcelId for seed determinism)
    const buyer = await prisma.buyer.upsert({
      where: { id: `seed-buyer-${prop.parcelId}` },
      update: { firstName: prop.buyerFirst, lastName: prop.buyerLast, email: prop.buyerEmail || null },
      create: { id: `seed-buyer-${prop.parcelId}`, firstName: prop.buyerFirst, lastName: prop.buyerLast, email: prop.buyerEmail || null },
    });

    // Build property data
    const propData = {
      parcelId: prop.parcelId,
      address: prop.address,
      programType: prop.programLabel,
      dateSold: new Date(prop.dateSold),
      offerType: prop.offerType || null,
      occupancyDeadline: prop.occupancyDeadline ? new Date(prop.occupancyDeadline) : null,
      insuranceDueDate: prop.insuranceDueDate ? new Date(prop.insuranceDueDate) : null,
      insuranceReceived: prop.insuranceReceived ?? false,
      occupancyEstablished: prop.occupancyEstablished ?? 'No',
      minimumHoldExpiry: prop.minimumHoldExpiry ? new Date(prop.minimumHoldExpiry) : null,
      dateProofOfInvestProvided: prop.dateProofOfInvestProvided ? new Date(prop.dateProofOfInvestProvided) : null,
      compliance1stAttempt: prop.compliance1stAttempt ? new Date(prop.compliance1stAttempt) : null,
      compliance2ndAttempt: prop.compliance2ndAttempt ? new Date(prop.compliance2ndAttempt) : null,
      scopeOfWorkApproved: prop.scopeOfWorkApproved ?? false,
      buildingPermitObtained: prop.buildingPermitObtained ?? false,
      rehabDeadline: prop.rehabDeadline ? new Date(prop.rehabDeadline) : null,
      percentComplete: prop.percentComplete ?? 0,
      demoFinalCertDate: prop.demoFinalCertDate ? new Date(prop.demoFinalCertDate) : null,
      complianceType: prop.complianceType || null,
      extras: prop.extras || null,
      enforcementLevel: prop.enforcementLevel ?? 0,
      status: prop.enforcementLevel === 0 ? 'compliant' : 'active',
      buyerId: buyer.id,
      programId: programMap[ruleKey],
    };

    const property = await prisma.property.upsert({
      where: { parcelId: prop.parcelId },
      update: propData,
      create: propData,
    });

    // 3. Seed communications
    if (prop.comms?.length) {
      // Delete existing comms for this property before re-seeding
      await prisma.communication.deleteMany({ where: { propertyId: property.id } });

      for (const comm of prop.comms) {
        await prisma.communication.create({
          data: {
            propertyId: property.id,
            buyerId: buyer.id,
            templateName: comm.template,
            action: comm.action || null,
            channel: comm.channel,
            status: comm.status,
            sentAt: new Date(comm.date),
          },
        });
      }
    }

    propCount++;
  }

  console.log(`  ✓ ${propCount} properties seeded with buyers and communications`);
  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
