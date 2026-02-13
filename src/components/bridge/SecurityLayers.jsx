import React from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

/**
 * SecurityLayers — Stacked defense-in-depth visualization
 *
 * Shows 4 security layers as nested horizontal bars, narrowing toward the center.
 * Each layer lists its protections. The innermost layer shows "Your Data" with a shield.
 *
 * Uses DOM elements for crisp rendering. The nested indentation visually communicates
 * that each layer wraps around the ones inside it (defense-in-depth).
 */

const LAYERS = [
  {
    id: 'tls',
    label: 'HTTPS / TLS 1.3',
    icon: ICONS.globe,
    color: 'bg-emerald-600',
    colorLight: 'bg-emerald-50',
    colorBorder: 'border-emerald-200',
    colorText: 'text-emerald-700',
    colorMuted: 'text-emerald-600/70',
    items: [
      'All traffic encrypted in transit',
      'Automatic SSL certificates via Vercel',
      'HSTS headers prevent downgrade attacks',
    ],
  },
  {
    id: 'cors',
    label: 'CORS & Edge Middleware',
    icon: ICONS.shield,
    color: 'bg-blue-500',
    colorLight: 'bg-blue-50',
    colorBorder: 'border-blue-200',
    colorText: 'text-blue-700',
    colorMuted: 'text-blue-600/70',
    items: [
      'API routes gated by ADMIN_API_KEY',
      'CORS restricts cross-origin requests',
      'Edge middleware runs before functions',
    ],
  },
  {
    id: 'auth',
    label: 'API Auth + Buyer Tokens',
    icon: ICONS.outreach,
    color: 'bg-amber-500',
    colorLight: 'bg-amber-50',
    colorBorder: 'border-amber-200',
    colorText: 'text-amber-700',
    colorMuted: 'text-amber-600/70',
    items: [
      'Unique time-limited access links per buyer',
      'Tokens are single-use and expire after submission',
      'No login required — secure by design',
    ],
  },
  {
    id: 'db',
    label: 'Encrypted Database',
    icon: ICONS.database,
    color: 'bg-violet-500',
    colorLight: 'bg-violet-50',
    colorBorder: 'border-violet-200',
    colorText: 'text-violet-700',
    colorMuted: 'text-violet-600/70',
    items: [
      'Neon PostgreSQL: AES-256 encryption at rest',
      'FileMaker Server: built-in encryption at rest',
      'Prisma ORM prevents SQL injection',
    ],
  },
];

/* ── Layer row ────────────────────────────────── */

function LayerRow({ layer, depth }) {
  return (
    <div
      className={`rounded-lg border ${layer.colorBorder} ${layer.colorLight} p-4 transition-all duration-200 hover:shadow-sm`}
      style={{ marginLeft: `${depth * 12}px`, marginRight: `${depth * 12}px` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon badge */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-md ${layer.color} text-white flex items-center justify-center shadow-sm`}>
          <AppIcon icon={layer.icon} size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className={`text-sm font-bold ${layer.colorText}`}>{layer.label}</h4>
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Layer {depth + 1}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {layer.items.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className={`mt-1 w-1 h-1 rounded-full ${layer.color} flex-shrink-0`} />
                <span className={`text-[11px] ${layer.colorMuted}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────── */

export default function SecurityLayers() {
  return (
    <div className="w-full space-y-2">
      {LAYERS.map((layer, i) => (
        <LayerRow key={layer.id} layer={layer} depth={i} />
      ))}

      {/* Core — "Your Data" */}
      <div
        className="rounded-lg border-2 border-emerald-300 bg-white p-4 text-center transition-all duration-200 hover:shadow-md"
        style={{ marginLeft: `${LAYERS.length * 12}px`, marginRight: `${LAYERS.length * 12}px` }}
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <AppIcon icon={ICONS.shieldCheck} size={16} className="text-emerald-600" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-emerald-700 block">Your Data</span>
            <span className="text-[10px] text-emerald-500">Protected by 4 layers of defense</span>
          </div>
        </div>
      </div>
    </div>
  );
}
