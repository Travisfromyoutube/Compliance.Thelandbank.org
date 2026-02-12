import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { PropertyProvider } from './context/PropertyContext'
import Layout from './components/Layout'
import './index.css'

/* ── Eager-loaded pages (always in initial bundle) ────── */
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'

/* ── Lazy-loaded pages (separate chunks, loaded on navigate) ── */
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'))
const BatchEmail = React.lazy(() => import('./pages/BatchEmail'))
const CommunicationLog = React.lazy(() => import('./pages/CommunicationLog'))
const BuyerSubmission = React.lazy(() => import('./pages/BuyerSubmission'))
const UpcomingMilestones = React.lazy(() => import('./pages/UpcomingMilestones'))
const Compliance = React.lazy(() => import('./pages/Compliance'))
const ActionQueue = React.lazy(() => import('./pages/ActionQueue'))
const Reports = React.lazy(() => import('./pages/Reports'))
const Settings = React.lazy(() => import('./pages/Settings'))
const TemplateManager = React.lazy(() => import('./pages/TemplateManager'))
const ComplianceMap = React.lazy(() => import('./pages/ComplianceMap'))
const AuditTrail = React.lazy(() => import('./pages/AuditTrail'))
const FileMakerBridge = React.lazy(() => import('./pages/FileMakerBridge'))

/* ── Route loading fallback ───────────────────────────── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-warm-400">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-sm font-sans">Loading…</span>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PropertyProvider>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/milestones" element={<UpcomingMilestones />} />
            <Route path="/action-queue" element={<ActionQueue />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/batch-email" element={<BatchEmail />} />
            <Route path="/templates" element={<TemplateManager />} />
            <Route path="/communications" element={<CommunicationLog />} />
            <Route path="/map" element={<ComplianceMap />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/bridge" element={<FileMakerBridge />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* Buyer submission is standalone (no sidebar) */}
          <Route path="/submit" element={<BuyerSubmission />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </PropertyProvider>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
)
