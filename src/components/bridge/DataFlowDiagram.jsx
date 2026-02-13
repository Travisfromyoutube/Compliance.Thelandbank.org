import React from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * DataFlowDiagram — Linear data lifecycle visualization
 *
 * 5 stages connected by labeled arrows. Cards flex to fill full width.
 * DOM-based for crisp text. Horizontal on desktop, vertical on mobile.
 */

const STAGES = [
  {
    id: 'buyer',
    label: 'Buyer Portal',
    detail: 'Buyers upload photos and progress updates',
    icon: ICONS.user,
  },
  {
    id: 'neon',
    label: 'Data Stored',
    detail: 'Portal stores all records for fast access',
    icon: ICONS.database,
  },
  {
    id: 'filemaker',
    label: 'FileMaker Synced',
    detail: 'Your master property database stays in sync',
    icon: ICONS.database,
  },
  {
    id: 'compliance',
    label: 'Deadlines Checked',
    detail: 'Every hour, the system flags missed deadlines',
    icon: ICONS.shieldCheck,
  },
  {
    id: 'admin',
    label: 'Admin Portal',
    detail: 'Review properties and send compliance notices',
    icon: ICONS.dashboard,
  },
];

const CONNECTIONS = [
  { label: 'Submission' },
  { label: 'API Sync' },
  { label: 'Cron Check' },
  { label: 'Review Queue' },
];

/* ── Stage card ───────────────────────────────── */

function StageCard({ stage, index }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Step number */}
      <div className="absolute -top-2 -right-1.5 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow-sm z-10">
        {index + 1}
      </div>

      {/* Card */}
      <div className="w-full px-4 py-4 rounded-lg border border-accent/20 bg-accent/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-accent/10">
        <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
          <AppIcon icon={stage.icon} size={20} />
        </div>
        <h4 className="text-sm font-bold text-text leading-tight mb-0.5">{stage.label}</h4>
        <p className="text-xs text-muted leading-snug">{stage.detail}</p>
      </div>
    </div>
  );
}

/* ── Arrow ────────────────────────────────────── */

function FlowArrow({ connection }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 self-center flex-shrink-0">
      <span className="text-[9px] font-semibold text-muted mb-0.5 whitespace-nowrap">{connection.label}</span>
      <div className="flex items-center">
        <div className="w-8 h-[1.5px] bg-accent/30" />
        <div className="w-0 h-0 border-l-[4px] border-l-accent/40 border-y-[2.5px] border-y-transparent" />
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────── */

export default function DataFlowDiagram() {
  return (
    <div className="w-full">
      {/* Desktop — horizontal, cards flex to fill width */}
      <div className="hidden lg:flex items-start gap-1">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <div className="flex-1 min-w-0">
              <StageCard stage={stage} index={i} />
            </div>
            {i < STAGES.length - 1 && <FlowArrow connection={CONNECTIONS[i]} />}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile — vertical */}
      <div className="lg:hidden space-y-1.5">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <StageCard stage={stage} index={i} />
            {i < STAGES.length - 1 && (
              <div className="flex flex-col items-center py-0.5">
                <div className="h-4 w-[1.5px] bg-accent/30" />
                <div className="w-0 h-0 border-t-[4px] border-t-accent/40 border-x-[2.5px] border-x-transparent" />
                <span className="text-[9px] font-semibold text-muted mt-0.5">{CONNECTIONS[i].label}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Feedback loop */}
      <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-accent/5 border border-accent/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <AppIcon icon={ICONS.outreach} size={14} className="text-accent flex-shrink-0" />
        <span className="text-[11px] text-accent font-medium">Email / Token Link</span>
        <span className="text-[10px] text-muted">— when action is needed, buyers receive an email with a one-time secure link to submit updates</span>
      </div>
    </div>
  );
}
