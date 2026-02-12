import React, { useState, useCallback } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import AnimatedCheck from './AnimatedCheck';
import BuyerHero from './BuyerHero';

export default function BuyerConfirmation({ submissionData, onDownload, onReset }) {
  const { confirmationId, timestamp, formData, photoCount, docCount, receiptCount } = submissionData;
  const [copied, setCopied] = useState(false);

  const copyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(confirmationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = confirmationId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [confirmationId]);

  const summaryRows = [
    { label: 'Name', value: `${formData.firstName} ${formData.lastName}` },
    { label: 'Email', value: formData.email },
    { label: 'Property', value: formData.propertyAddress },
    { label: 'Program', value: formData.programType },
    { label: 'Photos uploaded', value: photoCount },
    { label: 'Documents', value: docCount },
    { label: 'Receipts', value: receiptCount },
  ];

  const nextSteps = [
    {
      icon: ICONS.batchEmail,
      title: 'Check your email',
      desc: 'A confirmation email has been sent to the address on file with your submission details.',
    },
    {
      icon: ICONS.clock,
      title: 'Review within 5 business days',
      desc: 'A compliance officer will review your submission and update your property record.',
    },
    {
      icon: ICONS.shield,
      title: 'Stay on track',
      desc: 'Continue meeting your program milestones. You\'ll be notified of your next required update.',
    },
  ];

  return (
    <div className="min-h-screen app-bg">
      <BuyerHero />

      <main className="max-w-2xl mx-auto px-6 py-12 animate-fade-slide-up">
        {/* Success icon + headline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center text-accent mb-4">
            <AnimatedCheck size={72} />
          </div>
          <h2 className="font-heading text-[28px] font-bold text-text mb-2">
            Submission Received
          </h2>
          <p className="text-muted">
            Your compliance update has been recorded and synced to the Land Bank database.
          </p>
        </div>

        {/* Confirmation ID panel */}
        <div className="bg-warm-100 rounded-xl px-6 py-5 text-center mb-8 border border-warm-200/60">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Confirmation ID</p>
          <div className="flex items-center justify-center gap-2">
            <p className="font-mono text-xl font-bold text-text tracking-wide select-all">{confirmationId}</p>
            <button
              type="button"
              onClick={copyId}
              className="p-1.5 rounded-md hover:bg-warm-200/50 transition-colors"
              title="Copy confirmation ID"
            >
              {copied
                ? <AppIcon icon={ICONS.check} size={16} className="text-accent" />
                : <AppIcon icon={ICONS.copy} size={16} className="text-muted" />}
            </button>
          </div>
          {copied && (
            <p className="text-[10px] text-accent font-medium mt-1 animate-fade-slide-up">Copied to clipboard</p>
          )}
          <p className="text-xs text-muted mt-2">{timestamp}</p>
          <p className="text-[10px] text-accent font-mono mt-2 flex items-center justify-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            Saved to compliance database
          </p>
        </div>

        {/* Next Steps */}
        <div className="mb-10">
          <h3 className="font-heading text-base font-semibold text-text mb-4">What Happens Next</h3>
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div
                key={step.title}
                className="flex items-start gap-3.5 p-4 rounded-lg bg-surface border border-border animate-fade-slide-up"
                style={{ animationDelay: `${300 + i * 150}ms` }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
                  <AppIcon icon={step.icon} size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{step.title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary table */}
        <div className="mb-10">
          <h3 className="font-heading text-base font-semibold text-text mb-4">Submission Summary</h3>
          <div className="divide-y divide-warm-200/60">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between py-3">
                <span className="text-sm text-muted">{row.label}</span>
                <span className="text-sm font-medium text-text text-right ml-4">{row.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-accent-blue border-2 border-accent-blue rounded-lg hover:bg-accent-blue-light transition-colors"
          >
            <AppIcon icon={ICONS.file} size={16} />
            Download Record
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
          >
            Submit Another
            <AppIcon icon={ICONS.arrowRight} size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
