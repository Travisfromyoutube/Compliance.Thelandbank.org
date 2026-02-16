import { usePageTitle } from '../hooks/usePageTitle';
import ICONS from '../icons/iconMap';
import { AdminPageHeader, AppIcon, Card } from '../components/ui';
import SOPPhase from '../components/howToUse/SOPPhase';
import SOPStep from '../components/howToUse/SOPStep';
import PhaseDivider from '../components/howToUse/PhaseDivider';

/**
 * HowToUse - Staff workflow guide for the Compliance Portal.
 *
 * Walks through the compliance process as it works in the portal.
 * The audience is staff only. Buyer-facing steps are included
 * (Section 3) to explain what buyers see and how their submissions
 * arrive for review.
 *
 * The workflow follows the compliance framework established by the
 * GCLBA compliance team. This page documents how that process
 * is consolidated into the portal, not a critique of the original.
 *
 * Sections:
 *   1. Checking Your Workload (dashboard + action queue)
 *   2. Sending Notices (template selection + batch email)
 *   3. Buyer Submissions (what buyers see, how submissions arrive)
 *   4. Recording Completion (milestones + audit trail)
 *   5. VIP Agreements (development agreement milestones)
 */

/* ── Intro section above the phases ── */
function IntroCard() {
  return (
    <div className="mb-10 rounded-xl overflow-hidden border border-accent/15 bg-white shadow-sm">
      {/* Tinted header band */}
      <div className="px-6 py-5 bg-gradient-to-r from-accent/[0.10] to-accent-blue/[0.07] border-b border-accent/10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-accent/15 flex items-center justify-center shadow-sm">
            <AppIcon icon={ICONS.clipboardList} size={22} className="text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold text-text mb-1">
              Compliance Standard Operating Procedure
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              This guide walks through the compliance workflow as it works in the portal,
              covering all four programs: Featured Homes, Ready4Rehab (R4R), Demolition,
              and VIP. Each phase below maps to the tasks you perform daily, weekly, or
              as needed.
            </p>
          </div>
        </div>
      </div>

      {/* Program badges */}
      <div className="px-6 py-4 bg-white">
        <p className="text-[10px] font-label font-semibold tracking-[0.08em] uppercase text-muted mb-2.5">
          Programs covered
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Featured Homes', color: 'bg-accent/8 text-accent border-accent/15' },
            { name: 'Ready4Rehab', color: 'bg-accent-blue/8 text-accent-blue border-accent-blue/15' },
            { name: 'Demolition', color: 'bg-warning/8 text-warning border-warning/15' },
            { name: 'VIP', color: 'bg-accent-dark/8 text-accent-dark border-accent-dark/15' },
          ].map((prog) => (
            <span
              key={prog.name}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${prog.color}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {prog.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Quick-reference sidebar cards ── */
function QuickRef() {
  const items = [
    { icon: ICONS.dashboard, label: 'Dashboard', path: '/', desc: 'Overdue counts, action items' },
    { icon: ICONS.actionQueue, label: 'Action Queue', path: '/action-queue', desc: 'Grouped notices, batch send' },
    { icon: ICONS.compliance, label: 'Compliance', path: '/compliance', desc: 'Submissions, compliance levels' },
    { icon: ICONS.batchEmail, label: 'Batch Email', path: '/batch-email', desc: 'Template merge and send' },
    { icon: ICONS.communication, label: 'Communication Log', path: '/communications', desc: 'Auto-archived history' },
    { icon: ICONS.file, label: 'Templates', path: '/templates', desc: 'Email template editor' },
  ];

  return (
    <Card title="Quick Reference" subtitle="Pages you'll use most">
      <div className="space-y-2">
        {items.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-warm-50 transition-colors group"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-warm-100 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <AppIcon icon={item.icon} size={15} className="text-warm-500 group-hover:text-accent transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text leading-tight">{item.label}</p>
              <p className="text-[11px] text-muted mt-0.5">{item.desc}</p>
            </div>
            <AppIcon icon={ICONS.arrowRight} size={13} className="text-warm-300 group-hover:text-accent transition-colors" />
          </a>
        ))}
      </div>
    </Card>
  );
}

export default function HowToUse() {
  usePageTitle('How to Use the Portal');

  return (
    <div className="space-y-0">
      <AdminPageHeader
        title="How to Use This Portal"
        subtitle="The compliance workflow for all four programs, in one place"
        icon={ICONS.clipboardList}
      />

      {/* Two-column layout: SOP phases + quick reference sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Main SOP content */}
        <div className="flex-1 min-w-0 space-y-3">
          <IntroCard />

          {/* ═══════════════════════════════════════
              SECTION 1: Checking Your Workload
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={1}
            title="Checking Your Workload"
            subtitle="What needs attention today"
            icon={ICONS.dashboard}
            defaultOpen={true}
          >
            <p className="text-xs text-muted italic mt-2 mb-1">
              Previously handled through FileMaker exports and Excel sorting.
            </p>
            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="Open the Dashboard"
                icon={ICONS.dashboard}
                linkTo="/"
                linkLabel="Go to Dashboard"
                details={[
                  'The "Needs Action" count shows properties requiring attention right now',
                  'Overdue properties are sorted by urgency, longest overdue first',
                  'Stat cards update automatically as compliance data changes',
                ]}
              >
                <p>
                  The Dashboard is your home page. When you log in, you immediately see
                  how many properties need action, how many are overdue, and the overall
                  compliance health across all four programs.
                </p>
              </SOPStep>

              <SOPStep
                number={2}
                title="Review the Action Queue"
                icon={ICONS.actionQueue}
                linkTo="/action-queue"
                linkLabel="Go to Action Queue"
                details={[
                  'Properties are grouped by level and action type',
                  'Each group shows which communication attempt is needed (1st, 2nd, Warning, Default)',
                  'Select multiple properties to send notices in batch',
                ]}
                tip="The Action Queue pre-groups properties by which communication attempt is due, so you can see at a glance what needs to go out today."
              >
                <p>
                  The Action Queue shows every property that needs a compliance action, organized
                  by what type of notice is due. This is where you will spend most of your time.
                </p>
              </SOPStep>

              <SOPStep
                number={3}
                title="Check for new buyer submissions"
                icon={ICONS.inbox}
                linkTo="/compliance"
                linkLabel="Go to Compliance"
                details={[
                  'The sidebar badge shows how many submissions are waiting for review',
                  'Each submission includes uploaded photos, documents, and buyer notes',
                  'Approve or flag submissions directly from the review panel',
                ]}
              >
                <p>
                  When buyers submit progress updates through their portal link, those
                  submissions appear here for your review. Check this daily to stay on top
                  of incoming documentation.
                </p>
              </SOPStep>
            </div>
          </SOPPhase>

          <PhaseDivider />

          {/* ═══════════════════════════════════════
              SECTION 2: Sending Notices
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={2}
            title="Sending Notices"
            subtitle="Selecting properties, previewing templates, and sending emails"
            icon={ICONS.batchEmail}
          >
            <p className="text-xs text-muted italic mt-2 mb-1">
              Previously handled across Word templates, Outlook, and the K-drive.
            </p>
            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="Select properties from the Action Queue"
                icon={ICONS.actionQueue}
                linkTo="/action-queue"
                details={[
                  'Use checkboxes to select individual properties, or "Select All" for a group',
                  'The queue already separates 1st attempt from 2nd attempt, warnings, and defaults',
                  'Only properties with email addresses are included for email; non-email records are flagged separately for snail mail',
                ]}
              >
                <p>
                  From the Action Queue, select the properties you want to send notices to.
                  They are already organized by which communication attempt is needed.
                </p>
              </SOPStep>

              <SOPStep
                number={2}
                title="Choose or edit the email template"
                icon={ICONS.file}
                linkTo="/templates"
                linkLabel="Manage Templates"
                details={[
                  'Templates auto-populate buyer name, address, program type, and due dates',
                  'Each template has variants for 1st attempt, 2nd attempt, Warning, and Default',
                  'Preview the merged result before sending to catch any issues',
                ]}
                tip="Edit a template once and it auto-fills for every property. Templates have variants for each communication attempt."
              >
                <p>
                  The Template Manager holds all compliance letter templates. Each template
                  supports variants (1st request, 2nd request, warning, default notice) and
                  auto-merges property data into the template fields.
                </p>
              </SOPStep>

              <SOPStep
                number={3}
                title="Send batch emails"
                icon={ICONS.send}
                linkTo="/batch-email"
                linkLabel="Go to Batch Email"
                details={[
                  'Review the merged preview for each recipient before confirming',
                  'Click Send and emails go out individually to each buyer',
                  'Each sent email is automatically logged in the Communication Log',
                  'No need to save PDFs or create compliance subfolders; it is all recorded',
                ]}
              >
                <p>
                  After selecting properties and confirming the template, send the batch.
                  The portal sends individual emails to each buyer and automatically
                  archives every communication.
                </p>
              </SOPStep>

              <SOPStep
                number={4}
                title="Handle snail mail (non-email records)"
                icon={ICONS.file}
                details={[
                  'Properties without email addresses are flagged in the Action Queue',
                  'Use the same template and select "Print" to export to PDF',
                  'The communication is still logged when you mark it as sent',
                ]}
              >
                <p>
                  For properties without an email address on file, the same templates
                  can be exported to PDF for printing and mailing.
                </p>
              </SOPStep>
            </div>
          </SOPPhase>

          <PhaseDivider />

          {/* ═══════════════════════════════════════
              SECTION 3: Buyer Submissions
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={3}
            title="Buyer Submissions"
            subtitle="What happens when a buyer receives their compliance link"
            icon={ICONS.userCheck}
          >
            <p className="text-xs text-muted italic mt-2 mb-1">
              Previously handled through incoming email, manual downloads, and FileMaker data entry.
            </p>
            <div className="mt-3 mb-4 px-4 py-3 bg-accent-blue/5 border border-accent-blue/15 rounded-lg">
              <div className="flex items-start gap-2.5">
                <AppIcon icon={ICONS.info} size={15} className="text-accent-blue mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text/80 leading-relaxed">
                  <span className="font-medium">This section describes the buyer's experience</span> so
                  you understand what they see when they receive a compliance link. Their submissions
                  appear in your review queue automatically.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="Buyer receives a secure link via email"
                icon={ICONS.lock}
                details={[
                  'Each compliance email includes a unique, time-limited link to the buyer portal',
                  'The link is tied to their specific property; they can only access their own data',
                  'No account creation needed; the token handles authentication',
                ]}
              >
                <p>
                  When you send a compliance notice (Section 2), the email automatically includes
                  a secure link to the buyer submission portal. The buyer clicks this link to
                  respond to your compliance request.
                </p>
              </SOPStep>

              <SOPStep
                number={2}
                title="Buyer reviews their compliance timeline"
                icon={ICONS.milestones}
                details={[
                  'The portal shows the buyer their program requirements (Featured, R4R, Demo, or VIP)',
                  'A visual timeline displays which milestones are upcoming, due, or overdue',
                  'Requirements are specific to their program; an R4R buyer sees rehabilitation phases, a Featured Homes buyer sees occupancy deadlines',
                ]}
              >
                <p>
                  The buyer portal shows the buyer exactly where they stand in their compliance
                  timeline. They can see which milestones are upcoming, due, or overdue, along
                  with what documentation is needed.
                </p>
              </SOPStep>

              <SOPStep
                number={3}
                title="Buyer uploads photos and documents"
                icon={ICONS.upload}
                details={[
                  'Photo slots tell the buyer exactly what photos are needed (front, back, interior progress)',
                  'Document upload accepts receipts, permits, contractor agreements, certifications',
                  'Files are stored securely and linked directly to the property record',
                ]}
              >
                <p>
                  The buyer portal collects photos and documents through structured upload
                  slots. Each file is automatically attached to the correct property record
                  and available for your review.
                </p>
              </SOPStep>

              <SOPStep
                number={4}
                title="Submission appears for your review"
                icon={ICONS.inbox}
                linkTo="/compliance"
                linkLabel="Go to Compliance"
                details={[
                  'A badge on the Compliance page shows how many submissions are pending',
                  'You can approve, request changes, or flag submissions',
                  'Approved submissions automatically update compliance status',
                ]}
                tip="Buyer submissions arrive pre-structured with photos and documents already attached to the property. You can approve, request changes, or flag them from one screen."
              >
                <p>
                  Once the buyer submits, their progress report appears in your Compliance
                  review queue. You review the uploaded photos and documents, then approve
                  or request changes.
                </p>
              </SOPStep>
            </div>
          </SOPPhase>

          <PhaseDivider />

          {/* ═══════════════════════════════════════
              SECTION 4: Recording Completion
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={4}
            title="Recording Completion"
            subtitle="Marking milestones complete and closing out properties"
            icon={ICONS.success}
          >
            <p className="text-xs text-muted italic mt-2 mb-1">
              Previously handled through FileMaker field updates and K-drive filing.
            </p>
            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="Open the property detail"
                icon={ICONS.properties}
                linkTo="/properties"
                linkLabel="Go to Properties"
                details={[
                  'Search or filter to find the property',
                  'The property detail shows all milestones, communications, and uploaded documents in one view',
                  'The compliance timeline shows exactly where the property stands',
                ]}
              >
                <p>
                  When a buyer has provided enough documentation to satisfy compliance
                  requirements, open their property record to review and mark complete.
                </p>
              </SOPStep>

              <SOPStep
                number={2}
                title="Review documentation and mark milestones complete"
                icon={ICONS.check}
                details={[
                  'For rehab programs: confirm renovation photos and receipts satisfy proof of investment',
                  'For demolition: verify the final certification from the local unit of government',
                  'For Featured Homes: confirm occupancy within 90 days and ongoing maintenance',
                  'Each completed milestone is timestamped and logged in the audit trail',
                ]}
                tip="For demolition compliance, always verify that the final certification was signed off by the local unit of government before marking complete. If you are unsure whether demolition proof is sufficient, consult with the demolition department."
              >
                <p>
                  Review the submitted documentation against the program's requirements.
                  When satisfied, mark the relevant milestones as complete. The property
                  automatically drops off compliance reports as milestones are fulfilled.
                </p>
              </SOPStep>

              <SOPStep
                number={3}
                title="View the audit trail"
                icon={ICONS.auditTrail}
                linkTo="/audit"
                linkLabel="Go to Audit Trail"
                details={[
                  'Every communication, submission, and status change is recorded',
                  'The timeline view shows the full history of a property\'s compliance journey',
                  'Useful for manager review, disputes, or escalation documentation',
                ]}
              >
                <p>
                  The Audit Trail provides a complete, timestamped record of every action
                  taken on a property: communications sent, submissions received, and
                  status changes. It is a searchable history of the full compliance
                  journey for any property.
                </p>
              </SOPStep>
            </div>
          </SOPPhase>

          <PhaseDivider />

          {/* ═══════════════════════════════════════
              SECTION 5: VIP Agreements
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={5}
            title="VIP Agreements"
            subtitle="Development agreement milestones and proactive outreach"
            icon={ICONS.users}
          >
            <p className="text-xs text-muted italic mt-2 mb-1">
              Previously handled through the dedicated VIP layout in FileMaker.
            </p>
            <div className="mt-3 mb-4 px-4 py-3 bg-warm-100/60 border border-warm-200 rounded-lg">
              <div className="flex items-start gap-2.5">
                <AppIcon icon={ICONS.info} size={15} className="text-warm-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text/80 leading-relaxed">
                  VIP compliance follows the same workflow as the other programs but includes
                  additional development agreement milestones. The portal tracks these
                  automatically based on the closing date.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="VIP milestones auto-generate from closing date"
                icon={ICONS.milestones}
                details={[
                  'Development agreement milestones (RC15, RC30, RC60, etc.) are calculated automatically',
                  'Rehab and new construction timelines are both supported',
                  'No need to manually set up the compliance layout after closing',
                ]}
                tip="The portal determines the compliance layout type automatically based on the property's program and development type."
              >
                <p>
                  When a VIP property closing date is entered, the portal generates the
                  full development agreement timeline. The RC (required contact) dates
                  are calculated automatically: RC15 is 15 days after closing, RC30 is
                  30 days, and so on.
                </p>
              </SOPStep>

              <SOPStep
                number={2}
                title="Proactive outreach at each interval"
                icon={ICONS.communication}
                linkTo="/action-queue"
                details={[
                  'The Action Queue includes VIP outreach items as they come due',
                  'If the buyer hasn\'t reached out by the RC date, the portal flags it for staff contact',
                  'Each outreach is logged with the date',
                ]}
              >
                <p>
                  VIP compliance is proactive. If the buyer is not reaching out at the
                  recommended intervals, you should contact them. The portal flags overdue
                  contact dates in the Action Queue alongside your other compliance work.
                </p>
              </SOPStep>

              <SOPStep
                number={3}
                title="Record buyer communications"
                icon={ICONS.communication}
                linkTo="/communications"
                linkLabel="Go to Communication Log"
                details={[
                  'Log each buyer communication with date and notes',
                  'The property timeline shows all contact history at a glance',
                  'When all RC milestones are fulfilled, the property moves to compliant status',
                ]}
              >
                <p>
                  Each time you receive communications from the buyer updating the status
                  of their project, log it in the Communication Log. This keeps the full
                  contact history in one place for each property.
                </p>
              </SOPStep>

              <SOPStep
                number={4}
                title="Final compliance and lien release"
                icon={ICONS.shieldCheck}
                details={[
                  'When all development agreement requirements are met, mark the property as compliant',
                  'The release of lien process is tracked as the final milestone',
                  'If the buyer is non-compliant and management decides to reclaim the property, that status is recorded in the system as well',
                ]}
              >
                <p>
                  When all compliance requirements have been met, the property is marked
                  fully compliant. The release of lien signing and recording is tracked as
                  the final step. For non-compliant properties where management decides to
                  reclaim, that decision and the deed-back process are also tracked.
                </p>
              </SOPStep>
            </div>
          </SOPPhase>
        </div>

        {/* Sidebar: quick reference */}
        <div className="lg:w-[280px] xl:w-[300px] flex-shrink-0">
          <div className="lg:sticky lg:top-8 space-y-5">
            <QuickRef />

            {/* Programs legend */}
            <Card title="Programs" subtitle="Each has different timelines">
              <div className="space-y-3">
                {[
                  { name: 'Featured Homes', desc: '90-day occupancy, 3-year minimum stay, maintenance standards' },
                  { name: 'Ready4Rehab (R4R)', desc: '12-month rehab timeline: Mobilization, Construction, Completion' },
                  { name: 'Demolition', desc: 'Demolition completion + proof of investment in new construction' },
                  { name: 'VIP', desc: '6-month integration or 12-24 month development agreement milestones' },
                ].map((prog) => (
                  <div key={prog.name} className="pb-3 border-b border-border last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-text">{prog.name}</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{prog.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Levels reference */}
            <Card title="Compliance Levels" subtitle="Graduated response system">
              <div className="space-y-2">
                {[
                  { level: 0, label: 'Compliant', color: 'text-success', desc: 'All requirements met' },
                  { level: 1, label: 'Level 1', color: 'text-warning', desc: '0-30 days: Notice + technical assistance' },
                  { level: 2, label: 'Level 2', color: 'text-warning', desc: '31-60 days: Formal warning + meeting' },
                  { level: 3, label: 'Level 3', color: 'text-danger', desc: '61-90 days: Default notice' },
                  { level: 4, label: 'Level 4', color: 'text-danger', desc: '91+ days: Legal remedies' },
                ].map((lvl) => (
                  <div key={lvl.level} className="flex items-start gap-2.5 py-1">
                    <span className={`flex-shrink-0 text-xs font-mono font-bold ${lvl.color} mt-0.5`}>
                      L{lvl.level}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text">{lvl.label}</p>
                      <p className="text-[10px] text-muted mt-0.5">{lvl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
