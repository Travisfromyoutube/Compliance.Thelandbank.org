import { useState, useCallback } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import ChapterHeader from './ChapterHeader';

/**
 * DataFlowPipeline — Chapter 4: "How Data Moves"
 *
 * Three tabbed flow scenarios (Property Sync, Compliance Emails, Buyer Access Links)
 * with step-through navigation. Horizontal pipeline on desktop, vertical on mobile.
 * Each step shows a detail card with label + description.
 */

const FLOWS = [
  {
    id: 'sync',
    label: 'Property Sync',
    steps: [
      { label: 'Log In', detail: 'The portal connects to FileMaker using a session token that lasts 15 minutes.' },
      { label: 'Pull Records', detail: 'Grabs property data from the PARC layout in FileMaker.' },
      { label: 'Translate Fields', detail: 'FileMaker and the portal use different field names — a mapping file translates 50+ of them.' },
      { label: 'Save Locally', detail: 'Records get saved to the portal\'s own database so pages load fast.' },
    ],
  },
  {
    id: 'email',
    label: 'Compliance Emails',
    steps: [
      { label: 'Pick Template', detail: 'Each enforcement step — Attempt 1, Warning, Default Notice — has a ready-to-go template.' },
      { label: 'Fill In Details', detail: 'The buyer\'s name, address, and deadline get dropped into the template automatically.' },
      { label: 'Send It', detail: 'Email goes out from compliance@thelandbank.org through Resend.' },
    ],
  },
  {
    id: 'token',
    label: 'Buyer Access Links',
    steps: [
      { label: 'Create a Token', detail: 'A unique code gets generated — tied to one buyer, one property, with an expiration date.' },
      { label: 'Email the Link', detail: 'The token is embedded in the submission URL and sent to the buyer.' },
      { label: 'Buyer Clicks', detail: 'The portal checks that the token is valid and hasn\'t been used yet.' },
      { label: 'Submit Updates', detail: 'Buyer uploads their photos and documents through the verified form.' },
      { label: 'Link Dies', detail: 'Once used or timed out, the link stops working. No reuse.' },
    ],
  },
];

function StepIndicator({ index, total, active, onClick }) {
  return (
    <div className="flex items-center">
      <button
        onClick={() => onClick(index)}
        className={`
          w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
          transition-all duration-200 flex-shrink-0
          ${active
            ? 'bg-accent text-white scale-110 shadow-sm'
            : 'bg-white border-2 border-border text-muted hover:border-accent/40'
          }
        `}
      >
        {index + 1}
      </button>
      {/* Connector line */}
      {index < total - 1 && (
        <div className="relative w-8 sm:w-12 h-[2px] bg-border mx-1" />
      )}
    </div>
  );
}

export default function DataFlowPipeline() {
  const [activeFlow, setActiveFlow] = useState('sync');
  const [activeStep, setActiveStep] = useState(0);

  const flow = FLOWS.find((f) => f.id === activeFlow);

  const handleFlowChange = useCallback((id) => {
    setActiveFlow(id);
    setActiveStep(0);
  }, []);

  const handlePrev = () => setActiveStep((s) => Math.max(0, s - 1));
  const handleNext = () => setActiveStep((s) => Math.min(flow.steps.length - 1, s + 1));

  return (
    <div>
      <ChapterHeader
        icon={ICONS.dataFlow}
        title="How Data Moves"
        subtitle="Pick a workflow and walk through it step by step"
      />

      {/* Flow selector tabs */}
      <div className="flex gap-2 mb-5">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            onClick={() => handleFlowChange(f.id)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
              ${activeFlow === f.id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white border border-border text-muted hover:border-accent/30'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pipeline — horizontal on desktop */}
      <div className="hidden sm:flex items-center justify-center mb-5">
        {flow.steps.map((_, i) => (
          <StepIndicator
            key={`${activeFlow}-${i}`}
            index={i}
            total={flow.steps.length}
            active={i === activeStep}
            onClick={setActiveStep}
          />
        ))}
      </div>

      {/* Pipeline — vertical on mobile */}
      <div className="sm:hidden flex flex-col items-start gap-1 mb-5 pl-2">
        {flow.steps.map((step, i) => (
          <div key={`${activeFlow}-${i}`} className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep(i)}
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                transition-all duration-200
                ${i === activeStep
                  ? 'bg-accent text-white scale-110'
                  : 'bg-white border-2 border-border text-muted'
                }
              `}
            >
              {i + 1}
            </button>
            <span className={`text-xs ${i === activeStep ? 'text-text font-semibold' : 'text-muted'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Detail card */}
      <div className="bg-white rounded-lg border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-accent">Step {activeStep + 1}</span>
          <span className="font-heading text-sm font-semibold text-text">{flow.steps[activeStep].label}</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">{flow.steps[activeStep].detail}</p>

        {/* Nav buttons */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
          <button
            onClick={handlePrev}
            disabled={activeStep === 0}
            className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <AppIcon icon={ICONS.arrowLeft} size={12} /> Previous
          </button>
          <button
            onClick={handleNext}
            disabled={activeStep === flow.steps.length - 1}
            className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <AppIcon icon={ICONS.arrowRight} size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
