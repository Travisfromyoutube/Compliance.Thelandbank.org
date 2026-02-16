import React from 'react';

const VARIANT_STYLES = {
  default: 'bg-surface-alt text-text-secondary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger:  'bg-danger-light text-danger',
  info:    'bg-info-light text-info',
};

const STATUS_TO_VARIANT = {
  compliant:          'success',
  'on-track':         'success',
  completed:          'success',
  watch:              'warning',
  'due-soon':         'warning',
  'needs-attention':  'warning',
  'at-risk':          'danger',
  overdue:            'danger',
  'non-compliant':    'danger',
  default:            'danger',
};

/** FM Availability color coding - matches FileMaker's row-coloring convention */
const FM_COLOR_MAP = {
  'Sold':       'bg-red-100 text-red-800 border-red-200',
  'Under LC':   'bg-orange-100 text-orange-800 border-orange-200',
  'Inactive':   'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Treasurer':  'bg-sky-100 text-sky-800 border-sky-200',
  'Available':  'bg-green-100 text-green-800 border-green-200',
};

export function StatusPill({ children, variant, status, fmStatus, className = '' }) {
  // FM status takes precedence when provided
  if (fmStatus && FM_COLOR_MAP[fmStatus]) {
    return (
      <span
        className={[
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-label font-medium tracking-wide border',
          FM_COLOR_MAP[fmStatus],
          className,
        ].join(' ')}
      >
        {children}
      </span>
    );
  }

  const resolved = variant || STATUS_TO_VARIANT[status] || 'default';
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-label font-medium tracking-wide',
        VARIANT_STYLES[resolved] || VARIANT_STYLES.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
