// Mock data generator for GCLBA Compliance Portal
// Produces ~30 additional demo property records with realistic Flint, MI data.
// Uses deterministic seeding so output is stable between renders.

// Program types duplicated here to avoid circular dependency with mockData.js
const PROGRAM_TYPES = {
  FEATURED: 'Featured Homes',
  R4R: 'Ready4Rehab',
  DEMO: 'Demolition',
  VIP: 'VIP',
};

// ---------------------------------------------------------------------------
// Seeded PRNG (Lehmer / Park-Miller)
// ---------------------------------------------------------------------------

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Reference data - real Flint streets, names, and zip codes
// ---------------------------------------------------------------------------

const STREETS = [
  'Saginaw St', 'Court St', 'Kearsley St', 'Ballenger Hwy', 'MLK Ave',
  'Davison Rd', 'Fenton Rd', 'Corunna Rd', 'Dort Hwy', 'Pierson Rd',
  'Carpenter Rd', 'Beecher Rd', 'Robert T Longway Blvd', 'Industrial Ave',
  'Lippincott Blvd', 'Dupont St', 'Lapeer Rd', 'Pasadena Ave', 'Lewis St',
  'Mason St', 'Welch Blvd', 'Begole St', 'Chevrolet Ave', 'Leith St',
];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael',
  'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan',
  'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel',
  'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Sandra',
  'Donald', 'Dorothy', 'Terrence', 'Shanice', 'Darnell', 'Keisha',
  'Marcus', 'Latoya', 'Jamal', 'Tanya', 'DeShawn', 'Aaliyah',
];

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Wilson', 'Anderson',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson',
  'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Scott',
  'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Moore', 'Simmons', 'Carter',
];

const ZIP_CODES = ['48502', '48503', '48504', '48505', '48506', '48507'];

// Program distribution: 40% Featured, 30% R4R, 15% Demo, 15% VIP
const PROGRAM_DISTRIBUTION = [
  { type: PROGRAM_TYPES.FEATURED, weight: 0.40 },
  { type: PROGRAM_TYPES.R4R,      weight: 0.70 },  // cumulative
  { type: PROGRAM_TYPES.DEMO,     weight: 0.85 },
  { type: PROGRAM_TYPES.VIP,      weight: 1.00 },
];

// Enforcement level distribution: 35/25/20/12/8
const ENFORCEMENT_DISTRIBUTION = [
  { level: 0, weight: 0.35 },
  { level: 1, weight: 0.60 },
  { level: 2, weight: 0.80 },
  { level: 3, weight: 0.92 },
  { level: 4, weight: 1.00 },
];

// VIP compliance type options
const VIP_COMPLIANCE_TYPES = ['New Build', 'Renovation'];

// RC day offsets from dateSold (VIP program)
const RC_DAY_OFFSETS = [15, 45, 90, 135, 180, 225, 270, 315, 360];

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Add `days` to a YYYY-MM-DD string and return a new YYYY-MM-DD string. */
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z'); // noon UTC avoids DST drift
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

/** Format a Date object as YYYY-MM-DD (UTC). */
function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate a random date between `startStr` and `endStr` (inclusive)
 * using the provided random function.
 */
function randomDate(rand, startStr, endStr) {
  const start = new Date(startStr + 'T12:00:00Z').getTime();
  const end = new Date(endStr + 'T12:00:00Z').getTime();
  const ts = start + Math.floor(rand() * (end - start));
  return formatDate(new Date(ts));
}

// ---------------------------------------------------------------------------
// Weighted pick helper
// ---------------------------------------------------------------------------

function pickWeighted(rand, distribution) {
  const r = rand();
  for (const entry of distribution) {
    if (r <= entry.weight) return entry;
  }
  return distribution[distribution.length - 1]; // fallback
}

function pickFrom(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

// ---------------------------------------------------------------------------
// Communication template lookup by program and enforcement action
// ---------------------------------------------------------------------------

function getTemplate(programType, action) {
  const templates = {
    ATTEMPT_1: {
      [PROGRAM_TYPES.FEATURED]: '1st Request for Proof of Renovations',
      [PROGRAM_TYPES.R4R]:      '1st Request for Proof of Renovations',
      [PROGRAM_TYPES.DEMO]:     'Proof of Demo Investment',
      [PROGRAM_TYPES.VIP]:      'VIP Compliance Check-In',
    },
    ATTEMPT_2: {
      [PROGRAM_TYPES.FEATURED]: '2nd Request for Proof of Renovations',
      [PROGRAM_TYPES.R4R]:      '2nd Request for Proof of Renovations',
      [PROGRAM_TYPES.DEMO]:     'Proof of Demo Investment',
      [PROGRAM_TYPES.VIP]:      'VIP Compliance Check-In',
    },
    WARNING: 'Formal Warning - Compliance Required',
    DEFAULT_NOTICE: 'Default Notice - Immediate Action Required',
  };

  if (action === 'WARNING' || action === 'DEFAULT_NOTICE') {
    return templates[action];
  }
  return templates[action]?.[programType] ?? templates.ATTEMPT_1[programType];
}

// ---------------------------------------------------------------------------
// Per-property field builders
// ---------------------------------------------------------------------------

/**
 * Build communications array and compliance attempt dates based on
 * enforcement level, program type, and dateSold.
 */
function buildCommunications(rand, programType, enforcementLevel, dateSold) {
  const comms = [];
  let compliance1stAttempt = null;
  let compliance2ndAttempt = null;
  let lastContactDate = null;

  if (enforcementLevel === 0) {
    // Compliant properties may or may not have had an initial attempt
    const hadAttempt = rand() < 0.3;
    if (hadAttempt) {
      const attemptDate = addDays(dateSold, 120 + Math.floor(rand() * 60));
      compliance1stAttempt = attemptDate;
      lastContactDate = attemptDate;
      comms.push({
        date: attemptDate,
        type: 'email',
        template: getTemplate(programType, 'ATTEMPT_1'),
        status: 'sent',
      });
    }
    return { comms, compliance1stAttempt, compliance2ndAttempt, lastContactDate };
  }

  // Level 1+: always has a 1st attempt
  const attempt1Offset = 90 + Math.floor(rand() * 90); // 90-180 days after sale
  compliance1stAttempt = addDays(dateSold, attempt1Offset);
  lastContactDate = compliance1stAttempt;
  comms.push({
    date: compliance1stAttempt,
    type: rand() < 0.8 ? 'email' : 'mail',
    template: getTemplate(programType, 'ATTEMPT_1'),
    status: 'sent',
  });

  if (enforcementLevel >= 2) {
    // 2nd attempt 30-60 days after 1st
    compliance2ndAttempt = addDays(compliance1stAttempt, 30 + Math.floor(rand() * 30));
    lastContactDate = compliance2ndAttempt;
    comms.push({
      date: compliance2ndAttempt,
      type: 'email',
      template: getTemplate(programType, 'ATTEMPT_2'),
      status: 'sent',
    });
  }

  if (enforcementLevel >= 3) {
    const warningDate = addDays(compliance2ndAttempt || compliance1stAttempt, 30 + Math.floor(rand() * 15));
    lastContactDate = warningDate;
    comms.push({
      date: warningDate,
      type: 'mail',
      template: getTemplate(programType, 'WARNING'),
      status: 'sent',
    });
  }

  if (enforcementLevel >= 4) {
    const defaultDate = addDays(lastContactDate, 30 + Math.floor(rand() * 20));
    lastContactDate = defaultDate;
    comms.push({
      date: defaultDate,
      type: 'mail',
      template: getTemplate(programType, 'DEFAULT_NOTICE'),
      status: 'sent',
    });
  }

  return { comms, compliance1stAttempt, compliance2ndAttempt, lastContactDate };
}

/**
 * Build Featured Homes program-specific fields.
 */
function buildFeaturedFields(rand, dateSold, enforcementLevel) {
  const occupancyDeadline = addDays(dateSold, 90);
  const insuranceDueDate = addDays(dateSold, 30);
  const minimumHoldExpiry = addDays(dateSold, 365 * 3);

  // Compliant properties are more likely to have everything done
  const compliant = enforcementLevel === 0;
  const insuranceReceived = compliant ? rand() < 0.95 : rand() < 0.4;
  const occupancyEstablished = compliant ? (rand() < 0.85 ? 'Yes' : 'No') : (rand() < 0.15 ? 'Yes' : rand() < 0.3 ? 'Unsure' : 'No');

  return {
    occupancyDeadline,
    insuranceDueDate,
    insuranceReceived,
    occupancyEstablished,
    minimumHoldExpiry,
    // Fields that only Featured Homes uses but we include for shape consistency
    referredToLISC: null,
    liscRecommendReceived: null,
    liscRecommendSale: null,
  };
}

/**
 * Build Ready4Rehab program-specific fields.
 */
function buildR4RFields(rand, dateSold, enforcementLevel) {
  const rehabDeadline = addDays(dateSold, 365);
  const compliant = enforcementLevel === 0;

  // Progress correlates with enforcement level
  let percentComplete;
  if (compliant) {
    percentComplete = 70 + Math.floor(rand() * 31); // 70-100
  } else if (enforcementLevel <= 2) {
    percentComplete = 15 + Math.floor(rand() * 45); // 15-60
  } else {
    percentComplete = Math.floor(rand() * 25); // 0-25
  }

  const scopeOfWorkApproved = compliant ? true : rand() < 0.7;
  const buildingPermitObtained = scopeOfWorkApproved ? (compliant ? rand() < 0.95 : rand() < 0.5) : false;

  return {
    scopeOfWorkApproved,
    buildingPermitObtained,
    rehabDeadline,
    percentComplete,
    bondRequired: false,
    bondAmount: null,
  };
}

/**
 * Build Demolition program-specific fields.
 */
function buildDemoFields(rand, dateSold, enforcementLevel) {
  const compliant = enforcementLevel === 0;
  const demoFinalCertDate = compliant && rand() < 0.6
    ? addDays(dateSold, 120 + Math.floor(rand() * 120))
    : null;

  return {
    demoFinalCertDate,
  };
}

/**
 * Build VIP program-specific fields, including RC date schedule and checklists.
 */
function buildVIPFields(rand, dateSold, enforcementLevel) {
  const complianceType = pickFrom(rand, VIP_COMPLIANCE_TYPES);

  // Build RC dates - mark earlier milestones as completed based on enforcement
  // Lower enforcement = more milestones completed on time
  const completedCount = enforcementLevel === 0
    ? 3 + Math.floor(rand() * 4)  // 3-6 completed
    : enforcementLevel === 1
      ? 2 + Math.floor(rand() * 2)  // 2-3 completed
      : Math.floor(rand() * 2);     // 0-1 completed

  const rcDates = {};
  RC_DAY_OFFSETS.forEach((offset, idx) => {
    const key = `RC${offset}`;
    const due = addDays(dateSold, offset);
    let completed = null;
    if (idx < completedCount) {
      // Completed a few days after due
      completed = addDays(due, 1 + Math.floor(rand() * 7));
    }
    rcDates[key] = { due, completed };
  });

  // 15-day check-in - usually all true for low enforcement
  const secure15 = enforcementLevel <= 1 ? true : rand() < 0.6;
  const checkIn15Day = {
    propertyIsSecure: secure15,
    cleanedUp: secure15 ? rand() < 0.9 : rand() < 0.4,
    lawnMowed: secure15 ? rand() < 0.85 : rand() < 0.3,
  };

  // 45-day check-in - more fields, more variance
  const good45 = enforcementLevel === 0;
  const checkIn45Day = {
    beforePicturesProvided: good45 ? rand() < 0.95 : rand() < 0.5,
    permitsPulled: good45 ? rand() < 0.85 : rand() < 0.3,
    estimatesOrContractsProvided: good45 ? rand() < 0.8 : rand() < 0.25,
    estimatedDateOfCompletionGiven: good45 ? rand() < 0.75 : rand() < 0.2,
    waterUtilityActivated: good45 ? rand() < 0.7 : rand() < 0.2,
    electricUtilityActivated: good45 ? rand() < 0.7 : rand() < 0.2,
    gasUtilityActivated: good45 ? rand() < 0.65 : rand() < 0.25,
    lawnMowed: good45 ? rand() < 0.9 : rand() < 0.4,
    afterPicturesProvided: good45 ? rand() < 0.5 : rand() < 0.1,
  };

  // Completion checklist - only filled for very compliant VIP properties
  const nearComplete = enforcementLevel === 0 && rand() < 0.3;
  const completionChecklist = {
    exteriorPhotos: {
      foundationToRoofRepaired: nearComplete ? rand() < 0.8 : false,
      noBoardsOrBlight: nearComplete ? rand() < 0.8 : false,
      landscapeMaintained: nearComplete ? rand() < 0.7 : false,
    },
    interiorPhotos: {
      bathroom: nearComplete ? rand() < 0.7 : false,
      kitchen: nearComplete ? rand() < 0.7 : false,
      waterHeater: nearComplete ? rand() < 0.6 : false,
      furnace: nearComplete ? rand() < 0.6 : false,
    },
    allPermitsCompleted: nearComplete ? rand() < 0.5 : false,
    cocOrCoo: nearComplete ? rand() < 0.3 : false,
    lbaStaffInspectionSatisfied: nearComplete ? rand() < 0.2 : false,
  };

  return { complianceType, rcDates, checkIn15Day, checkIn45Day, completionChecklist };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate an array of demo property records.
 *
 * @param {number} count - Number of properties to generate (default 30).
 * @returns {Array<Object>} Array of property objects matching mockData shape.
 */
export function generateDemoProperties(count = 30) {
  const properties = [];

  for (let i = 0; i < count; i++) {
    // Each property gets its own seeded PRNG for full determinism
    const rand = seededRandom((i + 11) * 7919); // offset by 11 (P011+), prime multiplier

    // --- Identity ---
    const id = `P${String(i + 11).padStart(3, '0')}`;
    const parcelPrefix = '40';
    const parcelSuffix = String(Math.floor(rand() * 100000000)).padStart(8, '0');
    const parcelId = parcelPrefix + parcelSuffix;

    const houseNumber = 100 + Math.floor(rand() * 5900); // 100-5999
    const street = pickFrom(rand, STREETS);
    const zip = pickFrom(rand, ZIP_CODES);
    const address = `${houseNumber} ${street}, Flint, MI ${zip}`;

    const firstName = pickFrom(rand, FIRST_NAMES);
    const lastName = pickFrom(rand, LAST_NAMES);
    const buyerName = `${firstName} ${lastName}`;

    // ~70% have email addresses
    const hasEmail = rand() < 0.7;
    const buyerEmail = hasEmail
      ? `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(rand() * 999)}@gmail.com`
      : '';

    // --- Program & enforcement ---
    const programEntry = pickWeighted(rand, PROGRAM_DISTRIBUTION);
    const programType = programEntry.type;

    const enforcementEntry = pickWeighted(rand, ENFORCEMENT_DISTRIBUTION);
    const enforcementLevel = enforcementEntry.level;

    // --- Dates ---
    // Spread close dates from 2024-06-01 through 2025-10-31
    const dateSold = randomDate(rand, '2024-06-01', '2025-10-31');

    // --- Geographic coordinates (Flint city bounds) ---
    const lat = 42.95 + rand() * (43.07 - 42.95);
    const lng = -83.78 + rand() * (-83.65 - (-83.78));

    // --- Communications ---
    const {
      comms: communications,
      compliance1stAttempt,
      compliance2ndAttempt,
      lastContactDate,
    } = buildCommunications(rand, programType, enforcementLevel, dateSold);

    // --- Proof of investment (set for some compliant properties) ---
    const dateProofOfInvestProvided =
      enforcementLevel === 0 && rand() < 0.35
        ? addDays(dateSold, 100 + Math.floor(rand() * 150))
        : null;

    // --- Base property (shared across all programs) ---
    const property = {
      id,
      parcelId,
      address,
      buyerName,
      buyerEmail,
      organization: '',
      programType,
      dateSold,
      offerType: 'Cash',
      purchaseType: '',

      // Compliance tracking
      dateProofOfInvestProvided,
      compliance1stAttempt,
      compliance2ndAttempt,
      lastContactDate,
      enforcementLevel,

      // Geographic
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),

      // Communications
      communications,
    };

    // --- Program-specific fields ---
    switch (programType) {
      case PROGRAM_TYPES.FEATURED: {
        const featured = buildFeaturedFields(rand, dateSold, enforcementLevel);
        Object.assign(property, featured);
        break;
      }

      case PROGRAM_TYPES.R4R: {
        const r4r = buildR4RFields(rand, dateSold, enforcementLevel);
        Object.assign(property, r4r);
        break;
      }

      case PROGRAM_TYPES.DEMO: {
        const demo = buildDemoFields(rand, dateSold, enforcementLevel);
        Object.assign(property, demo);
        break;
      }

      case PROGRAM_TYPES.VIP: {
        const vip = buildVIPFields(rand, dateSold, enforcementLevel);
        Object.assign(property, vip);
        break;
      }
    }

    properties.push(property);
  }

  return properties;
}

export default generateDemoProperties;
