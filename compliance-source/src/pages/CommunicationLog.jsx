import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  FileText,
  Zap,
  Calendar,
  Search,
  Filter,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { mockProperties } from '../data/mockData';
import { formatDate } from '../utils/milestones';

export default function CommunicationLog() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchProperty, setSearchProperty] = useState('');
  const [communicationType, setCommunicationType] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);

  // Flatten all communications from all properties
  const allCommunications = useMemo(() => {
    const comms = [];
    mockProperties.forEach(property => {
      if (property.communications && property.communications.length > 0) {
        property.communications.forEach(comm => {
          comms.push({
            id: `${property.id}-${comms.length}`,
            propertyId: property.id,
            address: property.address,
            buyerName: property.buyerName,
            programType: property.programType,
            ...comm
          });
        });
      }
    });
    return comms;
  }, []);

  // Filter communications
  const filteredCommunications = useMemo(() => {
    let filtered = [...allCommunications];

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(c => c.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(c => c.date <= dateTo);
    }

    // Property search
    if (searchProperty) {
      const search = searchProperty.toLowerCase();
      filtered = filtered.filter(c =>
        c.address.toLowerCase().includes(search) ||
        c.buyerName.toLowerCase().includes(search)
      );
    }

    // Communication type filter
    if (communicationType !== 'All') {
      filtered = filtered.filter(c => c.type === communicationType.toLowerCase());
    }

    // Sort by date, newest first
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [allCommunications, dateFrom, dateTo, searchProperty, communicationType]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return {
      total: allCommunications.length,
      emails: allCommunications.filter(c => c.type === 'email').length,
      mail: allCommunications.filter(c => c.type === 'mail').length,
      thisMonth: allCommunications.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length
    };
  }, [allCommunications]);

  // Get icon for communication type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'mail':
        return <FileText className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'system':
        return <Zap className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Get color class for type badge
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'mail':
        return 'bg-slate-100 text-slate-800';
      case 'phone':
        return 'bg-emerald-100 text-emerald-800';
      case 'system':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Get icon and class for status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          class: 'bg-emerald-100 text-emerald-800'
        };
      case 'logged':
        return {
          icon: <Clock className="w-4 h-4" />,
          class: 'bg-blue-100 text-blue-800'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          class: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          class: 'bg-slate-100 text-slate-800'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-slate-900">Communication Log</h1>
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
              {filteredCommunications.length} Total
            </span>
          </div>
          <p className="text-lg text-slate-600">Track all compliance communications across all properties</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-slate-400">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Total Communications</div>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              </div>
              <MessageSquare className="w-10 h-10 text-slate-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Emails Sent</div>
                <div className="text-3xl font-bold text-blue-600">{stats.emails}</div>
              </div>
              <Mail className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-slate-400">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Letters Mailed</div>
                <div className="text-3xl font-bold text-slate-900">{stats.mail}</div>
              </div>
              <FileText className="w-10 h-10 text-slate-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-400">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">This Month</div>
                <div className="text-3xl font-bold text-emerald-600">{stats.thisMonth}</div>
              </div>
              <Calendar className="w-10 h-10 text-emerald-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            Filter Communications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Search className="inline w-4 h-4 mr-2" />
                Property Search
              </label>
              <input
                type="text"
                placeholder="Address or buyer name..."
                value={searchProperty}
                onChange={(e) => setSearchProperty(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <select
                value={communicationType}
                onChange={(e) => setCommunicationType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option>All</option>
                <option>Email</option>
                <option>Mail</option>
                <option>Phone</option>
                <option>System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Communications Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Property Address</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Buyer</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Type</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Template/Subject</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCommunications.map((comm) => {
                const statusBadge = getStatusBadge(comm.status);
                return (
                  <tr
                    key={comm.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                      {formatDate(comm.date)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/properties/${comm.propertyId}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {comm.address}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{comm.buyerName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(comm.type)}`}>
                        {getTypeIcon(comm.type)}
                        {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      {comm.template || comm.subject || ' -'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                        {statusBadge.icon}
                        {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setExpandedRow(expandedRow === comm.id ? null : comm.id)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <svg className={`w-5 h-5 transition-transform ${expandedRow === comm.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCommunications.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg">No communications found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Automatic Logging</h4>
              <p className="text-sm text-blue-800">
                All communications sent through the Batch Email system are automatically logged here with
                timestamp, template/subject, and recipient information. This provides a complete audit trail
                for compliance tracking and record-keeping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
