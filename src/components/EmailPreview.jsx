import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, AlertCircle, Send } from 'lucide-react';
import { Card, StatusPill } from './ui';
import { renderTemplate, findTemplateForAction } from '../lib/templateRenderer';

export function EmailPreview({ properties, templates, timings, onClose, onApproveAndSend }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length > 0 ? properties[0].id : null
  );
  const [copiedState, setCopiedState] = useState(null);
  const [sendState, setSendState] = useState(null); // 'confirming' | 'sending' | 'sent'
  const [mobileTab, setMobileTab] = useState('recipients'); // 'recipients' | 'preview'

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedTiming = selectedProperty ? timings[selectedProperty.id] : null;
  const selectedTemplate = useMemo(() => {
    if (!selectedProperty || !selectedTiming) return null;
    return findTemplateForAction(templates, selectedProperty.programType, selectedTiming.currentAction);
  }, [selectedProperty, selectedTiming, templates]);

  const renderedEmail = useMemo(() => {
    if (!selectedTemplate || !selectedProperty || !selectedTiming) {
      return null;
    }
    return renderTemplate(selectedTemplate, selectedTiming.currentAction, selectedProperty);
  }, [selectedTemplate, selectedProperty, selectedTiming]);

  const handleCopyEmail = async () => {
    if (!renderedEmail || !selectedProperty) return;

    const text = `To: ${selectedProperty.buyerEmail || 'No email on file'}\nSubject: ${renderedEmail.subject}\n\n${renderedEmail.body}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedState('email');
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyAll = async () => {
    const allEmails = properties.map(prop => {
      const timing = timings[prop.id];
      const template = findTemplateForAction(templates, prop.programType, timing.currentAction);
      if (!template) {
        return `To: ${prop.buyerEmail || 'No email on file'}\nSubject: N/A\n\nNo template available`;
      }
      const rendered = renderTemplate(template, timing.currentAction, prop);
      return `To: ${prop.buyerEmail || 'No email on file'}\nSubject: ${rendered.subject}\n\n${rendered.body}`;
    }).join('\n---\n');

    try {
      await navigator.clipboard.writeText(allEmails);
      setCopiedState('all');
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error('Failed to copy all:', err);
    }
  };

  const handleExportCSV = () => {
    const rows = properties.map(prop => {
      const timing = timings[prop.id];
      const template = findTemplateForAction(templates, prop.programType, timing.currentAction);

      let subject = '';
      let body = '';

      if (template) {
        const rendered = renderTemplate(template, timing.currentAction, prop);
        subject = rendered.subject;
        body = rendered.body;
      }

      return {
        email: prop.buyerEmail || 'No email on file',
        subject,
        body
      };
    });

    const csv = generateCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `compliance-emails-${date}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (rows) => {
    const headers = ['Email', 'Subject', 'Body'];
    const csvRows = [headers.map(escapeCSVField).join(',')];

    rows.forEach(row => {
      csvRows.push([
        escapeCSVField(row.email),
        escapeCSVField(row.subject),
        escapeCSVField(row.body)
      ].join(','));
    });

    return csvRows.join('\n');
  };

  const escapeCSVField = (field) => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Count properties with valid buyerEmail
  const validEmailCount = properties.filter(p => p.buyerEmail).length;

  const handleApproveAndSendClick = () => {
    setSendState('confirming');
  };

  const handleConfirmSend = async () => {
    setSendState('sending');

    // Build entries for all properties with valid emails
    const entries = properties
      .filter(p => p.buyerEmail)
      .map(prop => {
        const timing = timings[prop.id];
        const template = findTemplateForAction(templates, prop.programType, timing.currentAction);

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

    // Call the callback
    if (onApproveAndSend) {
      await onApproveAndSend(entries);
    }

    // Show success state
    setSendState('sent');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleCancelSend = () => {
    setSendState(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full sm:w-[900px] max-w-[95vw] max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-text truncate">Email Preview</h2>
            <span className="bg-accent/10 text-accent px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
              {properties.length} recipients
            </span>
          </div>

          <div className="flex items-center flex-wrap justify-end gap-2">
            {onApproveAndSend && (
              <button
                onClick={handleApproveAndSendClick}
                disabled={validEmailCount === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-lg bg-success text-white hover:bg-success/90 transition-colors text-sm font-medium disabled:bg-surface-alt disabled:text-muted disabled:cursor-not-allowed"
                title={validEmailCount === 0 ? "No recipients with valid emails" : "Approve and send all emails"}
              >
                {sendState === 'sent' ? (
                  <>
                    <Check size={16} />
                    <span className="hidden sm:inline">Sent!</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span className="hidden sm:inline">Approve & Send ({validEmailCount})</span>
                    <span className="sm:hidden">Send ({validEmailCount})</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
              title="Copy all emails to clipboard"
            >
              {copiedState === 'all' ? <Check size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copiedState === 'all' ? 'Copied' : 'Copy All'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
              title="Export all emails as CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-surface-alt rounded-lg transition-colors text-muted hover:text-text"
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex gap-1 p-2 bg-surface-alt border-b border-border sm:hidden">
          <button
            onClick={() => setMobileTab('recipients')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mobileTab === 'recipients' ? 'bg-white text-text shadow-sm font-heading' : 'text-muted hover:text-text'
            }`}
          >
            Recipients ({properties.length})
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mobileTab === 'preview' ? 'bg-white text-text shadow-sm font-heading' : 'text-muted hover:text-text'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Recipient Tabs (Left Sidebar) */}
          <div className={`w-full sm:w-64 border-r border-border overflow-y-auto bg-surface-alt ${mobileTab !== 'recipients' ? 'hidden sm:block' : ''}`}>
            {properties.length === 0 ? (
              <div className="p-4 text-muted text-sm">
                No properties to preview
              </div>
            ) : (
              <div className="divide-y divide-border">
                {properties.map(prop => {
                  const isSelected = prop.id === selectedPropertyId;
                  const timing = timings[prop.id];
                  const hasEmail = !!prop.buyerEmail;

                  return (
                    <button
                      key={prop.id}
                      onClick={() => {
                        setSelectedPropertyId(prop.id);
                        setMobileTab('preview');
                      }}
                      className={`w-full text-left p-4 min-h-[44px] transition-colors opacity-100 ${
                        !hasEmail ? 'opacity-60' : ''
                      } ${
                        isSelected
                          ? 'bg-surface border-l-4 border-accent'
                          : 'hover:bg-surface/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text text-sm truncate">
                            {prop.buyerName || 'Unknown Buyer'}
                          </p>
                          <p className="text-xs text-muted truncate mt-1">
                            {prop.address || 'No address'}
                          </p>
                        </div>
                        {!hasEmail && (
                          <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      {timing && (
                        <div className="mt-2">
                          <StatusPill status={timing.currentAction}>
                            {timing.currentAction}
                          </StatusPill>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Pane (Right Side) */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col ${mobileTab !== 'preview' ? 'hidden sm:flex' : ''}`}>
            {!selectedProperty ? (
              <div className="flex items-center justify-center h-full text-muted">
                <p>Select a recipient to preview their email</p>
              </div>
            ) : !selectedTemplate ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted mb-2">
                    No template available for this action/program combination
                  </p>
                  <p className="text-xs text-muted">
                    Program: {selectedProperty.programType} | Action: {selectedTiming?.currentAction}
                  </p>
                </div>
              </div>
            ) : !renderedEmail ? (
              <div className="flex items-center justify-center h-full text-muted">
                <p>Error rendering email</p>
              </div>
            ) : (
              <>
                <div className="mb-4 sm:mb-6">
                  <Card className="p-4 bg-surface-alt border border-border">
                    <div className="mb-4">
                      <label className="block text-xs font-label font-semibold text-muted uppercase tracking-wide mb-1">
                        To
                      </label>
                      <p className={selectedProperty.buyerEmail ? 'text-text' : 'text-danger'}>
                        {selectedProperty.buyerEmail ? <span className="font-mono text-sm break-all">{selectedProperty.buyerEmail}</span> : 'No email on file'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-label font-semibold text-muted uppercase tracking-wide mb-1">
                        Subject
                      </label>
                      <p className="text-text font-medium text-sm sm:text-base">
                        {renderedEmail.subject}
                      </p>
                    </div>
                  </Card>
                </div>

                <div className="flex-1 mb-4 sm:mb-6">
                  <label className="block text-xs font-label font-semibold text-muted uppercase tracking-wide mb-2">
                    Body
                  </label>
                  <Card className="p-4 bg-white border border-border h-full overflow-y-auto">
                    <div className="whitespace-pre-wrap text-text text-sm leading-relaxed">
                      {renderEmailBody(renderedEmail.body)}
                    </div>
                  </Card>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors font-medium"
                  >
                    {copiedState === 'email' ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy this email
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Confirmation Bar */}
        {sendState === 'confirming' && (
          <div className="border-t border-border px-4 sm:px-6 py-4 bg-warning-light border-warning">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-text">
                <span className="font-semibold">You are about to send {validEmailCount} email{validEmailCount !== 1 ? 's' : ''}.</span> This action will be logged.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSend}
                  className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] text-sm font-medium text-text bg-surface-alt hover:bg-border rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Confirm Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render email body text with highlighting for missing/unresolved variables
 * Variables that weren't replaced appear as {{variableName}} or similar
 */
function renderEmailBody(body) {
  // Pattern to match unresolved template variables like {{name}}, ${var}, etc.
  const variablePattern = /(\{\{[^}]+\}\}|\$\{[^}]+\})/g;
  const parts = body.split(variablePattern);

  return parts.map((part, idx) => {
    if (variablePattern.test(part)) {
      return (
        <span
          key={idx}
          className="bg-warning-light text-warning px-1 rounded font-mono text-xs"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
