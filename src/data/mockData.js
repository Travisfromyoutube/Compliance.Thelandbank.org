// Mock data modeled on actual FileMaker field structure from GCLBA Compliance SOP
// Programs: Featured Homes, R4R (Ready 4 Rehab), Demo (Demolition), VIP
import { generateDemoProperties } from './mockDataGenerator';

export const PROGRAM_TYPES = {
  FEATURED: 'Featured Homes',
  R4R: 'Ready4Rehab',
  DEMO: 'Demolition',
  VIP: 'VIP'
};

/** Admin-facing display names matching FileMaker labeling conventions */
export const PROGRAM_DISPLAY_NAMES = {
  'Featured Homes': 'Featured Homes',
  'Ready4Rehab': 'R4R (Ready for Rehab)',
  'Demolition': 'Demo',
  'VIP': 'VIP',
};

export const ENFORCEMENT_LEVELS = {
  COMPLIANT: { level: 0, label: 'Compliant', color: 'emerald', bgClass: 'bg-emerald-100 text-emerald-800' },
  LEVEL_1: { level: 1, label: 'Level 1 — Notice & Technical Assistance', color: 'yellow', bgClass: 'bg-yellow-100 text-yellow-800', daysRange: '0-30 days past deadline' },
  LEVEL_2: { level: 2, label: 'Level 2 — Formal Warning', color: 'orange', bgClass: 'bg-orange-100 text-orange-800', daysRange: '31-60 days past deadline' },
  LEVEL_3: { level: 3, label: 'Level 3 — Default Notice', color: 'red', bgClass: 'bg-red-100 text-red-800', daysRange: '61-90 days past deadline' },
  LEVEL_4: { level: 4, label: 'Level 4 — Legal Remedies', color: 'red', bgClass: 'bg-red-200 text-red-900', daysRange: '91+ days past deadline' }
};

export const COMPLIANCE_STATUSES = {
  ON_TRACK: 'On Track',
  DUE_SOON: 'Due Soon',
  OVERDUE: 'Overdue',
  COMPLETED: 'Completed',
  IN_CURE: 'In Cure Period',
  DEFAULT: 'In Default'
};

// Mock properties matching FileMaker CP layout fields
export const mockProperties = [
  {
    id: 'P001',
    parcelId: '4108454001',
    address: '2120 Sherff Pl, Flint, MI 48503',
    buyerName: 'Bruce Bernard Willis',
    availability: 'Sold',
    buyerEmail: '',
    organization: '',
    programType: PROGRAM_TYPES.FEATURED,
    dateSold: '2025-06-15',
    offerType: 'Cash',
    purchaseType: '',
    topNote: 'Cash',
    lat: 43.0059, lng: -83.6910,
    // Featured Homes specific fields (from SOP image10)
    dateProofOfInvestProvided: null,
    compliance1stAttempt: '2025-11-01',
    compliance2ndAttempt: null,
    // Compliance spec fields
    occupancyDeadline: '2025-09-13', // 90 days from sale
    insuranceDueDate: '2025-07-15', // 30 days from sale
    insuranceReceived: true,
    occupancyEstablished: 'No',
    minimumHoldExpiry: '2028-06-15', // 3 years
    // LISC fields from FileMaker
    referredToLISC: null,
    liscRecommendReceived: null,
    liscRecommendSale: null,
    // Status
    enforcementLevel: 1,
    communications: [
      { date: '2025-11-01', type: 'email', template: '1st Request for Proof of Renovations', status: 'sent' }
    ]
  },
  {
    id: 'P002',
    parcelId: '4011182022',
    address: '2742 Raskob St, Flint, MI 48504',
    buyerName: 'Srinivasu Angadala',
    buyerEmail: 'srinivasuang@yahoo.com',
    organization: '',
    programType: PROGRAM_TYPES.R4R,
    dateSold: '2025-03-10',
    offerType: 'Cash',
    purchaseType: '',
    lat: 43.0234, lng: -83.7321,
    // R4R specific fields
    dateProofOfInvestProvided: null,
    compliance1stAttempt: '2025-09-15',
    compliance2ndAttempt: '2025-11-20',
    // R4R milestones (12-month rehab timeline)
    scopeOfWorkApproved: true,
    buildingPermitObtained: true,
    rehabDeadline: '2026-03-10', // 12 months from sale
    percentComplete: 35,
    // Bond fields from FileMaker
    bondRequired: false,
    bondAmount: null,
    enforcementLevel: 2,
    communications: [
      { date: '2025-09-15', type: 'email', template: '1st Request for Proof of Renovations', status: 'sent' },
      { date: '2025-11-20', type: 'email', template: '2nd Request for Proof of Renovations', status: 'sent' }
    ]
  },
  {
    id: 'P003',
    parcelId: '4012478008',
    address: '224 W Second Ave, Flint, MI 48502',
    buyerName: 'Michael Torres',
    buyerEmail: 'mtorres@gmail.com',
    organization: '',
    programType: PROGRAM_TYPES.VIP,
    dateSold: '2024-10-25',
    offerType: 'Cash',
    purchaseType: '',
    topNote: 'Development Agreement - Renovation',
    lat: 43.0151, lng: -83.6886,
    complianceType: 'Renovation', // New Build or Renovation
    // VIP RC dates (from SOP image13 - auto-calculated from dateSold)
    rcDates: {
      RC15:  { due: '2024-11-09', completed: '2024-11-13' },
      RC45:  { due: '2024-12-09', completed: '2025-01-13' },
      RC90:  { due: '2025-01-23', completed: '2025-02-05' },
      RC135: { due: '2025-03-09', completed: '2025-07-23' },
      RC180: { due: '2025-04-23', completed: null },
      RC225: { due: '2025-06-07', completed: null },
      RC270: { due: '2025-07-27', completed: null },
      RC315: { due: '2025-09-05', completed: null },
      RC360: { due: '2025-10-20', completed: null }
    },
    // VIP checklists (from SOP image13)
    checkIn15Day: {
      propertyIsSecure: true,
      cleanedUp: true,
      lawnMowed: true
    },
    checkIn45Day: {
      beforePicturesProvided: true,
      permitsPulled: true,
      estimatesOrContractsProvided: false,
      estimatedDateOfCompletionGiven: false,
      waterUtilityActivated: false,
      electricUtilityActivated: false,
      gasUtilityActivated: true,
      lawnMowed: false,
      afterPicturesProvided: false
    },
    completionChecklist: {
      exteriorPhotos: { foundationToRoofRepaired: false, noBoardsOrBlight: false, landscapeMaintained: false },
      interiorPhotos: { bathroom: false, kitchen: false, waterHeater: false, furnace: false },
      allPermitsCompleted: false,
      cocOrCoo: false,
      lbaStaffInspectionSatisfied: false
    },
    enforcementLevel: 1,
    communications: [
      { date: '2025-04-25', type: 'email', template: 'VIP Compliance Check-In', status: 'sent' }
    ]
  },
  {
    id: 'P004',
    parcelId: '4003484004',
    address: '3429 Barth St, Flint, MI 48504',
    buyerName: 'Trina Townsend',
    buyerEmail: '',
    organization: '',
    programType: PROGRAM_TYPES.DEMO,
    dateSold: '2025-04-20',
    offerType: 'Cash',
    purchaseType: '',
    lat: 43.0412, lng: -83.7205,
    // Demo specific fields
    dateProofOfInvestProvided: null,
    demoFinalCertDate: null, // needs local gov sign-off
    compliance1stAttempt: '2025-10-20',
    compliance2ndAttempt: null,
    enforcementLevel: 1,
    communications: [
      { date: '2025-10-20', type: 'mail', template: 'Proof of Demo Investment', status: 'sent' }
    ]
  },
  {
    id: 'P005',
    parcelId: '4011278039',
    address: '1914 Barth St, Flint, MI 48504',
    buyerName: 'Lawrence Mays',
    buyerEmail: 'lmays8764@gmail.com',
    organization: '',
    programType: PROGRAM_TYPES.R4R,
    dateSold: '2025-01-15',
    offerType: 'Cash',
    purchaseType: '',
    lat: 43.0389, lng: -83.7198,
    dateProofOfInvestProvided: '2025-12-01',
    compliance1stAttempt: '2025-07-20',
    compliance2ndAttempt: null,
    scopeOfWorkApproved: true,
    buildingPermitObtained: true,
    rehabDeadline: '2026-01-15',
    percentComplete: 100,
    enforcementLevel: 0,
    communications: [
      { date: '2025-07-20', type: 'email', template: '1st Request for Proof of Renovations', status: 'sent' },
      { date: '2025-12-01', type: 'email', template: 'Compliance Completion Confirmation', status: 'sent' }
    ]
  },
  {
    id: 'P006',
    parcelId: '4024476002',
    address: '1325 Neubert Ave, Flint, MI 48507',
    buyerName: 'Nakia Crawford',
    buyerEmail: 'crawfordnikki2@gmail.com',
    organization: '',
    programType: PROGRAM_TYPES.FEATURED,
    dateSold: '2025-08-01',
    offerType: 'Cash',
    purchaseType: '',
    lat: 42.9712, lng: -83.6945,
    dateProofOfInvestProvided: null,
    compliance1stAttempt: null,
    compliance2ndAttempt: null,
    occupancyDeadline: '2025-10-30',
    insuranceDueDate: '2025-08-31',
    insuranceReceived: true,
    occupancyEstablished: 'Yes',
    minimumHoldExpiry: '2028-08-01',
    enforcementLevel: 0,
    communications: []
  },
  {
    id: 'P007',
    parcelId: '4625481001',
    address: '606 E Parkway Ave, Flint, MI 48503',
    buyerName: 'Leroy Bowling, Jr',
    buyerEmail: '',
    organization: '',
    programType: PROGRAM_TYPES.DEMO,
    dateSold: '2025-05-10',
    offerType: 'Cash',
    purchaseType: '',
    lat: 43.0023, lng: -83.6773,
    dateProofOfInvestProvided: null,
    demoFinalCertDate: '2025-11-15',
    compliance1stAttempt: '2025-11-01',
    compliance2ndAttempt: null,
    enforcementLevel: 0,
    communications: [
      { date: '2025-11-01', type: 'email', template: 'Proof of Demo Investment', status: 'sent' },
      { date: '2025-11-15', type: 'system', template: 'Demo Compliance Completed', status: 'logged' }
    ]
  },
  {
    id: 'P008',
    parcelId: '4104130036',
    address: '3121 Thom St, Flint, MI 48504',
    buyerName: 'Charles Chandler',
    buyerEmail: 'cchandler644632@gmail.com',
    organization: '',
    programType: PROGRAM_TYPES.R4R,
    dateSold: '2025-07-01',
    offerType: 'Cash',
    purchaseType: '',
    lat: 43.0345, lng: -83.7156,
    dateProofOfInvestProvided: null,
    compliance1stAttempt: '2026-01-05',
    compliance2ndAttempt: null,
    scopeOfWorkApproved: true,
    buildingPermitObtained: false,
    rehabDeadline: '2026-07-01',
    percentComplete: 10,
    enforcementLevel: 0,
    communications: [
      { date: '2026-01-05', type: 'email', template: '1st Request for Proof of Renovations', status: 'sent' }
    ]
  },
  {
    id: 'P009',
    parcelId: '4001253033',
    address: '209 E Jackson Ave, Flint, MI 48505',
    buyerName: 'Laquinda Mccraw',
    buyerEmail: '',
    organization: '',
    programType: PROGRAM_TYPES.VIP,
    dateSold: '2025-09-01',
    offerType: 'Cash',
    purchaseType: '',
    lat: 43.0478, lng: -83.6852,
    complianceType: 'New Build',
    rcDates: {
      RC15:  { due: '2025-09-16', completed: '2025-09-20' },
      RC45:  { due: '2025-10-16', completed: '2025-10-20' },
      RC90:  { due: '2025-11-30', completed: null },
      RC135: { due: '2026-01-14', completed: null },
      RC180: { due: '2026-02-28', completed: null },
      RC225: { due: '2026-04-14', completed: null },
      RC270: { due: '2026-05-29', completed: null },
      RC315: { due: '2026-07-13', completed: null },
      RC360: { due: '2026-08-27', completed: null }
    },
    checkIn15Day: { propertyIsSecure: true, cleanedUp: true, lawnMowed: true },
    checkIn45Day: {
      beforePicturesProvided: true,
      permitsPulled: false,
      estimatesOrContractsProvided: false,
      estimatedDateOfCompletionGiven: false,
      waterUtilityActivated: false,
      electricUtilityActivated: false,
      gasUtilityActivated: false,
      lawnMowed: true,
      afterPicturesProvided: false
    },
    completionChecklist: {
      exteriorPhotos: { foundationToRoofRepaired: false, noBoardsOrBlight: false, landscapeMaintained: false },
      interiorPhotos: { bathroom: false, kitchen: false, waterHeater: false, furnace: false },
      allPermitsCompleted: false,
      cocOrCoo: false,
      lbaStaffInspectionSatisfied: false
    },
    enforcementLevel: 0,
    communications: []
  },
  {
    id: 'P010',
    parcelId: '4014454026',
    address: '2606 Gibson St, Flint, MI 48503',
    buyerName: 'Sammy Laporta',
    buyerEmail: '',
    organization: '',
    availability: 'Under LC',
    programType: PROGRAM_TYPES.FEATURED,
    dateSold: '2025-02-20',
    offerType: 'Land Contract',
    purchaseType: '',
    lat: 43.0098, lng: -83.7034,
    dateProofOfInvestProvided: null,
    compliance1stAttempt: '2025-08-25',
    compliance2ndAttempt: '2025-10-30',
    occupancyDeadline: '2025-05-21',
    insuranceDueDate: '2025-03-22',
    insuranceReceived: false,
    occupancyEstablished: 'No',
    minimumHoldExpiry: '2028-02-20',
    enforcementLevel: 3,
    communications: [
      { date: '2025-08-25', type: 'email', template: '1st Request for Proof of Renovations', status: 'sent' },
      { date: '2025-10-30', type: 'email', template: '2nd Request for Proof of Renovations', status: 'sent' },
      { date: '2026-01-15', type: 'mail', template: 'Default Notice', status: 'sent' }
    ]
  }
];

// Merge hand-curated properties with generated demo data for 40+ total
const _handCuratedProperties = mockProperties;
const _generatedProperties = generateDemoProperties(30);

// Re-export merged array (hand-curated first, generated after)
export { _handCuratedProperties, _generatedProperties };
export const allProperties = [..._handCuratedProperties, ..._generatedProperties];

// Email templates matching SOP shared drive (k/Jennifer Riggs/Compliance/)
export const emailTemplates = [
  { id: 'rehab-1st', name: 'Request for Proof of Renovations', program: ['R4R', 'Featured Homes'], attempt: 1 },
  { id: 'rehab-2nd', name: '2nd Request for Proof of Renovations', program: ['R4R', 'Featured Homes'], attempt: 2 },
  { id: 'rehab-mail', name: 'Proof of Renovations — Mail', program: ['R4R', 'Featured Homes'], attempt: 1, mailOnly: true },
  { id: 'demo-proof', name: 'Proof of Demo Investment', program: ['Demolition'], attempt: 1 },
  { id: 'vip-checkin', name: 'VIP Compliance Check-In', program: ['VIP'], attempt: 1 },
  { id: 'level3-default', name: 'Default Notice', program: ['all'], attempt: 3 },
  { id: 'level4-legal', name: 'Legal Remedies Notification', program: ['all'], attempt: 4 }
];
