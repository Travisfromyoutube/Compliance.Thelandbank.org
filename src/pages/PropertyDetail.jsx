import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle,
  Circle,
  Home,
  Shield,
  FileCheck,
  AlertTriangle,
  Link2,
  Copy,
  CheckCheck,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Card, StatCard, StatusPill, AdminPageHeader } from '../components/ui';
import { PROGRAM_TYPES } from '../data/mockData';
import { useProperties } from '../context/PropertyContext';
import {
  generateMilestones,
  formatDate,
  daysOverdue,
  getMilestoneStatus,
  daysBetween,
  addDays,
  getCompletedDateForMilestone,
  getFirstOverdueMilestoneDate,
} from '../utils/milestones';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatParcelIdDashed } from '../config/filemakerFieldMap';

const PropertyDetail = () => {
  usePageTitle('Property Detail');
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties } = useProperties();

  /* ── Token generation state ──────────────────────── */
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  /* ── Notes state ───────────────────────────────── */
  const [notes, setNotes] = useState([]);
  const [newNoteBody, setNewNoteBody] = useState('');
  const [newNoteVisibility, setNewNoteVisibility] = useState('internal');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    fetch(`/api/notes?propertyId=${id}`)
      .then((r) => r.ok ? r.json() : { notes: [] })
      .then((data) => { if (mounted) setNotes(data.notes || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  const handleAddNote = async () => {
    if (!newNoteBody.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, body: newNoteBody.trim(), visibility: newNoteVisibility }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setNewNoteBody('');
      }
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    setGeneratedLink(null);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedLink(data.url);
      }
    } catch (e) {
      console.error('Token generation failed:', e);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const property = useMemo(() => {
    return properties.find((p) => p.id === id);
  }, [id, properties]);

  const milestones = useMemo(() => {
    return property ? generateMilestones(property.programType, property.dateSold) : [];
  }, [property]);

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text mb-2">Property Not Found</h2>
          <p className="text-muted mb-6">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="w-full px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-md font-medium transition-colors"
          >
            Back to Properties
          </button>
        </Card>
      </div>
    );
  }

  // Enforcement status mapping
  const getEnforcementStatus = (level) => {
    const statusMap = {
      0: 'compliant',
      1: 'watch',
      2: 'at-risk',
      3: 'at-risk',
      4: 'default',
    };
    return statusMap[level] || 'default';
  };

  // Get milestone status icon
  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-success" />;
      case 'due-soon':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-danger" />;
      default:
        return <Circle className="w-5 h-5 text-muted" />;
    }
  };

  // Program-specific content renderer
  const renderProgramContent = () => {
    switch (property.programType) {
      case PROGRAM_TYPES.FEATURED:
        return (
          <Card title="Featured Homes Requirements" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Occupancy Status</p>
                <div className="flex items-center gap-2">
                  {property.occupancyEstablished === 'Yes' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : property.occupancyEstablished === 'Unsure' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  )}
                  <span className="text-sm font-semibold text-text">
                    {property.occupancyEstablished === 'Yes' ? 'Occupied'
                      : property.occupancyEstablished === 'Unsure' ? 'Unsure'
                      : 'Not Yet Occupied'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Insurance Status</p>
                <div className="flex items-center gap-2">
                  {property.insuranceReceived ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-danger" />
                  )}
                  <span className="text-sm font-semibold text-text">
                    {property.insuranceReceived ? 'Received' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Hold Period Timeline</p>
                <p className="text-text">
                  <span className="font-semibold font-mono">
                    {property.minimumHoldExpiry
                      ? `${Math.round(daysBetween(property.dateSold, property.minimumHoldExpiry) / 30)} months`
                      : '36 months'}
                  </span>
                  <span className="text-muted ml-2 text-xs">
                    (expires <span className="font-mono">{formatDate(property.minimumHoldExpiry)}</span>)
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Annual Certification Date</p>
                <p className="text-sm font-semibold text-text font-mono">
                  {formatDate(addDays(property.dateSold, 365))}
                </p>
              </div>
            </div>
          </Card>
        );

      case PROGRAM_TYPES.R4R:
        return (
          <Card title="Rehabilitation Progress" className="mb-8">
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-text">Completion Progress</p>
                  <span className="text-lg font-semibold text-accent">
                    {property.percentComplete || 0}%
                  </span>
                </div>
                <div className="w-full bg-warm-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-accent transition-all"
                    style={{ width: `${property.percentComplete || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text mb-4">Rehabilitation Milestones</p>
                <div className="space-y-3">
                  {[
                    { label: 'Scope of Work Approved', done: property.scopeOfWorkApproved },
                    { label: 'Building Permit Obtained', done: property.buildingPermitObtained },
                    { label: 'Mobilization (25%)', done: property.percentComplete >= 25 },
                    { label: 'Construction (50%)', done: property.percentComplete >= 50 },
                    { label: 'Near Completion (75%)', done: property.percentComplete >= 75 },
                    { label: 'Rehabilitation Complete', done: property.percentComplete >= 100 },
                  ].map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {milestone.done ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${milestone.done ? 'text-text' : 'text-muted'}`}>
                        {milestone.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
                <div>
                  <p className="text-xs font-label font-medium text-muted uppercase mb-2">Permit Status</p>
                  <div className="flex items-center gap-2">
                    {property.buildingPermitObtained ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-warning" />
                    )}
                    <span className="text-sm text-text">
                      {property.buildingPermitObtained ? 'Obtained' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-label font-medium text-muted uppercase mb-2">Rehab Deadline</p>
                  <p className="text-sm font-semibold text-text font-mono">{formatDate(property.rehabDeadline)}</p>
                </div>
              </div>
            </div>
          </Card>
        );

      case PROGRAM_TYPES.DEMO:
        return (
          <Card title="Demolition Status" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Demolition Status</p>
                <div className="flex items-center gap-2">
                  {property.demoFinalCertDate ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Clock className="w-5 h-5 text-accent" />
                  )}
                  <span className="text-sm font-semibold text-text">
                    {property.demoFinalCertDate ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Local Gov Certification</p>
                <div className="flex items-center gap-2">
                  {property.demoFinalCertDate ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  )}
                  <span className="text-sm font-semibold text-text">
                    {property.demoFinalCertDate
                      ? <>Certified - <span className="font-mono">{formatDate(property.demoFinalCertDate)}</span></>
                      : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs font-label font-medium text-muted uppercase">Proof of Investment</p>
                <div className="flex items-center gap-2">
                  {property.dateProofOfInvestProvided ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-danger" />
                  )}
                  <span className="text-sm font-semibold text-text">
                    {property.dateProofOfInvestProvided
                      ? <>Provided - <span className="font-mono">{formatDate(property.dateProofOfInvestProvided)}</span></>
                      : 'Not Provided'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );

      case PROGRAM_TYPES.VIP: {
        const rcIntervals = [15, 45, 90, 135, 180, 225, 270, 315, 360];
        const checklistSections = [
          {
            name: '15-Day Check-In',
            data: property.checkIn15Day,
            labels: {
              propertyIsSecure: 'Property is secure',
              cleanedUp: 'Cleaned up',
              lawnMowed: 'Lawn mowed',
            },
          },
          {
            name: '45-Day Check-In',
            data: property.checkIn45Day,
            labels: {
              beforePicturesProvided: 'Before pictures provided',
              permitsPulled: 'Permits pulled',
              estimatesOrContractsProvided: 'Estimates/contracts provided',
              estimatedDateOfCompletionGiven: 'Estimated completion date given',
              waterUtilityActivated: 'Water utility activated',
              electricUtilityActivated: 'Electric utility activated',
              gasUtilityActivated: 'Gas utility activated',
              lawnMowed: 'Lawn mowed',
              afterPicturesProvided: 'After pictures provided',
            },
          },
          {
            name: 'Completion Checklist',
            data: property.completionChecklist,
            labels: {
              exteriorPhotos: 'Exterior Photos',
              interiorPhotos: 'Interior Photos',
              allPermitsCompleted: 'All permits completed',
              cocOrCoo: 'COC or COO',
              lbaStaffInspectionSatisfied: 'LBA Staff Inspection satisfied',
            },
          },
        ];

        return (
          <Card title="RC Timeline & Checklists" subtitle={property.complianceType ? `(${property.complianceType})` : undefined} className="mb-8">
            <div className="mb-8">
              <p className="text-sm font-semibold text-text mb-4">Release Certificate Timeline</p>
              <div className="space-y-2 bg-surface rounded-lg border border-border p-4">
                {rcIntervals.map((days, idx) => {
                  const rcKey = `RC${days}`;
                  const rcData = property.rcDates?.[rcKey];
                  const isCompleted = !!rcData?.completed;

                  return (
                    <div key={idx} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted" />
                        )}
                        <span className="text-sm font-medium text-text">{rcKey}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span>Due: <span className="font-mono">{rcData?.due ? formatDate(rcData.due) : '-'}</span></span>
                        {isCompleted && (
                          <span className="text-success font-medium">Done: <span className="font-mono">{formatDate(rcData.completed)}</span></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {checklistSections.map((section, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-text mb-3">{section.name}</p>
                  {section.data ? (
                    <div className="space-y-2">
                      {Object.entries(section.labels).map(([key, label]) => {
                        const value = section.data[key];
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="ml-2 mb-2">
                              <p className="text-xs font-label font-medium text-muted uppercase tracking-wide mb-1">
                                {label}
                              </p>
                              {Object.entries(value).map(([subKey, subVal]) => (
                                <div key={subKey} className="flex items-center gap-2 ml-2">
                                  <input
                                    type="checkbox"
                                    checked={!!subVal}
                                    readOnly
                                    className="w-4 h-4 rounded accent-accent"
                                  />
                                  <span className="text-sm text-text">
                                    {subKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!value}
                              readOnly
                              className="w-4 h-4 rounded accent-accent"
                            />
                            <span className="text-sm text-text">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted italic">No data available</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  // Calculate enforcement data
  const enforcementData = useMemo(() => {
    if (property.enforcementLevel === 0) return { overdue: 0 };
    const firstOverdueDate = getFirstOverdueMilestoneDate(property);
    const overdue = firstOverdueDate ? daysOverdue(firstOverdueDate) : 0;
    return { overdue };
  }, [property]);

  // Enforcement required actions
  const getEnforcementActions = (level) => {
    const actions = {
      1: [
        'Send compliance notice and offer technical assistance',
        'Owner must respond within 10 days',
        'Submit written compliance plan',
      ],
      2: [
        'Mandatory compliance conference required',
        'Submit detailed remediation plan with timeline',
        'Formal compliance review initiated',
      ],
      3: [
        'Formal Default Notice issued',
        'Legal remedies under consideration',
        'Property may be listed as scofflaw',
        'Lien may be filed against property',
      ],
      4: [
        'Property recovery proceedings may begin',
        'Legal remedies initiated',
        'Property reversion proceedings may begin',
        'Code enforcement legal action',
      ],
    };
    return actions[level] || [];
  };

  const enforcementStatus = getEnforcementStatus(property.enforcementLevel);
  const enforcementVariant = property.enforcementLevel === 0 ? 'success' : property.enforcementLevel <= 1 ? 'warning' : 'danger';
  const statVariant = property.enforcementLevel === 0 ? 'success' : property.enforcementLevel <= 1 ? 'warning' : property.enforcementLevel <= 2 ? 'warning' : 'danger';

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        breadcrumb={{ label: 'Back to Properties', to: '/properties' }}
        title={property.address}
        subtitle={<>Parcel: <span className="font-mono">{property.parcelId}</span>{' / '}<span className="font-mono text-muted">{property.parcelIdDashed || formatParcelIdDashed(property.parcelId)}</span></>}
        icon={Home}
        actions={
          <div className="flex gap-2 flex-wrap justify-end">
            {property.availability && (
              <StatusPill fmStatus={property.availability}>{property.availability}</StatusPill>
            )}
            <StatusPill variant="default">{property.programType}</StatusPill>
            <StatusPill status={enforcementStatus}>
              {property.enforcementLevel === 0 ? 'Compliant' : `Level ${property.enforcementLevel}`}
            </StatusPill>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Enforcement Level"
          value={property.enforcementLevel === 0 ? 'Compliant' : <span className="font-mono">{`Level ${property.enforcementLevel}`}</span>}
          variant={statVariant}
          icon={Shield}
        />
        <StatCard
          label="Days Overdue"
          value={enforcementData.overdue > 0 ? <span className="font-mono">{enforcementData.overdue}</span> : '-'}
          variant={enforcementData.overdue > 0 ? 'warning' : 'default'}
          icon={Clock}
        />
        <StatCard
          label="Program Type"
          value={property.programType}
          icon={Home}
        />
        <StatCard
          label="Compliance Status"
          value={property.enforcementLevel === 0 ? 'On Track' : 'At Risk'}
          variant={property.enforcementLevel === 0 ? 'success' : 'danger'}
          icon={FileCheck}
        />
      </div>

      {/* Building Details (physical property info from FM) */}
      {(property.bedrooms != null || property.baths != null || property.sqFt != null || property.yearBuilt != null) && (
        <Card title="Building Details" className="animate-fade-slide-up admin-stagger-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.bedrooms != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Bedrooms</p>
                <p className="text-lg font-semibold text-text font-mono">{property.bedrooms}</p>
              </div>
            )}
            {property.baths != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Baths</p>
                <p className="text-lg font-semibold text-text font-mono">{property.baths}</p>
              </div>
            )}
            {property.sqFt != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Sq Ft</p>
                <p className="text-lg font-semibold text-text font-mono">{property.sqFt.toLocaleString()}</p>
              </div>
            )}
            {property.yearBuilt != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Year Built</p>
                <p className="text-lg font-semibold text-text font-mono">{property.yearBuilt}</p>
              </div>
            )}
            {property.stories != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Stories</p>
                <p className="text-lg font-semibold text-text font-mono">{property.stories}</p>
              </div>
            )}
            {property.garageSize != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Garage</p>
                <p className="text-lg font-semibold text-text font-mono">{property.garageSize} sq ft</p>
              </div>
            )}
            {property.basementSize != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Basement</p>
                <p className="text-lg font-semibold text-text font-mono">{property.basementSize} sq ft</p>
              </div>
            )}
            {property.lotSize != null && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">Lot Size</p>
                <p className="text-lg font-semibold text-text font-mono">{property.lotSize} acres</p>
              </div>
            )}
            {property.school && (
              <div className="space-y-1">
                <p className="text-xs font-label font-medium text-muted uppercase">School District</p>
                <p className="text-lg font-semibold text-text">{property.school}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Property Details */}
      <Card title="Property Details" className="animate-fade-slide-up admin-stagger-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-label font-medium text-muted uppercase mb-1">Parcel ID</p>
              <p className="text-sm font-semibold text-text font-mono">{property.parcelId}</p>
            </div>
            <div>
              <p className="text-xs font-label font-medium text-muted uppercase mb-1">Buyer Name</p>
              <p className="text-sm font-semibold text-text">{property.buyerName || property.buyer}</p>
            </div>
            <div>
              <p className="text-xs font-label font-medium text-muted uppercase mb-1">Email</p>
              <p className="text-sm font-semibold text-text">{property.buyerEmail || 'Not provided'}</p>
            </div>
            {property.topNote && (
              <div>
                <p className="text-xs font-label font-medium text-muted uppercase mb-1">Top Note</p>
                <p className="text-sm font-semibold text-text font-mono">{property.topNote}</p>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-label font-medium text-muted uppercase mb-1">Date Sold</p>
              <p className="text-sm font-semibold text-text font-mono">{formatDate(property.dateSold)}</p>
            </div>
            <div>
              <p className="text-xs font-label font-medium text-muted uppercase mb-1">Offer Type</p>
              <p className="text-sm font-semibold text-text">{property.offerType || 'Standard'}</p>
            </div>
            <div>
              <p className="text-xs font-label font-medium text-muted uppercase mb-1">Program</p>
              <p className="text-sm font-semibold text-text">{property.programType}</p>
            </div>
          </div>
        </div>

        {/* ── Generate Submission Link ──────────────────── */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-text">Buyer Submission Link</p>
              <p className="text-xs text-muted mt-0.5">Generate a secure link for this buyer to submit compliance updates</p>
            </div>
            <button
              onClick={handleGenerateToken}
              disabled={generatingToken}
              className={[
                'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                generatingToken
                  ? 'bg-warm-100 text-muted cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-dark text-white',
              ].join(' ')}
            >
              {generatingToken ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Generate Link
                </>
              )}
            </button>
          </div>

          {generatedLink && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-3">
              <p className="text-xs text-muted mb-2">Share this link with the buyer:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 text-sm font-mono bg-surface border border-border rounded-md px-3 py-2 text-text"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-surface border border-border rounded-md hover:bg-warm-100 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-success" />
                      <span className="text-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted mt-2">Expires in 30 days. Buyer can submit multiple times.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Program-Specific Content */}
      <div className="animate-fade-slide-up admin-stagger-4">
        {renderProgramContent()}
      </div>

      {/* Milestone Timeline */}
      <Card title="Milestone Timeline" className="animate-fade-slide-up admin-stagger-5">
        {milestones.length > 0 ? (
          <div className="relative">
            <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-warm-200"></div>
            <div className="space-y-6">
              {milestones.map((milestone, idx) => {
                const completedDate = getCompletedDateForMilestone(milestone, property);
                const status = getMilestoneStatus(milestone, completedDate);
                const statusVariantMap = {
                  completed: 'success',
                  'due-soon': 'warning',
                  overdue: 'danger',
                  pending: 'default',
                };
                const variant = statusVariantMap[status] || 'default';
                const bgColorMap = {
                  success: 'bg-success-light',
                  warning: 'bg-warning-light',
                  danger: 'bg-danger-light',
                  default: 'bg-surface-alt',
                };
                const borderColorMap = {
                  success: 'border-success',
                  warning: 'border-warning',
                  danger: 'border-danger',
                  default: 'border-border',
                };
                const dotBg = bgColorMap[variant];
                const dotBorder = borderColorMap[variant];

                return (
                  <div key={idx} className="relative pl-16 sm:pl-20">
                    <div
                      className={`absolute left-0 top-1.5 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 ${dotBorder} ${dotBg} flex items-center justify-center`}
                    >
                      {getMilestoneIcon(status)}
                    </div>
                    <div className="bg-surface rounded-lg p-5 border border-border">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-semibold text-text text-sm">{milestone.label}</h3>
                        <StatusPill status={status}>
                          {status === 'due-soon'
                            ? 'Due Soon'
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                        </StatusPill>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted">
                        <div>
                          <p className="text-xs font-label font-medium text-muted uppercase mb-1">Due Date</p>
                          <p className="font-medium text-text font-mono">{formatDate(milestone.dueDate)}</p>
                        </div>
                        {completedDate && (
                          <div>
                            <p className="text-xs font-label font-medium text-muted uppercase mb-1">Completed</p>
                            <p className="font-medium text-success font-mono">{formatDate(completedDate)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-label font-medium text-muted uppercase mb-1">Category</p>
                          <p className="font-medium text-text">{milestone.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">No Milestones</p>
            <p className="text-xs text-muted">No milestones defined for this property</p>
          </div>
        )}
      </Card>

      {/* Enforcement Action */}
      {property.enforcementLevel > 0 && (
        <Card title="Enforcement Action" variant={enforcementVariant} className="animate-fade-slide-up admin-stagger-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <p className="text-xs font-label font-medium text-muted uppercase">Enforcement Level</p>
              <p className="text-2xl font-semibold text-text font-mono">Level {property.enforcementLevel}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-label font-medium text-muted uppercase">Days Overdue</p>
              <p className="text-2xl font-semibold text-text font-mono">
                {enforcementData.overdue > 0 ? enforcementData.overdue : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 pb-8 border-b border-border">
            <div className="space-y-2">
              <p className="text-xs font-label font-medium text-muted uppercase">1st Compliance Attempt</p>
              <p className="text-sm font-semibold text-text font-mono">
                {property.compliance1stAttempt ? formatDate(property.compliance1stAttempt) : 'Not yet sent'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-label font-medium text-muted uppercase">2nd Compliance Attempt</p>
              <p className="text-sm font-semibold text-text font-mono">
                {property.compliance2ndAttempt ? formatDate(property.compliance2ndAttempt) : 'Not yet sent'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-text mb-4">Required Actions:</p>
            <ul className="space-y-3">
              {getEnforcementActions(property.enforcementLevel).map((action, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-text">
                  <div className="w-1.5 h-1.5 rounded-full bg-text mt-1.5 flex-shrink-0"></div>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Communication History */}
      <Card title="Communication History" className="animate-fade-slide-up admin-stagger-6">
        {property.communications && property.communications.length > 0 ? (
          <div className="space-y-4">
            {property.communications
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((comm, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 pb-4 border-b border-warm-200 last:pb-0 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm truncate">{comm.template}</p>
                    <p className="text-xs text-muted mt-1 capitalize">{comm.type}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusPill status={comm.status === 'sent' ? 'compliant' : 'at-risk'}>
                      {comm.status}
                    </StatusPill>
                    <span className="text-xs text-muted whitespace-nowrap font-mono">{formatDate(comm.date)}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">No Communications</p>
            <p className="text-xs text-muted">No communications recorded for this property</p>
          </div>
        )}
      </Card>

      {/* Notes / Activity Log */}
      <Card title="Notes" className="animate-fade-slide-up admin-stagger-6">
        {/* Add note form */}
        <div className="mb-6 pb-6 border-b border-border">
          <textarea
            value={newNoteBody}
            onChange={(e) => setNewNoteBody(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <select
                value={newNoteVisibility}
                onChange={(e) => setNewNoteVisibility(e.target.value)}
                className="text-xs px-2 py-1 border border-border rounded bg-surface text-text"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
              <span className="text-xs text-muted">
                {newNoteVisibility === 'internal' ? 'Staff only' : 'Visible to buyer'}
              </span>
            </div>
            <button
              onClick={handleAddNote}
              disabled={savingNote || !newNoteBody.trim()}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                savingNote || !newNoteBody.trim()
                  ? 'bg-warm-100 text-muted cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-dark text-white',
              ].join(' ')}
            >
              <Send className="w-3.5 h-3.5" />
              {savingNote ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="pb-4 border-b border-warm-200 last:pb-0 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text">{note.creator || 'Staff'}</span>
                  <span className="text-xs text-muted font-mono">{formatDate(note.createdAt)}</span>
                  {note.visibility === 'external' && (
                    <StatusPill variant="default">External</StatusPill>
                  )}
                </div>
                <p className="text-sm text-text whitespace-pre-wrap">{note.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">No Notes</p>
            <p className="text-xs text-muted">Add notes to track activity for this property</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PropertyDetail;
