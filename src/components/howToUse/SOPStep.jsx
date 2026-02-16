import { Link } from 'react-router-dom';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * SOPStep - A single numbered step in the SOP flow.
 *
 * Each step has a number, title, description, and optional:
 * - icon: Lucide icon component from iconMap
 * - linkTo: internal route (renders as clickable "Open page" link)
 * - details: array of bullet strings for sub-instructions
 * - tip: a brief "pro tip" callout
 */
export default function SOPStep({
  number,
  title,
  children,
  icon,
  linkTo,
  linkLabel,
  details,
  tip,
}) {
  return (
    <div className="relative flex gap-4 sm:gap-5">
      {/* Step number circle */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-accent">{number}</span>
        </div>
        {/* Connector line */}
        <div className="flex-1 w-px bg-warm-200 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 min-w-0">
        <div className="flex items-start gap-2.5 mb-1.5">
          {icon && (
            <div className="flex-shrink-0 p-1.5 bg-warm-100 rounded-md mt-0.5">
              <AppIcon icon={icon} size={15} className="text-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-heading text-[15px] font-semibold text-text leading-snug">
              {title}
            </h4>
          </div>
        </div>

        {/* Description */}
        <div className="text-sm text-muted leading-relaxed mt-2">
          {children}
        </div>

        {/* Detail bullets */}
        {details && details.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text/80">
                <AppIcon icon={ICONS.check} size={14} className="text-accent mt-0.5 flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Tip callout */}
        {tip && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-accent/5 border border-accent/10 rounded-lg">
            <AppIcon icon={ICONS.lightbulb} size={14} className="text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs text-accent-dark leading-relaxed">{tip}</p>
          </div>
        )}

        {/* Deep link to the actual page */}
        {linkTo && (
          <Link
            to={linkTo}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
          >
            <AppIcon icon={ICONS.arrowRight} size={13} />
            {linkLabel || 'Open this page'}
          </Link>
        )}
      </div>
    </div>
  );
}
