import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mail, Phone, FileText, MessageSquare, List, Layers } from 'lucide-react';
import { Card, StatCard, StatusPill, DataTable, FormField, TextInput, SelectInput, AdminPageHeader } from '../components/ui';
import { AppIcon } from '../components/ui';
import ICONS from '../icons/iconMap';
import { useProperties } from '../context/PropertyContext';
import { formatDate } from '../utils/milestones';
import { usePageTitle } from '../hooks/usePageTitle';

export default function CommunicationLog() {
  usePageTitle('Communications');
  const navigate = useNavigate();
  const { properties } = useProperties();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'grouped'

  // Flatten communications from all properties
  const allComms = useMemo(() => {
    return properties
      .flatMap(prop =>
        prop.communications.map(comm => ({
          ...comm,
          propertyId: prop.id,
          address: prop.address,
          buyerName: prop.buyerName,
        }))
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [properties]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: allComms.length,
      emailsSent: allComms.filter(c => c.type === 'email' && c.status === 'sent').length,
      pending: allComms.filter(c => c.status === 'pending').length,
    };
  }, [allComms]);

  // Filter communications
  const filteredComms = useMemo(() => {
    return allComms.filter(comm => {
      const matchesSearch =
        searchTerm === '' ||
        comm.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.template.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'All' || comm.type === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'All' || comm.status === statusFilter.toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allComms, searchTerm, typeFilter, statusFilter]);

  // Get icon for communication type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'mail':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get status pill variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Get type pill color
  const getTypeColor = (type) => {
    return 'bg-surface-alt text-text-secondary';
  };

  // Format type display
  const formatType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Table columns
  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value) => (
        <span className="text-sm font-mono text-muted">{formatDate(value)}</span>
      ),
      width: '120px',
    },
    {
      key: 'address',
      header: 'Property',
      render: (value) => (
        <span className="text-sm font-medium text-accent">{value}</span>
      ),
      width: '200px',
    },
    {
      key: 'buyerName',
      header: 'Buyer',
      render: (value) => (
        <span className="text-sm text-text">{value}</span>
      ),
      width: '150px',
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(value)}`}>
          {formatType(value)}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'template',
      header: 'Template',
      render: (value) => (
        <span className="text-sm text-text">{value}</span>
      ),
      width: '180px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <StatusPill variant={getStatusVariant(value)}>{formatType(value)}</StatusPill>
      ),
      width: '120px',
    },
  ];

  // Grouped by property
  const groupedByProperty = useMemo(() => {
    const groups = {};
    filteredComms.forEach((comm) => {
      if (!groups[comm.propertyId]) {
        groups[comm.propertyId] = {
          propertyId: comm.propertyId,
          address: comm.address,
          buyerName: comm.buyerName,
          comms: [],
        };
      }
      groups[comm.propertyId].comms.push(comm);
    });
    return Object.values(groups).sort((a, b) => b.comms.length - a.comms.length);
  }, [filteredComms]);

  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (propertyId) => {
    setExpandedGroups((prev) => ({ ...prev, [propertyId]: !prev[propertyId] }));
  };

  const handleRowClick = (row) => {
    navigate(`/properties/${row.propertyId}`);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Communication Log"
        subtitle="Track all communications with buyers and properties"
        icon={MessageSquare}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Total Communications"
          value={stats.total}
          variant="default"
        />
        <StatCard
          label="Emails Sent"
          value={stats.emailsSent}
          variant="default"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          variant="warning"
        />
      </div>

      {/* Filter Area */}
      <div className="bg-warm-100 rounded-lg border border-warm-200 p-5 animate-fade-slide-up admin-stagger-3">
        <h3 className="font-heading text-sm font-semibold text-text mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
              <TextInput
                placeholder="Search by property, buyer, or template..."
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField label="Type">
            <SelectInput
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
            >
              <option value="All">All Types</option>
              <option value="Email">Email</option>
              <option value="Mail">Mail</option>
              <option value="Phone">Phone</option>
              <option value="System">System</option>
            </SelectInput>
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            >
              <option value="All">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </SelectInput>
          </FormField>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 animate-fade-slide-up admin-stagger-4">
        <span className="text-xs text-muted font-medium mr-1">View:</span>
        <button
          onClick={() => setViewMode('flat')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'flat' ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-text'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          Timeline
        </button>
        <button
          onClick={() => setViewMode('grouped')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'grouped' ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-text'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          By Property
        </button>
      </div>

      {/* Communications - Flat Table */}
      {viewMode === 'flat' && (
        <div className="animate-fade-slide-up admin-stagger-5">
          <DataTable
            columns={columns}
            data={filteredComms}
            onRowClick={handleRowClick}
            emptyMessage="No communications found"
            mobileColumns={['date', 'address', 'type', 'status']}
            mobileTitle="address"
          />
        </div>
      )}

      {/* Communications - Grouped by Property */}
      {viewMode === 'grouped' && (
        <div className="space-y-3 animate-fade-slide-up admin-stagger-5">
          {groupedByProperty.length === 0 && (
            <Card>
              <p className="text-sm text-muted text-center py-8">No communications found</p>
            </Card>
          )}
          {groupedByProperty.map((group) => (
            <Card key={group.propertyId}>
              <button
                type="button"
                onClick={() => toggleGroup(group.propertyId)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-medium text-accent">{group.address}</p>
                  <p className="text-xs text-muted">{group.buyerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-muted bg-surface-alt px-2 py-0.5 rounded-full">
                    {group.comms.length}
                  </span>
                  <AppIcon
                    icon={ICONS.chevronDown}
                    size={14}
                    className={`text-muted transition-transform duration-200 ${expandedGroups[group.propertyId] ? '' : '-rotate-90'}`}
                  />
                </div>
              </button>
              {expandedGroups[group.propertyId] && (
                <div className="mt-3 border-t border-border pt-3 space-y-2">
                  {group.comms.map((comm) => (
                    <div
                      key={comm.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-surface-alt cursor-pointer transition-colors"
                      onClick={() => navigate(`/properties/${comm.propertyId}`)}
                    >
                      <span className="text-xs font-mono text-muted w-20 flex-shrink-0">{formatDate(comm.date)}</span>
                      <span className="text-xs text-text flex-1 truncate">{comm.template}</span>
                      <StatusPill variant={getStatusVariant(comm.status)}>{formatType(comm.status)}</StatusPill>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
