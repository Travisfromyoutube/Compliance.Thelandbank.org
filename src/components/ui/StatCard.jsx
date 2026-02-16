import React from 'react';
import { AppIcon } from './AppIcon';

const VARIANT_ACCENT = {
  default: 'border-l-border',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger:  'border-l-danger',
  info:    'border-l-info',
};

const VARIANT_ICON_BG = {
  default: 'bg-surface-alt',
  success: 'bg-success-light',
  warning: 'bg-warning-light',
  danger:  'bg-danger-light',
  info:    'bg-info-light',
};

export function StatCard({
  label,
  value,
  icon,
  variant = 'default',
  trend,
  className = '',
}) {
  return (
    <div
      className={[
        'bg-surface rounded-lg border border-border shadow-sm p-5 hover:shadow-md transition-all duration-150',
        'border-l-[3px]',
        VARIANT_ACCENT[variant] || VARIANT_ACCENT.default,
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-label font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="text-2xl font-mono font-semibold text-text tabular-nums mt-1">{value}</p>
          {trend && <p className="text-xs text-muted mt-1">{trend}</p>}
        </div>
        {icon && (
          <div className={[
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            VARIANT_ICON_BG[variant] || VARIANT_ICON_BG.default,
          ].join(' ')}>
            <AppIcon icon={icon} size={18} variant={variant === 'default' ? 'default' : variant} />
          </div>
        )}
      </div>
    </div>
  );
}
