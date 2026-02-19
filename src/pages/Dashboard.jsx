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

/* ── Scorecard stat (editorial inline) ────────── */
function ScorecardStat({ label, value, accent }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={`text-lg font-mono font-semibold tabular-nums ${accent || 'text-text'}`}>{value}</span>
      <span className="text-[11px] text-muted font-label">{label}</span>
    </span>
  );
}

/* ── Action-need line item (editorial inline) ─── */
function ActionNeedLine({ icon, count, label, sublabel, isUrgent }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <AppIcon icon={icon} size={14} className={isUrgent ? 'text-danger' : 'text-muted'} />
      <span className={`font-mono font-semibold tabular-nums text-sm ${isUrgent ? 'text-danger' : 'text-text'}`}>
        {count}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text">{label}</span>
        <span className="text-xs text-muted ml-2 hidden sm:inline">- {sublabel}</span>
      </div>
      {isUrgent && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-danger" />
      )}
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
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-0 py-4 border-b border-warm-200/60">
          {/* Left: editorial compliance rate */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-label uppercase tracking-widest text-muted mb-1">Portfolio Compliance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading font-bold text-text tabular-nums tracking-tight">
                {complianceRate}
              </span>
              <span className="text-lg font-heading font-bold text-muted">%</span>
            </div>
            <p className="text-xs text-muted mt-1">
              {stats.compliantCount} of {stats.totalActiveCases} active properties on track
            </p>
          </div>

          {/* Right: compact stat strip with separator dots */}
          <div className="flex items-baseline gap-3 text-sm flex-shrink-0">
            <ScorecardStat label="active" value={stats.totalActiveCases} />
            <span className="text-warm-300">&#183;</span>
            <ScorecardStat label="on track" value={stats.compliantCount} accent="text-accent" />
            <span className="text-warm-300">&#183;</span>
            <ScorecardStat label="attention" value={stats.warningCount} accent="text-warning" />
            <span className="text-warm-300">&#183;</span>
            <ScorecardStat label="at risk" value={stats.defaultCount} accent="text-danger" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Needs Your Attention ──────── */}
      {actionStats.total > 0 && (
        <div className="animate-fade-slide-up admin-stagger-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full bg-warning" />
              <h2 className="font-label text-xs font-semibold text-muted uppercase tracking-widest">
                Needs Attention
              </h2>
              <span className="text-xs font-mono text-warning tabular-nums">{actionStats.total}</span>
            </div>
            <Link
              to="/action-queue"
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
            >
              <span>Action Queue</span>
              <AppIcon icon={ICONS.arrowRight} size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-surface rounded-lg border border-border p-4 divide-y divide-warm-200/50">
            <ActionNeedLine
              icon={ICONS.warning}
              count={actionStats.needs1st}
              label="Need 1st contact"
              sublabel="no outreach attempt on file"
            />
            <ActionNeedLine
              icon={ICONS.clock}
              count={actionStats.needs2nd}
              label="Need follow-up"
              sublabel="1st attempt sent, no response"
            />
            <ActionNeedLine
              icon={ICONS.alert}
              count={actionStats.noEmail}
              label="Missing email address"
              sublabel="cannot send electronic notice"
              isUrgent
            />
          </div>
        </div>
      )}

      {/* ── Section 3: Overdue Properties ────────── */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`w-1 h-5 rounded-full ${tableData.length > 0 ? 'bg-danger' : 'bg-accent'}`} />
            <h2 className="font-label text-xs font-semibold text-muted uppercase tracking-widest">
              Overdue Properties
            </h2>
            {tableData.length > 0 && (
              <span className="text-xs font-mono text-danger tabular-nums">{tableData.length}</span>
            )}
          </div>
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
        <div className="flex items-center gap-3 py-3 border-t border-warm-200/60">
          <p className="text-[11px] font-label uppercase tracking-widest text-muted flex-shrink-0">By Program</p>
          <div className="flex items-baseline gap-4 flex-wrap">
            {[
              { label: 'Featured Homes', value: stats.programBreakdown.featuredHomes },
              { label: 'Ready4Rehab', value: stats.programBreakdown.r4r },
              { label: 'Demolition', value: stats.programBreakdown.demo },
              { label: 'VIP', value: stats.programBreakdown.vip },
            ].map(({ label, value }, i, arr) => (
              <React.Fragment key={label}>
                <span className="inline-flex items-baseline gap-1.5">
                  <span className="text-sm font-mono font-semibold tabular-nums text-text">{value}</span>
                  <span className="text-xs text-muted">{label}</span>
                </span>
                {i < arr.length - 1 && <span className="text-warm-300 text-xs">&#183;</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
