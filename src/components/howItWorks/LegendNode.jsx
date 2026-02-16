/**
 * LegendNode - color-coded category legend for the blueprint diagram.
 * Rendered as a non-interactive React Flow node at the bottom of the map.
 */

const LEGEND_ITEMS = [
  { label: 'Portal',      color: '#2d7a4a' },
  { label: 'Service',     color: '#2b5f8a' },
  { label: 'Integration', color: '#b07d2e' },
];

export default function LegendNode() {
  return (
    <div className="flex items-center gap-5 select-none pointer-events-none">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] font-medium tracking-wider uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
