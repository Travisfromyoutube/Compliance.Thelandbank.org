import { Handle, Position } from '@xyflow/react';
import { AppIcon } from '../ui';

/**
 * SystemNode - Custom React Flow node for the dark blueprint diagram.
 *
 * Category colors (left border):
 * - portal:      #2d7a4a (civic green) - Buyer Portal, Admin Portal
 * - service:     #2b5f8a (civic blue)  - Vercel API, Compliance Engine
 * - integration: #b07d2e (warm ochre)  - Neon, FileMaker, Resend
 *
 * Two sizes:
 * - Anchor nodes (portals): 260px wide, larger icon/text
 * - Service nodes: 220px wide, standard sizing
 *
 * States: active (colored ring glow), dimmed (faded content), default (hover)
 * Handles on all 4 sides for flexible edge routing.
 */

const CATEGORY_COLORS = {
  portal:      '#2d7a4a',
  service:     '#2b5f8a',
  integration: '#b07d2e',
};

export default function SystemNode({ data }) {
  const { label, subtitle, description, icon, active, dimmed, anchor, category, onClick } = data;
  const catColor = CATEGORY_COLORS[category] || '#2d7a4a';

  return (
    <div
      onClick={onClick}
      style={{
        borderLeftColor: dimmed ? 'rgba(255,255,255,0.06)' : catColor,
        boxShadow: active ? `0 0 16px ${catColor}33, 0 0 4px ${catColor}22` : 'none',
      }}
      className={`
        relative flex items-start gap-3 border-l-[3px] rounded-lg
        transition-all duration-300 cursor-pointer select-none
        ${anchor ? 'w-[260px] px-4 py-4' : 'w-[220px] px-3.5 py-3'}
        ${active
          ? 'scale-[1.02]'
          : dimmed
            ? ''
            : 'hover:scale-[1.02]'
        }
      `}
      /* Inline styles handle the dynamic colors; Tailwind handles structure */
    >
      {/* Background + border (non-left sides) via nested absolute div
          so we can have different border-left vs other borders */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: active
            ? 'rgba(18, 36, 25, 0.95)'
            : 'rgba(15, 31, 22, 0.95)',
          borderTop:    `1px solid ${active ? `${catColor}44` : 'rgba(255,255,255,0.08)'}`,
          borderRight:  `1px solid ${active ? `${catColor}44` : 'rgba(255,255,255,0.08)'}`,
          borderBottom: `1px solid ${active ? `${catColor}44` : 'rgba(255,255,255,0.08)'}`,
        }}
      />

      {/* Icon */}
      <div
        className={`
          relative flex-shrink-0 rounded-md flex items-center justify-center mt-0.5
          transition-all duration-300
          ${anchor ? 'w-11 h-11' : 'w-9 h-9'}
        `}
        style={{
          backgroundColor: dimmed ? 'rgba(255,255,255,0.03)' : `${catColor}22`,
        }}
      >
        <AppIcon
          icon={icon}
          size={anchor ? 22 : 18}
          className="transition-colors duration-300"
          style={{ color: dimmed ? 'rgba(255,255,255,0.15)' : catColor }}
        />
      </div>

      {/* Text */}
      <div className="relative min-w-0 flex-1">
        <p
          className={`font-heading font-bold leading-tight transition-colors duration-300
            ${anchor ? 'text-lg' : 'text-sm'}`}
          style={{ color: dimmed ? 'rgba(255,255,255,0.15)' : '#e8e6e3' }}
        >
          {label}
        </p>
        {subtitle && (
          <p
            className={`font-medium leading-tight mt-0.5 transition-colors duration-300
              ${anchor ? 'text-sm' : 'text-[13px]'}`}
            style={{ color: dimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)' }}
          >
            {subtitle}
          </p>
        )}
        {description && (
          <p
            className={`leading-snug line-clamp-2 transition-colors duration-300
              ${anchor ? 'text-[13px] mt-2' : 'text-xs mt-1'}`}
            style={{ color: dimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.65)' }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top}    className="!w-2 !h-2 !border-0" style={{ background: `${catColor}55` }} />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-0" style={{ background: `${catColor}55` }} />
      <Handle type="target" position={Position.Left}   id="left"  className="!w-2 !h-2 !border-0" style={{ background: `${catColor}55` }} />
      <Handle type="source" position={Position.Right}  id="right" className="!w-2 !h-2 !border-0" style={{ background: `${catColor}55` }} />
    </div>
  );
}
