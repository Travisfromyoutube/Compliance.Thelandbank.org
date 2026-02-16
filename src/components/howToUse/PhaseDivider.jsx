import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * PhaseDivider - Visual break between SOP phases.
 *
 * Thin dashed line with a small centered icon dot to signal
 * "new section" without adding visual heaviness.
 */
export default function PhaseDivider({ icon }) {
  return (
    <div className="flex items-center gap-3 py-2 my-2">
      <div className="flex-1 border-t border-dashed border-warm-200" />
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-100 border border-warm-200 flex items-center justify-center">
        <AppIcon
          icon={icon || ICONS.chevronDown}
          size={11}
          className="text-warm-400"
        />
      </div>
      <div className="flex-1 border-t border-dashed border-warm-200" />
    </div>
  );
}
