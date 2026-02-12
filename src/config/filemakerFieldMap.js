/**
 * FileMaker ↔ Portal field mapping configuration.
 *
 * This is the single source of truth for translating between Prisma/portal
 * field names and the actual FileMaker layout field names.
 *
 * Mapping format: { portalField: 'FM_FieldName' }
 *
 * ── Field name sources ──────────────────────────────────────
 * ✅ CONFIRMED — Visible on GCLBA "PARC - Form" layout screenshots (30,061 records)
 * 🔍 TBD       — Not visible in screenshots; likely on Sales/Maint./Planning/
 *                Inspections tabs. Run GET /api/filemaker?action=status&meta=true
 *                with real credentials to discover actual names.
 *
 * Last updated: 2026-02-11 from GCLBA FM screenshots
 */

/* ── Property fields (PARC - Form layout) ─────────────────── */

export const PROPERTY_FIELD_MAP = {
  // ✅ Identifiers — visible on main form
  parcelId:              'Parc ID',               // ✅ Top of form: "4635457003"
  address:               'Address',               // ✅ "3618 BURGESS ST, FLINT, MI 48504"

  // ✅ Program & sale info — visible on main form + buyer portal section
  programType:           'Sales Disposition',      // ✅ Checkbox group: Featured, R4R, VIP, Demo, etc.
  dateSold:              'Date Sold',              // ✅ Buyer portal section at bottom
  offerType:             'Sold Auction',           // ✅ "LBA - NO Min"
  purchaseType:          'Purchase Cat',           // ✅ "Purchase Cat" column in buyer section

  // ✅ Additional property metadata — visible on main form
  foreclosureYear:       'Foreclosure Year',       // ✅ Year field (e.g. "2015")
  propertyClass:         'Property Class',         // ✅ "Resi / 401 / Residential With Structure"
  soldStatus:            'Sold Status',            // ✅ Radio: L, LC, P, Y
  gclbOwned:             'GCLB Owned',             // ✅ Yes/No field
  flintAreaName:         'Flint Area Name',        // ✅ "Green Neighborhood"
  minimumBid:            'Minimum Bid',            // ✅ Dollar amount: "$0.00"
  category:              'Category',               // ✅ "Demo - Removed Sold"

  // ✅ Survey data — visible in Survey Data section
  sev:                   'SEV',                    // ✅ State Equalized Value (assessment)
  interiorCondition:     'interior condition',     // ✅ Survey field
  fireDamage:            'fire_damage',            // ✅ Survey field
  occupancyStatus:       'occupancy_status',       // ✅ Survey field
  overallCondition:      'LB_Overall condition',   // ✅ Survey field

  // 🔍 Compliance dates — likely on Sales or Planning tab (not visible in screenshots)
  occupancyDeadline:     'TBD_Occupancy_Deadline',       // 🔍 Check Sales tab
  insuranceDueDate:      'TBD_Insurance_Due_Date',       // 🔍 Check Sales tab
  insuranceReceived:     'TBD_Insurance_Received',       // 🔍 Check Sales tab
  occupancyEstablished:  'TBD_Occupancy_Established',    // 🔍 Check Sales tab
  minimumHoldExpiry:     'TBD_Minimum_Hold_Expiry',      // 🔍 Check Sales tab

  // 🔍 Rehab fields — likely on Maint. or Planning tab
  dateProofOfInvestProvided: 'TBD_Date_Proof_Investment',    // 🔍 Check Maint. tab
  compliance1stAttempt:      'TBD_Compliance_1st_Attempt',   // 🔍 Check Maint. or Inspections tab
  compliance2ndAttempt:      'TBD_Compliance_2nd_Attempt',   // 🔍 Check Maint. or Inspections tab
  lastContactDate:           'TBD_Last_Contact_Date',        // 🔍 Check Sales tab
  scopeOfWorkApproved:       'TBD_Scope_Work_Approved',      // 🔍 Check Planning tab
  buildingPermitObtained:    'TBD_Building_Permit_Obtained', // 🔍 Check Planning tab
  rehabDeadline:             'TBD_Rehab_Deadline',           // 🔍 Check Planning tab
  percentComplete:           'TBD_Percent_Complete',         // 🔍 Check Maint. tab

  // 🔍 Demo fields — likely on Maint. tab
  demoFinalCertDate:     'TBD_Demo_Final_Cert_Date',     // 🔍 Check Maint. tab

  // 🔍 Bond fields
  bondRequired:          'TBD_Bond_Required',             // 🔍 Check Finance tab
  bondAmount:            'TBD_Bond_Amount',               // 🔍 Check Finance tab

  // 🔍 VIP
  complianceType:        'TBD_Compliance_Type',           // 🔍 "Renovation" or "New Build"

  // 🔍 LISC
  referredToLISC:        'TBD_Referred_To_LISC',          // 🔍 Check Sales tab
  liscRecommendReceived: 'TBD_LISC_Recommend_Received',   // 🔍 Check Sales tab
  liscRecommendSale:     'TBD_LISC_Recommend_Sale',       // 🔍 Check Sales tab

  // 🔍 Enforcement
  enforcementLevel:      'TBD_Enforcement_Level',         // 🔍 Check Inspections or Reports tab
  status:                'Status',                        // ✅ Buyer portal "Status" column
};

/* ── Buyer fields ───────────────────────────────────────────
 * In GCLBA's FM, buyers are a PORTAL (related records) on the
 * property layout — not a separate layout. The buyer section at
 * the bottom of "PARC - Form" shows: Name, Organization,
 * Co-Applicant, Interest Type, Status, Top Note, Closing, etc.
 *
 * FM uses a single "Name" field (not separate first/last).
 * The fromFMBuyer() helper below handles splitting.
 * ─────────────────────────────────────────────────────────── */

export const BUYER_FIELD_MAP = {
  fullName:      'Name',                // ✅ Combined name field in buyer portal
  organization:  'Organization',        // ✅ Buyer portal section
  coApplicant:   'Co-Applicant',        // ✅ Buyer portal section
  interestType:  'Interest Type',       // ✅ Buyer portal section
  dateReceived:  'Date Rcd',            // ✅ Buyer portal section
  closing:       'Closing',             // ✅ Buyer portal section
  email:         'TBD_Buyer_Email',     // 🔍 Not visible — ask Lucille
  phone:         'TBD_Buyer_Phone',     // 🔍 Not visible — ask Lucille
};

/* ── Communication fields ───────────────────────────────────
 * These are for a dedicated FM communication log layout.
 * Layout likely needs to be created by Lucille/consultant.
 * ─────────────────────────────────────────────────────────── */

export const COMMUNICATION_FIELD_MAP = {
  action:         'Communication_Action',     // 🔍 Placeholder
  channel:        'Communication_Channel',    // 🔍 Placeholder
  recipientEmail: 'Recipient_Email',          // 🔍 Placeholder
  subject:        'Email_Subject',            // 🔍 Placeholder
  bodyText:       'Email_Body',               // 🔍 Placeholder
  status:         'Communication_Status',     // 🔍 Placeholder
  sentAt:         'Date_Sent',                // 🔍 Placeholder
  templateName:   'Template_Name',            // 🔍 Placeholder
};

/* ── Submission fields ──────────────────────────────────────
 * These are for a dedicated FM submissions layout.
 * Layout likely needs to be created by Lucille/consultant.
 * ─────────────────────────────────────────────────────────── */

export const SUBMISSION_FIELD_MAP = {
  type:            'Submission_Type',         // 🔍 Placeholder
  status:          'Submission_Status',       // 🔍 Placeholder
  confirmationId:  'Confirmation_ID',         // 🔍 Placeholder
  createdAt:       'Date_Submitted',          // 🔍 Placeholder
};

/* ── Sales Disposition → Program Type mapping ──────────────
 * FM uses checkboxes for "Sales Disposition" (Featured, R4R,
 * VIP, Demo, etc.). Portal uses single programType string.
 * This map converts between them.
 * ─────────────────────────────────────────────────────────── */

export const SALES_DISPOSITION_MAP = {
  'Featured':     'FeaturedHomes',
  'FH adj VL':    'FeaturedHomes',     // Featured Homes adjacent vacant lot
  'R4R':          'Ready4Rehab',
  'R4R adj VL':   'Ready4Rehab',       // R4R adjacent vacant lot
  'Demo':         'Demolition',
  'VIP':          'VIP',
  'Comm/I':       'Commercial',        // Commercial/Industrial
  'Dev Lot':      'DeveloperLot',
  'RealDR':       'RealDR',
  'Occupant':     'Occupant',
  'Vacant Land':  'VacantLand',
  'Realtor':      'Realtor',
};

/**
 * Convert FM "Sales Disposition" checkbox value → portal programType.
 * FM stores checkbox values as return-delimited strings.
 * We pick the first recognized program type.
 *
 * @param {string|null|undefined} fmValue — Raw FM checkbox value (newline-delimited)
 * @returns {string|null} A SALES_DISPOSITION_MAP value (e.g. 'FeaturedHomes'),
 *   the raw first checkbox value if unrecognized, or null if input is empty.
 */
export function salesDispositionToProgram(fmValue) {
  if (!fmValue) return null;
  // FM checkbox values are newline-separated
  const values = String(fmValue).split(/[\r\n]+/).map((v) => v.trim()).filter(Boolean);
  for (const v of values) {
    if (SALES_DISPOSITION_MAP[v]) return SALES_DISPOSITION_MAP[v];
  }
  return values[0] || null; // fallback to raw value
}

/**
 * Convert portal programType → FM Sales Disposition value.
 */
export function programToSalesDisposition(programType) {
  // Reverse lookup
  for (const [fmVal, portalVal] of Object.entries(SALES_DISPOSITION_MAP)) {
    if (portalVal === programType) return fmVal;
  }
  return programType || '';
}

/* ── FM layout names (env-configurable) ─────────────────── */

export function getLayouts() {
  return {
    properties:     process.env.FM_LAYOUT_PROPERTIES     || 'PARC - Form',
    buyers:         process.env.FM_LAYOUT_BUYERS          || 'PARC - Form',   // buyers are a portal on property layout
    submissions:    process.env.FM_LAYOUT_SUBMISSIONS     || 'BuyerSubmissions',
    communications: process.env.FM_LAYOUT_COMMUNICATIONS  || 'CommunicationLog',
  };
}

/* ── Converters ─────────────────────────────────────────── */

/**
 * FM date format is MM/DD/YYYY for find queries.
 * Portal uses ISO YYYY-MM-DD or Date objects.
 */
function toFMDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function fromFMDate(value) {
  if (!value) return null;
  // FM returns dates as strings — could be MM/DD/YYYY or ISO
  if (typeof value === 'string' && value.includes('/')) {
    const [m, d, y] = value.split('/');
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
  }
  return new Date(value);
}

function toFMBoolean(value) {
  return value ? 1 : 0;
}

function fromFMBoolean(value) {
  return value === 1 || value === '1' || value === 'Yes' || value === true;
}

/**
 * Split a full name string into firstName and lastName.
 * Handles "LAST, FIRST" and "FIRST LAST" patterns.
 */
export function splitFMName(fullName) {
  if (!fullName) return { firstName: 'Unknown', lastName: '' };
  const trimmed = String(fullName).trim();
  if (!trimmed) return { firstName: 'Unknown', lastName: '' };

  // FM often stores as "Last, First"
  if (trimmed.includes(',')) {
    const [last, ...rest] = trimmed.split(',').map((s) => s.trim());
    return { firstName: rest.join(' ') || 'Unknown', lastName: last };
  }

  // Otherwise "First Last"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Join firstName + lastName into a single name for FM.
 */
export function joinNameForFM(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

/** Date-type fields in the property map */
const DATE_FIELDS = new Set([
  'dateSold', 'occupancyDeadline', 'insuranceDueDate', 'minimumHoldExpiry',
  'dateProofOfInvestProvided', 'compliance1stAttempt', 'compliance2ndAttempt',
  'lastContactDate', 'rehabDeadline', 'demoFinalCertDate',
  'referredToLISC', 'liscRecommendReceived', 'liscRecommendSale',
]);

/** Date-type fields in the buyer map */
const BUYER_DATE_FIELDS = new Set([
  'dateReceived', 'closing',
]);

/** Boolean-type fields in the property map */
const BOOLEAN_FIELDS = new Set([
  'insuranceReceived', 'occupancyEstablished', 'scopeOfWorkApproved',
  'buildingPermitObtained', 'bondRequired', 'gclbOwned',
]);

/** Numeric fields */
const NUMERIC_FIELDS = new Set([
  'enforcementLevel', 'percentComplete', 'foreclosureYear',
]);

/** Currency fields */
const CURRENCY_FIELDS = new Set([
  'minimumBid', 'bondAmount', 'sev',
]);

/**
 * Convert a portal property object → FM fieldData object.
 * Only includes fields that have values (skips null/undefined).
 * Handles programType → Sales Disposition conversion.
 */
export function toFM(portalObj, fieldMap = PROPERTY_FIELD_MAP) {
  const fm = {};

  for (const [portalKey, fmKey] of Object.entries(fieldMap)) {
    // Skip TBD fields — they can't be written to FM yet
    if (fmKey.startsWith('TBD_')) continue;

    const value = portalObj[portalKey];
    if (value === undefined) continue;

    // Special handling for programType → Sales Disposition
    if (portalKey === 'programType' && fieldMap === PROPERTY_FIELD_MAP) {
      fm[fmKey] = programToSalesDisposition(value);
      continue;
    }

    if (DATE_FIELDS.has(portalKey) || BUYER_DATE_FIELDS.has(portalKey)) {
      fm[fmKey] = toFMDate(value);
    } else if (BOOLEAN_FIELDS.has(portalKey)) {
      fm[fmKey] = toFMBoolean(value);
    } else if (CURRENCY_FIELDS.has(portalKey)) {
      fm[fmKey] = typeof value === 'number' ? value : parseFloat(value) || 0;
    } else {
      fm[fmKey] = value ?? '';
    }
  }

  return fm;
}

/**
 * Convert an FM record's fieldData → portal object.
 * Reverses the field map and applies type conversions.
 * Handles Sales Disposition → programType and Name → first/last.
 */
export function fromFM(fmFieldData, fieldMap = PROPERTY_FIELD_MAP) {
  // Build reverse map: FM_FieldName → portalKey
  const reverseMap = {};
  for (const [portalKey, fmKey] of Object.entries(fieldMap)) {
    reverseMap[fmKey] = portalKey;
  }

  const portal = {};

  for (const [fmKey, value] of Object.entries(fmFieldData)) {
    const portalKey = reverseMap[fmKey];
    if (!portalKey) continue; // skip unmapped FM fields

    // Special handling for Sales Disposition → programType
    if (portalKey === 'programType' && fieldMap === PROPERTY_FIELD_MAP) {
      portal[portalKey] = salesDispositionToProgram(value);
      continue;
    }

    // Special handling for buyer Name → fullName (split in calling code)
    if (portalKey === 'fullName' && fieldMap === BUYER_FIELD_MAP) {
      portal.fullName = value || '';
      const { firstName, lastName } = splitFMName(value);
      portal.firstName = firstName;
      portal.lastName = lastName;
      continue;
    }

    if (DATE_FIELDS.has(portalKey) || BUYER_DATE_FIELDS.has(portalKey)) {
      portal[portalKey] = fromFMDate(value);
    } else if (BOOLEAN_FIELDS.has(portalKey)) {
      portal[portalKey] = fromFMBoolean(value);
    } else if (NUMERIC_FIELDS.has(portalKey)) {
      portal[portalKey] = parseInt(value, 10) || 0;
    } else if (CURRENCY_FIELDS.has(portalKey)) {
      portal[portalKey] = parseFloat(value) || 0;
    } else {
      portal[portalKey] = value || null;
    }
  }

  return portal;
}
