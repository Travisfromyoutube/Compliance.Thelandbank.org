import { useState } from 'react';
import ICONS from '../../icons/iconMap';
import ChapterHeader from './ChapterHeader';

/**
 * TechStack - Chapter 3: "The Tech Behind It"
 *
 * Four horizontal layer rows with expandable tech chips.
 * Only one chip expanded at a time (accordion behavior).
 * Each layer has a colored left border for visual hierarchy.
 */

const LAYERS = [
  {
    label: 'What you see',
    techs: [
      { name: 'React 18', aha: 'Every card, table, and form is a reusable building block' },
      { name: 'Tailwind CSS', aha: 'All colors, spacing, and fonts come from one shared design system' },
    ],
  },
  {
    label: 'What handles requests',
    techs: [
      { name: 'Vite 5', aha: 'Changes show up in the browser instantly while developing' },
      { name: 'Vercel Serverless', aha: 'Push code to GitHub and it\'s live in under 60 seconds' },
    ],
  },
  {
    label: 'Where data lives',
    techs: [
      { name: 'Prisma', aha: 'Catches data mismatch bugs before they happen, not after' },
      { name: 'Neon PostgreSQL', aha: 'The portal\'s own database - always on, scales on its own' },
      { name: 'FileMaker', aha: 'GCLBA\'s master property database - the portal reads and writes to it over HTTPS' },
    ],
  },
  {
    label: 'Services that help',
    techs: [
      { name: 'Resend', aha: 'Sends compliance emails from compliance@thelandbank.org - lands right in Outlook' },
      { name: 'Leaflet', aha: 'The map page - color-coded pins show compliance status across the county' },
    ],
  },
];

const LAYER_BORDERS = ['border-l-accent', 'border-l-info', 'border-l-warning', 'border-l-accent-blue'];

export default function TechStack() {
  const [expandedChip, setExpandedChip] = useState(null);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.zap}
        title="The Tech Behind It"
        subtitle="What's running under the hood - click any chip to learn more"
      />
      <div className="space-y-3">
        {LAYERS.map((layer, layerIdx) => (
          <div
            key={layer.label}
            className={`flex items-start gap-4 pl-4 border-l-[3px] ${LAYER_BORDERS[layerIdx]} py-3`}
          >
            <p className="text-[11px] font-semibold text-muted w-36 flex-shrink-0 pt-1.5">{layer.label}</p>
            <div className="flex flex-wrap gap-2">
              {layer.techs.map((tech) => {
                const isExpanded = expandedChip === tech.name;
                return (
                  <button
                    key={tech.name}
                    onClick={() => setExpandedChip(isExpanded ? null : tech.name)}
                    className={`
                      text-left transition-all duration-200 rounded-full border
                      ${isExpanded
                        ? 'bg-accent/5 border-accent/40 shadow-sm px-4 py-2 rounded-lg'
                        : 'bg-white border-border hover:border-accent/30 px-3 py-1.5'
                      }
                    `}
                  >
                    <span className={`text-xs font-semibold ${isExpanded ? 'text-accent' : 'text-text'}`}>
                      {tech.name}
                    </span>
                    {isExpanded && (
                      <p className="text-[11px] text-muted leading-relaxed mt-1">{tech.aha}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
