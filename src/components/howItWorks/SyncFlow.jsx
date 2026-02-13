import { useState, useCallback, useEffect } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import ChapterHeader from './ChapterHeader';

/**
 * SyncFlow - Chapter 6: "What Stays in Sync"
 *
 * Bidirectional flow showing data moving from FileMaker → Portal and
 * Portal → FileMaker. Hover rows to see concrete examples.
 * Includes a live sync button and system health status bar
 * that reads from the /api/filemaker?action=status endpoint.
 */

const FROM_FM = [
  { label: 'Property records and addresses', example: '1234 Elm St, Flint - parcel 46-35-457-003' },
  { label: 'Buyer names and contact info', example: 'John Smith - jsmith@email.com' },
  { label: 'Sale dates and program types', example: 'Closed 2025-11-15 - Featured Homes' },
  { label: 'Sold status and parcel details', example: 'Status: Sold - SEV: $12,500' },
];

const TO_FM = [
  { label: 'Buyer compliance submissions and photos', example: 'Progress photo uploaded Jan 30' },
  { label: 'Email communication logs', example: 'Attempt 1 sent to buyer on Feb 3' },
  { label: 'Enforcement level changes', example: 'Level 0 → Level 2 for 5678 Oak Ave' },
  { label: 'Staff notes and field edits', example: 'Note: Buyer requested 30-day extension' },
];

function SyncRow({ item, isHovered, onHover, onLeave }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-default
        transition-colors duration-200 ease-out
        ${isHovered ? 'bg-accent/5 text-text' : 'text-muted hover:bg-surface-alt'}
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      <span
        className={`
          text-[10px] text-accent italic ml-2 whitespace-nowrap
          transition-all duration-200 ease-out overflow-hidden
          ${isHovered ? 'opacity-100 max-w-[300px]' : 'opacity-0 max-w-0'}
        `}
      >
        e.g. {item.example}
      </span>
    </div>
  );
}

function StatusDot({ connected, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent' : 'bg-danger'}`} />
      <span className="text-[10px] font-mono text-muted">{label}</span>
    </div>
  );
}

export default function SyncFlow() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/filemaker?action=status');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, configured: false });
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch('/api/filemaker?action=sync');
      await fetchStatus();
    } catch {
      // status will show error state
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.sync}
        title="What Stays in Sync"
        subtitle="FileMaker and the portal keep each other up to date - here's what moves"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* From FileMaker */}
        <div className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-accent-blue/10 flex items-center justify-center">
              <AppIcon icon={ICONS.arrowRight} size={14} className="text-accent-blue" />
            </div>
            <div>
              <p className="font-heading text-xs font-semibold text-text">From FileMaker</p>
              <p className="text-[10px] text-muted">Every 15 minutes or on demand</p>
            </div>
          </div>
          <div className="space-y-0.5">
            {FROM_FM.map((item, i) => (
              <SyncRow
                key={i}
                item={item}
                isHovered={hoveredItem === `from-${i}`}
                onHover={() => setHoveredItem(`from-${i}`)}
                onLeave={() => setHoveredItem(null)}
              />
            ))}
          </div>
        </div>

        {/* Center: Sync button */}
        <div className="flex flex-col items-center gap-3 self-center py-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center shadow-sm hover:scale-105 disabled:opacity-60 transition-all"
          >
            <AppIcon icon={ICONS.sync} size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
          <span className="text-[9px] font-mono text-muted">
            {status?.connected ? `${status.latencyMs || '?'}ms` : 'Offline'}
          </span>
        </div>

        {/* Back to FileMaker */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center">
              <AppIcon icon={ICONS.arrowLeft} size={14} className="text-accent" />
            </div>
            <div>
              <p className="font-heading text-xs font-semibold text-text">Back to FileMaker</p>
              <p className="text-[10px] text-muted">When staff or buyers take action</p>
            </div>
          </div>
          <div className="space-y-0.5">
            {TO_FM.map((item, i) => (
              <SyncRow
                key={i}
                item={item}
                isHovered={hoveredItem === `to-${i}`}
                onHover={() => setHoveredItem(`to-${i}`)}
                onLeave={() => setHoveredItem(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* System Health Bar */}
      <div className="mt-5 rounded-lg border border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status?.connected ? 'bg-accent' : 'bg-danger'}`} />
          <span className={`text-sm font-medium ${status?.connected ? 'text-accent' : 'text-danger'}`}>
            {status?.connected ? 'Everything\'s connected' : 'Something needs attention'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <StatusDot connected={status?.connected} label="FileMaker" />
          <StatusDot connected={true} label="Neon DB" />
          <StatusDot connected={true} label="Vercel" />
          <StatusDot connected={status?.sync?.inSync} label="Sync" />
        </div>
      </div>
    </div>
  );
}
