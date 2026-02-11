import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ICONS from '../icons/iconMap';
import { Card, StatCard, StatusPill, DataTable, AdminPageHeader } from '../components/ui';
import { useProperties } from '../context/PropertyContext';
import {
  getDashboardStats,
  getFirstOverdueMilestoneDate,
  daysOverdue,
} from '../utils/milestones';

const Dashboard = () => {
  const navigate = useNavigate();
  const { properties } = useProperties();

  // Calculate dashboard stats
  const stats = useMemo(() => getDashboardStats(properties), [properties]);

  // Get properties needing attention — sorted by most overdue first
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
    return { needs1st, needs2nd, noEmail };
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
        <span className="text-sm text-text">{value || '—'}</span>
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

  // Build table data with correct field names
  const tableData = propertiesNeedingAttention.map((prop) => ({
    id: prop.id,
    address: prop.address,
    buyerName: prop.buyerName,
    programType: prop.programType,
    enforcementLevel: prop.enforcementLevel,
    overdueDays: prop.overdueDays,
  }));

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        subtitle={todayFormatted}
        icon={ICONS.dashboard}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Total Properties"
          value={stats.totalActiveCases}
          icon={ICONS.compliance}
          variant="default"
        />
        <StatCard
          label="Compliant"
          value={stats.compliantCount}
          icon={ICONS.success}
          variant="success"
        />
        <StatCard
          label="Needs Attention"
          value={stats.warningCount}
          icon={ICONS.warning}
          variant="warning"
        />
        <StatCard
          label="At Risk"
          value={stats.defaultCount}
          icon={ICONS.alert}
          variant="danger"
        />
      </div>

      {/* Program Breakdown */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <Card>
          <h2 className="font-heading text-sm font-semibold text-text mb-5">
            Program Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Featured Homes', value: stats.programBreakdown.featuredHomes },
              { label: 'Ready4Rehab', value: stats.programBreakdown.r4r },
              { label: 'Demolition', value: stats.programBreakdown.demo },
              { label: 'VIP', value: stats.programBreakdown.vip },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-mono font-semibold text-text tabular-nums">
                  {value}
                </p>
                <p className="text-xs text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Queue CTA — primary demo entry point */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <Link
          to="/action-queue"
          className="group flex items-center justify-between p-5 rounded-lg bg-accent/5 border-2 border-accent/30 hover:border-accent hover:bg-accent/10 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
              <ICONS.actionQueue className="w-5 h-5 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-accent">
                Open Action Queue
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {actionStats.needs1st + actionStats.needs2nd} properties need compliance action — review, select, and mail merge in one step
              </p>
            </div>
          </div>
          <ICONS.arrowRight className="w-5 h-5 text-accent/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" strokeWidth={1.75} />
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-slide-up admin-stagger-4">
        <Link
          to="/milestones"
          className="group flex items-center gap-3 p-4 rounded-lg border-2 border-warm-200 hover:border-accent transition-colors"
        >
          <ICONS.milestones className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" strokeWidth={1.75} />
          <div>
            <h3 className="font-heading text-xs font-semibold text-text group-hover:text-accent transition-colors">
              Milestones
            </h3>
            <p className="text-[10px] text-muted mt-0.5 hidden md:block">Deadlines &amp; schedules</p>
          </div>
        </Link>
        <Link
          to="/compliance"
          className="group flex items-center gap-3 p-4 rounded-lg border-2 border-warm-200 hover:border-accent transition-colors"
        >
          <ICONS.compliance className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" strokeWidth={1.75} />
          <div>
            <h3 className="font-heading text-xs font-semibold text-text group-hover:text-accent transition-colors">
              Compliance
            </h3>
            <p className="text-[10px] text-muted mt-0.5 hidden md:block">Status &amp; requirements</p>
          </div>
        </Link>
        <Link
          to="/map"
          className="group flex items-center gap-3 p-4 rounded-lg border-2 border-warm-200 hover:border-accent transition-colors"
        >
          <ICONS.mapPin className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" strokeWidth={1.75} />
          <div>
            <h3 className="font-heading text-xs font-semibold text-text group-hover:text-accent transition-colors">
              Map View
            </h3>
            <p className="text-[10px] text-muted mt-0.5 hidden md:block">Geographic overview</p>
          </div>
        </Link>
        <Link
          to="/audit"
          className="group flex items-center gap-3 p-4 rounded-lg border-2 border-warm-200 hover:border-accent transition-colors"
        >
          <ICONS.auditTrail className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" strokeWidth={1.75} />
          <div>
            <h3 className="font-heading text-xs font-semibold text-text group-hover:text-accent transition-colors">
              Audit Trail
            </h3>
            <p className="text-[10px] text-muted mt-0.5 hidden md:block">Compliance history</p>
          </div>
        </Link>
      </div>

      {/* Action Needed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-slide-up admin-stagger-5">
        <StatCard
          label="Needs 1st Attempt"
          value={actionStats.needs1st}
          icon={ICONS.warning}
          variant="warning"
        />
        <StatCard
          label="Needs 2nd Attempt"
          value={actionStats.needs2nd}
          icon={ICONS.clock}
          variant="warning"
        />
        <StatCard
          label="No Email on File"
          value={actionStats.noEmail}
          icon={ICONS.alert}
          variant="danger"
        />
      </div>

      {/* Properties Needing Attention */}
      <div className="animate-fade-slide-up admin-stagger-6">
        <h2 className="font-heading text-base font-semibold text-text mb-3">
          Properties Needing Attention
        </h2>
        <div className="h-px bg-warm-200 mb-4" />
        {tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData}
            onRowClick={(row) => navigate(`/properties/${row.id}`)}
            mobileColumns={['address', 'enforcementLevel', 'overdueDays']}
            mobileTitle="address"
          />
        ) : (
          <div className="text-center py-8 bg-surface rounded-lg border border-border">
            <ICONS.success className="w-8 h-8 text-success mx-auto mb-2" strokeWidth={1.75} />
            <p className="text-sm text-muted">All properties are on track</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
