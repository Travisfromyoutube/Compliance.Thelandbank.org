import React from 'react';

export default function BuyerHero() {
  return (
    <header className="bg-warm-100 border-b-2 border-accent relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.15) 19px, rgba(0,0,0,0.15) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.15) 19px, rgba(0,0,0,0.15) 20px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-8 lg:py-10 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* GCLBA official logo */}
            <img
              src="/gclba-logo.png"
              alt="Genesee County Land Bank"
              className="flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 lg:w-60 lg:h-60 object-contain"
            />
            <div>
              <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight">
                Genesee County Land Bank
              </h1>
              <p className="text-sm text-muted mt-1">
                Buyer Compliance Portal
              </p>
              <p className="text-xs text-text-secondary mt-2 max-w-md leading-relaxed hidden sm:block">
                Helping Genesee County homebuyers stay on track. Submit your progress updates securely and keep your property record up to date.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 font-label text-[10px] font-medium uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              Secure Portal
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
