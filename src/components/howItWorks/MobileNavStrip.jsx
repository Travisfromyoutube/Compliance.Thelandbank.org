import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * MobileNavStrip - Horizontal pill navigator for mobile screens.
 *
 * Replaces the React Flow diagram below lg (1024px) breakpoint.
 * Sticky at top, scrollable overflow, shows 6 chapter pills.
 * Active pill gets accent fill; tapping scrolls to chapter.
 */

const NAV_ITEMS = [
  { id: 'what-it-does',    icon: ICONS.home,        label: 'Overview' },
  { id: 'whats-inside',    icon: ICONS.file,        label: 'Files' },
  { id: 'tech-behind-it',  icon: ICONS.zap,         label: 'Tech' },
  { id: 'how-data-moves',  icon: ICONS.dataFlow,    label: 'Data' },
  { id: 'data-stays-safe', icon: ICONS.shieldCheck, label: 'Security' },
  { id: 'what-stays-sync', icon: ICONS.sync,        label: 'Sync' },
];

export default function MobileNavStrip({ activeChapter, onNavigate }) {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-border px-3 py-2 -mx-4 sm:-mx-6">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium
              whitespace-nowrap flex-shrink-0 transition-all duration-150
              ${activeChapter === item.id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white border border-border text-muted hover:border-accent/30'
              }
            `}
          >
            <AppIcon icon={item.icon} size={12} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
