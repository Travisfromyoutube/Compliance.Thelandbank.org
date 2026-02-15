import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';
import ChapterHeader from './ChapterHeader';

/**
 * FullSystem - Chapter 7: "The Full Picture"
 *
 * Summary view showing how all 7 nodes work together as one system.
 * Three highlight cards for the main data loops, plus a closing statement.
 */

const LOOPS = [
  {
    icon: ICONS.dataFlow,
    title: 'Buyer Loop',
    detail: 'Buyer submits through a secure link → API validates and stores → Neon caches for fast page loads → Admin reviews in the portal.',
  },
  {
    icon: ICONS.sync,
    title: 'FileMaker Loop',
    detail: 'FileMaker stays the master record. The API syncs property data in, and pushes compliance updates back out.',
  },
  {
    icon: ICONS.batchEmail,
    title: 'Compliance Loop',
    detail: 'The compliance engine checks milestones hourly → flags overdue properties → triggers notices through Resend → logs every action.',
  },
];

export default function FullSystem() {
  return (
    <div>
      <ChapterHeader
        icon={ICONS.globe}
        title="The Full Picture"
        subtitle="How all seven pieces work as one system"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {LOOPS.map((loop) => (
          <div
            key={loop.title}
            className="rounded-lg border border-border bg-white p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center">
                <AppIcon icon={loop.icon} size={15} className="text-accent" />
              </div>
              <h4 className="font-heading font-semibold text-sm text-text">
                {loop.title}
              </h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {loop.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <p className="text-sm text-text/80 leading-relaxed">
          <span className="font-semibold text-text">One connected system.</span>{' '}
          Every node you see in the diagram talks to at least one other. No manual
          handoffs, no spreadsheet exports, no copy-pasting between windows.
          The portal handles the back and forth so staff can focus on compliance decisions,
          not data entry.
        </p>
      </div>
    </div>
  );
}
