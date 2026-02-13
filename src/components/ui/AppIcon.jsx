import React from 'react';

/**
 * AppIcon - consistent icon wrapper for the GCLBA portal.
 *
 * ICON USAGE GUIDE
 * ────────────────────────────
 * Sizes:   16 (tight inline) | 18 (nav/cards, DEFAULT) | 20 (buttons) | 24 (empty states)
 * Stroke:  1.75 everywhere (do not override)
 * Color:   Inherits from parent `text-*` by default.
 *          Use `variant` for semantic coloring (success, warning, danger, info).
 * Library: lucide-react only, outline style. No filled icons.
 *
 * Usage:
 *   <AppIcon icon={ClipboardCheck} />
 *   <AppIcon icon={AlertTriangle} size={24} variant="warning" />
 *   <AppIcon icon={CheckCircle} variant="success" className="mr-2" />
 */

const VARIANT_COLOR = {
  default: '',
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
  info:    'text-accent-blue',
  accent:  'text-accent',
};

const STROKE_WIDTH = 1.75;

export function AppIcon({
  icon: Icon,
  size = 18,
  variant = 'default',
  className = '',
  ...props
}) {
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={STROKE_WIDTH}
      className={[
        'inline-flex shrink-0 align-middle',
        VARIANT_COLOR[variant] || '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
