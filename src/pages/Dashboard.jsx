import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ICONS from '../icons/iconMap';
import { Card, StatusPill, DataTable, AdminPageHeader } from '../components/ui';
import { AppIcon } from '../components/ui';
import { useProperties } from '../context/PropertyContext';
import {
  getDashboardStats,
  getFirstOverdueMilestoneDate,
  daysOverdue,
} from '../utils/milestones';
import { usePageTitle } from '../hooks/usePageTitle';

/* ── Live clock hook ──────────────────────────── */
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Inline stat (compact number + label) ──────── */
function InlineStat({ label, value, color = 'text-text' }) {
  return (
    <div className="text-center min-w-[60px]">
      <p className={`text-xl font-mono font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-muted font-heading uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

/* ── Action-need card (icon + count + context) ─── */
function ActionNeedCard({ icon, count, label, sublabel, variant = 'warning' }) {
  const colors = {
    warning: { bg: 'bg-warning-light', text: 'text-warning', iconBg: 'bg-warning/15' },
    danger:  { bg: 'bg-danger-light',  text: 'text-danger',  iconBg: 'bg-danger/15' },
  };
  const c = colors[variant] || colors.warning;

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-lg ${c.bg}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-md ${c.iconBg} flex items-center justify-center`}>
        <AppIcon icon={icon} size={16} className={c.text} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-mono font-bold tabular-nums ${c.text}`}>{count}</span>
          <span className="text-xs font-medium text-text truncate">{label}</span>
        </div>
        <p className="text-[10px] text-muted mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

/* ── Security status badge ──────────────────── */
function SecurityBadge() {
  const [checks, setChecks] = useState({ https: false, secureContext: false });
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setChecks({
      https: window.location.protocol === 'https:',
      secureContext: window.isSecureContext === true,
    });
  }, []);

  const isSecure = checks.https && checks.secureContext;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
          isSecure
            ? 'border-accent/30 bg-accent/5 hover:bg-accent/10'
            : 'border-danger/30 bg-danger/5 hover:bg-danger/10'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isSecure && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isSecure ? 'bg-accent' : 'bg-danger'}`} />
        </span>
        <span className={isSecure ? 'text-accent' : 'text-danger'}>
          {isSecure ? 'Secure Connection' : 'Insecure'}
        </span>
        {isSecure && <AppIcon icon={ICONS.shieldCheck} size={12} className="text-accent" />}
      </button>

      {/* Detail popover - compact, overlays inline */}
      {showDetail && (
        <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-surface rounded-md border border-border shadow-sm p-2 z-20 animate-fade-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${checks.https ? 'bg-accent' : 'bg-danger'}`} />
              <span className="text-text">HTTPS</span>
              <span className="ml-auto text-muted font-mono text-[10px]">{checks.https ? 'Active' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${checks.secureContext ? 'bg-accent' : 'bg-danger'}`} />
              <span className="text-text">Secure Context</span>
              <span className="ml-auto text-muted font-mono text-[10px]">{checks.secureContext ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Start Here action card ───────────────── */
function StartHereCard({ overdueCount, onGoToQueue }) {
  if (overdueCount === 0) {
    return (
      <div className="animate-fade-slide-up admin-stagger-1">
        <Card variant="success">
          <div className="flex items-center gap-4 py-1">
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <AppIcon icon={ICONS.success} size={20} className="text-success" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-sm font-semibold text-text">All caught up</h2>
              <p className="text-xs text-muted mt-0.5">No overdue properties right now. Great work!</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-slide-up admin-stagger-1">
      <Card variant="warning">
        <div className="flex flex-wrap items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-mono font-bold text-warning tabular-nums">{overdueCount}</span>
            </div>
            <div>
              <h2 className="font-heading text-sm font-semibold text-text">Start Here</h2>
              <p className="text-xs text-muted mt-0.5">
                {overdueCount} propert{overdueCount === 1 ? 'y needs' : 'ies need'} compliance action today
              </p>
            </div>
          </div>
          <button
            onClick={onGoToQueue}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            <AppIcon icon={ICONS.actionQueue} size={15} />
            <span>Open Action Queue</span>
            <AppIcon icon={ICONS.arrowRight} size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────── */
const Dashboard = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { properties } = useProperties();
  const now = useLiveClock();

  // Calculate dashboard stats
  const stats = useMemo(() => getDashboardStats(properties), [properties]);

  // Compliance rate
  const complianceRate = useMemo(() => {
    if (stats.totalActiveCases === 0) return 0;
    return Math.round((stats.compliantCount / stats.totalActiveCases) * 100);
  }, [stats]);

  // Get properties needing attention - sorted by most overdue first
  const propertiesNeedingAttention = useMemo(() => {
    return properties
      .map((prop) => {
        const firstOverdueDate = getFirstOverdueMilestoneDate(prop);
        const overdueDays = firstOverdueDate ? daysOverdue(firstOverdueDate) : 0;
        return { ...prop, overdueDays };
      })
      .filter((prop) => prop.overdueDays > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 10);
  }, [properties]);

  // Action-needed stats
  const actionStats = useMemo(() => {
    const needs1st = properties.filter(
      (p) => !p.compliance1stAttempt && p.enforcementLevel > 0
    ).length;
    const needs2nd = properties.filter(
      (p) => p.compliance1stAttempt && !p.compliance2ndAttempt && p.enforcementLevel > 0
    ).length;
    const noEmail = properties.filter(
      (p) => (!p.buyerEmail || p.buyerEmail.trim() === '') && p.enforcementLevel > 0
    ).length;
    return { needs1st, needs2nd, noEmail, total: needs1st + needs2nd + noEmail };
  }, [properties]);

  // DataTable columns
  const columns = [
    {
      key: 'address',
      header: 'Address',
      render: (value) => (
        <span className="text-sm font-medium text-accent">{value}</span>
      ),
    },
    {
      key: 'buyerName',
      header: 'Buyer',
      render: (value) => (
        <span className="text-sm text-text">{value || '-'}</span>
      ),
    },
    {
      key: 'programType',
      header: 'Program',
      render: (value) => (
        <StatusPill variant="default">{value}</StatusPill>
      ),
    },
    {
      key: 'enforcementLevel',
      header: 'Level',
      render: (value) => {
        const variant =
          value === 0 ? 'success' : value <= 2 ? 'warning' : 'danger';
        return <StatusPill variant={variant}>{value}</StatusPill>;
      },
    },
    {
      key: 'overdueDays',
      header: 'Days Overdue',
      render: (value) => (
        <span
          className={`text-sm font-mono font-semibold tabular-nums ${
            value > 30
              ? 'text-danger'
              : value > 14
                ? 'text-warning'
                : 'text-text'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  // Build table data
  const tableData = propertiesNeedingAttention.map((prop) => ({
    id: prop.id,
    address: prop.address,
    buyerName: prop.buyerName,
    programType: prop.programType,
    enforcementLevel: prop.enforcementLevel,
    overdueDays: prop.overdueDays,
  }));

  const todayFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const greeting = getGreeting(now.getHours());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${greeting}`}
        subtitle={`${todayFormatted} \u00b7 ${timeFormatted}`}
        icon={ICONS.dashboard}
        actions={<SecurityBadge />}
      />

      <StartHereCard
        overdueCount={propertiesNeedingAttention.length}
        onGoToQueue={() => navigate('/action-queue')}
      />

      {/* ── Section 1: Compliance Scorecard ──────── */}
      <div className="animate-fade-slide-up admin-stagger-2">
        <div className="flex flex-wrap items-center gap-8 py-4 border-b border-warm-200/60">
          {/* Hero stat: compliance rate */}
          <div className="flex-shrink-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-display font-bold text-accent tabular-nums">
                {complianceRate}%
              </span>
              <span className="text-xs text-muted font-heading uppercase tracking-wider">
                Compliance Rate
              </span>
            </div>
            <div className="mt-2 h-1.5 w-36 bg-warm-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-warm-200/60" />

          {/* Inline stat group */}
          <div className="flex items-center gap-6">
            <InlineStat label="Active" value={stats.totalActiveCases} />
            <InlineStat label="On Track" value={stats.compliantCount} color="text-success" />
            <InlineStat label="Attention" value={stats.warningCount} color="text-warning" />
            <InlineStat label="At Risk" value={stats.defaultCount} color="text-danger" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Needs Your Attention ──────── */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <Card variant={actionStats.total > 5 ? 'danger' : actionStats.total > 0 ? 'warning' : 'success'}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="font-heading text-base font-semibold text-text">
                Needs Your Attention
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {actionStats.total} item{actionStats.total !== 1 ? 's' : ''} require action
              </p>
            </div>
            <Link
              to="/action-queue"
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              <AppIcon icon={ICONS.actionQueue} size={15} />
              <span>Open Action Queue</span>
              <AppIcon icon={ICONS.arrowRight} size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActionNeedCard
              icon={ICONS.warning}
              count={actionStats.needs1st}
              label="Need 1st Contact"
              sublabel="No outreach attempt on file"
              variant="warning"
            />
            <ActionNeedCard
              icon={ICONS.clock}
              count={actionStats.needs2nd}
              label="Need Follow-Up"
              sublabel="1st attempt sent, no response"
              variant="warning"
            />
            <ActionNeedCard
              icon={ICONS.alert}
              count={actionStats.noEmail}
              label="Missing Email"
              sublabel="Cannot send electronic notice"
              variant="danger"
            />
          </div>
        </Card>
      </div>

      {/* ── Section 3: Overdue Properties ────────── */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-semibold text-text">
            Overdue Properties
          </h2>
          {tableData.length > 0 && (
            <span className="text-xs font-mono font-medium text-danger bg-danger-light px-2.5 py-1 rounded-full tabular-nums">
              {tableData.length} overdue
            </span>
          )}
        </div>
        {tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData}
            onRowClick={(row) => navigate(`/properties/${row.id}`)}
            mobileColumns={['address', 'enforcementLevel', 'overdueDays']}
            mobileTitle="address"
            compact
          />
        ) : (
          <div className="text-center py-8 bg-surface rounded-lg border border-border">
            <ICONS.success className="w-8 h-8 text-success mx-auto mb-2" strokeWidth={1.75} />
            <p className="text-sm text-muted">All properties are on track</p>
          </div>
        )}
      </div>

      {/* ── Section 4: Program Breakdown ─────────── */}
      <div className="animate-fade-slide-up admin-stagger-5">
        <h2 className="font-heading text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Programs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Featured Homes', value: stats.programBreakdown.featuredHomes },
            { label: 'Ready4Rehab', value: stats.programBreakdown.r4r },
            { label: 'Demolition', value: stats.programBreakdown.demo },
            { label: 'VIP', value: stats.programBreakdown.vip },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3.5 rounded-lg bg-surface border border-border hover:shadow-md hover:border-accent/20 transition-all duration-150 cursor-default">
              <p className="text-lg font-mono font-semibold text-text tabular-nums">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
