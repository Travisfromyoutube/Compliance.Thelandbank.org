import { useState } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import ChapterHeader from './ChapterHeader';

/**
 * SecurityStack — Chapter 5: "How Data Stays Safe"
 *
 * Four peelable layer cards stacked with offset. Click the top card
 * to "peel" it away and reveal the next layer. Progress dots on the
 * right let you jump or reset.
 *
 * Each layer has a distinct color from the design spec:
 * TLS (green), CORS (blue), Buyer Tokens (amber), Encrypted DB (purple).
 */

const LAYERS = [
  {
    id: 'tls',
    label: 'Encrypted Connections',
    icon: ICONS.globe,
    color: '#2d7a4a',
    items: [
      'Everything between your browser and the server is encrypted.',
      'Security certificates renew automatically — nothing to manage.',
      'Plain HTTP connections get redirected to HTTPS.',
    ],
  },
  {
    id: 'cors',
    label: 'Access Controls',
    icon: ICONS.shield,
    color: '#2b5f8a',
    items: [
      'Staff pages are locked behind login.',
      'Only the portal itself can talk to its own API.',
      'Every request gets checked before any data loads.',
    ],
  },
  {
    id: 'auth',
    label: 'Buyer Verification',
    icon: ICONS.outreach,
    color: '#b07d2e',
    items: [
      'Buyers get a unique link that\'s tied to their property.',
      'Once used (or after it times out), the link stops working.',
      'No passwords, no accounts — just click and submit.',
    ],
  },
  {
    id: 'db',
    label: 'Encrypted Storage',
    icon: ICONS.database,
    color: '#7c3aed',
    items: [
      'The portal\'s database is encrypted even when nothing\'s running.',
      'FileMaker\'s data is encrypted the same way.',
      'All database queries are parameterized — no SQL injection.',
    ],
  },
];

export default function SecurityStack() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < LAYERS.length - 1) setActiveIndex((i) => i + 1);
  };

  const handleReset = () => setActiveIndex(0);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.shieldCheck}
        title="How Data Stays Safe"
        subtitle="Peel back each layer to see how buyer and property data is protected"
      />

      <div className="flex gap-6">
        {/* Layer stack */}
        <div className="flex-1 relative" style={{ minHeight: '220px' }}>
          {LAYERS.map((layer, i) => {
            const isPeeled = i < activeIndex;
            const isActive = i === activeIndex;
            const offset = (i - activeIndex) * 12;

            return (
              <div
                key={layer.id}
                className={`
                  absolute inset-x-0 rounded-lg border bg-white p-5 shadow-sm
                  transition-all duration-300 cursor-pointer
                  ${isPeeled ? 'opacity-0 -translate-y-5 pointer-events-none' : ''}
                  ${isActive ? 'z-20' : 'z-10'}
                `}
                style={{
                  top: isPeeled ? 0 : `${offset}px`,
                  borderLeftWidth: '4px',
                  borderLeftColor: layer.color,
                }}
                onClick={isActive ? handleNext : () => setActiveIndex(i)}
              >
                {isActive ? (
                  <>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${layer.color}15` }}
                      >
                        <AppIcon icon={layer.icon} size={16} style={{ color: layer.color }} />
                      </div>
                      <h3 className="font-heading text-sm font-bold" style={{ color: layer.color }}>{layer.label}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {layer.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: layer.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {i < LAYERS.length - 1 && (
                      <p className="text-[10px] text-muted mt-3 font-medium">Click to reveal next layer &rarr;</p>
                    )}
                  </>
                ) : (
                  <p className="font-heading text-xs font-semibold" style={{ color: layer.color }}>{layer.label}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="flex flex-col items-center gap-2 pt-2">
          {LAYERS.map((layer, i) => (
            <button
              key={layer.id}
              onClick={() => setActiveIndex(i)}
              className="w-3 h-3 rounded-full border-2 transition-all duration-200"
              style={{
                borderColor: layer.color,
                background: i <= activeIndex ? layer.color : 'transparent',
              }}
              title={layer.label}
            />
          ))}
          {activeIndex > 0 && (
            <button
              onClick={handleReset}
              className="text-[9px] text-muted hover:text-accent mt-1 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
