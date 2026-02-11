import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListChecks,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  MailWarning,
} from 'lucide-react';
import { Card, StatCard, StatusPill, AdminPageHeader, SelectInput } from '../components/ui';
import { PROGRAM_TYPES } from '../data/mockData';
import { DEFAULT_TEMPLATES, ACTION_LABELS } from '../data/emailTemplates';
import { computeComplianceTiming } from '../lib/computeDueNow';
import { findTemplateForAction } from '../lib/templateRenderer';
import { formatDate } from '../utils/milestones';
import { EmailPreview } from '../components/EmailPreview';
import { PropertyDetailDrawer } from '../components/PropertyDetailDrawer';
import { useProperties } from '../context/PropertyContext';

/* ── helpers ───────────────────────────────────────────── */

const ACTION_ORDER = ['ATTEMPT_1', 'ATTEMPT_2', 'WARNING', 'DEFAULT_NOTICE'];

const ACTION_ICON = {
  ATTEMPT_1: Info,
  ATTEMPT_2: AlertTriangle,
  WARNING: AlertTriangle,
  DEFAULT_NOTICE: AlertCircle,
};

const ACTION_STAT_VARIANT = {
  ATTEMPT_1: 'info',
  ATTEMPT_2: 'warning',
  WARNING: 'warning',
  DEFAULT_NOTICE: 'danger',
};

const enforcementVariant = (level) =>
  level === 0 ? 'success' : level <= 2 ? 'warning' : 'danger';

const enforcementLabel = (level) =>
  level === 0 ? 'Compliant' : `Level ${level}`;

/* ════════════════════════════════════════════════════════ */

export default function ActionQueue() {
  const navigate = useNavigate();
  const { properties, batchLogCommunications } = useProperties();

  /* ── state ─────────────────────────────────────────────── */
  const [programFilter, setProgramFilter] = useState('All');
  const [selectedByAction, setSelectedByAction] = useState({});
  const [drawerProperty, setDrawerProperty] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewAction, setEmailPreviewAction] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /* ── compute compliance timing for all properties ─────── */
  const timingsMap = useMemo(() => {
    const map = {};
    properties.forEach((p) => {
      map[p.id] = computeComplianceTiming(p);
    });
    return map;
  }, [properties]);

  /* ── build action groups ────────────────────────────────── */
  const { actionGroups, noEmailProperties, awaitingCounts } = useMemo(() => {
    const groups = {};
    ACTION_ORDER.forEach((a) => { groups[a] = []; });
    const noEmail = [];

    // Track properties awaiting response (sent but next step not yet due)
    const awaiting = { ATTEMPT_1: 0, ATTEMPT_2: 0 };

    properties.forEach((prop) => {
      const timing = timingsMap[prop.id];
      if (!timing || timing.error) return;

      // Program filter
      if (programFilter !== 'All' && prop.programType !== programFilter) return;

      // Check if property is due now for an action
      if (timing.isDueNow && ACTION_ORDER.includes(timing.currentAction)) {
        if (!prop.buyerEmail) {
          noEmail.push(prop);
        } else {
          groups[timing.currentAction].push({ ...prop, timing });
        }
      }

      // Track awaiting responses: action was sent but next action is not yet due
      if (timing.actionAlreadySent && timing.currentAction !== 'NOT_DUE_YET') {
        // The action that was already sent is the one recorded, not the current effective one
        // We look at completedActions to determine what's been sent
        if (timing.completedActions?.includes('ATTEMPT_1') && !timing.completedActions?.includes('ATTEMPT_2')) {
          awaiting.ATTEMPT_1++;
        }
        if (timing.completedActions?.includes('ATTEMPT_2') && !timing.completedActions?.includes('WARNING')) {
          awaiting.ATTEMPT_2++;
        }
      }

      // Also check NOT_DUE_YET properties with completed actions for awaiting counts
      if (timing.currentAction === 'NOT_DUE_YET' && timing.completedActions?.length > 0) {
        if (timing.completedActions.includes('ATTEMPT_1') && !timing.completedActions.includes('ATTEMPT_2')) {
          awaiting.ATTEMPT_1++;
        }
        if (timing.completedActions.includes('ATTEMPT_2') && !timing.completedActions.includes('WARNING')) {
          awaiting.ATTEMPT_2++;
        }
      }
    });

    // Sort each group by most overdue first
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => b.timing.daysOverdue - a.timing.daysOverdue)
    );

    return { actionGroups: groups, noEmailProperties: noEmail, awaitingCounts: awaiting };
  }, [properties, timingsMap, programFilter]);

  /* ── stat card counts ───────────────────────────────────── */
  const statCounts = useMemo(() => {
    const counts = {};
    ACTION_ORDER.forEach((a) => { counts[a] = actionGroups[a].length; });
    return counts;
  }, [actionGroups]);

  /* ── selection helpers ──────────────────────────────────── */
  const getSelected = (action) => selectedByAction[action] || new Set();

  const toggleSelection = useCallback((action, id) => {
    setSelectedByAction((prev) => {
      const current = new Set(prev[action] || []);
      current.has(id) ? current.delete(id) : current.add(id);
      return { ...prev, [action]: current };
    });
  }, []);

  const toggleSelectAll = useCallback((action) => {
    setSelectedByAction((prev) => {
      const current = prev[action] || new Set();
      const group = actionGroups[action];
      if (current.size === group.length) {
        return { ...prev, [action]: new Set() };
      }
      return { ...prev, [action]: new Set(group.map((p) => p.id)) };
    });
  }, [actionGroups]);

  /* ── mail merge handler ─────────────────────────────────── */
  const handleMailMerge = (action) => {
    setEmailPreviewAction(action);
    setShowEmailPreview(true);
  };

  const selectedPropertiesForPreview = useMemo(() => {
    if (!emailPreviewAction) return [];
    const ids = selectedByAction[emailPreviewAction] || new Set();
    return properties.filter((p) => ids.has(p.id));
  }, [emailPreviewAction, selectedByAction, properties]);

  const handleApproveAndSend = async (entries) => {
    batchLogCommunications(entries);

    const sentCount = entries.length;
    const noEmailCount = noEmailProperties.length;

    // Close preview and clear selection for this action
    setShowEmailPreview(false);
    setEmailPreviewAction(null);
    setSelectedByAction((prev) => ({ ...prev, [emailPreviewAction]: new Set() }));

    // Show success message
    setSuccessMessage({ sentCount, noEmailCount });
    setTimeout(() => setSuccessMessage(null), 8000);
  };

  /* ── drawer handler ─────────────────────────────────────── */
  const handleDrawerPrepareEmail = (property, timing) => {
    // Add property to its action group selection and open preview
    if (timing && timing.currentAction) {
      const action = timing.currentAction;
      setSelectedByAction((prev) => {
        const current = new Set(prev[action] || []);
        current.add(property.id);
        return { ...prev, [action]: current };
      });
      setDrawerProperty(null);
      setEmailPreviewAction(action);
      setShowEmailPreview(true);
    }
  };

  const handleRowClick = (property) => {
    setDrawerProperty(property);
  };

  /* ── active groups (count > 0) ──────────────────────────── */
  const activeActions = ACTION_ORDER.filter((a) => actionGroups[a].length > 0);

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        icon={ListChecks}
        title="Compliance Action Queue"
        subtitle="Properties grouped by required action"
      />

      {/* Success Message */}
      {successMessage && (
        <div className="animate-fade-slide-up">
          <Card className="bg-success-light border-success">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success">
                  Sent {successMessage.sentCount} compliance email{successMessage.sentCount !== 1 ? 's' : ''}.
                  {successMessage.noEmailCount > 0 && (
                    <span> {successMessage.noEmailCount} need snail mail.</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate('/map')}
                  className="text-sm font-medium text-success hover:text-success/80 underline transition-colors"
                >
                  View on Map
                </button>
                <span className="text-success/40">|</span>
                <button
                  onClick={() => navigate('/audit')}
                  className="text-sm font-medium text-success hover:text-success/80 underline transition-colors"
                >
                  Audit Trail
                </button>
                <span className="text-success/40">|</span>
                <button
                  onClick={() => navigate('/communications')}
                  className="text-sm font-medium text-success hover:text-success/80 underline transition-colors"
                >
                  Comm Log
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Needs 1st Attempt"
          value={statCounts.ATTEMPT_1}
          icon={Info}
          variant="info"
        />
        <StatCard
          label="Needs 2nd Attempt"
          value={statCounts.ATTEMPT_2}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          label="Needs Warning"
          value={statCounts.WARNING}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          label="Needs Default Notice"
          value={statCounts.DEFAULT_NOTICE}
          icon={AlertCircle}
          variant="danger"
        />
      </div>

      {/* Program Filter */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <div className="w-full sm:w-56">
          <SelectInput
            value={programFilter}
            onChange={(val) => setProgramFilter(val)}
            options={[
              { value: 'All', label: 'All Programs' },
              ...Object.values(PROGRAM_TYPES).map((t) => ({ value: t, label: t })),
            ]}
          />
        </div>
      </div>

      {/* Action Groups */}
      {activeActions.length === 0 && !noEmailProperties.length && (
        <Card className="animate-fade-slide-up admin-stagger-4">
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <h3 className="text-lg font-heading font-semibold text-text mb-1">All Clear</h3>
            <p className="text-sm text-muted">No properties require compliance action right now.</p>
          </div>
        </Card>
      )}

      {activeActions.map((action, groupIdx) => {
        const group = actionGroups[action];
        const selected = getSelected(action);
        const ActionIcon = ACTION_ICON[action];
        const staggerClass = `admin-stagger-${Math.min(groupIdx + 4, 6)}`;

        return (
          <Card key={action} className={`animate-fade-slide-up ${staggerClass}`}>
            {/* Group Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ActionIcon className={`w-4 h-4 text-${ACTION_STAT_VARIANT[action] === 'info' ? 'info' : ACTION_STAT_VARIANT[action]}`} />
                  <h2 className="text-lg font-semibold text-text font-heading">
                    {ACTION_LABELS[action]}
                  </h2>
                </div>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-alt text-text">
                  {group.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === group.length}
                    onChange={() => toggleSelectAll(action)}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  Select All
                </label>
                <button
                  disabled={selected.size === 0}
                  onClick={() => handleMailMerge(action)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                    selected.size === 0
                      ? 'bg-surface-alt text-muted cursor-not-allowed'
                      : 'text-white bg-accent hover:bg-accent-dark'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Mail Merge ({selected.size})
                </button>
              </div>
            </div>

            {/* Properties Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-warm-100">
                    <th className="px-3 py-3 text-left w-10">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Address</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Buyer</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Program</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Days Over</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Last Contact</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-surface-alt transition-colors cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelection(action, item.id)}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-text max-w-[200px] truncate">
                        {item.address}
                      </td>
                      <td className="px-3 py-3 text-sm text-text hidden sm:table-cell">
                        {item.buyerName}
                      </td>
                      <td className="px-3 py-3 text-sm hidden md:table-cell">
                        <StatusPill variant="default">{item.programType}</StatusPill>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span className={`font-mono font-semibold ${item.timing.daysOverdue > 30 ? 'text-danger' : 'text-text'}`}>
                          {item.timing.daysOverdue}d
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted hidden sm:table-cell">
                        <span className="font-mono">{formatDate(item.timing.lastContactDate)}</span>
                      </td>
                      <td className="px-3 py-3 text-sm hidden md:table-cell">
                        <StatusPill variant={enforcementVariant(item.timing.recommendedEnforcementLevel)}>
                          {enforcementLabel(item.timing.recommendedEnforcementLevel)}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {/* No Email Callout */}
      {noEmailProperties.length > 0 && (
        <Card className="animate-fade-slide-up admin-stagger-5 border-l-[3px] border-l-warning">
          <div className="flex items-start gap-3">
            <MailWarning className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-heading font-semibold text-text mb-1">
                No Email on File ({noEmailProperties.length})
              </h3>
              <p className="text-sm text-muted mb-3">
                These properties need compliance action but have no buyer email. Per SOP, send via snail mail.
              </p>
              <div className="space-y-1.5">
                {noEmailProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between bg-warning-light/50 rounded-md px-3 py-2 cursor-pointer hover:bg-warning-light transition-colors"
                    onClick={() => handleRowClick(prop)}
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{prop.address}</p>
                      <p className="text-xs text-muted">{prop.buyerName} &middot; {prop.programType}</p>
                    </div>
                    <StatusPill variant={ACTION_STAT_VARIANT[timingsMap[prop.id]?.currentAction] || 'warning'}>
                      {ACTION_LABELS[timingsMap[prop.id]?.currentAction] || 'Action Needed'}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Follow-up Summary */}
      <Card className="animate-fade-slide-up admin-stagger-6">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-heading font-semibold text-text mb-1">
              Automatic Follow-ups
            </h3>
            <p className="text-sm text-muted mb-3">
              Properties that have been contacted but haven't responded are automatically tracked.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-surface-alt rounded-md px-4 py-3">
                <p className="text-[11px] font-heading font-semibold text-muted uppercase tracking-wider mb-1">
                  Awaiting Response to 1st Attempt
                </p>
                <p className="text-xl font-mono font-semibold text-text tabular-nums">
                  {awaitingCounts.ATTEMPT_1}
                </p>
              </div>
              <div className="bg-surface-alt rounded-md px-4 py-3">
                <p className="text-[11px] font-heading font-semibold text-muted uppercase tracking-wider mb-1">
                  Awaiting Response to 2nd Attempt
                </p>
                <p className="text-xl font-mono font-semibold text-text tabular-nums">
                  {awaitingCounts.ATTEMPT_2}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PropertyDetailDrawer                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {drawerProperty && (
        <PropertyDetailDrawer
          property={drawerProperty}
          timing={timingsMap[drawerProperty.id]}
          onClose={() => setDrawerProperty(null)}
          onPrepareEmail={() => handleDrawerPrepareEmail(drawerProperty, timingsMap[drawerProperty.id])}
        />
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* EmailPreview Modal                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      {showEmailPreview && selectedPropertiesForPreview.length > 0 && (
        <EmailPreview
          properties={selectedPropertiesForPreview}
          templates={DEFAULT_TEMPLATES}
          timings={timingsMap}
          onClose={() => {
            setShowEmailPreview(false);
            setEmailPreviewAction(null);
          }}
          onApproveAndSend={handleApproveAndSend}
        />
      )}
    </div>
  );
}
