import React, { useState, useEffect, useCallback } from 'react';
import ICONS from '../icons/iconMap';
import { Card, AdminPageHeader } from '../components/ui';
import { AppIcon } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { DataFlowDiagram, SecurityLayers, MacOSWindow } from '../components/bridge';

/* ── Status indicator dot ───────────────────── */

function StatusDot({ connected, size = 'md' }) {
  const sizes = { sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3 w-3' };
  const dotSize = sizes[size] || sizes.md;
  const color = connected ? 'bg-accent' : 'bg-danger';
  const ping = connected ? 'bg-accent/60' : 'bg-danger/60';

  return (
    <span className="relative flex">
      {connected && (
        <span className={`animate-ping absolute inline-flex ${dotSize} rounded-full ${ping} opacity-75`} />
      )}
      <span className={`relative inline-flex ${dotSize} rounded-full ${color}`} />
    </span>
  );
}

/* ── Sync button (replaces credentials chip) ── */

function SyncButton({ connected, loading, onSync }) {
  return (
    <button
      onClick={onSync}
      disabled={loading}
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-accent/25 bg-accent/5 hover:bg-accent/10 transition-all duration-150 group disabled:opacity-60"
    >
      {/* Left arrow (FM → Portal) */}
      <span className="text-[9px] font-mono text-muted hidden sm:inline">FM</span>
      <div className="flex items-center gap-0.5">
        <div className="w-3 h-[1.5px] bg-accent/40" />
        <div className="w-0 h-0 border-l-[3px] border-l-accent/50 border-y-[2px] border-y-transparent" />
      </div>

      {/* Center icon */}
      <div className={`w-6 h-6 rounded bg-accent text-white flex items-center justify-center shadow-sm ${loading ? 'animate-spin' : 'group-hover:scale-105'} transition-transform`}>
        <AppIcon icon={ICONS.sync} size={13} />
      </div>

      {/* Right arrow (Portal → FM) */}
      <div className="flex items-center gap-0.5">
        <div className="w-0 h-0 border-r-[3px] border-r-accent/50 border-y-[2px] border-y-transparent" />
        <div className="w-3 h-[1.5px] bg-accent/40" />
      </div>
      <span className="text-[9px] font-mono text-muted hidden sm:inline">Portal</span>

      {/* Status dot */}
      <StatusDot connected={connected} size="sm" />
    </button>
  );
}

/* ── System health bar ─────────────────────── */

function SystemHealthBar({ status }) {
  const checks = [
    { label: 'FileMaker', ok: status?.connected, detail: status?.connected ? `${status.latencyMs}ms` : 'Disconnected' },
    { label: 'Neon DB', ok: true, detail: 'Connected' },
    { label: 'Vercel', ok: true, detail: 'Deployed' },
    { label: 'Sync', ok: status?.sync?.inSync, detail: status?.sync?.inSync ? 'In sync' : `${status?.sync?.delta || '?'} behind` },
  ];

  const allOk = checks.every(c => c.ok);

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${allOk ? 'bg-accent/5 border-accent/20' : 'bg-warning/5 border-warning/20'}`}>
      <div className="flex items-center gap-2">
        <StatusDot connected={allOk} size="md" />
        <span className={`text-sm font-medium ${allOk ? 'text-accent' : 'text-warning'}`}>
          {allOk ? 'All systems operational' : 'Some systems need attention'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <StatusDot connected={c.ok} size="sm" />
            <span className="text-[10px] font-mono text-muted">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────── */

export default function FileMakerBridge() {
  usePageTitle('How This Portal Works');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/filemaker?action=status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setStatus({ connected: false, configured: false, error: err.message });
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <AdminPageHeader
        title="How This Portal Works"
        subtitle="A behind-the-scenes look at how property data stays accurate and secure"
        icon={ICONS.bookOpen}
        actions={
          <SyncButton
            connected={status?.connected}
            loading={loading || syncing}
            onSync={handleSync}
          />
        }
      />

      {/* 1. Hero Explainer */}
      <div className="animate-fade-slide-up admin-stagger-1">
        <div className="bg-warm-100 rounded-xl border border-warm-200 p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
              <AppIcon icon={ICONS.home} size={20} className="text-accent" />
            </div>
            <div className="max-w-2xl">
              <h2 className="font-heading text-xl font-bold text-text mb-2">
                One system for compliance, connected to your records
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                This portal replaces the manual spreadsheet-and-email workflow. It pulls
                property data directly from your FileMaker database, tracks buyer compliance
                milestones automatically, and sends notices when deadlines pass — all from
                one place.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ICONS.sync,       label: 'Syncs with FileMaker',  detail: 'Property records stay current without manual re-entry' },
              { icon: ICONS.clock,      label: 'Tracks Deadlines',      detail: 'Compliance milestones computed automatically from close date' },
              { icon: ICONS.batchEmail, label: 'Sends Notices',         detail: 'Email outreach from compliance@thelandbank.org in one click' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-white/60 border border-warm-200/60">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center">
                  <AppIcon icon={item.icon} size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text">{item.label}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-snug">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Mac OS Window — signature hero section */}
      <div className="animate-fade-slide-up admin-stagger-2">
        <MacOSWindow />
      </div>

      {/* 3. Data Flow — own section */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-text">How Data Flows</h2>
          <p className="text-sm text-muted mt-1">From buyer submission to staff action — five steps, fully automated</p>
        </div>
        <Card className="p-6 lg:p-8">
          <DataFlowDiagram />
        </Card>
      </div>

      {/* 4. Security — own section */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <AppIcon icon={ICONS.shieldCheck} size={18} className="text-accent" />
            <h2 className="font-heading text-lg font-semibold text-text">End-to-End Encryption</h2>
          </div>
          <p className="text-sm text-muted mt-1">Four layers of security protect every piece of property data</p>
        </div>
        <SecurityLayers />
      </div>

      {/* 5. What Stays in Sync */}
      <div className="animate-fade-slide-up admin-stagger-5">
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-text">What Stays in Sync</h2>
          <p className="text-sm text-muted mt-1">Data flows both ways between FileMaker and the portal</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FROM FileMaker */}
          <Card className="p-5" variant="info">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-info-light flex items-center justify-center">
                <AppIcon icon={ICONS.arrowRight} size={16} className="text-info" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">From FileMaker</h3>
                <p className="text-[11px] text-muted">Syncs every 15 minutes or on demand</p>
              </div>
            </div>
            <ul className="space-y-2">
              {['Property records and addresses', 'Buyer names and contact info', 'Sale dates and program types', 'Sold status and parcel details'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-info flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* BACK TO FileMaker */}
          <Card className="p-5" variant="success">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
                <AppIcon icon={ICONS.arrowLeft} size={16} className="text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">Back to FileMaker</h3>
                <p className="text-[11px] text-muted">Updates sent when staff or buyers take action</p>
              </div>
            </div>
            <ul className="space-y-2">
              {['Buyer compliance submissions and photos', 'Email communication logs', 'Enforcement level changes', 'Staff notes and field edits'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* 6. System Status — quiet footer */}
      <div className="animate-fade-slide-up admin-stagger-6">
        <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-2">System Status</p>
        <SystemHealthBar status={status} />
      </div>
    </div>
  );
}
