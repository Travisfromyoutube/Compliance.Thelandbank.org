import { Handle, Position } from '@xyflow/react';
import { AppIcon } from '../ui';

/**
 * SystemNode - Custom React Flow node for the system architecture diagram.
 *
 * Receives data props: label, subtitle, icon, active, dimmed, onClick.
 * Active state = green ring + accent background (chapter is viewing this node).
 * Dimmed state = faded out (another chapter is active, this node isn't relevant).
 * Handles on all 4 sides for flexible edge routing.
 */
export default function SystemNode({ data }) {
  const { label, subtitle, icon, active, dimmed, onClick } = data;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-5 py-3.5 rounded-lg border bg-white
        transition-all duration-200 cursor-pointer select-none
        ${active
          ? 'ring-2 ring-accent/40 bg-accent/5 border-accent shadow-md'
          : dimmed
            ? 'border-border/40 opacity-40'
            : 'border-border hover:border-accent hover:shadow-md hover:scale-105'
        }
      `}
    >
      <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
        <AppIcon icon={icon} size={20} className="text-accent" />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-sm font-semibold text-text leading-tight truncate">{label}</p>
        {subtitle && (
          <p className="text-xs text-muted leading-tight truncate">{subtitle}</p>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-accent/30 !w-2 !h-2 !border-0" />
    </div>
  );
}
