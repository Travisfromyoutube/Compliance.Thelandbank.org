import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import { PropertyProvider } from './context/PropertyContext'
import Layout from './components/Layout'
import './index.css'

/* ── Sentry (client-side) ──────────────────────────────── */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    sendDefaultPii: true,
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    ],
  })
}

/* ── Clerk ──────────────────────────────────────────────── */
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/**
 * ProtectedRoute - wraps admin pages in Clerk auth.
 * When VITE_CLERK_PUBLISHABLE_KEY is not set, renders children directly
 * (prototype mode - no auth).
 */
function ProtectedRoute({ children }) {
  if (!CLERK_KEY) return children
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

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
const HowItWorks = React.lazy(() => import('./pages/HowItWorks'))
const HowToUse = React.lazy(() => import('./pages/HowToUse'))

/* ── 404 page ─────────────────────────────────────────── */
function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center max-w-md">
        <p className="text-6xl font-heading font-bold text-warm-300 mb-4">404</p>
        <h1 className="text-xl font-heading font-semibold text-warm-700 mb-2">Page not found</h1>
        <p className="text-sm text-warm-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

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

/**
 * AppShell - wraps the entire app.
 * If Clerk key is set, wraps in ClerkProvider.
 * If not, renders directly (prototype mode).
 */
function AppShell({ children }) {
  if (!CLERK_KEY) return children
  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell>
    <PropertyProvider>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
            <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
            <Route path="/milestones" element={<ProtectedRoute><UpcomingMilestones /></ProtectedRoute>} />
            <Route path="/action-queue" element={<ProtectedRoute><ActionQueue /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/batch-email" element={<ProtectedRoute><BatchEmail /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
            <Route path="/communications" element={<ProtectedRoute><CommunicationLog /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><ComplianceMap /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/bridge" element={<ProtectedRoute><HowItWorks /></ProtectedRoute>} />
            <Route path="/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          {/* Buyer submission is standalone (no sidebar, no auth) */}
          <Route path="/submit" element={<BuyerSubmission />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </PropertyProvider>
    </AppShell>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
)
