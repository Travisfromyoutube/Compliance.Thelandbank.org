import { useState } from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * SOPPhase - Collapsible phase container for grouping SOP steps.
 *
 * Phases map to the old SOP's logical groupings:
 *   Phase 1: Daily Check-In (replaces FM export + Excel sort)
 *   Phase 2: Sending Notices (replaces Word merge + Outlook)
 *   Phase 3: Buyer Self-Service (replaces incoming email + manual data entry)
 *   Phase 4: Tracking & Recording (replaces FM field updates + K-drive archival)
 *   Phase 5: VIP Program (replaces dedicated VIP layout juggling)
 *
 * defaultOpen: first phase starts expanded, rest collapsed
 */
export default function SOPPhase({
  number,
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
      {/* Phase header (clickable) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 sm:gap-4 px-5 py-4 text-left hover:bg-warm-50/50 transition-colors"
      >
        {/* Phase number badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
          {icon ? (
            <AppIcon icon={icon} size={18} className="text-accent" />
          ) : (
            <span className="text-sm font-mono font-bold text-accent">{number}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-mono font-medium text-accent tracking-wider uppercase">
              Phase {number}
            </span>
          </div>
          <h3 className="font-heading text-base font-semibold text-text leading-snug mt-0.5">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted mt-0.5">{subtitle}</p>
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
          isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="px-5 pb-5 pt-1 border-t border-border/50">
          {children}
        </div>
      </div>
    </div>
  );
}
