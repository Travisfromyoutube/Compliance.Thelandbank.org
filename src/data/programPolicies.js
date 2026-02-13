/**
 * GCLBA Program Policies - Real data sourced from thelandbank.org
 *
 * Single source of truth for program descriptions, buyer requirements,
 * and compliance summaries displayed across the portal.
 */

export const PROGRAM_POLICIES = {
  FeaturedHomes: {
    label: 'Featured Homes',
    tagline: 'Move-in ready homes at affordable prices',
    description:
      'Featured Homes are properties in conditions that allow them to be immediately available for sale. These homes include new kitchens, new bathrooms, new energy-efficient appliances, security systems, low monthly payments, and low utility costs. The Land Bank holds open houses weekly - interested parties can show up, view the home, and make an offer on the spot.',
    purchaseProcess: [
      'Attend a scheduled open house (bring photo ID).',
      'Check in with the Land Bank representative and sign a liability release.',
      'View the property; obtain an offer sheet from the Land Bank employee if interested.',
      'Submit your Highest & Best offer by fax (810-257-3090), email (offers@thelandbank.org), or drop box by the stated deadline.',
      'Include all required documentation - incomplete offers will not be accepted.',
      'If accepted, closing must occur within 21 days.',
    ],
    eligibility: [
      'Must attend the open house in person - offers are only accepted from attendees.',
      'Must provide proof of income with offer.',
      'Housing expenses must not exceed 30% of take-home income (payment + taxes + water + utilities).',
      'No delinquent property taxes or property tax foreclosure within the last 5 years.',
      'Must intend to use the home as a primary residence.',
      'The Land Bank reserves the right to refuse any and all offers.',
    ],
    landContract: {
      available: true,
      details: [
        'Available only for primary-residence purchases.',
        'Interest rate: 7%.',
        'Term: varies by amount, maximum 5 years.',
        'Minimum down payment: 10% or $1,000, whichever is greater.',
        'Proof of available funds for down payment required with offer.',
        'Purchaser is responsible for all property taxes and assessments from the day the land contract is executed.',
      ],
    },
    homeownerEducation: {
      required: true,
      details:
        'All land contract buyers must complete homebuyer education through a MSHDA- or HUD-approved housing counselor before closing.',
      providers: [
        { name: 'Metro Community Development', phone: '810-620-1737 / 810-620-1717', note: '$25 workshop fee; up to $500 down payment assistance available' },
        { name: 'Genesee County Habitat for Humanity', phone: '810-766-9089', url: 'https://www.geneseehabitat.org/homebuyer-education.html' },
        { name: 'Fannie Mae (online, free)', url: 'https://www.fanniemae.com/education', note: '3–4 hours, available in English and Spanish' },
      ],
    },
    complianceAfterPurchase:
      'Buyers must submit monthly progress updates showing that the property is being maintained and improved. Updates include photos of all major areas and any relevant documentation such as permits and contractor agreements.',
    offerMethod: 'Highest & Best - one opportunity per party to make an offer.',
    contactEmail: 'offers@thelandbank.org',
    contactFax: '810-257-3090',
  },

  Ready4Rehab: {
    label: 'Ready for Rehab',
    tagline: 'Affordable homes in need of renovation',
    description:
      'Ready for Rehab homes are properties in poor or fair condition, sold as-is and often in need of significant repair and improvement. These are ideal for buyers ready to invest in renovations. The Land Bank holds open houses - no appointment necessary.',
    purchaseProcess: [
      'Attend a scheduled open house (bring photo ID, no appointment needed).',
      'Check in with the Land Bank representative and sign a liability release.',
      'View the property; obtain an offer sheet from the Land Bank employee if interested.',
      'Gather proof of funds/income as detailed on the form.',
      'Submit your Highest & Best offer by fax (810-257-3090), email (offers@thelandbank.org), or drop box by the stated deadline.',
      'Include all required documentation - incomplete or late offers will not be considered.',
    ],
    eligibility: [
      'Must attend the open house in person - offers are only accepted from attendees.',
      'GCLBA staff review renovation cost estimates, proof of adequate funding, and documentation of previous investment in Land Bank properties.',
      'No delinquent property taxes or property tax foreclosure within the last 5 years.',
      'Having the highest offer does not guarantee acceptance.',
      'The Land Bank reserves the right to refuse any and all offers.',
    ],
    landContract: {
      available: false,
      details: ['Land contracts are not available for Ready for Rehab properties. Cash or independent financing only.'],
    },
    homeownerEducation: {
      required: false,
      details: 'Not required for Ready for Rehab purchases, but recommended.',
      providers: [],
    },
    complianceAfterPurchase:
      'Buyers must submit monthly progress updates demonstrating active renovation. Updates include photos of all major areas, permits (if applicable), and contractor agreements. Properties on the local condemnation list require permits and inspections to clear violations.',
    specialNotes: [
      'Houses are sold as-is.',
      'Many properties are on the local unit of government condemnation list - permits and inspections will be required to clear violations.',
      'Refer to the Land Bank Renovation Cost Guide for typical estimated repair costs.',
    ],
    offerMethod: 'Highest & Best - one opportunity per party to make an offer.',
    contactEmail: 'offers@thelandbank.org',
    contactFax: '810-257-3090',
  },

  VIP: {
    label: 'VIP Spotlight',
    tagline: 'Very Interesting Properties - unique reinvestment opportunities',
    description:
      'VIP Spotlight properties present unique opportunities to reinvest in the community. The Land Bank welcomes new and innovative plans for these remarkable properties. These are often larger-scale or distinctive properties that require a proposal-based review rather than a simple offer.',
    purchaseProcess: [
      'Attend a scheduled open house to view the property.',
      'Prepare a full proposal: development/renovation plans, cost estimates, proof of funds/financing.',
      'Answer all questions in the Proposal Guidelines (Residential or Commercial).',
      'Submit your proposal by email (offers@thelandbank.org), fax (810-257-3090), or drop box.',
      'Land Bank staff review proposals using a scoring criteria framework.',
    ],
    eligibility: [
      'Open to individuals, developers, and businesses with viable plans.',
      'Proposals are scored on: Price, Feasibility, Experience, Financing, Neighborhood Benefit, and use of Local Individuals/Businesses.',
      'The Land Bank reserves the right to refuse any and all proposals.',
    ],
    scoringCriteria: [
      'Price offered',
      'Feasibility of proposed project',
      'Applicant experience',
      'Financing / proof of funds',
      'Neighborhood benefit',
      'Use of local individuals and businesses',
    ],
    proposalGuidelines: {
      residential: 'https://www.thelandbank.org/downloads/residenital_requirments.pdf',
      commercial: 'https://www.thelandbank.org/downloads/commercial_requirments.pdf',
    },
    resources: [
      { name: 'City of Flint Building & Safety', url: 'https://www.cityofflint.com/building-safety-inspections/' },
      { name: 'City of Flint Planning & Zoning', url: 'https://www.cityofflint.com/planning-and-zoning/' },
      { name: 'LISC Flint', url: 'https://www.lisc.org/michigan/' },
      { name: 'Flint Property Portal', url: 'https://flintpropertyportal.com/' },
    ],
    landContract: {
      available: false,
      details: ['VIP properties require independent financing or cash.'],
    },
    homeownerEducation: {
      required: false,
      details: 'Not required for VIP purchases.',
      providers: [],
    },
    complianceAfterPurchase:
      'VIP buyers submit quarterly progress reports demonstrating progress against their approved development plan. Updates include exterior photos and proof of current insurance.',
    offerMethod: 'Proposal-based - scored by Land Bank staff using published criteria.',
    contactEmail: 'offers@thelandbank.org',
    contactFax: '810-257-3090',
  },

  Demolition: {
    label: 'Demolition',
    tagline: 'Structures approved for safe removal',
    description:
      'The Land Bank demolishes blighted structures that have deteriorated beyond repair. Demolition follows strict federal environmental clean-up standards including asbestos and hazardous material removal, dust control, advance neighbor notification, and contractor accountability.',
    complianceAfterPurchase:
      'Demolition buyers must submit milestone-based reports including site photos (before, during, after), contractor agreements, and disposal receipts. There is no grace period - documentation is due on the stated deadlines.',
    specialNotes: [
      'All demolitions must comply with federal and state environmental requirements.',
      'Contractors must remove asbestos and hazardous materials prior to demolition.',
      'Advance notice via door hangers is required at least one week prior.',
      'Dutch White Clover is planted after demolition to reduce maintenance and support pollinators.',
    ],
    offerMethod: 'Application-based.',
    contactEmail: 'offers@thelandbank.org',
    contactFax: '810-257-3090',
  },
};

/**
 * General policies that apply across all programs.
 */
export const GENERAL_POLICIES = {
  fairHousing:
    'The Genesee County Land Bank is an equal opportunity provider and employer. The GCLBA does not discriminate on the basis of race, color, national origin, age, or handicap.',
  mission:
    "The Land Bank's mission is to restore value to the community by acquiring, developing and selling vacant and abandoned properties in cooperation with stakeholders who value responsible land ownership.",
  officeAddress: '452 S. Saginaw Street, 2nd Floor, Flint, Michigan 48502',
  phone: '810-257-3088',
  fax: '810-257-3090',
  offersEmail: 'offers@thelandbank.org',
  website: 'https://www.thelandbank.org',
  closingDeadline: '21 days from offer acceptance (Featured Homes)',
  taxForeclosureDisqualification: 'Applicants with delinquent property taxes or tax foreclosure in the last 5 years are disqualified.',
};

/**
 * Enforcement levels - graduated compliance for all programs.
 * Used by ComplianceOverview.jsx
 */
export const ENFORCEMENT_LEVELS = [
  {
    level: 0,
    label: 'Compliant',
    desc: 'You are meeting all program requirements. No action needed.',
    variant: 'success',
  },
  {
    level: 1,
    label: 'Notice & Technical Assistance',
    desc: 'The Land Bank will contact you to offer support and request an update on your progress.',
    days: '0–30 days past deadline',
    variant: 'info',
  },
  {
    level: 2,
    label: 'Formal Warning',
    desc: 'A formal warning letter will be issued requiring a response within the stated timeframe.',
    days: '31–60 days past deadline',
    variant: 'warning',
  },
  {
    level: 3,
    label: 'Default Notice',
    desc: 'Official default proceedings may begin. You will receive a written default notice.',
    days: '61–90 days past deadline',
    variant: 'warning',
  },
  {
    level: 4,
    label: 'Legal Remedies',
    desc: 'The Land Bank may pursue legal remedies, which can include property recovery.',
    days: '91+ days past deadline',
    variant: 'danger',
  },
];
