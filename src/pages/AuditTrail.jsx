import React, { useState, useMemo } from 'react';
import { Search, Mail, FileText, ChevronDown, ChevronUp, Calendar, MessageSquare, CheckCircle2, AlertTriangle, AlertOctagon, Info, Phone } from 'lucide-react';
import ICONS from '../icons/iconMap';
import { Card, StatCard, StatusPill, AdminPageHeader, AppIcon } from '../components/ui';
import { useProperties } from '../context/PropertyContext';
import { computeComplianceTiming } from '../lib/computeDueNow';
import { formatDate } from '../utils/milestones';
import { usePageTitle } from '../hooks/usePageTitle';

/* ── Timeline event builder ─────────────────────────────── */

/**
 * Build a sorted chronological timeline from multiple property data sources.
 * Merges dateSold, communications, compliance attempt dates, and proof of investment.
 */
function buildTimeline(property) {
  const events = [];
  const commDates = new Set();

  // Communications - each gets an event
  if (property.communications?.length) {
    property.communications.forEach((comm) => {
      const key = `${comm.action || ''}-${comm.date}`;
      commDates.add(key);
      events.push({
        date: comm.date,
        label: comm.template || comm.action || 'Communication',
        type: comm.type || 'email',
        category: categorizeAction(comm.action, comm.template),
        detail: comm.subject || null,
        status: comm.status,
      });
    });
  }

  // Property closed
  if (property.dateSold) {
    events.push({
      date: property.dateSold,
      label: 'Property Closed',
      type: 'system',
      category: 'info',
      detail: `${property.programType} program`,
      status: 'complete',
    });
  }

  // 1st Compliance Attempt - only if not already represented in comms
  if (property.compliance1stAttempt) {
    const alreadyInComms = property.communications?.some(
      (c) => c.action === 'ATTEMPT_1' && c.date === property.compliance1stAttempt
    );
    if (!alreadyInComms) {
      events.push({
        date: property.compliance1stAttempt,
        label: '1st Compliance Attempt Sent',
        type: 'system',
        category: 'info',
        detail: null,
        status: 'complete',
      });
    }
  }

  // 2nd Compliance Attempt
  if (property.compliance2ndAttempt) {
    const alreadyInComms = property.communications?.some(
      (c) => c.action === 'ATTEMPT_2' && c.date === property.compliance2ndAttempt
    );
    if (!alreadyInComms) {
      events.push({
        date: property.compliance2ndAttempt,
        label: '2nd Compliance Attempt Sent',
        type: 'system',
        category: 'warning',
        detail: null,
        status: 'complete',
      });
    }
  }

  // Proof of Investment received
  if (property.dateProofOfInvestProvided) {
    events.push({
      date: property.dateProofOfInvestProvided,
      label: 'Proof of Investment Received',
      type: 'system',
      category: 'positive',
      detail: null,
      status: 'complete',
    });
  }

  // Sort chronologically (oldest first)
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return events;
}

/**
 * Categorize an event for color-coding the timeline dot.
 *   positive  = green (proof received, compliant actions)
 *   info      = blue  (close, first attempt, informational)
 *   warning   = amber (second attempts, formal warnings)
 *   danger    = red   (defaults, legal remedies)
 */
function categorizeAction(action, template) {
  if (!action && !template) return 'info';
  const a = (action || '').toUpperCase();
  const t = (template || '').toLowerCase();

  if (a === 'DEFAULT_NOTICE' || a === 'LEGAL' || t.includes('default') || t.includes('legal')) return 'danger';
  if (a === 'WARNING' || a === 'ATTEMPT_2' || t.includes('warning') || t.includes('2nd')) return 'warning';
  if (t.includes('proof') || t.includes('received') || t.includes('compliant')) return 'positive';
  return 'info';
}

/* ── Dot and badge color mappings ───────────────────────── */

const DOT_COLORS = {
  positive: 'bg-success border-success-light',
  info:     'bg-accent-blue border-info-light',
  warning:  'bg-warning border-warning-light',
  danger:   'bg-danger border-danger-light',
};

const TYPE_BADGE = {
  email:  { label: 'Email',  icon: Mail,           cls: 'bg-info-light text-accent-blue' },
  mail:   { label: 'Mail',   icon: FileText,       cls: 'bg-warm-100 text-text-secondary' },
  phone:  { label: 'Phone',  icon: Phone,          cls: 'bg-warning-light text-warning' },
  system: { label: 'System', icon: Info,            cls: 'bg-surface-alt text-muted' },
};

/* ── Enforcement level helpers ──────────────────────────── */

function enforcementVariant(level) {
  if (level === 0) return 'success';
  if (level <= 2) return 'warning';
  return 'danger';
}

function enforcementLabel(level) {
  const labels = ['Compliant', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];
  return labels[level] ?? `Level ${level}`;
}

/* ── Main component ─────────────────────────────────────── */

export default function AuditTrail() {
  usePageTitle('Audit Trail');
  const { properties } = useProperties();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(15);

  // Compute compliance timing for each property (memoized)
  const propertyTimings = useMemo(() => {
    const map = {};
    properties.forEach((p) => {
      map[p.id] = computeComplianceTiming(p);
    });
    return map;
  }, [properties]);

  // Summary stats
  const stats = useMemo(() => {
    let withComms = 0;
    let compliant = 0;
    let needsAction = 0;

    properties.forEach((p) => {
      if (p.communications?.length > 0) withComms++;
      if (p.enforcementLevel === 0) compliant++;
      const timing = propertyTimings[p.id];
      if (timing && !timing.error && timing.isDueNow) needsAction++;
    });

    return {
      total: properties.length,
      withComms,
      compliant,
      needsAction,
    };
  }, [properties, propertyTimings]);

  // Filtered list
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return properties;
    const q = searchTerm.toLowerCase();
    return properties.filter(
      (p) =>
        p.address.toLowerCase().includes(q) ||
        p.buyerName.toLowerCase().includes(q)
    );
  }, [properties, searchTerm]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Toggle expand
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <AdminPageHeader
        icon={ICONS.auditTrail}
        title="Audit Trail"
        subtitle="Complete compliance history and document retention timeline"
      />

      {/* ── Summary Stats ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Total Properties"
          value={stats.total}
          icon={ICONS.properties}
          variant="default"
        />
        <StatCard
          label="With Communications"
          value={stats.withComms}
          icon={ICONS.communication}
          variant="info"
        />
        <StatCard
          label="Compliant"
          value={stats.compliant}
          icon={ICONS.success}
          variant="success"
        />
        <StatCard
          label="Needs Action"
          value={stats.needsAction}
          icon={ICONS.warning}
          variant="danger"
        />
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by address or buyer name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(15);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-input rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* ── Property List ───────────────────────────────── */}
      <div className="space-y-3 animate-fade-slide-up admin-stagger-4">
        {visible.length === 0 && (
          <Card className="text-center py-12">
            <AppIcon icon={ICONS.search} size={24} className="mx-auto text-muted mb-3" />
            <p className="text-sm text-muted">No properties match your search.</p>
          </Card>
        )}

        {visible.map((property) => {
          const isExpanded = expandedIds.has(property.id);
          const timeline = isExpanded ? buildTimeline(property) : [];
          const commCount = property.communications?.length || 0;

          return (
            <Card
              key={property.id}
              padding="p-0"
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* ── Collapsed row ─────────────────────────── */}
              <button
                type="button"
                onClick={() => toggleExpand(property.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 text-left group"
              >
                {/* Address + Buyer */}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-semibold text-text truncate">
                    {property.address}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">{property.buyerName}</p>
                </div>

                {/* Program pill */}
                <StatusPill variant="default">{property.programType}</StatusPill>

                {/* Enforcement pill */}
                <StatusPill variant={enforcementVariant(property.enforcementLevel)}>
                  {enforcementLabel(property.enforcementLevel)}
                </StatusPill>

                {/* Comms count badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {commCount}
                </span>

                {/* Close date */}
                <span className="text-xs font-mono text-muted whitespace-nowrap hidden md:inline">
                  {formatDate(property.dateSold)}
                </span>

                {/* Chevron */}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted flex-shrink-0 transition-transform" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted flex-shrink-0 transition-transform group-hover:text-accent" />
                )}
              </button>

              {/* ── Expanded timeline ─────────────────────── */}
              {isExpanded && (
                <div className="border-t border-border bg-warm-100/40 px-5 py-6 animate-fade-slide-up">
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">
                      No compliance events recorded for this property.
                    </p>
                  ) : (
                    <div className="relative ml-2 sm:ml-6">
                      {/* Vertical line */}
                      <div className="absolute left-[7px] top-3 bottom-3 w-px bg-warm-200" aria-hidden="true" />

                      <ol className="space-y-6">
                        {timeline.map((event, idx) => {
                          const dotColor = DOT_COLORS[event.category] || DOT_COLORS.info;
                          const badge = TYPE_BADGE[event.type] || TYPE_BADGE.system;
                          const BadgeIcon = badge.icon;

                          return (
                            <li key={idx} className="relative flex gap-4">
                              {/* Dot */}
                              <div
                                className={`relative z-10 flex-shrink-0 w-[15px] h-[15px] rounded-full border-[3px] ${dotColor} mt-0.5`}
                              />

                              {/* Content */}
                              <div className="flex-1 min-w-0 -mt-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Date */}
                                  <time className="text-xs font-mono text-muted whitespace-nowrap">
                                    {formatDate(event.date)}
                                  </time>

                                  {/* Type badge */}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label font-medium tracking-wide ${badge.cls}`}
                                  >
                                    <BadgeIcon className="w-3 h-3" />
                                    {badge.label}
                                  </span>
                                </div>

                                {/* Event label */}
                                <p className="text-sm font-medium text-text mt-1">
                                  {event.label}
                                </p>

                                {/* Optional detail */}
                                {event.detail && (
                                  <p className="text-xs text-muted mt-0.5">{event.detail}</p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Show More ───────────────────────────────────── */}
      {hasMore && (
        <div className="flex justify-center pt-2 animate-fade-slide-up admin-stagger-5">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + 15)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-accent bg-accent-light hover:bg-accent hover:text-white border border-accent/20 rounded-lg transition-colors"
          >
            Show More
            <span className="font-mono text-xs opacity-70">
              ({filtered.length - visibleCount} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
