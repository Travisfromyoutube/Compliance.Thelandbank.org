/**
 * Schedule-engine email templates.
 *
 * Each template targets one or more program types and contains
 * variants keyed by action type (ATTEMPT_1, ATTEMPT_2, WARNING, DEFAULT_NOTICE).
 *
 * Variables:  {BuyerName}  {PropertyAddress}  {DueDate}
 *             {DaysOverdue}  {ProgramType}  {BuyerEmail}
 */

export const ACTION_LABELS = {
  ATTEMPT_1:      '1st Attempt',
  ATTEMPT_2:      '2nd Attempt',
  WARNING:        'Warning',
  DEFAULT_NOTICE: 'Default Notice',
  NOT_DUE_YET:    'Not Due Yet',
};

export const TEMPLATE_VARIABLES = [
  '{BuyerName}',
  '{PropertyAddress}',
  '{DueDate}',
  '{DaysOverdue}',
  '{ProgramType}',
  '{BuyerEmail}',
];

let _nextId = 100;

export const DEFAULT_TEMPLATES = [
  {
    id: 'monthly-compliance',
    name: 'Monthly Compliance Update',
    programTypes: ['FeaturedHomes', 'Ready4Rehab'],
    variants: {
      ATTEMPT_1: {
        subject: 'Compliance check-in for {PropertyAddress}',
        body: `Hi {BuyerName},

This is a friendly check-in regarding your property at {PropertyAddress}.

As part of the {ProgramType} program, you are required to submit monthly progress updates showing that the property is being maintained and improved per your purchase agreement with the Genesee County Land Bank Authority. Your compliance update was due on {DueDate}.

Please submit your required photos and documents through the Buyer Portal at your earliest convenience.

Thank you,
GCLBA Compliance Team`,
      },
      ATTEMPT_2: {
        subject: 'Second request: Compliance update for {PropertyAddress}',
        body: `Hi {BuyerName},

This is a follow-up regarding the compliance update for your property at {PropertyAddress}.

We previously reached out on your first due date and have not yet received your submission. Your update is now {DaysOverdue} days overdue.

Please submit your photos and documents as soon as possible to avoid further enforcement action.

Thank you,
GCLBA Compliance Team`,
      },
      WARNING: {
        subject: 'Action required: Compliance warning for {PropertyAddress}',
        body: `Dear {BuyerName},

This letter serves as a formal warning regarding the property at {PropertyAddress}.

Your compliance update is {DaysOverdue} days past due. Continued non-compliance may result in default proceedings under your {ProgramType} agreement.

Please contact our office immediately to discuss your compliance status and submit the required documentation.

Sincerely,
GCLBA Compliance Team`,
      },
      DEFAULT_NOTICE: {
        subject: 'Default Notice: {PropertyAddress}',
        body: `Dear {BuyerName},

NOTICE OF DEFAULT

Property: {PropertyAddress}
Program: {ProgramType}
Days Overdue: {DaysOverdue}

You are hereby notified that you are in default of your compliance obligations under the {ProgramType} program. Your required submission was due on {DueDate}.

Failure to respond within 10 business days may result in legal remedies as outlined in your purchase agreement.

Per GCLBA Residential Land Transfer Policies, the Land Bank may pursue property recovery and legal remedies for continued non-compliance.

Please contact our office immediately.

GCLBA Compliance Division`,
      },
    },
  },

  {
    id: 'demo-compliance',
    name: 'Demolition Compliance',
    programTypes: ['Demolition'],
    variants: {
      ATTEMPT_1: {
        subject: 'Demolition progress update needed: {PropertyAddress}',
        body: `Hi {BuyerName},

We're checking in on the demolition progress for {PropertyAddress}.

Per your agreement, documentation was due by {DueDate}. Please submit your site photos (before, during, after) and contractor documentation through the Buyer Portal.

Thank you,
GCLBA Compliance Team`,
      },
      WARNING: {
        subject: 'Warning: Demolition compliance overdue for {PropertyAddress}',
        body: `Dear {BuyerName},

Your demolition compliance documentation for {PropertyAddress} is now {DaysOverdue} days overdue.

Required items: site photos, contractor agreement, and disposal receipt.

Please submit immediately to avoid default proceedings.

Sincerely,
GCLBA Compliance Team`,
      },
      DEFAULT_NOTICE: {
        subject: 'Default Notice: Demolition non-compliance - {PropertyAddress}',
        body: `Dear {BuyerName},

NOTICE OF DEFAULT - DEMOLITION PROGRAM

Property: {PropertyAddress}
Days Overdue: {DaysOverdue}

You are in default of your demolition compliance obligations. Required documentation was due on {DueDate}.

Immediate action is required. Please contact our office.

GCLBA Compliance Division`,
      },
    },
  },

  {
    id: 'vip-compliance',
    name: 'VIP Quarterly Check-In',
    programTypes: ['VIP'],
    variants: {
      ATTEMPT_1: {
        subject: 'VIP quarterly check-in: {PropertyAddress}',
        body: `Hi {BuyerName},

It's time for your quarterly VIP compliance check-in for {PropertyAddress}.

As a VIP Spotlight buyer, you are required to submit quarterly progress reports against your approved development plan. Please submit your exterior photos and current insurance documentation through the Buyer Portal by {DueDate}.

Thank you,
GCLBA Compliance Team`,
      },
      ATTEMPT_2: {
        subject: 'Second request: VIP check-in for {PropertyAddress}',
        body: `Hi {BuyerName},

We haven't received your quarterly VIP compliance update for {PropertyAddress}. Your submission is now {DaysOverdue} days overdue.

Please submit your photos and insurance proof as soon as possible.

Thank you,
GCLBA Compliance Team`,
      },
      WARNING: {
        subject: 'Warning: VIP compliance overdue - {PropertyAddress}',
        body: `Dear {BuyerName},

Your VIP compliance documentation for {PropertyAddress} is {DaysOverdue} days past due.

Continued non-compliance may result in default proceedings. Please contact our office and submit the required documentation immediately.

Sincerely,
GCLBA Compliance Team`,
      },
      DEFAULT_NOTICE: {
        subject: 'Default Notice: VIP program - {PropertyAddress}',
        body: `Dear {BuyerName},

NOTICE OF DEFAULT - VIP PROGRAM

Property: {PropertyAddress}
Days Overdue: {DaysOverdue}

You are in default of your VIP compliance obligations. Documentation was due on {DueDate}.

Please contact our office immediately.

GCLBA Compliance Division`,
      },
    },
  },
];

/** Generate a unique template ID */
export function generateTemplateId() {
  return `template-${++_nextId}`;
}
