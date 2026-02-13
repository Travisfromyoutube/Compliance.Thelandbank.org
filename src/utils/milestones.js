// Feature 1.2: Automated Milestone Calculator
// Extends the VIP RC date pattern to all program types
// Feature 1.3: Enforcement Level Calculator

import { PROGRAM_TYPES, ENFORCEMENT_LEVELS } from '../data/mockData';

// Add days to a date
export const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Calculate days between two dates
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

// Days overdue (negative = not yet due)
export const daysOverdue = (dueDate) => {
  return daysBetween(dueDate, new Date().toISOString().split('T')[0]);
};

// Generate milestones based on program type and closing date
export const generateMilestones = (programType, dateSold) => {
  if (!dateSold) return [];

  const base = [
    { key: 'insurance', label: 'Insurance Proof Due', dueDate: addDays(dateSold, 30), category: 'documentation' }
  ];

  switch (programType) {
    case PROGRAM_TYPES.FEATURED:
      return [
        ...base,
        { key: 'occupancy', label: 'Occupancy Established', dueDate: addDays(dateSold, 90), category: 'occupancy' },
        { key: 'annual-1', label: 'Year 1 Annual Certification', dueDate: addDays(dateSold, 365), category: 'certification' },
        { key: 'annual-2', label: 'Year 2 Annual Certification', dueDate: addDays(dateSold, 730), category: 'certification' },
        { key: 'hold-expiry', label: 'Minimum Hold Period Ends', dueDate: addDays(dateSold, 1095), category: 'milestone' },
        { key: 'rofr-expiry', label: 'Right of First Refusal Ends', dueDate: addDays(dateSold, 1825), category: 'milestone' }
      ];

    case PROGRAM_TYPES.R4R:
      return [
        ...base,
        { key: 'permit', label: 'Building Permit Obtained', dueDate: addDays(dateSold, 90), category: 'mobilization' },
        { key: 'mobilization', label: 'Mobilization Complete', dueDate: addDays(dateSold, 90), category: 'mobilization' },
        { key: 'progress-1', label: 'First Progress Report', dueDate: addDays(dateSold, 90), category: 'reporting' },
        { key: 'inspect-25', label: '25% Completion Inspection', dueDate: addDays(dateSold, 120), category: 'inspection' },
        { key: 'inspect-50', label: '50% Completion Inspection', dueDate: addDays(dateSold, 180), category: 'inspection' },
        { key: 'inspect-75', label: '75% Completion Inspection', dueDate: addDays(dateSold, 270), category: 'inspection' },
        { key: 'rehab-complete', label: 'Rehabilitation Complete', dueDate: addDays(dateSold, 365), category: 'completion' },
        { key: 'coo', label: 'Certificate of Occupancy', dueDate: addDays(dateSold, 365), category: 'completion' },
        { key: 'move-in', label: 'Occupancy Established', dueDate: addDays(dateSold, 425), category: 'occupancy' },
        { key: 'hold-expiry', label: 'Minimum Hold Period Ends', dueDate: addDays(dateSold, 1460), category: 'milestone' }
      ];

    case PROGRAM_TYPES.DEMO:
      return [
        { key: 'demo-start', label: 'Demolition Commenced', dueDate: addDays(dateSold, 90), category: 'mobilization' },
        { key: 'demo-complete', label: 'Demolition Complete', dueDate: addDays(dateSold, 180), category: 'completion' },
        { key: 'demo-cert', label: 'Local Gov Final Certification', dueDate: addDays(dateSold, 210), category: 'certification' },
        { key: 'site-clear', label: 'Site Cleared & Graded', dueDate: addDays(dateSold, 240), category: 'completion' }
      ];

    case PROGRAM_TYPES.VIP:
      // VIP uses the RC date system from FileMaker
      return [
        { key: 'RC15', label: 'RC15 - 15-Day Check-In', dueDate: addDays(dateSold, 15), category: 'check-in' },
        { key: 'RC45', label: 'RC45 - 45-Day Check-In', dueDate: addDays(dateSold, 45), category: 'check-in' },
        { key: 'RC90', label: 'RC90 - 90-Day Check-In', dueDate: addDays(dateSold, 90), category: 'check-in' },
        { key: 'RC135', label: 'RC135 - Progress Review', dueDate: addDays(dateSold, 135), category: 'check-in' },
        { key: 'RC180', label: 'RC180 - 6-Month Review', dueDate: addDays(dateSold, 180), category: 'inspection' },
        { key: 'RC225', label: 'RC225 - Progress Review', dueDate: addDays(dateSold, 225), category: 'check-in' },
        { key: 'RC270', label: 'RC270 - 9-Month Review', dueDate: addDays(dateSold, 270), category: 'inspection' },
        { key: 'RC315', label: 'RC315 - Progress Review', dueDate: addDays(dateSold, 315), category: 'check-in' },
        { key: 'RC360', label: 'RC360 - Final Review', dueDate: addDays(dateSold, 360), category: 'completion' }
      ];

    default:
      return base;
  }
};

// Feature 1.3: Calculate enforcement level from days overdue
export const calculateEnforcementLevel = (daysOver) => {
  if (daysOver <= 0) return ENFORCEMENT_LEVELS.COMPLIANT;
  if (daysOver <= 30) return ENFORCEMENT_LEVELS.LEVEL_1;
  if (daysOver <= 60) return ENFORCEMENT_LEVELS.LEVEL_2;
  if (daysOver <= 90) return ENFORCEMENT_LEVELS.LEVEL_3;
  return ENFORCEMENT_LEVELS.LEVEL_4;
};

// Get the completed date for a milestone based on property data
export const getCompletedDateForMilestone = (milestone, property) => {
  if (!property || !milestone) return null;

  switch (property.programType) {
    case PROGRAM_TYPES.VIP:
      return property.rcDates?.[milestone.key]?.completed || null;

    case PROGRAM_TYPES.FEATURED:
      switch (milestone.key) {
        case 'insurance':
          return property.insuranceReceived ? (property.insuranceDueDate || property.dateSold) : null;
        case 'occupancy':
          return property.occupancyEstablished === 'Yes' ? (property.occupancyDeadline || property.dateSold) : null;
        default:
          return null;
      }

    case PROGRAM_TYPES.R4R:
      switch (milestone.key) {
        case 'insurance':
          return property.insuranceReceived ? (property.insuranceDueDate || property.dateSold) : null;
        case 'permit':
          return property.buildingPermitObtained ? property.dateSold : null;
        case 'mobilization':
          return property.scopeOfWorkApproved ? property.dateSold : null;
        case 'inspect-25':
          return property.percentComplete >= 25 ? addDays(property.dateSold, 120) : null;
        case 'inspect-50':
          return property.percentComplete >= 50 ? addDays(property.dateSold, 180) : null;
        case 'inspect-75':
          return property.percentComplete >= 75 ? addDays(property.dateSold, 270) : null;
        case 'rehab-complete':
        case 'coo':
          return property.percentComplete >= 100 ? (property.dateProofOfInvestProvided || property.rehabDeadline) : null;
        case 'move-in':
          return property.percentComplete >= 100 ? (property.dateProofOfInvestProvided || null) : null;
        default:
          return null;
      }

    case PROGRAM_TYPES.DEMO:
      switch (milestone.key) {
        case 'demo-cert':
        case 'demo-complete':
          return property.demoFinalCertDate || null;
        case 'site-clear':
          return property.demoFinalCertDate || null;
        default:
          return null;
      }

    default:
      return null;
  }
};

// Get milestone status
export const getMilestoneStatus = (milestone, completedDate) => {
  if (completedDate) return 'completed';
  const overdue = daysOverdue(milestone.dueDate);
  if (overdue > 0) return 'overdue';
  if (overdue > -14) return 'due-soon';
  return 'upcoming';
};

// Format date for display
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Get the first overdue milestone date for a property (used for days overdue calculation)
export const getFirstOverdueMilestoneDate = (property) => {
  if (!property) return null;
  const milestones = generateMilestones(property.programType, property.dateSold);
  const today = new Date().toISOString().split('T')[0];

  for (const milestone of milestones) {
    const completed = getCompletedDateForMilestone(milestone, property);
    if (!completed && milestone.dueDate < today) {
      return milestone.dueDate;
    }
  }
  return null;
};

// Get summary stats for dashboard
export const getDashboardStats = (properties) => {
  if (!properties) properties = [];
  return {
    totalActiveCases: properties.length,
    compliantCount: properties.filter(p => p.enforcementLevel === 0).length,
    warningCount: properties.filter(p => p.enforcementLevel === 1 || p.enforcementLevel === 2).length,
    defaultCount: properties.filter(p => p.enforcementLevel === 3 || p.enforcementLevel === 4).length,
    programBreakdown: {
      featuredHomes: properties.filter(p => p.programType === PROGRAM_TYPES.FEATURED).length,
      r4r: properties.filter(p => p.programType === PROGRAM_TYPES.R4R).length,
      demo: properties.filter(p => p.programType === PROGRAM_TYPES.DEMO).length,
      vip: properties.filter(p => p.programType === PROGRAM_TYPES.VIP).length,
    },
    actionNeeded: {
      needs1stAttempt: properties.filter(p => !p.compliance1stAttempt && p.enforcementLevel > 0).length,
      needs2ndAttempt: properties.filter(p => p.compliance1stAttempt && !p.compliance2ndAttempt && p.enforcementLevel > 0).length,
      noEmailOnFile: properties.filter(p => !p.buyerEmail && p.enforcementLevel > 0).length,
    },
  };
};
