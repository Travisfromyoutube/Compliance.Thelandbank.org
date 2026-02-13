import { Handle, Position } from '@xyflow/react';
import { AppIcon } from '../ui';

/**
 * SystemNode - Custom React Flow node for the system architecture diagram.
 *
 * Horizontal card layout: icon (left) + text (right).
 * 200px wide for the landscape full-width hero card.
 *
 * States:
 * - Active: green ring + accent background (this node is relevant to the current step)
 * - Dimmed: faded out (another step is active, this node isn't relevant)
 * - Default: neutral border, hover effects
 *
 * Handles on all 4 sides for flexible edge routing.
 */
export default function SystemNode({ data }) {
  const { label, subtitle, description, icon, active, dimmed, onClick } = data;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-3 w-[200px]
        px-3.5 py-3 rounded-lg border bg-white
        transition-all duration-300 cursor-pointer select-none
        ${active
          ? 'ring-2 ring-accent/40 bg-accent/5 border-accent shadow-lg scale-[1.02]'
          : dimmed
            ? 'border-border/40 opacity-30'
            : 'border-border hover:border-accent hover:shadow-md hover:scale-[1.02]'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center mt-0.5
        transition-colors duration-300
        ${active ? 'bg-accent/20' : 'bg-accent/10'}
      `}>
        <AppIcon icon={icon} size={18} className="text-accent" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-bold text-text leading-tight">{label}</p>
        {subtitle && (
          <p className="text-[11px] text-muted font-medium leading-tight mt-0.5">{subtitle}</p>
        )}
        {description && (
          <p className="text-[10px] text-text/70 leading-snug mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-accent/30 !w-2 !h-2 !border-0" />
    </div>
  );
}
