import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { mockProperties } from '../data/mockData';
import {
  daysOverdue,
  formatDate,
  getFirstOverdueMilestoneDate,
} from '../utils/milestones';
import { StatCard, StatusPill, DataTable, FormField, SelectInput, AdminPageHeader } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

const EnforcementTracker = () => {
  usePageTitle('Enforcement Tracker');
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedProgram, setSelectedProgram] = useState('All');

  // Enrich properties with enforcement data
  const enrichedProperties = useMemo(() => {
    return mockProperties.map((property) => {
      const firstOverdueDate = getFirstOverdueMilestoneDate(property);
      const overdue = firstOverdueDate ? daysOverdue(firstOverdueDate) : 0;

      return {
        ...property,
        daysOverdue: overdue > 0 ? overdue : 0,
      };
    });
  }, []);

  // Filter
  const filteredProperties = useMemo(() => {
    return enrichedProperties.filter((p) => {
      if (selectedLevel !== 'All' && p.enforcementLevel !== parseInt(selectedLevel)) return false;
      if (selectedProgram !== 'All' && p.programType !== selectedProgram) return false;
      return true;
    });
  }, [enrichedProperties, selectedLevel, selectedProgram]);

  // Stats
  const stats = useMemo(() => {
    const compliant = enrichedProperties.filter((p) => p.enforcementLevel === 0).length;
    const warning = enrichedProperties.filter((p) => p.enforcementLevel === 1 || p.enforcementLevel === 2).length;
    const defaulted = enrichedProperties.filter((p) => p.enforcementLevel === 3 || p.enforcementLevel === 4).length;

    return { compliant, warning, defaulted };
  }, [enrichedProperties]);

  // Enforcement label helper
  const getEnforcementLabel = (level) => {
    const labels = {
      0: 'Compliant',
      1: 'Level 1 - Notice',
      2: 'Level 2 - Warning',
      3: 'Level 3 - Default',
      4: 'Level 4 - Legal',
    };
    return labels[level] || 'Unknown';
  };

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
        <span className="text-sm text-text">{value}</span>
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
        const variant = value === 0 ? 'success' : value <= 2 ? 'warning' : 'danger';
        return <StatusPill variant={variant}>{getEnforcementLabel(value)}</StatusPill>;
      },
    },
    {
      key: 'daysOverdue',
      header: 'Days Overdue',
      render: (value) => (
        value > 0 ? (
          <span className="text-sm font-mono font-semibold text-danger">{value} days</span>
        ) : (
          <span className="text-sm font-mono text-muted">-</span>
        )
      ),
    },
    {
      key: 'compliance1stAttempt',
      header: '1st Attempt',
      render: (value) => (
        value ? (
          <span className="text-sm font-mono text-text">{formatDate(value)}</span>
        ) : (
          <span className="text-sm text-muted">-</span>
        )
      ),
    },
    {
      key: 'compliance2ndAttempt',
      header: '2nd Attempt',
      render: (value) => (
        value ? (
          <span className="text-sm font-mono text-text">{formatDate(value)}</span>
        ) : (
          <span className="text-sm text-muted">-</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Enforcement Tracker"
        subtitle="Portfolio-wide view of enforcement levels and compliance attempt history."
        icon={ShieldAlert}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Compliant"
          value={stats.compliant}
          icon={CheckCircle}
          variant="success"
          trend="Level 0"
        />
        <StatCard
          label="Warning"
          value={stats.warning}
          icon={AlertTriangle}
          variant="warning"
          trend="Levels 1-2"
        />
        <StatCard
          label="Default"
          value={stats.defaulted}
          icon={AlertCircle}
          variant="danger"
          trend="Levels 3-4"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-warm-100 rounded-lg border border-warm-200 p-5 animate-fade-slide-up admin-stagger-3">
        <h3 className="font-heading text-sm font-semibold text-text mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Enforcement Level">
            <SelectInput
              value={selectedLevel}
              onChange={(value) => setSelectedLevel(value)}
            >
              <option value="All">All Levels</option>
              <option value="0">Compliant</option>
              <option value="1">Level 1 - Notice</option>
              <option value="2">Level 2 - Warning</option>
              <option value="3">Level 3 - Default</option>
              <option value="4">Level 4 - Legal</option>
            </SelectInput>
          </FormField>

          <FormField label="Program Type">
            <SelectInput
              value={selectedProgram}
              onChange={(value) => setSelectedProgram(value)}
            >
              <option>All</option>
              <option>Featured Homes</option>
              <option>Ready4Rehab</option>
              <option>Demolition</option>
              <option>VIP</option>
            </SelectInput>
          </FormField>
        </div>
      </div>

      {/* Enforcement Table */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <div className="mb-3">
          <h2 className="font-heading text-base font-semibold text-text">
            {filteredProperties.length} Properties
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={filteredProperties}
          onRowClick={(row) => navigate(`/properties/${row.id}`)}
          emptyMessage="No properties match your current filters."
          mobileColumns={['address', 'enforcementLevel', 'daysOverdue']}
          mobileTitle="address"
        />
      </div>
    </div>
  );
};

export default EnforcementTracker;
