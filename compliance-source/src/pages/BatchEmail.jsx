import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronRight,
  Eye,
  Printer,
  Send,
  Download
} from 'lucide-react';
import { mockProperties, PROGRAM_TYPES, emailTemplates } from '../data/mockData';
import { formatDate } from '../utils/milestones';

const ATTEMPT_LEVELS = [
  { value: '1st', label: '1st Attempt', field: 'compliance1stAttempt' },
  { value: '2nd', label: '2nd Attempt', field: 'compliance2ndAttempt' },
  { value: 'level3', label: 'Level 3 Escalation', field: 'enforcementLevel', compare: 3 },
  { value: 'level4', label: 'Level 4 Legal', field: 'enforcementLevel', compare: 4 }
];

export default function BatchEmail() {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [step, setStep] = useState(1);
  const [sendStatus, setSendStatus] = useState(null);
  const [previewProperty, setPreviewProperty] = useState(null);

  // Filter properties based on selection criteria
  const filteredProperties = useMemo(() => {
    let filtered = mockProperties;

    if (selectedProgram) {
      filtered = filtered.filter(p => p.programType === selectedProgram);
    }

    if (selectedAttempt) {
      const attempt = ATTEMPT_LEVELS.find(a => a.value === selectedAttempt);
      if (attempt.compare !== undefined) {
        filtered = filtered.filter(p => p[attempt.field] >= attempt.compare);
      } else {
        filtered = filtered.filter(p => p[attempt.field] !== null);
      }
    }

    return filtered;
  }, [selectedProgram, selectedAttempt]);

  // Separate records by email availability
  const { hasEmail, needsSnailMail } = useMemo(() => {
    return {
      hasEmail: filteredProperties.filter(p => p.buyerEmail),
      needsSnailMail: filteredProperties.filter(p => !p.buyerEmail)
    };
  }, [filteredProperties]);

  const displayRecords = activeTab === 'email' ? hasEmail : needsSnailMail;

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    setSelectAllChecked(e.target.checked);
    if (e.target.checked) {
      setSelectedRows(new Set(displayRecords.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle individual row selection
  const handleRowSelect = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      setSelectAllChecked(false);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Get available templates for current program
  const availableTemplates = useMemo(() => {
    if (!selectedProgram) return emailTemplates;
    return emailTemplates.filter(t =>
      t.program.includes('all') ||
      t.program.includes(selectedProgram) ||
      t.program.some(p => Object.values(PROGRAM_TYPES).includes(p))
    );
  }, [selectedProgram]);

  // Generate email preview
  const generatePreview = () => {
    if (!previewProperty || !selectedTemplate) return '';
    const template = emailTemplates.find(t => t.id === selectedTemplate);
    return `
Dear ${previewProperty.buyerName},

This is a compliance notice regarding your property at:
${previewProperty.address}

Program: ${previewProperty.programType}

Please provide documentation to maintain compliance with program requirements.

Best regards,
Compliance Team
    `.trim();
  };

  // Handle send batch
  const handleSendBatch = () => {
    const selected = Array.from(selectedRows);
    setSendStatus({
      success: selected.length,
      failed: 0,
      total: selected.length
    });
    setStep(4);
  };

  // Step 1: Filters
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-600" />
          Step 1: Filter Records
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Program Type
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Programs</option>
              {Object.values(PROGRAM_TYPES).map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attempt Number
            </label>
            <select
              value={selectedAttempt}
              onChange={(e) => setSelectedAttempt(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Records</option>
              {ATTEMPT_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredProperties.length > 0 && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab('email');
                setSelectedRows(new Set());
                setSelectAllChecked(false);
              }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'email'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="inline w-4 h-4 mr-2" />
              Has Email ({hasEmail.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('snailmail');
                setSelectedRows(new Set());
                setSelectAllChecked(false);
              }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'snailmail'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="inline w-4 h-4 mr-2" />
              Needs Snail Mail ({needsSnailMail.length})
            </button>
          </div>

          {/* Property Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAllChecked && displayRecords.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Address</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Buyer</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    {activeTab === 'email' ? 'Email' : 'Contact'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Program</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Last Attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayRecords.map(property => (
                  <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(property.id)}
                        onChange={() => handleRowSelect(property.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-3 text-slate-900 font-medium">{property.address}</td>
                    <td className="px-6 py-3 text-slate-700">{property.buyerName}</td>
                    <td className="px-6 py-3 text-slate-700">
                      {activeTab === 'email' ? property.buyerEmail : property.address}
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                        {property.programType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {property.compliance1stAttempt ? formatDate(property.compliance1stAttempt) : ' -'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayRecords.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No records match the selected filters for {activeTab === 'email' ? 'email' : 'snail mail'}.
            </div>
          )}

          {selectedRows.size > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
              >
                Continue to Templates
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {filteredProperties.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No records match your filter criteria. Try adjusting the filters.</p>
        </div>
      )}
    </div>
  );

  // Step 2: Template Selection
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Step 2: Select Email Template
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              if (displayRecords.length > 0) {
                setPreviewProperty(displayRecords[0]);
              }
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a template...</option>
            {availableTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTemplate && (
        <div className="border border-slate-300 rounded-lg p-6 bg-white">
          <h4 className="font-semibold text-slate-900 mb-4">Template Preview</h4>
          <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap font-mono">
            {generatePreview()}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              <strong>Merge fields:</strong> {'{'}buyer_name{'}'}, {'{'}address{'}'}, {'{'}program{'}'}
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        >
          Back
        </button>
        {selectedTemplate && (
          <button
            onClick={() => setStep(3)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            Review & Send
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // Step 3: Review & Send
  const renderStep3 = () => {
    const selectedProps = displayRecords.filter(p => selectedRows.has(p.id));
    const template = emailTemplates.find(t => t.id === selectedTemplate);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Step 3: Review & Send
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-4 border border-emerald-200">
              <div className="text-sm text-slate-600">Emails Will Be Sent</div>
              <div className="text-3xl font-bold text-emerald-600">
                {activeTab === 'email' ? selectedRows.size : 0}
              </div>
            </div>
            <div className="bg-white rounded p-4 border border-slate-200">
              <div className="text-sm text-slate-600">Need Snail Mail</div>
              <div className="text-3xl font-bold text-slate-900">
                {activeTab === 'snailmail' ? selectedRows.size : 0}
              </div>
            </div>
            <div className="bg-white rounded p-4 border border-slate-200">
              <div className="text-sm text-slate-600">Template</div>
              <div className="text-lg font-bold text-slate-900">{template?.name}</div>
            </div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-lg p-6 bg-white max-h-96 overflow-y-auto">
          <h4 className="font-semibold text-slate-900 mb-4">Recipients</h4>
          <div className="space-y-2">
            {selectedProps.map(prop => (
              <div key={prop.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <div className="font-medium text-slate-900">{prop.buyerName}</div>
                  <div className="text-sm text-slate-600">{prop.address}</div>
                </div>
                <div className="text-sm text-slate-600">
                  {activeTab === 'email' ? prop.buyerEmail : 'Mail'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Back
          </button>
          <div className="flex gap-3">
            {activeTab === 'snailmail' && (
              <button
                onClick={() => console.log('Print snail mail labels')}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Labels
              </button>
            )}
            <button
              onClick={handleSendBatch}
              className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold flex items-center gap-2 text-lg"
            >
              <Send className="w-5 h-5" />
              Send {activeTab === 'email' ? 'Batch' : 'to Snail Mail'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Results
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-emerald-900 mb-2">
          {activeTab === 'email' ? 'Batch Sent Successfully!' : 'Ready for Mail Processing'}
        </h3>
        <p className="text-lg text-emerald-800">
          {sendStatus.success} {activeTab === 'email' ? 'emails' : 'mail items'} will be sent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <div className="text-sm text-slate-600">Sent</div>
              <div className="text-3xl font-bold text-emerald-600">{sendStatus.success}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-slate-400" />
            <div>
              <div className="text-sm text-slate-600">Failed</div>
              <div className="text-3xl font-bold text-slate-400">{sendStatus.failed}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-slate-900 mb-2">Auto-Logged to Communication Log</h4>
        <p className="text-sm text-slate-700 mb-4">
          All {sendStatus.success} communications have been automatically recorded in the Communication Log
          with timestamp, template, and recipient information.
        </p>
        <Link
          to="/communications"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <Download className="w-4 h-4" />
          View Communication Log
        </Link>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => {
            setStep(1);
            setSelectedRows(new Set());
            setSelectAllChecked(false);
            setSelectedProgram('');
            setSelectedAttempt('');
            setSelectedTemplate('');
            setActiveTab('email');
            setSendStatus(null);
          }}
          className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold"
        >
          Send Another Batch
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Batch Compliance Email</h1>
          <p className="text-lg text-slate-600">Replace the mail merge workflow</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex justify-between items-center">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  stepNum <= step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-24 h-1 mx-2 transition-all ${
                    stepNum < step ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-4 gap-4 mb-8 text-center text-sm font-medium text-slate-600">
          <div>Filter</div>
          <div>Template</div>
          <div>Review</div>
          <div>Results</div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
}
