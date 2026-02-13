import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Clock,
  Mail,
  Shield,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Card, AdminPageHeader } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Settings() {
  usePageTitle('Settings');
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    milestoneAlerts: true,
    enforcementEscalations: true,
    weeklyDigest: true,
    daysBeforeDue: 14,
  });

  // Enforcement timeline
  const [enforcement, setEnforcement] = useState({
    level1Days: 0,
    level2Days: 31,
    level3Days: 61,
    level4Days: 91,
    curesPeriodDays: 30,
  });

  // Communication defaults
  const [commDefaults, setCommDefaults] = useState({
    defaultSender: 'compliance@thelandbank.org',
    ccAddress: '',
    autoLog: true,
    followUpDays: 30,
  });

  const handleSave = () => {
    alert('Settings saved successfully! (In production, this would persist to database.)');
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setNotifications({
        emailReminders: true, milestoneAlerts: true,
        enforcementEscalations: true, weeklyDigest: true, daysBeforeDue: 14,
      });
      setEnforcement({
        level1Days: 0, level2Days: 31, level3Days: 61, level4Days: 91, curesPeriodDays: 30,
      });
      setCommDefaults({
        defaultSender: 'compliance@thelandbank.org', ccAddress: '', autoLog: true, followUpDays: 30,
      });
    }
  };

  const InputField = ({ label, value, onChange, type = 'number', prefix, suffix, helpText }) => (
    <div>
      <label className="block text-sm font-medium text-text mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-muted">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-1 focus:ring-accent/20 focus:border-accent outline-none hover:border-border transition-colors"
        />
        {suffix && <span className="text-sm text-muted">{suffix}</span>}
      </div>
      {helpText && <p className="text-xs text-text-secondary mt-1">{helpText}</p>}
    </div>
  );

  const ToggleField = ({ label, checked, onChange, helpText }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        {helpText && <p className="text-xs text-text-secondary mt-0.5">{helpText}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Configure compliance portal parameters"
        actions={
          <>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-surface transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg text-sm font-medium text-white hover:bg-accent-dark transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </>
        }
      />

      {/* Info Banner */}
      <div className="bg-warm-100 border border-warm-200 rounded-lg p-4 flex items-start gap-3 animate-fade-slide-up admin-stagger-2">
        <Info className="h-5 w-5 text-muted mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-text font-medium">Configuration Preview</p>
          <p className="text-xs text-muted mt-1">
            These settings control how the compliance portal triggers enforcement levels and manages notifications. In production, these would be stored in your database and applied system-wide.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-slide-up admin-stagger-3">
        {/* Enforcement Timeline */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning-light text-warning">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold font-heading text-text">Enforcement Timeline</h2>
          </div>
          <div className="space-y-4">
            <InputField
              label="Level 1 - Notice & Technical Assistance"
              value={enforcement.level1Days}
              onChange={(v) => setEnforcement({ ...enforcement, level1Days: v })}
              suffix="days past deadline"
              helpText="First contact and compliance assistance"
            />
            <InputField
              label="Level 2 - Formal Warning"
              value={enforcement.level2Days}
              onChange={(v) => setEnforcement({ ...enforcement, level2Days: v })}
              suffix="days past deadline"
              helpText="Written warning with cure period"
            />
            <InputField
              label="Level 3 - Default Notice"
              value={enforcement.level3Days}
              onChange={(v) => setEnforcement({ ...enforcement, level3Days: v })}
              suffix="days past deadline"
              helpText="Formal default notice issued"
            />
            <InputField
              label="Level 4 - Legal Remedies"
              value={enforcement.level4Days}
              onChange={(v) => setEnforcement({ ...enforcement, level4Days: v })}
              suffix="days past deadline"
              helpText="Legal action and property recovery"
            />
            <InputField
              label="Cure Period Duration"
              value={enforcement.curesPeriodDays}
              onChange={(v) => setEnforcement({ ...enforcement, curesPeriodDays: v })}
              suffix="days"
              helpText="Time allowed to correct violations before escalation"
            />
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success-light text-success">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold font-heading text-text">Notifications</h2>
          </div>
          <div className="space-y-4">
            <ToggleField
              label="Email Reminders"
              checked={notifications.emailReminders}
              onChange={(v) => setNotifications({ ...notifications, emailReminders: v })}
              helpText="Send email reminders before milestone deadlines"
            />
            <ToggleField
              label="Milestone Alerts"
              checked={notifications.milestoneAlerts}
              onChange={(v) => setNotifications({ ...notifications, milestoneAlerts: v })}
              helpText="Alert when milestones become overdue"
            />
            <ToggleField
              label="Enforcement Escalations"
              checked={notifications.enforcementEscalations}
              onChange={(v) => setNotifications({ ...notifications, enforcementEscalations: v })}
              helpText="Notify when a property moves to a higher enforcement level"
            />
            <ToggleField
              label="Weekly Digest"
              checked={notifications.weeklyDigest}
              onChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })}
              helpText="Send a weekly compliance summary to staff"
            />
            <InputField
              label="Alert Days Before Due"
              value={notifications.daysBeforeDue}
              onChange={(v) => setNotifications({ ...notifications, daysBeforeDue: v })}
              suffix="days"
              helpText="How early to start sending milestone reminders"
            />
          </div>
        </Card>

        {/* Communication Defaults */}
        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent-light text-accent">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold font-heading text-text">Communication Defaults</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputField
              label="Default Sender Email"
              value={commDefaults.defaultSender}
              onChange={(v) => setCommDefaults({ ...commDefaults, defaultSender: v })}
              type="text"
              helpText="Used as the From address for outbound compliance emails"
            />
            <InputField
              label="CC Address"
              value={commDefaults.ccAddress}
              onChange={(v) => setCommDefaults({ ...commDefaults, ccAddress: v })}
              type="text"
              helpText="Optional CC for all outbound communications (leave blank for none)"
            />
            <InputField
              label="Follow-Up Interval"
              value={commDefaults.followUpDays}
              onChange={(v) => setCommDefaults({ ...commDefaults, followUpDays: v })}
              suffix="days"
              helpText="Days between 1st and 2nd compliance attempts"
            />
            <div className="flex items-end">
              <ToggleField
                label="Auto-Log Communications"
                checked={commDefaults.autoLog}
                onChange={(v) => setCommDefaults({ ...commDefaults, autoLog: v })}
                helpText="Automatically create log entries when emails are sent"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Program-Specific Timeline Reference */}
      <Card className="animate-fade-slide-up admin-stagger-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warm-100 text-muted">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold font-heading text-text">Program Compliance Timelines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Key Milestones
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Total Timeline
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Hold Period
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-warm-100 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue">
                    Featured Homes
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  Insurance (30 days), Occupancy (90 days), Proof of Investment (12 months)
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">12 months</td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">3 years</td>
              </tr>
              <tr className="hover:bg-warm-100 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    Ready4Rehab
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  Permit (60 days), 25% (120 days), 50% (180 days), 75% (270 days), Complete (365 days)
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">12 months</td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">N/A</td>
              </tr>
              <tr className="hover:bg-warm-100 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    Demolition
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  Demo Start (90 days), Final Cert (180 days)
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">6 months</td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">N/A</td>
              </tr>
              <tr className="hover:bg-warm-100 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-light text-success">
                    VIP
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  RC15, RC45, RC90, RC135, RC180, RC225, RC270, RC315, RC360
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">12 months (9 check-ins)</td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
