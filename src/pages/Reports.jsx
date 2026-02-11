import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Users,
  Building2,
} from 'lucide-react';
import { PROGRAM_TYPES, ENFORCEMENT_LEVELS } from '../data/mockData';
import { useProperties } from '../context/PropertyContext';
import { computeComplianceTiming } from '../lib/computeDueNow';
import { generateFileMakerCSV, generateFileMakerJSON, generateCommunicationLogCSV, downloadFile } from '../lib/filemakerExport';
import {
  getDashboardStats,
  getFirstOverdueMilestoneDate,
  daysOverdue,
  formatDate,
  generateMilestones,
  getCompletedDateForMilestone,
} from '../utils/milestones';
import { Card, StatCard, DataTable, AdminPageHeader } from '../components/ui';

export default function Reports() {
  const { properties } = useProperties();

  // Compute compliance timing for all properties
  const timingsMap = useMemo(() => {
    const map = {};
    properties.forEach(prop => {
      map[prop.id] = computeComplianceTiming(prop);
    });
    return map;
  }, [properties]);

  // Calculate portfolio summary stats
  const portfolioStats = useMemo(() => {
    const totalProperties = properties.length;
    const compliantCount = properties.filter(
      (prop) => prop.enforcementLevel === 0
    ).length;
    const atRiskCount = properties.filter(
      (prop) => prop.enforcementLevel >= 2
    ).length;
    const complianceRate = totalProperties > 0
      ? Math.round((compliantCount / totalProperties) * 100)
      : 0;

    const propertiesOverdue = properties.filter((prop) => {
      const firstOverdueDate = getFirstOverdueMilestoneDate(prop);
      return firstOverdueDate !== null;
    }).length;

    return {
      totalProperties,
      compliantCount,
      complianceRate,
      atRiskCount,
      propertiesOverdue,
    };
  }, [properties]);

  // Calculate program breakdown stats
  const programBreakdown = useMemo(() => {
    return Object.entries(PROGRAM_TYPES).map(([key, programName]) => {
      const propertiesInProgram = properties.filter(
        (prop) => prop.programType === programName
      );
      const compliant = propertiesInProgram.filter(
        (prop) => prop.enforcementLevel === 0
      ).length;
      const warning = propertiesInProgram.filter(
        (prop) => prop.enforcementLevel >= 1 && prop.enforcementLevel <= 2
      ).length;
      const defaultLevel = propertiesInProgram.filter(
        (prop) => prop.enforcementLevel >= 3
      ).length;

      const complianceRate =
        propertiesInProgram.length > 0
          ? Math.round((compliant / propertiesInProgram.length) * 100)
          : 0;

      return {
        programName,
        total: propertiesInProgram.length,
        compliant,
        warning,
        defaultLevel,
        complianceRate,
      };
    });
  }, [properties]);

  // Calculate enforcement distribution
  const enforcementDistribution = useMemo(() => {
    const distribution = [0, 1, 2, 3, 4].map((level) => {
      const count = properties.filter(
        (prop) => prop.enforcementLevel === level
      ).length;
      return { level, count };
    });
    return distribution;
  }, [properties]);

  // Calculate communication metrics
  const communicationMetrics = useMemo(() => {
    let totalCommunications = 0;
    const communicationsByType = { email: 0, mail: 0, system: 0 };
    let propertiesWithNoCommunications = 0;
    let propertiesAwaitingFirstAttempt = 0;

    properties.forEach((prop) => {
      if (prop.communications && prop.communications.length > 0) {
        totalCommunications += prop.communications.length;
        prop.communications.forEach((comm) => {
          if (communicationsByType.hasOwnProperty(comm.type)) {
            communicationsByType[comm.type]++;
          }
        });
      } else {
        propertiesWithNoCommunications++;
      }

      // Properties awaiting first attempt: no first attempt communication and (enforcement > 0 or overdue milestones)
      if (
        prop.compliance1stAttempt === null ||
        prop.compliance1stAttempt === undefined
      ) {
        if (prop.enforcementLevel > 0) {
          propertiesAwaitingFirstAttempt++;
        } else {
          const firstOverdueDate = getFirstOverdueMilestoneDate(prop);
          if (firstOverdueDate) {
            propertiesAwaitingFirstAttempt++;
          }
        }
      }
    });

    return {
      totalCommunications,
      communicationsByType,
      propertiesWithNoCommunications,
      propertiesAwaitingFirstAttempt,
    };
  }, [properties]);

  // Calculate milestone completion stats
  const milestoneStats = useMemo(() => {
    return Object.entries(PROGRAM_TYPES).map(([key, programName]) => {
      const propertiesInProgram = properties.filter(
        (prop) => prop.programType === programName
      );

      let totalMilestones = 0;
      let completedMilestones = 0;
      let overdueMilestones = 0;
      const now = new Date();

      propertiesInProgram.forEach((prop) => {
        const milestones = generateMilestones(prop.programType, prop.dateSold);
        totalMilestones += milestones.length;

        milestones.forEach((milestone) => {
          const completedDate = getCompletedDateForMilestone(milestone, prop);
          if (completedDate) {
            completedMilestones++;
          } else {
            const milestoneDate = new Date(milestone.dueDate);
            if (milestoneDate < now) {
              overdueMilestones++;
            }
          }
        });
      });

      const completionRate =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      return {
        programName,
        totalMilestones,
        completedMilestones,
        overdueMilestones,
        completionRate,
      };
    });
  }, [properties]);

  const getComplianceColor = (rate) => {
    if (rate >= 75) return 'bg-success-light text-success';
    if (rate >= 50) return 'bg-warning-light text-warning';
    return 'bg-danger-light text-danger';
  };

  const getEnforcementColor = (level) => {
    switch (level) {
      case 0:
        return 'bg-success';
      case 1:
        return 'bg-warning';
      case 2:
        return 'bg-warning';
      case 3:
      case 4:
        return 'bg-danger';
      default:
        return 'bg-muted';
    }
  };

  const getEnforcementLabel = (level) => {
    switch (level) {
      case 0:
        return 'Level 0 — Compliant';
      case 1:
        return 'Level 1 — Minor Warning';
      case 2:
        return 'Level 2 — Major Warning';
      case 3:
        return 'Level 3 — Default Notice';
      case 4:
        return 'Level 4 — Enforcement Action';
      default:
        return `Level ${level}`;
    }
  };

  const totalEnforcementCount = enforcementDistribution.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const handleExportFileMakerCSV = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const csv = generateFileMakerCSV(properties, timingsMap);
    downloadFile(csv, `filemaker-compliance-export-${dateStr}.csv`, 'text/csv');
  };

  const handleExportFileMakerJSON = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const json = generateFileMakerJSON(properties, timingsMap);
    downloadFile(json, `filemaker-compliance-export-${dateStr}.json`, 'application/json');
  };

  const handleExportCommunicationLog = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const csv = generateCommunicationLogCSV(properties);
    downloadFile(csv, `communication-log-${dateStr}.csv`, 'text/csv');
  };

  /* ── DataTable column definitions ──────────────────── */
  const programBreakdownColumns = [
    { header: 'Program Name', accessor: 'programName' },
    {
      header: 'Total',
      accessor: 'total',
      render: (val) => <span className="font-mono">{val}</span>,
    },
    {
      header: 'Compliant',
      accessor: 'compliant',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success font-mono">
          {val}
        </span>
      ),
    },
    {
      header: 'Warning',
      accessor: 'warning',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning font-mono">
          {val}
        </span>
      ),
    },
    {
      header: 'Default',
      accessor: 'defaultLevel',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger font-mono">
          {val}
        </span>
      ),
    },
    {
      header: 'Compliance Rate',
      accessor: 'complianceRate',
      render: (val) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-mono ${getComplianceColor(val)}`}
        >
          {val}%
        </span>
      ),
    },
  ];

  const milestoneColumns = [
    { header: 'Program Name', accessor: 'programName' },
    {
      header: 'Total Milestones',
      accessor: 'totalMilestones',
      render: (val) => <span className="font-mono">{val}</span>,
    },
    {
      header: 'Completed',
      accessor: 'completedMilestones',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success font-mono">
          {val}
        </span>
      ),
    },
    {
      header: 'Completion Rate',
      accessor: 'completionRate',
      render: (val) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-mono ${getComplianceColor(val)}`}
        >
          {val}%
        </span>
      ),
    },
    {
      header: 'Overdue',
      accessor: 'overdueMilestones',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger font-mono">
          {val}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Compliance Reports"
        subtitle="Portfolio analytics and compliance metrics"
        icon={BarChart3}
      />

      {/* Portfolio Summary Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-slide-up admin-stagger-2"
      >
        <StatCard
          label="Total Properties"
          value={portfolioStats.totalProperties}
          icon={Building2}
        />
        <StatCard
          label="Compliance Rate"
          value={`${portfolioStats.complianceRate}%`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="Properties at Risk"
          value={portfolioStats.atRiskCount}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          label="Properties Overdue"
          value={portfolioStats.propertiesOverdue}
          icon={BarChart3}
          variant="warning"
        />
      </div>

      {/* Program Breakdown Table */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <h2 className="font-heading text-lg font-semibold text-text mb-4">Program Breakdown</h2>
        <DataTable
          columns={programBreakdownColumns}
          data={programBreakdown}
          emptyMessage="No program data available"
          mobileColumns={['programName', 'total', 'complianceRate']}
          mobileTitle="programName"
        />
      </div>

      {/* Rate of Compliance */}
      <div className="animate-fade-slide-up admin-stagger-4">
        <h2 className="font-heading text-lg font-semibold text-text mb-4">Rate of Compliance</h2>
        <Card>
          <div className="space-y-4">
            {enforcementDistribution.map((item) => {
              const percentage =
                totalEnforcementCount > 0
                  ? Math.round((item.count / totalEnforcementCount) * 100)
                  : 0;
              return (
                <div key={item.level} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-20 sm:w-32 text-xs sm:text-sm font-medium text-text shrink-0">
                    {getEnforcementLabel(item.level)}
                  </div>
                  <div className="flex-1 bg-warm-100 rounded-full h-8 overflow-hidden relative">
                    <div
                      className={`${getEnforcementColor(
                        item.level
                      )} h-full transition-all duration-300 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      {percentage > 0 && (
                        <span className="text-xs font-bold text-white font-mono">{percentage}%</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-mono font-semibold text-text">
                    {item.count}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Communication Metrics */}
      <div className="animate-fade-slide-up admin-stagger-5">
        <h2 className="font-heading text-lg font-semibold text-text mb-4">Communication Metrics</h2>
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Total Communications */}
            <div className="border-l-4 border-l-accent pl-4">
              <p className="text-sm font-heading font-medium text-muted">Total Communications Sent</p>
              <p className="text-3xl font-mono font-bold text-text mt-2 tabular-nums">
                {communicationMetrics.totalCommunications}
              </p>
            </div>

            {/* Email */}
            <div className="border-l-4 border-l-success pl-4">
              <p className="text-sm font-heading font-medium text-muted">Email</p>
              <p className="text-3xl font-mono font-bold text-text mt-2 tabular-nums">
                {communicationMetrics.communicationsByType.email}
              </p>
            </div>

            {/* Mail */}
            <div className="border-l-4 border-l-warning pl-4">
              <p className="text-sm font-heading font-medium text-muted">Mail</p>
              <p className="text-3xl font-mono font-bold text-text mt-2 tabular-nums">
                {communicationMetrics.communicationsByType.mail}
              </p>
            </div>

            {/* System */}
            <div className="border-l-4 border-l-accent pl-4">
              <p className="text-sm font-heading font-medium text-muted">System</p>
              <p className="text-3xl font-mono font-bold text-text mt-2 tabular-nums">
                {communicationMetrics.communicationsByType.system}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-warm-200 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="text-sm font-heading font-medium text-muted">Properties with No Communications</p>
              <p className="text-2xl font-mono font-bold text-danger mt-1 tabular-nums">
                {communicationMetrics.propertiesWithNoCommunications}
              </p>
            </div>
            <div>
              <p className="text-sm font-heading font-medium text-muted">Properties Awaiting 1st Attempt</p>
              <p className="text-2xl font-mono font-bold text-warning mt-1 tabular-nums">
                {communicationMetrics.propertiesAwaitingFirstAttempt}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Milestone Completion Report */}
      <div className="animate-fade-slide-up admin-stagger-6">
        <h2 className="font-heading text-lg font-semibold text-text mb-4">Milestone Completion Report</h2>
        <DataTable
          columns={milestoneColumns}
          data={milestoneStats}
          emptyMessage="No milestone data available"
          mobileColumns={['programName', 'completionRate', 'overdueMilestones']}
          mobileTitle="programName"
        />
      </div>

      {/* Export Actions */}
      <div className="animate-fade-slide-up" style={{ animationDelay: '480ms' }}>
        <h2 className="font-heading text-lg font-semibold text-text mb-4">Export Actions</h2>
        <div className="bg-warm-100 rounded-lg border border-warm-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export FileMaker CSV */}
            <button
              onClick={handleExportFileMakerCSV}
              className="flex items-center gap-4 p-4 bg-white border-2 border-warm-200 rounded-lg hover:border-accent transition-colors text-left group"
            >
              <Download className="text-accent flex-shrink-0 group-hover:scale-110 transition-transform" size={24} />
              <div>
                <p className="font-heading font-semibold text-text">Export for FileMaker (CSV)</p>
                <p className="text-sm text-muted mt-0.5">Compliance data for FileMaker import</p>
              </div>
            </button>

            {/* Export FileMaker JSON */}
            <button
              onClick={handleExportFileMakerJSON}
              className="flex items-center gap-4 p-4 bg-white border-2 border-warm-200 rounded-lg hover:border-accent transition-colors text-left group"
            >
              <Download className="text-success flex-shrink-0 group-hover:scale-110 transition-transform" size={24} />
              <div>
                <p className="font-heading font-semibold text-text">Export for FileMaker (JSON)</p>
                <p className="text-sm text-muted mt-0.5">Structured data for API integration</p>
              </div>
            </button>

            {/* Export Communication Log */}
            <button
              onClick={handleExportCommunicationLog}
              className="flex items-center gap-4 p-4 bg-white border-2 border-warm-200 rounded-lg hover:border-accent transition-colors text-left group"
            >
              <Download className="text-accent flex-shrink-0 group-hover:scale-110 transition-transform" size={24} />
              <div>
                <p className="font-heading font-semibold text-text">Export Communication Log (CSV)</p>
                <p className="text-sm text-muted mt-0.5">All communications across properties</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
