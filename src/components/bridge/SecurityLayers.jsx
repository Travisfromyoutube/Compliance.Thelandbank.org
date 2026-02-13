import React from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * SecurityLayers — Horizontal security layer cards
 *
 * 4 cards laid out left-to-right in a grid, all in civic green.
 * Each card shows a security layer with icon, title, and bullet list.
 * Hover lift animation on each card.
 */

const LAYERS = [
  {
    id: 'tls',
    label: 'Encrypted Connections',
    icon: ICONS.globe,
    items: [
      'All data travels through encrypted channels',
      'Security certificates are managed automatically',
      'Browsers are required to use secure connections',
    ],
  },
  {
    id: 'cors',
    label: 'Access Controls',
    icon: ICONS.shield,
    items: [
      'Staff-only features require authorization',
      'Only approved applications can access data',
      'Security checks happen before any data loads',
    ],
  },
  {
    id: 'auth',
    label: 'Buyer Verification',
    icon: ICONS.outreach,
    items: [
      'Each buyer gets a unique, time-limited link',
      'Links work once and automatically expire',
      'Buyers never need to create an account',
    ],
  },
  {
    id: 'db',
    label: 'Encrypted Storage',
    icon: ICONS.database,
    items: [
      'Portal database is encrypted at rest',
      'FileMaker data is encrypted at rest',
      'Database queries are protected against tampering',
    ],
  },
];

function LayerCard({ layer }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-4 rounded-lg border border-accent/20 bg-accent/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-accent/10">
      <div className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center mb-2 shadow-sm">
        <AppIcon icon={layer.icon} size={18} />
      </div>
      <h4 className="text-xs font-bold text-text mb-2">{layer.label}</h4>
      <div className="space-y-1 w-full">
        {layer.items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 text-left">
            <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0 mt-1.5" />
            <span className="text-[10px] text-muted leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SecurityLayers() {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {LAYERS.map((layer) => (
        <LayerCard key={layer.id} layer={layer} />
      ))}
    </div>
  );
}
