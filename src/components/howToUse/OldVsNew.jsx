import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * OldVsNew - Side-by-side comparison of the old SOP process vs the portal.
 *
 * Used sparingly at the end of each phase to reinforce the value proposition.
 * The "old way" column lists the manual steps across multiple tools.
 * The "new way" column shows the single-portal equivalent.
 */
export default function OldVsNew({ oldSteps, newSteps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {/* Old way */}
      <div className="px-4 py-3.5 bg-warm-100/60 border border-warm-200 rounded-lg">
        <p className="text-[11px] font-label font-semibold tracking-[0.06em] uppercase text-warm-500 mb-2.5">
          Previous process
        </p>
        <ul className="space-y-1.5">
          {oldSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-warm-500 leading-relaxed">
              <span className="text-warm-400 mt-px flex-shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* New way */}
      <div className="px-4 py-3.5 bg-accent/[0.04] border border-accent/15 rounded-lg">
        <p className="text-[11px] font-label font-semibold tracking-[0.06em] uppercase text-accent mb-2.5">
          With the portal
        </p>
        <ul className="space-y-1.5">
          {newSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text/80 leading-relaxed">
              <AppIcon icon={ICONS.check} size={13} className="text-accent mt-px flex-shrink-0" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
