import { useState } from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * SOPPhase - Color-coded phase container for SOP steps.
 *
 * Each phase gets a distinct accent color and alternating tinted backgrounds
 * to break the visual monotony of identical white cards.
 *
 * Phase color mapping:
 *   Phase 1 (Daily Check-In):     accent green
 *   Phase 2 (Sending Notices):    accent blue
 *   Phase 3 (Buyer Self-Service): warm amber
 *   Phase 4 (Recording):          accent green (darker)
 *   Phase 5 (VIP Program):        accent blue (deeper)
 */

const PHASE_COLORS = {
  1: {
    accent: 'border-accent',
    badge: 'bg-accent/10 text-accent border-accent/20',
    label: 'text-accent',
    tint: 'bg-accent/[0.03]',
  },
  2: {
    accent: 'border-accent-blue',
    badge: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    label: 'text-accent-blue',
    tint: 'bg-accent-blue/[0.03]',
  },
  3: {
    accent: 'border-warning',
    badge: 'bg-warning/10 text-warning border-warning/20',
    label: 'text-warning',
    tint: 'bg-warning/[0.03]',
  },
  4: {
    accent: 'border-accent-dark',
    badge: 'bg-accent-dark/10 text-accent-dark border-accent-dark/20',
    label: 'text-accent-dark',
    tint: 'bg-accent-dark/[0.03]',
  },
  5: {
    accent: 'border-accent-blue-dark',
    badge: 'bg-accent-blue-dark/10 text-accent-blue-dark border-accent-blue-dark/20',
    label: 'text-accent-blue-dark',
    tint: 'bg-accent-blue-dark/[0.03]',
  },
};

export default function SOPPhase({
  number,
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colors = PHASE_COLORS[number] || PHASE_COLORS[1];

  // Odd-numbered phases get a subtle tinted background for alternation
  const useTint = number % 2 === 1;

  return (
    <div className="relative">
      {/* Colored left accent bar */}
      <div
        className={`
          absolute left-0 top-0 bottom-0 w-1 rounded-full
          ${colors.accent}
          border-l-[3px]
        `}
      />

      <div
        className={`
          ml-4 rounded-xl overflow-hidden transition-colors duration-200
          ${useTint ? colors.tint : 'bg-transparent'}
        `}
      >
        {/* Phase header (clickable) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 sm:gap-4 px-5 py-5 text-left hover:bg-warm-100/40 transition-colors rounded-xl"
        >
          {/* Phase number badge, larger and color-coded */}
          <div
            className={`
              flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center
              ${colors.badge}
            `}
          >
            {icon ? (
              <AppIcon icon={icon} size={20} className="opacity-80" />
            ) : (
              <span className="text-base font-mono font-bold">{number}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className={`
                  text-[10px] font-mono font-semibold tracking-[0.08em] uppercase
                  ${colors.label}
                `}
              >
                Phase {number}
              </span>
            </div>
            <h3 className="font-heading text-lg font-semibold text-text leading-snug mt-0.5">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>

          {/* Expand/collapse indicator */}
          <span
            className={[
              'flex-shrink-0 transition-transform duration-200 text-warm-400',
              isOpen ? 'rotate-0' : '-rotate-90',
            ].join(' ')}
          >
            <AppIcon icon={ICONS.chevronDown} size={16} />
          </span>
        </button>

        {/* Collapsible content */}
        <div
          className={[
            'overflow-hidden transition-all duration-300 ease-out',
            isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <div className="px-5 pb-6 pt-1">
            {/* Subtle top separator inside the content area */}
            <div className={`h-px mb-4 ${colors.accent} opacity-10`} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
