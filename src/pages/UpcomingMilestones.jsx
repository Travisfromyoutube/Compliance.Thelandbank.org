import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { mockProperties } from '../data/mockData';
import {
  generateMilestones,
  getMilestoneStatus,
  getCompletedDateForMilestone,
  daysOverdue,
  formatDate,
} from '../utils/milestones';
import { StatCard, StatusPill, DataTable, FormField, SelectInput, AdminPageHeader } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

const UpcomingMilestones = () => {
  usePageTitle('Milestones');
  const navigate = useNavigate();
  const [timeWindow, setTimeWindow] = useState(30);
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Generate all milestones across all properties
  const allMilestones = useMemo(() => {
    const results = [];
    mockProperties.forEach((property) => {
      const milestones = generateMilestones(property.programType, property.dateSold);
      milestones.forEach((milestone) => {
        const completedDate = getCompletedDateForMilestone(milestone, property);
        const status = getMilestoneStatus(milestone, completedDate);
        const overdue = daysOverdue(milestone.dueDate);

        results.push({
          ...milestone,
          propertyId: property.id,
          address: property.address,
          buyerName: property.buyerName,
          programType: property.programType,
          status,
          completedDate,
          daysUntilDue: -overdue,
          daysOverdue: overdue,
        });
      });
    });

    return results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, []);

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      const withinWindow = m.daysUntilDue <= timeWindow;
      const isOverdue = m.status === 'overdue';
      const isCompleted = m.status === 'completed';

      if (selectedStatus === 'overdue' && !isOverdue) return false;
      if (selectedStatus === 'due-soon' && m.status !== 'due-soon') return false;
      if (selectedStatus === 'upcoming' && m.status !== 'upcoming') return false;
      if (selectedStatus === 'completed' && !isCompleted) return false;

      if (selectedStatus === 'All' && !withinWindow && !isOverdue) return false;

      if (selectedProgram !== 'All' && m.programType !== selectedProgram) return false;

      return true;
    });
  }, [allMilestones, timeWindow, selectedProgram, selectedStatus]);

  // Summary stats
  const stats = useMemo(() => {
    const nonCompleted = allMilestones.filter((m) => m.status !== 'completed');
    return {
      totalUpcoming: nonCompleted.filter((m) => m.daysUntilDue > 0 && m.daysUntilDue <= 30).length,
      dueSoon: nonCompleted.filter((m) => m.status === 'due-soon').length,
      overdue: nonCompleted.filter((m) => m.status === 'overdue').length,
    };
  }, [allMilestones]);

  // DataTable columns
  const columns = [
    {
      key: 'address',
      header: 'Property',
      render: (value, row) => (
        <div>
          <p className="text-sm font-medium text-accent">{value}</p>
          <p className="text-xs text-text-secondary">{row.buyerName}</p>
        </div>
      ),
    },
    {
      key: 'label',
      header: 'Milestone',
      render: (value, row) => (
        <div>
          <p className="text-sm font-medium text-text">{value}</p>
          <p className="text-xs text-text-secondary">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (value) => (
        <span className="text-sm font-mono text-text">{formatDate(value)}</span>
      ),
    },
    {
      key: 'daysUntilDue',
      header: 'Days',
      render: (value, row) => {
        if (row.status === 'completed') {
          return <span className="text-sm font-mono font-semibold text-success">Done</span>;
        }
        if (row.daysOverdue > 0) {
          return <span className="text-sm font-mono font-semibold text-danger">{row.daysOverdue}d overdue</span>;
        }
        return <span className="text-sm font-mono font-semibold text-text">{value}d left</span>;
      },
    },
    {
      key: 'programType',
      header: 'Program',
      render: (value) => (
        <StatusPill variant="default">{value}</StatusPill>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <StatusPill status={value}>
          {value === 'completed'
            ? 'Completed'
            : value === 'overdue'
            ? 'Overdue'
            : value === 'due-soon'
            ? 'Due Soon'
            : 'Upcoming'}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Upcoming Milestones"
        subtitle="Proactive view of all milestones across all properties - catch deadlines before they become enforcement issues."
        icon={CalendarClock}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Due Within 30 Days"
          value={stats.totalUpcoming}
          variant="default"
        />
        <StatCard
          label="Due Within 14 Days"
          value={stats.dueSoon}
          variant="warning"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          variant="danger"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-warm-100 rounded-lg border border-warm-200 p-5 animate-fade-slide-up admin-stagger-3">
        <h3 className="font-heading text-sm font-semibold text-text mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Time Window">
            <SelectInput
              value={String(timeWindow)}
              onChange={(value) => setTimeWindow(parseInt(value))}
            >
              <option value="7">Next 7 days</option>
              <option value="14">Next 14 days</option>
              <option value="30">Next 30 days</option>
              <option value="60">Next 60 days</option>
              <option value="90">Next 90 days</option>
              <option value="365">Next 12 months</option>
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

          <FormField label="Status">
            <SelectInput
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
            >
              <option value="All">All Active</option>
              <option value="overdue">Overdue</option>
              <option value="due-soon">Due Soon</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </SelectInput>
          </FormField>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <div className="mb-3">
          <h2 className="font-heading text-base font-semibold text-text">
            {filteredMilestones.length} Milestones
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={filteredMilestones}
          onRowClick={(row) => navigate(`/properties/${row.propertyId}`)}
          emptyMessage="No milestones match your current filters."
          mobileColumns={['address', 'label', 'dueDate', 'status']}
          mobileTitle="address"
        />
      </div>
    </div>
  );
};

export default UpcomingMilestones;
