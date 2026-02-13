import React from 'react';

export default function BuyerSection({ number, title, subtitle, id, stagger = 0, children }) {
  return (
    <section
      id={id}
      className="animate-fade-slide-up"
      style={{ animationDelay: `${stagger}ms` }}
    >
      {/* Section header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Number badge - visible on all screens */}
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white font-mono text-sm flex items-center justify-center font-medium mt-0.5">
          {number}
        </span>
        <div className="flex-grow min-w-0">
          <h2 className="font-heading text-xl font-semibold text-text">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-warm-200 mb-8" />

      {/* Section content */}
      <div className="lg:pl-12">
        {children}
      </div>
    </section>
  );
}
