import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PropertyProvider } from './context/PropertyContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import BatchEmail from './pages/BatchEmail'
import CommunicationLog from './pages/CommunicationLog'
import BuyerSubmission from './pages/BuyerSubmission'
import UpcomingMilestones from './pages/UpcomingMilestones'
import Compliance from './pages/Compliance'
import ActionQueue from './pages/ActionQueue'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import TemplateManager from './pages/TemplateManager'
import ComplianceMap from './pages/ComplianceMap'
import AuditTrail from './pages/AuditTrail'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PropertyProvider>
    <BrowserRouter>
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
          <Route path="/settings" element={<Settings />} />
        </Route>
        {/* Buyer submission is standalone (no sidebar) */}
        <Route path="/submit" element={<BuyerSubmission />} />
      </Routes>
    </BrowserRouter>
    </PropertyProvider>
  </React.StrictMode>,
)
