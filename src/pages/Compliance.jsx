import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ICONS from '../icons/iconMap';
import { StatCard, StatusPill, DataTable, FormField, TextInput, SelectInput, AdminPageHeader } from '../components/ui';
import { useProperties } from '../context/PropertyContext';
import { computeComplianceTiming } from '../lib/computeDueNow';
import { ACTION_LABELS } from '../data/emailTemplates';
import { toDisplayName } from '../lib/programTypeMapper';
import { PROGRAM_TYPES } from '../data/mockData';

export default function Compliance() {
  const navigate = useNavigate();
  const { properties } = useProperties();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('needs-action');
  const [showAll, setShowAll] = useState(false);

  // Compute compliance timing for all properties
  const timingData = useMemo(() => {
    const today = new Date();
    return properties.map((property) => ({
      property,
      timing: computeComplianceTiming(property, today),
    }));
  }, [properties]);

  // Filter properties based on exception status
  const filteredProperties = useMemo(() => {
    let results = timingData.filter(({ property, timing }) => {
      if (timing.error) return false;

      const needsAttention = timing.isDueNow || timing.daysOverdue > 0;
      const isAllClear = timing.currentAction === 'NOT_DUE_YET';
      const isCompleted = timing.completedActions && timing.completedActions.length > 0;

      if (!showAll) {
        if (filterStatus === 'needs-action' && !needsAttention && !isAllClear) {
          return true;
        } else if (filterStatus === 'overdue' && timing.daysOverdue > 0) {
          return true;
        } else if (filterStatus === 'all-clear' && isAllClear) {
          return true;
        } else if (filterStatus === 'all') {
          return true;
        }
      } else {
        return true;
      }

      return false;
    });

    results = results.filter(({ property }) => {
      const matchesSearch =
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (filterProgram) {
      results = results.filter(({ property }) => property.programType === filterProgram);
    }

    return results;
  }, [timingData, searchTerm, filterProgram, filterStatus, showAll]);

  // Calculate summary stats
  const stats = useMemo(() => {
    let allClear = 0;
    let actionNeeded = 0;
    let overdue = 0;
    let completedThisCycle = 0;

    timingData.forEach(({ timing }) => {
      if (timing.error) return;

      if (timing.currentAction === 'NOT_DUE_YET') {
        allClear++;
      } else if (timing.isDueNow) {
        actionNeeded++;
      }

      if (timing.daysOverdue > 0) {
        overdue++;
      }

      if (
        timing.completedActions &&
        timing.completedActions.length > 0 &&
        timing.currentAction === 'NOT_DUE_YET'
      ) {
        completedThisCycle++;
      }
    });

    return { allClear, actionNeeded, overdue, completedThisCycle };
  }, [timingData]);

  // Prepare table data
  const tableData = useMemo(() => {
    return filteredProperties.map(({ property, timing }) => ({
      id: property.id,
      address: property.address,
      buyer: property.buyerName,
      program: toDisplayName(property.programType),
      currentAction: ACTION_LABELS[timing.currentAction] || timing.currentAction,
      currentActionKey: timing.currentAction,
      dueDate: timing.dueDate,
      daysOverdue: timing.daysOverdue,
      enforcementLevel: timing.recommendedEnforcementLevel,
      lastContactDate: timing.lastContactDate,
      isDueNow: timing.isDueNow,
    }));
  }, [filteredProperties]);

  // Status filter options
  const statusOptions = [
    { value: 'needs-action', label: 'Needs Action' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'all-clear', label: 'All Clear' },
    { value: 'all', label: 'All' },
  ];

  // Program filter options
  const programOptions = [
    { value: '', label: 'All Programs' },
    ...Object.values(PROGRAM_TYPES).map((type) => ({ value: type, label: type })),
  ];

  // Enforcement level label helper
  const getEnforcementLabel = (level) => {
    const labels = {
      0: 'Compliant',
      1: 'Level 1',
      2: 'Level 2',
      3: 'Level 3',
      4: 'Level 4',
    };
    return labels[level] || `Level ${level}`;
  };

  // Enforcement level status helper
  const getEnforcementStatus = (level) => {
    if (level === 0) return 'compliant';
    if (level === 1 || level === 2) return 'warning';
    return 'danger';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Table columns definition
  const columns = [
    {
      header: 'Address',
      key: 'address',
      render: (value) => (
        <span className="text-sm font-medium text-accent">{value}</span>
      ),
    },
    {
      header: 'Buyer',
      key: 'buyer',
      render: (value) => <span className="text-sm text-text">{value}</span>,
    },
    {
      header: 'Program',
      key: 'program',
      render: (value) => (
        <StatusPill variant="default">{value}</StatusPill>
      ),
    },
    {
      header: 'Current Action',
      key: 'currentAction',
      render: (value, row) => {
        let status = 'default';
        if (row.currentActionKey === 'NOT_DUE_YET') {
          status = 'compliant';
        } else if (row.isDueNow) {
          status = 'warning';
        }
        return <StatusPill status={status}>{value}</StatusPill>;
      },
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      render: (value) => <span className="text-sm font-mono text-text-secondary">{formatDate(value)}</span>,
    },
    {
      header: 'Days Overdue',
      key: 'daysOverdue',
      render: (value) => (
        <span
          className={`text-sm font-mono font-medium ${
            value > 0 ? 'text-danger' : 'text-muted'
          }`}
        >
          {value > 0 ? `${value}` : '—'}
        </span>
      ),
    },
    {
      header: 'Enforcement',
      key: 'enforcementLevel',
      render: (value) => (
        <StatusPill status={getEnforcementStatus(value)}>
          {getEnforcementLabel(value)}
        </StatusPill>
      ),
    },
    {
      header: 'Last Contact',
      key: 'lastContactDate',
      render: (value) => <span className="text-sm font-mono text-text-secondary">{formatDate(value)}</span>,
    },
  ];

  // Handle row click to navigate to property detail
  const handleRowClick = (row) => {
    navigate(`/properties/${row.id}`);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Compliance Dashboard"
        subtitle={
          filteredProperties.length > 0
            ? `${filteredProperties.length} propert${filteredProperties.length === 1 ? 'y' : 'ies'} require${filteredProperties.length === 1 ? 's' : ''} attention`
            : 'All properties clear'
        }
        icon={ICONS.compliance}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-slide-up admin-stagger-2">
        <StatCard label="All Clear" value={stats.allClear} variant="success" />
        <StatCard label="Action Needed" value={stats.actionNeeded} variant="warning" />
        <StatCard label="Overdue" value={stats.overdue} variant="danger" />
        <StatCard label="Completed This Cycle" value={stats.completedThisCycle} variant="info" />
      </div>

      {/* Filter Bar */}
      <div className="bg-warm-100 rounded-lg border border-warm-200 p-5 animate-fade-slide-up admin-stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-sm font-semibold text-text">Filters</h3>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-text-secondary">Show All</span>
            <button
              type="button"
              role="switch"
              aria-checked={showAll}
              onClick={() => setShowAll(!showAll)}
              className={[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                showAll ? 'bg-accent' : 'bg-warm-200',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                  showAll ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
              <TextInput
                placeholder="Search by address or buyer"
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField label="Program Type">
            <SelectInput
              value={filterProgram}
              onChange={(value) => setFilterProgram(value)}
              options={programOptions}
            />
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              options={statusOptions}
            />
          </FormField>
        </div>
      </div>

      {/* Data Table */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <DataTable
          columns={columns}
          data={tableData}
          onRowClick={handleRowClick}
          emptyMessage={
            showAll
              ? 'No properties found.'
              : 'All properties are in compliance. Enable "Show All" to view complete inventory.'
          }
          mobileColumns={['address', 'currentAction', 'daysOverdue', 'enforcementLevel']}
          mobileTitle="address"
        />
      </div>
    </div>
  );
}
