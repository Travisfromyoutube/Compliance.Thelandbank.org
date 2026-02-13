import React from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * DataFlowDiagram — Linear data lifecycle visualization
 *
 * Shows 6 stages of data flow in a structured layout:
 * Buyer Portal → Neon DB → FileMaker → Compliance Engine → Admin Portal → Email/Token
 *
 * Uses DOM elements (not SVG) for crisp text rendering at any size.
 * Three horizontal "swim lanes" show the read path, write path, and feedback loop.
 */

/* ── Flow stages ──────────────────────────────── */

const STAGES = [
  {
    id: 'buyer',
    label: 'Buyer Portal',
    detail: 'Buyers submit compliance updates, photos, and documents',
    icon: ICONS.user,
    color: 'bg-amber-500',
    colorLight: 'bg-amber-50',
    colorBorder: 'border-amber-200',
    colorText: 'text-amber-700',
    colorAccent: 'text-amber-500',
  },
  {
    id: 'neon',
    label: 'Neon Database',
    detail: 'PostgreSQL cache for instant page loads and serverless queries',
    icon: ICONS.database,
    color: 'bg-violet-500',
    colorLight: 'bg-violet-50',
    colorBorder: 'border-violet-200',
    colorText: 'text-violet-700',
    colorAccent: 'text-violet-500',
  },
  {
    id: 'filemaker',
    label: 'FileMaker Server',
    detail: '30,000+ property records — the GCLBA system of record',
    icon: ICONS.database,
    color: 'bg-blue-500',
    colorLight: 'bg-blue-50',
    colorBorder: 'border-blue-200',
    colorText: 'text-blue-700',
    colorAccent: 'text-blue-500',
  },
  {
    id: 'compliance',
    label: 'Compliance Engine',
    detail: 'Hourly schedule checks flag overdue properties automatically',
    icon: ICONS.shieldCheck,
    color: 'bg-emerald-600',
    colorLight: 'bg-emerald-50',
    colorBorder: 'border-emerald-200',
    colorText: 'text-emerald-700',
    colorAccent: 'text-emerald-600',
  },
  {
    id: 'admin',
    label: 'Admin Portal',
    detail: 'Staff reviews compliance status and takes enforcement action',
    icon: ICONS.dashboard,
    color: 'bg-slate-600',
    colorLight: 'bg-slate-50',
    colorBorder: 'border-slate-200',
    colorText: 'text-slate-700',
    colorAccent: 'text-slate-600',
  },
];

/* ── Arrow connectors ─────────────────────────── */

const CONNECTIONS = [
  { label: 'Submission', sublabel: 'Photos, docs, form data' },
  { label: 'API Sync', sublabel: 'REST → Prisma upsert' },
  { label: 'Schedule Check', sublabel: 'Hourly cron job' },
  { label: 'Review Queue', sublabel: 'Organized by action type' },
];

/* ── Feedback loop ────────────────────────────── */

const FEEDBACK = {
  label: 'Email / Token Link',
  sublabel: 'Compliance notices cycle back to buyers via unique secure links',
};

/* ── Stage card ───────────────────────────────── */

function StageCard({ stage, index }) {
  return (
    <div className={`relative flex flex-col items-center text-center group`}>
      {/* Step number */}
      <div className={`absolute -top-2 -right-1 w-5 h-5 rounded-full ${stage.color} text-white text-[10px] font-bold flex items-center justify-center shadow-sm z-10`}>
        {index + 1}
      </div>

      {/* Card */}
      <div className={`w-full p-4 rounded-lg border ${stage.colorBorder} ${stage.colorLight} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg ${stage.color} text-white flex items-center justify-center mx-auto mb-3 shadow-sm`}>
          <AppIcon icon={stage.icon} size={20} />
        </div>

        {/* Label */}
        <h4 className={`text-sm font-bold ${stage.colorText} mb-1`}>
          {stage.label}
        </h4>

        {/* Detail */}
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {stage.detail}
        </p>
      </div>
    </div>
  );
}

/* ── Arrow between stages ─────────────────────── */

function FlowArrow({ connection }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 min-w-[60px] self-center">
      {/* Label */}
      <span className="text-[10px] font-semibold text-gray-500 mb-1 whitespace-nowrap">
        {connection.label}
      </span>

      {/* Arrow line */}
      <div className="flex items-center gap-0">
        <div className="w-8 h-[2px] bg-gray-300 rounded-full" />
        <div className="w-0 h-0 border-l-[5px] border-l-gray-400 border-y-[3px] border-y-transparent" />
      </div>

      {/* Sublabel */}
      <span className="text-[9px] text-gray-400 mt-1 whitespace-nowrap italic">
        {connection.sublabel}
      </span>
    </div>
  );
}

/* ── Main component ───────────────────────────── */

export default function DataFlowDiagram() {
  return (
    <div className="w-full">
      {/* Main flow — horizontal on desktop, vertical on mobile */}
      <div className="hidden lg:flex items-start justify-center gap-0">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <div className="w-[160px] flex-shrink-0">
              <StageCard stage={stage} index={i} />
            </div>
            {i < STAGES.length - 1 && (
              <FlowArrow connection={CONNECTIONS[i]} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile layout — vertical stack */}
      <div className="lg:hidden space-y-2">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            <StageCard stage={stage} index={i} />
            {i < STAGES.length - 1 && (
              <div className="flex flex-col items-center py-1">
                <div className="h-5 w-[2px] bg-gray-300 rounded-full" />
                <div className="w-0 h-0 border-t-[5px] border-t-gray-400 border-x-[3px] border-x-transparent" />
                <span className="text-[10px] font-semibold text-gray-500 mt-1">{CONNECTIONS[i].label}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Feedback loop banner */}
      <div className="mt-5 relative">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50/70 border border-amber-200/60">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
            <AppIcon icon={ICONS.outreach} size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800">{FEEDBACK.label}</span>
              <span className="text-[10px] text-amber-500">&#x21bb; cycles back to Step 1</span>
            </div>
            <p className="text-[11px] text-amber-600/80 mt-0.5">{FEEDBACK.sublabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
