import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ICONS from '../icons/iconMap';
import { AppIcon } from '../components/ui';
import { FormField, TextInput, SelectInput } from '../components/ui';
import {
  BuyerHero,
  BuyerSection,
  BuyerProgressSpine,
  BuyerConfirmation,
  PhotoSlot,
  DropZone,
  FileListItem,
  SaveIndicator,
} from '../components/buyer';
import ComplianceOverview from '../components/buyer/ComplianceOverview';
import { PROGRAM_POLICIES } from '../data/programPolicies';
import { usePageTitle } from '../hooks/usePageTitle';

/* ── Map buyer form values to policy keys ──────────────── */
const FORM_TO_POLICY_KEY = {
  'featured-homes': 'FeaturedHomes',
  'ready4rehab':    'Ready4Rehab',
  'demolition':     'Demolition',
  'vip':            'VIP',
};

/* ── Map program display names to form select values ─── */
const PROGRAM_TYPE_TO_FORM = {
  'Featured Homes': 'featured-homes',
  'Ready4Rehab': 'ready4rehab',
  'Demolition': 'demolition',
  'VIP': 'vip',
};

/* ── Photo slots per program type ──────────────────── */
const DEFAULT_PHOTO_SLOTS = [
  'Front Exterior', 'Rear Exterior', 'Kitchen', 'Bathroom',
  'Living Area', 'Bedroom', 'Basement / Mechanical', 'Active Work Area',
];

const PHOTO_SLOTS_BY_PROGRAM = {
  'featured-homes': [
    'Front Exterior', 'Rear Exterior', 'Kitchen', 'Bathroom',
    'Living Area', 'Primary Bedroom', 'Basement / Mechanical', 'Yard / Lot',
  ],
  'ready4rehab': [
    'Front Exterior', 'Rear Exterior', 'Kitchen', 'Bathroom',
    'Living Area', 'Bedroom', 'Active Work Area', 'Mechanical Systems',
  ],
  demolition: [
    'Front Exterior', 'Rear Exterior', 'Demo Progress', 'Debris Removal',
    'Lot Condition', 'Sidewalk / ROW',
  ],
  vip: [
    'Front Exterior', 'Rear Exterior', 'Kitchen', 'Bathroom',
    'Living Area', 'Bedroom', 'Basement / Mechanical', 'Active Work Area',
    'Yard / Lot', 'Curb Appeal',
  ],
};

export default function BuyerSubmission() {
  usePageTitle('Submit Compliance Update');
  /* ── URL params ──────────────────────────────────────── */
  const [searchParams] = useSearchParams();

  /* ── State ─────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    programType: '',
    closingDate: '',
    reportingMonth: '',
    permitStatus: '',
    inspectionStatus: '',
  });

  const [photoSlots, setPhotoSlots] = useState(() => {
    const slots = {};
    DEFAULT_PHOTO_SLOTS.forEach((s) => { slots[s] = null; });
    return slots;
  });

  const [financialDocs, setFinancialDocs] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [shakeField, setShakeField] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const accessToken = searchParams.get('token');

  /* ── Restore form from sessionStorage (non-token mode only) */
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) return; // Don't restore if token mode - token data takes precedence
    try {
      const saved = sessionStorage.getItem('buyer_form_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore parse errors */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Persist formData to sessionStorage on change */
  useEffect(() => {
    if (submitted) {
      sessionStorage.removeItem('buyer_form_draft');
      return;
    }
    // Only persist if user has entered something (not just defaults)
    const hasContent = Object.values(formData).some((v) => v && v.trim && v.trim() !== '');
    if (hasContent) {
      try {
        sessionStorage.setItem('buyer_form_draft', JSON.stringify(formData));
        setShowSaved(true);
        clearTimeout(window._saveTimer);
        window._saveTimer = setTimeout(() => setShowSaved(false), 2000);
      } catch { /* storage full - ignore */ }
    }
  }, [formData, submitted]);

  /* ── Token verification state ────────────────────── */
  const [tokenMode, setTokenMode] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  /* ── Verify token on mount ───────────────────────── */
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;

    setTokenLoading(true);
    fetch(`/api/tokens?action=verify&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenMode(true);
          setTokenData(data);
          setFormData((prev) => ({
            ...prev,
            firstName: data.buyer.firstName || '',
            lastName: data.buyer.lastName || '',
            email: data.buyer.email || '',
            propertyAddress: data.property.parcelId || '',
            programType: PROGRAM_TYPE_TO_FORM[data.property.programType] || '',
            closingDate: data.property.dateSold || '',
          }));
        } else {
          setTokenError(data.error || 'Invalid access link');
        }
      })
      .catch(() => {
        setTokenError('Unable to verify access link. Please try again.');
      })
      .finally(() => {
        setTokenLoading(false);
      });
  }, [searchParams]);

  /* ── Reset photo slots when program type changes ─── */
  const prevProgramRef = React.useRef(formData.programType);
  useEffect(() => {
    if (formData.programType === prevProgramRef.current) return;
    const hadPhotos = Object.values(photoSlots).some((p) => p !== null);
    if (hadPhotos && prevProgramRef.current) {
      if (!window.confirm('Changing program type will reset your photo slots. Continue?')) {
        setFormData((prev) => ({ ...prev, programType: prevProgramRef.current }));
        return;
      }
    }
    prevProgramRef.current = formData.programType;
    const labels = PHOTO_SLOTS_BY_PROGRAM[formData.programType] || DEFAULT_PHOTO_SLOTS;
    const newSlots = {};
    labels.forEach((s) => { newSlots[s] = null; });
    setPhotoSlots(newSlots);
  }, [formData.programType]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers (all logic preserved from original) ──── */

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Property address is required';
    if (!formData.programType) newErrors.programType = 'Program type is required';

    setErrors(newErrors);

    // Trigger shake on first error field
    const firstError = Object.keys(newErrors)[0];
    if (firstError) {
      setShakeField(firstError);
      setTimeout(() => setShakeField(null), 400);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = (slot, fileOrBlob) => {
    // PhotoSlot now passes an object with { name, data, blobUrl, size }
    // (uploaded to Vercel Blob) or a raw File (fallback)
    if (fileOrBlob && typeof fileOrBlob === 'object' && fileOrBlob.data) {
      setPhotoSlots((prev) => ({
        ...prev,
        [slot]: fileOrBlob,
      }));
    }
  };

  const removePhoto = (slot) => {
    setPhotoSlots((prev) => ({ ...prev, [slot]: null }));
  };

  const addFinancialDoc = (doc) => {
    setFinancialDocs((prev) => [...prev, doc]);
  };

  const addReceipt = (doc) => {
    setReceipts((prev) => [...prev, doc]);
  };

  const removeFinancialDoc = (index) => {
    setFinancialDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const removeReceipt = (index) => {
    setReceipts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setSubmitError('This form requires a secure access link. Please use the link from your compliance email.');
      return;
    }
    if (!validateForm()) return;

    setSubmitError(null);
    setSubmitting(true);

    const documents = [];
    Object.entries(photoSlots).forEach(([slot, file]) => {
      if (file) {
        documents.push({
          filename: file.name, mimeType: 'image/jpeg', sizeBytes: file.size,
          category: 'photo', slot, blobUrl: file.blobUrl || null,
        });
      }
    });
    financialDocs.forEach((doc) => {
      documents.push({
        filename: doc.name, mimeType: 'application/octet-stream', sizeBytes: doc.size,
        category: 'document', blobUrl: doc.blobUrl || null,
      });
    });
    receipts.forEach((doc) => {
      documents.push({
        filename: doc.name, mimeType: 'application/octet-stream', sizeBytes: doc.size,
        category: 'receipt', blobUrl: doc.blobUrl || null,
      });
    });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: formData.propertyAddress,
          token: accessToken,
          type: 'progress',
          formData,
          documents,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to submit your update right now.');
      }

      const result = await res.json();

      setSubmissionData({
        confirmationId: result.confirmationId,
        timestamp: new Date(result.timestamp).toLocaleString(),
        formData,
        photoCount: Object.values(photoSlots).filter((p) => p !== null).length,
        docCount: financialDocs.length,
        receiptCount: receipts.length,
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit your update right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadJSON = () => {
    const data = {
      confirmationId: submissionData.confirmationId,
      timestamp: submissionData.timestamp,
      ...submissionData.formData,
      photos: Object.entries(photoSlots).reduce((acc, [key, value]) => {
        if (value) acc[key] = { name: value.name, size: value.size };
        return acc;
      }, {}),
      documents: financialDocs.map((doc) => ({ name: doc.name, size: doc.size })),
      receipts: receipts.map((r) => ({ name: r.name, size: r.size })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${submissionData.confirmationId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', propertyAddress: '',
      programType: '', closingDate: '', reportingMonth: '',
      permitStatus: '', inspectionStatus: '',
    });
    const slots = {};
    DEFAULT_PHOTO_SLOTS.forEach((s) => { slots[s] = null; });
    setPhotoSlots(slots);
    setFinancialDocs([]);
    setReceipts([]);
    setSubmitted(false);
    setSubmissionData(null);
    setErrors({});
    setSubmitError(null);
  };

  /* ── Success screen ────────────────────────────────── */

  if (submitted && submissionData) {
    return (
      <BuyerConfirmation
        submissionData={submissionData}
        onDownload={handleDownloadJSON}
        onReset={handleReset}
      />
    );
  }

  /* ── Token loading screen ────────────────────────── */
  if (tokenLoading) {
    return (
      <div className="min-h-screen app-bg">
        <BuyerHero />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted font-sans">Verifying your access link...</p>
        </div>
      </div>
    );
  }

  /* ── Token error screen ──────────────────────────── */
  if (tokenError) {
    return (
      <div className="min-h-screen app-bg">
        <BuyerHero />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="bg-surface rounded-xl border border-border p-8 max-w-md mx-auto">
            <AppIcon icon={ICONS.alert} size={48} className="text-danger mx-auto mb-4" />
            <h2 className="font-heading text-lg font-bold text-text mb-2">Access Denied</h2>
            <p className="text-sm text-muted mb-6">{tokenError}</p>
            <p className="text-xs text-muted">
              If you believe this is an error, please contact the Genesee County Land Bank Authority.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Reporting month options (last 7 months) ──────── */
  const reportingMonthOptions = useMemo(() => {
    const options = [{ value: '', label: 'Select month', disabled: true, hidden: true }];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  /* ── Derived values ────────────────────────────────── */

  const photoSlotLabels = PHOTO_SLOTS_BY_PROGRAM[formData.programType] || DEFAULT_PHOTO_SLOTS;

  const uploadedPhotoCount = Object.values(photoSlots).filter((p) => p !== null).length;

  const fieldClass = (field) =>
    shakeField === field ? 'animate-error-shake' : '';

  /* ── Main form ─────────────────────────────────────── */

  return (
    <div className="min-h-screen app-bg">
      <BuyerHero />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex gap-10">
          {/* Progress spine (desktop) */}
          <BuyerProgressSpine />

          {/* Form content */}
          <div className="flex-grow max-w-3xl space-y-14">
            {!tokenMode && (
              <div className="bg-warning-light border border-warning/30 rounded-lg px-4 py-3">
                <p className="text-sm text-warning font-medium">
                  Secure access link required. Please open this form from your compliance email link.
                </p>
              </div>
            )}

            {/* ═══ Compliance Overview (pre-form) ═══ */}
            <ComplianceOverview programType={formData.programType} />

            {/* ═══ Section 1: Your Information ═══ */}
            <BuyerSection
              number={1}
              title="Your Information"
              subtitle={tokenMode ? 'Verified from your property record' : 'Enter your name and contact details'}
              id="buyer-info"
              stagger={0}
            >
              {tokenMode && (
                <div className="flex items-center gap-2 mb-5 bg-accent/5 border border-accent/20 rounded-lg px-4 py-2.5">
                  <AppIcon icon={ICONS.success} size={16} className="text-accent flex-shrink-0" />
                  <span className="text-sm text-accent font-medium">
                    Your information has been pre-filled from your property record
                  </span>
                </div>
              )}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={fieldClass('firstName')}>
                    <FormField label="First Name" required error={errors.firstName}>
                      <TextInput
                        value={formData.firstName}
                        onChange={(v) => handleInputChange('firstName', v)}
                        placeholder="First name"
                        hasError={!!errors.firstName}
                        disabled={tokenMode}
                      />
                    </FormField>
                  </div>
                  <div className={fieldClass('lastName')}>
                    <FormField label="Last Name" required error={errors.lastName}>
                      <TextInput
                        value={formData.lastName}
                        onChange={(v) => handleInputChange('lastName', v)}
                        placeholder="Last name"
                        hasError={!!errors.lastName}
                        disabled={tokenMode}
                      />
                    </FormField>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={fieldClass('email')}>
                    <FormField label="Email" required error={errors.email}>
                      <TextInput
                        value={formData.email}
                        onChange={(v) => handleInputChange('email', v)}
                        placeholder="email@example.com"
                        type="email"
                        hasError={!!errors.email}
                        disabled={tokenMode}
                      />
                    </FormField>
                  </div>
                  <FormField label="Phone">
                    <TextInput
                      value={formData.phone}
                      onChange={(v) => handleInputChange('phone', v)}
                      placeholder="(810) 555-0123"
                      type="tel"
                    />
                  </FormField>
                </div>
                <div className={fieldClass('propertyAddress')}>
                  <FormField label={tokenMode ? 'Property (Parcel ID)' : 'Property Address'} required error={errors.propertyAddress}>
                    {tokenMode && tokenData?.property?.address && (
                      <p className="text-xs text-muted mb-1">{tokenData.property.address}</p>
                    )}
                    <TextInput
                      value={formData.propertyAddress}
                      onChange={(v) => handleInputChange('propertyAddress', v)}
                      placeholder="Street address, city, state, zip"
                      hasError={!!errors.propertyAddress}
                      disabled={tokenMode}
                    />
                  </FormField>
                </div>
              </div>
            </BuyerSection>

            {/* ═══ Section 2: Property Details ═══ */}
            <BuyerSection
              number={2}
              title="Property Details"
              subtitle="Program type, timeline, and project status"
              id="property-details"
              stagger={100}
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={fieldClass('programType')}>
                    <FormField label="Program Type" required error={errors.programType}>
                      <SelectInput
                        value={formData.programType}
                        onChange={(v) => handleInputChange('programType', v)}
                        options={[
                          { value: '', label: 'Select program type', disabled: true, hidden: true },
                          { value: 'ready4rehab', label: 'Ready4Rehab' },
                          { value: 'featured-homes', label: 'Featured Homes' },
                          { value: 'demolition', label: 'Demolition' },
                          { value: 'vip', label: 'V.I.P.' },
                        ]}
                        hasError={!!errors.programType}
                        disabled={tokenMode}
                      />
                    </FormField>
                  </div>
                  {formData.programType && PROGRAM_POLICIES[FORM_TO_POLICY_KEY[formData.programType]] && (() => {
                    const p = PROGRAM_POLICIES[FORM_TO_POLICY_KEY[formData.programType]];
                    return (
                      <div className="col-span-full mt-1 bg-accent/5 border border-accent/15 rounded-lg p-4">
                        <p className="text-sm font-medium text-text mb-1">{p.tagline}</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{p.complianceAfterPurchase}</p>
                        {p.landContract?.available && (
                          <p className="text-xs text-accent mt-2 font-medium">
                            ✓ Land contract financing may be available for this program
                          </p>
                        )}
                        {p.homeownerEducation?.required && (
                          <p className="text-xs text-warning mt-1 font-medium">
                            ⚠ Homebuyer education is required before closing
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <FormField label="Reporting Month">
                    <SelectInput
                      value={formData.reportingMonth}
                      onChange={(v) => handleInputChange('reportingMonth', v)}
                      options={reportingMonthOptions}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField label="Closing Date">
                      <TextInput
                        value={formData.closingDate}
                        onChange={(v) => handleInputChange('closingDate', v)}
                        placeholder="MM/DD/YYYY"
                        type="date"
                      />
                    </FormField>
                    {formData.closingDate && (() => {
                      const closing = new Date(formData.closingDate + 'T00:00:00');
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((closing - today) / (1000 * 60 * 60 * 24));
                      if (diffDays > 0) {
                        return <p className="text-xs text-accent mt-1.5 font-medium">{diffDays} day{diffDays !== 1 ? 's' : ''} until closing</p>;
                      } else if (diffDays === 0) {
                        return <p className="text-xs text-warning mt-1.5 font-medium">Closing date is today</p>;
                      } else {
                        return <p className="text-xs text-muted mt-1.5">{Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? 's' : ''} since closing</p>;
                      }
                    })()}
                  </div>
                  <FormField label="Permit Status">
                    <SelectInput
                      value={formData.permitStatus}
                      onChange={(v) => handleInputChange('permitStatus', v)}
                      options={[
                        { value: '', label: 'Select status' },
                        { value: 'obtained', label: 'Obtained' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'not-required', label: 'Not Required' },
                      ]}
                    />
                  </FormField>
                </div>
                <FormField label="Inspection Status">
                  <SelectInput
                    value={formData.inspectionStatus}
                    onChange={(v) => handleInputChange('inspectionStatus', v)}
                    options={[
                      { value: '', label: 'Select status' },
                      { value: 'passed', label: 'Passed' },
                      { value: 'failed', label: 'Failed' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'not-applicable', label: 'Not Applicable' },
                    ]}
                  />
                </FormField>
              </div>
            </BuyerSection>

            {/* ═══ Section 3: Progress Photos ═══ */}
            <BuyerSection
              number={3}
              title="Progress Photos"
              subtitle={`Upload photos of the property - ${photoSlotLabels.length} required areas`}
              id="progress-photos"
              stagger={200}
            >
              {/* Upload count indicator */}
              <div className="flex items-center gap-2 mb-5">
                <AppIcon icon={ICONS.camera} size={16} className="text-muted" />
                <span className="text-sm text-muted">
                  <span className="font-medium text-text">{uploadedPhotoCount}</span> of {photoSlotLabels.length} uploaded
                </span>
                {uploadedPhotoCount === photoSlotLabels.length && (
                  <span className="text-xs font-medium text-accent bg-accent-light px-2 py-0.5 rounded-full ml-1">
                    Complete
                  </span>
                )}
              </div>

              {/* Photo grid */}
              <div className="bg-warm-100/40 rounded-xl border border-warm-200/40 p-4 sm:p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photoSlotLabels.map((label) => (
                    <PhotoSlot
                      key={label}
                      label={label}
                      photo={photoSlots[label]}
                      onUpload={(file) => handlePhotoUpload(label, file)}
                      onRemove={() => removePhoto(label)}
                    />
                  ))}
                </div>
              </div>
            </BuyerSection>

            {/* ═══ Section 4: Documentation ═══ */}
            <BuyerSection
              number={4}
              title="Documentation"
              subtitle="Upload contracts, permits, receipts, and other documents"
              id="documentation"
              stagger={300}
            >
              <div className="space-y-8">
                {/* Financial docs */}
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text mb-3">
                    Contracts & Permits
                  </h3>
                  <DropZone
                    icon={ICONS.file}
                    title="Drag and drop documents here"
                    subtitle="or click to browse - PDF, JPG, PNG accepted"
                    accept="image/*,.pdf"
                    onFilesAdded={addFinancialDoc}
                  />
                  {financialDocs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {financialDocs.map((doc, index) => (
                        <FileListItem
                          key={`${doc.name}-${index}`}
                          name={doc.name}
                          size={doc.size}
                          onRemove={() => removeFinancialDoc(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Receipts */}
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text mb-1">
                    Receipts & Invoices
                  </h3>
                  <p className="text-xs text-muted mb-3">Optional - upload proof of investment if available</p>
                  <DropZone
                    icon={ICONS.upload}
                    title="Drag and drop receipts here"
                    subtitle="or click to browse"
                    accept="image/*,.pdf,.csv"
                    onFilesAdded={addReceipt}
                  />
                  {receipts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {receipts.map((receipt, index) => (
                        <FileListItem
                          key={`${receipt.name}-${index}`}
                          name={receipt.name}
                          size={receipt.size}
                          onRemove={() => removeReceipt(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </BuyerSection>

            {/* ═══ Section 5: Submit ═══ */}
            <section
              id="submit"
              className="animate-fade-slide-up flex flex-col items-center pt-2 pb-4"
              style={{ animationDelay: '400ms' }}
            >
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !accessToken}
                className={[
                  'inline-flex items-center justify-center gap-2',
                  'font-heading text-base font-medium text-white',
                  'bg-accent hover:bg-accent-dark',
                  'px-8 py-3 rounded-lg transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'active:scale-[0.98]',
                ].join(' ')}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AppIcon icon={ICONS.upload} size={16} />
                    Submit Compliance Update
                  </>
                )}
              </button>
              <p className="text-xs text-muted mt-3">
                You will receive a confirmation email
              </p>
              {submitError && (
                <p className="text-xs text-danger mt-2 text-center max-w-md">{submitError}</p>
              )}
            </section>

          </div>
        </div>
      </div>

      <SaveIndicator show={showSaved} />

      {/* Footer */}
      <footer className="border-t border-warm-200/60 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-muted">
            Genesee County Land Bank Authority
          </p>
          <p className="text-xs text-muted">
            Genesee County, Michigan
          </p>
        </div>
      </footer>
    </div>
  );
}
