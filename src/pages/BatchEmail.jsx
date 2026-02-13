import React, { useState, useMemo } from 'react';
import { Mail, CheckCircle, ChevronRight, ArrowLeft, Send, Clock, AlertTriangle, CalendarClock, Eye } from 'lucide-react';
import { Card, StatCard, FormField, SelectInput, StatusPill, AdminPageHeader } from '../components/ui';
import { PROGRAM_TYPES, emailTemplates } from '../data/mockData';
import { DEFAULT_TEMPLATES, ACTION_LABELS } from '../data/emailTemplates';
import { computeComplianceTiming } from '../lib/computeDueNow';
import { toDisplayName } from '../lib/programTypeMapper';
import { formatDate } from '../utils/milestones';
import { PropertyDetailDrawer } from '../components/PropertyDetailDrawer';
import { EmailPreview } from '../components/EmailPreview';
import { renderTemplate, findTemplateForAction } from '../lib/templateRenderer';
import { useProperties } from '../context/PropertyContext';
import { usePageTitle } from '../hooks/usePageTitle';

/* ── helpers ───────────────────────────────────────────── */
const enforcementVariant = (level) =>
  level === 0 ? 'success' : level <= 2 ? 'warning' : 'danger';

const enforcementLabel = (level) =>
  level === 0 ? 'Compliant' : `Level ${level}`;

const actionVariant = (action) => {
  if (action === 'NOT_DUE_YET') return 'success';
  if (action === 'ATTEMPT_1') return 'info';
  if (action === 'ATTEMPT_2') return 'warning';
  if (action === 'WARNING') return 'warning';
  return 'danger';
};

/* ════════════════════════════════════════════════════════ */

export default function BatchEmail() {
  usePageTitle('Batch Email');
  /* ── Get properties from PropertyContext ──────────────── */
  const { properties, batchLogCommunications } = useProperties();

  /* ── mode toggle ──────────────────────────────────────── */
  const [mode, setMode] = useState('due-now'); // 'due-now' | 'custom'

  /* ── Due Now state ────────────────────────────────────── */
  const [dueFilter, setDueFilter] = useState('all'); // 'overdue' | 'today' | '7days' | '30days' | 'all'
  const [dueProgramFilter, setDueProgramFilter] = useState('All');
  const [dueSelectedIds, setDueSelectedIds] = useState(new Set());
  const [drawerProperty, setDrawerProperty] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  /* ── Custom mode state (existing wizard) ──────────────── */
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filters, setFilters] = useState({ program: 'All', enforcement: 'All' });

  /* ── Compute compliance timing for all properties ─────── */
  const timingsMap = useMemo(() => {
    const map = {};
    properties.forEach((prop) => {
      map[prop.id] = computeComplianceTiming(prop);
    });
    return map;
  }, [properties]);

  /* ── Due Now: filtered queue ──────────────────────────── */
  const dueNowQueue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return properties
      .map((prop) => {
        const timing = timingsMap[prop.id];
        if (!timing || timing.error) return null;
        return { ...prop, timing };
      })
      .filter(Boolean)
      .filter((item) => {
        // Program filter
        if (dueProgramFilter !== 'All' && item.programType !== dueProgramFilter) return false;

        const { timing } = item;
        if (timing.currentAction === 'NOT_DUE_YET') {
          // Show in 'all' and '30days' if next due is within 30 days
          if (dueFilter === 'all') return true;
          if (dueFilter === '30days' && timing.nextDueDate) {
            const nextDue = new Date(timing.nextDueDate + 'T00:00:00');
            const diffDays = Math.floor((nextDue - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
          }
          return false;
        }

        switch (dueFilter) {
          case 'overdue':
            return timing.daysOverdue > 0;
          case 'today': {
            const dueDate = new Date(timing.dueDate + 'T00:00:00');
            return dueDate.toDateString() === today.toDateString();
          }
          case '7days': {
            const dueDate = new Date(timing.dueDate + 'T00:00:00');
            const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 || timing.daysOverdue > 0;
          }
          case '30days': {
            const dueDate = new Date(timing.dueDate + 'T00:00:00');
            const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 30 || timing.daysOverdue > 0;
          }
          default:
            return true;
        }
      })
      .sort((a, b) => {
        // Sort: overdue first (by most overdue), then by due date
        if (a.timing.daysOverdue !== b.timing.daysOverdue) {
          return b.timing.daysOverdue - a.timing.daysOverdue;
        }
        return new Date(a.timing.dueDate) - new Date(b.timing.dueDate);
      });
  }, [properties, timingsMap, dueFilter, dueProgramFilter]);

  /* ── Due Now: stats ───────────────────────────────────── */
  const dueStats = useMemo(() => {
    const all = properties.map((p) => timingsMap[p.id]).filter((t) => t && !t.error);
    const overdue = all.filter((t) => t.daysOverdue > 0 && t.currentAction !== 'NOT_DUE_YET');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueThisWeek = all.filter((t) => {
      if (t.currentAction === 'NOT_DUE_YET') return false;
      const dueDate = new Date(t.dueDate + 'T00:00:00');
      const diff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    });
    const isDueNow = all.filter((t) => t.isDueNow);
    return {
      total: isDueNow.length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
    };
  }, [properties, timingsMap]);

  /* ── Due Now: selection handlers ──────────────────────── */
  const toggleDueRecipient = (id) => {
    const next = new Set(dueSelectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setDueSelectedIds(next);
  };

  const toggleDueSelectAll = () => {
    if (dueSelectedIds.size === dueNowQueue.length) {
      setDueSelectedIds(new Set());
    } else {
      setDueSelectedIds(new Set(dueNowQueue.map((p) => p.id)));
    }
  };

  const dueSelectedProperties = useMemo(
    () => properties.filter((p) => dueSelectedIds.has(p.id)),
    [properties, dueSelectedIds]
  );

  /* ── Custom mode: handlers (unchanged from original) ──── */
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const programMatch = filters.program === 'All' || prop.programType === filters.program;
      const enforcementMatch = filters.enforcement === 'All' || prop.enforcementLevel === filters.enforcement;
      return programMatch && enforcementMatch;
    });
  }, [properties, filters]);

  const enforcementLevels = useMemo(() => {
    const levels = new Set(properties.map((p) => p.enforcementLevel));
    return Array.from(levels).sort();
  }, [properties]);

  const toggleRecipient = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProperties.map((p) => p.id)));
    }
  };

  const selectedProperties = useMemo(
    () => properties.filter((p) => selectedIds.has(p.id)),
    [properties, selectedIds]
  );

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSend = async () => {
    // For custom mode Step 3, build entries and batch log
    const entries = selectedProperties
      .filter(p => p.buyerEmail)
      .map(prop => {
        const timing = timingsMap[prop.id];
        const template = selectedTemplate;

        if (!template) {
          return null;
        }

        const rendered = renderTemplate(template, timing.currentAction, prop);

        return {
          propertyId: prop.id,
          templateId: template.id,
          templateName: template.name,
          action: timing.currentAction,
          subject: rendered.subject,
          body: rendered.body,
          recipientEmail: prop.buyerEmail
        };
      })
      .filter(Boolean);

    if (entries.length > 0) {
      await batchLogCommunications(entries);
    }

    alert(`Email sent to ${selectedIds.size} properties using template: ${selectedTemplate.name}`);
    setStep(1);
    setSelectedIds(new Set());
    setSelectedTemplate(null);
    setFilters({ program: 'All', enforcement: 'All' });
  };

  const handleApproveAndSend = async (entries) => {
    // Send emails via API, then log communications via PropertyContext
    await batchLogCommunications(entries);
  };

  /* ── Drawer handler ───────────────────────────────────── */
  const handlePrepareEmail = () => {
    setDrawerProperty(null);
    setShowEmailPreview(true);
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader icon={Mail} title="Batch Email" subtitle="Send compliance emails to property buyers" />

      {/* Mode Toggle */}
      <div className="animate-fade-slide-up admin-stagger-2">
        <div className="flex gap-1 p-1 bg-surface-alt rounded-lg w-fit">
          <button
            onClick={() => setMode('due-now')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'due-now'
                ? 'bg-white text-text shadow-sm font-heading'
                : 'text-muted hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Due Now
            </span>
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'custom'
                ? 'bg-white text-text shadow-sm font-heading'
                : 'text-muted hover:text-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Custom
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* DUE NOW MODE                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      {mode === 'due-now' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-slide-up admin-stagger-2">
            <StatCard label="Total Due" value={dueStats.total} icon={CalendarClock} />
            <StatCard label="Overdue" value={dueStats.overdue} icon={AlertTriangle} variant="danger" />
            <StatCard label="Due This Week" value={dueStats.dueThisWeek} icon={Clock} variant="warning" />
          </div>

          {/* Filters */}
          <Card className="animate-fade-slide-up admin-stagger-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Due' },
                  { key: 'overdue', label: 'Overdue' },
                  { key: 'today', label: 'Due Today' },
                  { key: '7days', label: 'Next 7 Days' },
                  { key: '30days', label: 'Next 30 Days' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setDueFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      dueFilter === f.key
                        ? 'bg-accent text-white'
                        : 'bg-surface-alt text-muted hover:text-text'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-48 sm:ml-auto">
                <SelectInput
                  value={dueProgramFilter}
                  onChange={(val) => setDueProgramFilter(val)}
                  options={[
                    { value: 'All', label: 'All Programs' },
                    ...Object.values(PROGRAM_TYPES).map((t) => ({ value: t, label: t })),
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Due Now Queue Table */}
          <Card className="animate-fade-slide-up admin-stagger-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text font-heading">
                  Compliance Queue ({dueNowQueue.length})
                </h2>
                <p className="text-muted text-sm">
                  Selected: {dueSelectedIds.size} of {dueNowQueue.length}
                </p>
              </div>
              <div className="flex gap-2">
                {dueSelectedIds.size > 0 && (
                  <button
                    onClick={() => setShowEmailPreview(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-md transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Emails ({dueSelectedIds.size})
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-warm-100">
                    <th className="px-3 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={dueSelectedIds.size > 0 && dueSelectedIds.size === dueNowQueue.length}
                        onChange={toggleDueSelectAll}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Address</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Buyer</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Program</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Action</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Due Date</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Days Over</th>
                    <th className="px-3 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {dueNowQueue.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-surface-alt transition-colors cursor-pointer"
                      onClick={() => setDrawerProperty(item)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={dueSelectedIds.has(item.id)}
                          onChange={() => toggleDueRecipient(item.id)}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-text max-w-[200px] truncate">
                        {item.address}
                      </td>
                      <td className="px-3 py-3 text-sm text-text">
                        {item.buyerName}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted">
                        {item.programType}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <StatusPill variant={actionVariant(item.timing.currentAction)}>
                          {ACTION_LABELS[item.timing.currentAction] || item.timing.currentAction}
                        </StatusPill>
                      </td>
                      <td className="px-3 py-3 text-sm text-text">
                        <span className="font-mono">{formatDate(item.timing.dueDate)}</span>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span className={item.timing.daysOverdue > 0 ? 'font-mono text-danger font-semibold' : 'font-mono text-muted'}>
                          {item.timing.daysOverdue > 0 ? `${item.timing.daysOverdue}d` : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <StatusPill variant={enforcementVariant(item.timing.recommendedEnforcementLevel)}>
                          {enforcementLabel(item.timing.recommendedEnforcementLevel)}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                  {dueNowQueue.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-center text-muted">
                        No properties match the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* CUSTOM MODE (original 3-step wizard)               */}
      {/* ═══════════════════════════════════════════════════ */}
      {mode === 'custom' && (
        <>
          {/* Progress Indicator */}
          <Card className="animate-fade-slide-up admin-stagger-2">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Select Recipients' },
                { num: 2, label: 'Choose Template' },
                { num: 3, label: 'Review & Send' },
              ].map((s, i) => (
                <React.Fragment key={s.num}>
                  {i > 0 && <ChevronRight className="w-5 h-5 text-muted" />}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-semibold transition-colors ${
                        step >= s.num ? 'bg-accent text-white' : 'bg-surface-alt text-text'
                      }`}
                    >
                      {s.num}
                    </div>
                    <p className={`font-medium hidden sm:block ${step >= s.num ? 'text-text' : 'text-muted'}`}>
                      {s.label}
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* Step 1: Select Recipients */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-text mb-4 font-heading">Filters</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Program Type">
                    <SelectInput
                      value={filters.program}
                      onChange={(value) => setFilters({ ...filters, program: value })}
                      options={[
                        { value: 'All', label: 'All Programs' },
                        ...Object.values(PROGRAM_TYPES).map((type) => ({ value: type, label: type })),
                      ]}
                    />
                  </FormField>
                  <FormField label="Enforcement Level">
                    <SelectInput
                      value={filters.enforcement}
                      onChange={(value) => setFilters({ ...filters, enforcement: value })}
                      options={[
                        { value: 'All', label: 'All Levels' },
                        ...enforcementLevels.map((level) => ({ value: level, label: `Level ${level}` })),
                      ]}
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-text font-heading">Properties ({filteredProperties.length})</h2>
                  <p className="text-muted text-sm">Selected: {selectedIds.size} of {filteredProperties.length}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-warm-100">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedIds.size > 0 && selectedIds.size === filteredProperties.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Buyer</th>
                        <th className="px-4 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Address</th>
                        <th className="px-4 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Program</th>
                        <th className="px-4 py-3 text-left text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">Enforcement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProperties.map((property) => (
                        <tr key={property.id} className="border-b border-border hover:bg-surface-alt transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(property.id)}
                              onChange={() => toggleRecipient(property.id)}
                              className="w-4 h-4 rounded border-border cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-text">{property.buyerName}</td>
                          <td className="px-4 py-3 text-sm text-muted">{property.address}</td>
                          <td className="px-4 py-3 text-sm text-text">{property.programType}</td>
                          <td className="px-4 py-3 text-sm">
                            <StatusPill variant={enforcementVariant(property.enforcementLevel)}>
                              {enforcementLabel(property.enforcementLevel)}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex justify-end">
                <button
                  disabled={selectedIds.size === 0}
                  onClick={() => setStep(2)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedIds.size === 0
                      ? 'bg-surface-alt text-muted cursor-not-allowed'
                      : 'text-white bg-accent hover:bg-accent-dark'
                  }`}
                >
                  Continue to Templates
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Template */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-text mb-6 font-heading">Available Templates</h2>
                <div className="space-y-3">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-accent bg-accent-light'
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-text">{template.name}</h3>
                          <p className="text-sm text-muted mt-1">
                            {template.description || `Attempt ${template.attempt}`}
                          </p>
                          <span className="inline-block px-2 py-1 text-xs bg-surface-alt text-text rounded mt-2">
                            {template.program?.join(', ') || 'All Programs'}
                          </span>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-between">
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-text bg-surface-alt hover:bg-border rounded-md transition-colors flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  disabled={!selectedTemplate}
                  onClick={() => setStep(3)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    !selectedTemplate ? 'bg-surface-alt text-muted cursor-not-allowed' : 'text-white bg-accent hover:bg-accent-dark'
                  }`}
                >
                  Review & Send
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Send */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-text mb-6 font-heading">Review Email</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted uppercase tracking-wide mb-2">Template</p>
                    <div className="bg-surface-alt p-4 rounded-lg border border-border">
                      <p className="font-semibold text-text">{selectedTemplate.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted uppercase tracking-wide mb-2">
                      Recipients ({selectedIds.size})
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedProperties.map((property) => (
                        <div key={property.id} className="bg-surface-alt p-3 rounded-lg border border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text">{property.buyerName}</p>
                            <p className="text-sm text-muted">{property.address}</p>
                          </div>
                          <span className="text-xs bg-surface-alt text-text px-2 py-1 rounded">{property.programType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-accent-light border border-accent rounded-lg">
                    <p className="text-sm text-text">
                      <span className="font-semibold">Ready to send?</span>{' '}
                      This email will be sent to {selectedIds.size} properties.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between">
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-text bg-surface-alt hover:bg-border rounded-md transition-colors flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSend} className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-md transition-colors flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send Email
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PropertyDetailDrawer                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {drawerProperty && (
        <PropertyDetailDrawer
          property={drawerProperty}
          timing={timingsMap[drawerProperty.id]}
          onClose={() => setDrawerProperty(null)}
          onPrepareEmail={() => {
            // Add this property to selection and open preview
            const next = new Set(dueSelectedIds);
            next.add(drawerProperty.id);
            setDueSelectedIds(next);
            setDrawerProperty(null);
            setShowEmailPreview(true);
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* EmailPreview Modal                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      {showEmailPreview && dueSelectedProperties.length > 0 && (
        <EmailPreview
          properties={dueSelectedProperties}
          templates={DEFAULT_TEMPLATES}
          timings={timingsMap}
          onClose={() => setShowEmailPreview(false)}
          onApproveAndSend={handleApproveAndSend}
        />
      )}
    </div>
  );
}
