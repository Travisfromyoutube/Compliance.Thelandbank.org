import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Mail } from 'lucide-react';
import { Card, StatusPill } from './ui';
import { formatDate } from '../utils/milestones';
import { ACTION_LABELS } from '../data/emailTemplates';

function getEnforcementLevelVariant(level) {
  if (level === 0) return 'success';
  if (level >= 1 && level <= 2) return 'warning';
  if (level >= 3 && level <= 4) return 'danger';
  return 'info';
}

function getEnforcementLevelText(level) {
  if (level === 0) return 'Compliant';
  return `Level ${level}`;
}

function getActionVariant(action) {
  const variantMap = {
    NOT_DUE_YET: 'success',
    ATTEMPT_1: 'info',
    ATTEMPT_2: 'warning',
    WARNING: 'warning',
    DEFAULT_NOTICE: 'danger',
  };
  return variantMap[action] || 'info';
}

export function PropertyDetailDrawer({ property, timing, onClose, onPrepareEmail }) {
  const navigate = useNavigate();

  const handleViewProperty = () => {
    navigate(`/properties/${property.id}`);
    onClose();
  };

  const handlePrepareEmail = () => {
    onPrepareEmail(property, timing);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 bg-surface shadow-2xl overflow-y-auto transition-transform duration-300"
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-heading font-semibold text-text-primary">{property.address}</h2>
            <p className="text-sm text-text-muted">Parcel ID: <span className="font-mono">{property.parcelId}</span></p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 hover:bg-hover rounded-lg transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Buyer Info Section */}
          <Card>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Buyer Name</p>
                <p className="text-text-primary font-medium">{property.buyerName}</p>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Email</p>
                <a
                  href={`mailto:${property.buyerEmail}`}
                  className="text-accent hover:underline flex items-center gap-1"
                >
                  {property.buyerEmail}
                  <Mail size={14} />
                </a>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Organization</p>
                <p className="text-text-primary">{property.organization || '-'}</p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <StatusPill variant="info">{property.programType}</StatusPill>
                <StatusPill variant={getEnforcementLevelVariant(property.enforcementLevel)}>
                  {getEnforcementLevelText(property.enforcementLevel)}
                </StatusPill>
              </div>
            </div>
          </Card>

          {/* Compliance Timing Section */}
          <Card>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Current Action</p>
                <div className="mt-1">
                  <StatusPill variant={getActionVariant(timing.currentAction)}>
                    {ACTION_LABELS[timing.currentAction] || timing.currentAction}
                  </StatusPill>
                </div>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Due Date</p>
                <p className="text-text-primary">
                  {timing.dueDate ? formatDate(timing.dueDate) : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Days Overdue</p>
                <p className={timing.daysOverdue > 0 ? 'text-danger font-semibold font-mono' : 'text-text-primary'}>
                  {timing.daysOverdue}
                </p>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Days Since Close</p>
                <p className="text-text-primary font-mono">{timing.daysSinceClose}</p>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Next Action</p>
                <p className="text-text-primary">
                  {timing.nextAction ? ACTION_LABELS[timing.nextAction] : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Next Due Date</p>
                <p className="text-text-primary">
                  {timing.nextDueDate ? formatDate(timing.nextDueDate) : '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-heading font-medium text-text-muted uppercase tracking-wide">Recommended Level</p>
                <p className="text-text-primary font-medium font-mono">{timing.recommendedEnforcementLevel || '-'}</p>
              </div>
            </div>
          </Card>

          {/* Communication History Section */}
          <Card>
            <div>
              <h3 className="text-sm font-heading font-semibold text-text-primary mb-3">Communication History</h3>
              {property.communications && property.communications.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {property.communications.map((comm, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-border pl-3 py-2"
                    >
                      <p className="text-text-muted text-xs">
                        <span className="font-mono">{formatDate(comm.date)}</span> • {comm.type}
                      </p>
                      <p className="text-text-primary font-medium">{comm.templateName || comm.subject || 'Communication'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">No communication history</p>
              )}
            </div>
          </Card>

          {/* Spacer for sticky buttons */}
          <div className="h-24" />
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 right-0 w-full sm:w-[420px] bg-surface border-t border-border px-6 py-4 space-y-3">
          <button
            onClick={handlePrepareEmail}
            className="w-full min-h-[44px] px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
          >
            Prepare Email
          </button>
          <button
            onClick={handleViewProperty}
            className="w-full min-h-[44px] px-4 py-2 bg-secondary text-text-primary rounded-lg hover:bg-secondary-hover transition-colors font-medium"
          >
            View Property
          </button>
        </div>
      </div>
    </>
  );
}
