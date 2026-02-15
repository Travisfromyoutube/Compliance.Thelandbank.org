import { useState, useCallback, lazy, Suspense } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import ICONS from '../icons/iconMap';
import { AdminPageHeader, AppIcon } from '../components/ui';
import SystemMap from '../components/howItWorks/SystemMap';

/**
 * HowItWorks - "How This Portal Works" page
 *
 * Two-part layout:
 * 1. Interactive hero: Full-width React Flow diagram + click-through step nav
 *    - Clicking steps highlights nodes and animates edges
 *    - Active chapter content appears below the nav bar
 * 2. Scrollable reference: All chapters rendered in sequence below the hero
 *    - Reinforcing learning tool — same content, browsable format
 *
 * The hero is the guided tour; the scroll content is the reference manual.
 */

/* ── Lazy-load chapter components ── */
const FlipCards = lazy(() => import('../components/howItWorks/FlipCard'));
const FileExplorer = lazy(() => import('../components/howItWorks/FileExplorer'));
const TechStack = lazy(() => import('../components/howItWorks/TechStack'));
const DataFlowPipeline = lazy(() => import('../components/howItWorks/DataFlowPipeline'));
const SecurityStack = lazy(() => import('../components/howItWorks/SecurityStack'));
const SyncFlow = lazy(() => import('../components/howItWorks/SyncFlow'));

/* ── Step definitions ── */
const STEPS = [
  { id: 'what-it-does',    label: 'Overview',  icon: ICONS.home,        Component: FlipCards },
  { id: 'whats-inside',    label: 'Files',     icon: ICONS.file,        Component: FileExplorer },
  { id: 'tech-behind-it',  label: 'Tech',      icon: ICONS.zap,         Component: TechStack },
  { id: 'how-data-moves',  label: 'Data Flow', icon: ICONS.dataFlow,    Component: DataFlowPipeline },
  { id: 'data-stays-safe', label: 'Security',  icon: ICONS.shieldCheck, Component: SecurityStack },
  { id: 'what-stays-sync', label: 'Sync',      icon: ICONS.sync,        Component: SyncFlow },
];

/* ── Loading placeholder ── */
function ChapterFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-muted text-sm">
      Loading...
    </div>
  );
}

export default function HowItWorks() {
  usePageTitle('How This Portal Works');
  const [activeStep, setActiveStep] = useState(0);

  const activeChapter = STEPS[activeStep].id;
  const ActiveComponent = STEPS[activeStep].Component;

  const goNext = useCallback(() => {
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setActiveStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleNodeClick = useCallback((nodeId) => {
    const NODE_TO_STEP = {
      buyer: 0, admin: 0,
      api: 2,
      neon: 2, filemaker: 5,
      compliance: 4, resend: 3,
    };
    const stepIdx = NODE_TO_STEP[nodeId];
    if (stepIdx !== undefined) setActiveStep(stepIdx);
  }, []);

  return (
    <div className="space-y-0">
      <AdminPageHeader
        title="How This Portal Works"
        subtitle="What's actually happening under the hood"
        icon={ICONS.bookOpen}
      />

      {/* ═══════════════════════════════════════════
          PART 1: Interactive Hero (diagram + step nav)
          ═══════════════════════════════════════════ */}

      {/* Hero: Full-width system architecture diagram */}
      <div className="rounded-xl border border-accent-dark/30 blueprint-bg overflow-hidden shadow-sm">
        <div className="h-[456px] lg:h-[504px]">
          <SystemMap activeChapter={activeChapter} onNodeClick={handleNodeClick} />
        </div>
      </div>

      {/* Step navigation bar */}
      <div className="flex items-center justify-between py-4 px-1">
        {/* Prev button */}
        <button
          onClick={goPrev}
          disabled={activeStep === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
            text-muted hover:text-text hover:bg-surface"
        >
          <AppIcon icon={ICONS.chevronLeft} size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Step dots + labels */}
        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(i)}
              className={`
                flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${i === activeStep
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-text hover:bg-surface'
                }
              `}
            >
              <AppIcon icon={step.icon} size={13} />
              <span className="hidden md:inline">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={activeStep === STEPS.length - 1}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
            text-muted hover:text-text hover:bg-surface"
        >
          <span className="hidden sm:inline">Next</span>
          <AppIcon icon={ICONS.chevronRight} size={16} />
        </button>
      </div>

      {/* Active chapter preview */}
      <div className="min-h-[200px] mb-8">
        <Suspense fallback={<ChapterFallback />}>
          <div key={activeChapter} className="animate-fade-slide-up">
            <ActiveComponent />
          </div>
        </Suspense>
      </div>

      {/* ═══════════════════════════════════════════
          PART 2: Full scrollable reference content
          ═══════════════════════════════════════════ */}

      <div className="border-t border-border pt-10 mt-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <AppIcon icon={ICONS.file} size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-text">Deep Dive</h2>
            <p className="text-sm text-muted">All chapters in full, for reference</p>
          </div>
        </div>

        <Suspense fallback={<ChapterFallback />}>
          <div className="space-y-12">
            {STEPS.map((step) => (
              <div key={step.id} id={step.id}>
                <step.Component />
              </div>
            ))}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
