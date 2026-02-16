import { usePageTitle } from '../hooks/usePageTitle';
import ICONS from '../icons/iconMap';
import { AdminPageHeader, AppIcon, Card } from '../components/ui';
import SOPPhase from '../components/howToUse/SOPPhase';
import SOPStep from '../components/howToUse/SOPStep';
import OldVsNew from '../components/howToUse/OldVsNew';

/**
 * HowToUse - Staff SOP for the Compliance Portal.
 *
 * This replaces the old "Featured, R4R, Demo & VIP Compliance SOP" Word document.
 * The audience is staff only. Buyer-facing steps are included as a phase in the
 * SOP (Phase 3) to explain what the buyer portal handles automatically.
 *
 * Structure:
 *   - Hero intro card (what this page is, programs covered)
 *   - Phase 1: Daily Check-In (replaces FM export + Excel sort)
 *   - Phase 2: Sending Compliance Notices (replaces Word merge + Outlook + K-drive)
 *   - Phase 3: Buyer Self-Service (replaces manual email → FM data entry)
 *   - Phase 4: Recording Completion (replaces FM field updates + archival)
 *   - Phase 5: VIP Program Compliance (replaces dedicated VIP layout workflow)
 */

/* ── Intro section above the phases ── */
function IntroCard() {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
          <AppIcon icon={ICONS.clipboardList} size={22} className="text-accent" />
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-base font-semibold text-text mb-1.5">
            Compliance Standard Operating Procedure
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            This guide covers the full compliance workflow for all four programs:
            Featured Homes, Ready4Rehab (R4R), Demolition, and VIP. Each phase below
            maps to the tasks you perform daily, weekly, or as-needed.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Featured Homes', 'Ready4Rehab', 'Demolition', 'VIP'].map((prog) => (
              <span
                key={prog}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-100 text-xs font-medium text-warm-700 border border-warm-200"
              >
                <AppIcon icon={ICONS.circleDot} size={10} className="text-accent" />
                {prog}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Quick-reference sidebar cards ── */
function QuickRef() {
  const items = [
    { icon: ICONS.dashboard, label: 'Dashboard', path: '/', desc: 'Overdue counts, action items' },
    { icon: ICONS.actionQueue, label: 'Action Queue', path: '/action-queue', desc: 'Grouped notices, batch send' },
    { icon: ICONS.compliance, label: 'Compliance', path: '/compliance', desc: 'Submissions, enforcement levels' },
    { icon: ICONS.batchEmail, label: 'Batch Email', path: '/batch-email', desc: 'Mail merge replacement' },
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
        subtitle="Standard operating procedure for compliance staff"
        icon={ICONS.clipboardList}
      />

      {/* About this software */}
      <div className="mb-10 px-1">
        <p className="text-sm text-muted leading-relaxed">
          This portal is custom software built for the Genesee County Land Bank Authority
          to streamline compliance management across all property sale programs. Built on
          React and backed by a PostgreSQL database with real-time FileMaker synchronization,
          it replaces the previous multi-tool workflow of FileMaker exports, Excel sorting,
          Word mail merge, Outlook archiving, and K-drive filing with a single, unified system.
          Every compliance action — from sending notices to reviewing buyer submissions — is
          handled here and automatically recorded in a searchable audit trail.
        </p>
      </div>

      {/* Two-column layout: SOP phases + quick reference sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Main SOP content */}
        <div className="flex-1 min-w-0 space-y-5">
          <IntroCard />

          {/* ═══════════════════════════════════════
              PHASE 1: Daily Check-In
              Replaces: FM export → Excel sort → count overdue
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={1}
            title="Daily Check-In"
            subtitle="Review your compliance workload at a glance"
            icon={ICONS.dashboard}
            defaultOpen={true}
          >
            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="Open the Dashboard"
                icon={ICONS.dashboard}
                linkTo="/"
                linkLabel="Go to Dashboard"
                details={[
                  'The "Needs Action" count shows properties requiring attention right now',
                  'Overdue properties are sorted by urgency — longest overdue first',
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
                  'Properties are grouped by enforcement level and action type',
                  'Each group shows which communication attempt is needed (1st, 2nd, Warning, Default)',
                  'Select multiple properties to send notices in batch',
                ]}
                tip="The Action Queue replaces the need to export FileMaker data into Excel and manually sort by compliance attempt. The portal pre-groups everything for you."
              >
                <p>
                  The Action Queue shows every property that needs a compliance action, organized
                  by what type of notice is due. This is where you'll spend most of your time.
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

            <OldVsNew
              oldSteps={[
                'Open FileMaker, navigate to Compliance Report',
                'Click "Export Excel" button',
                'Sort by Date Sold, remove recent sales',
                'Sort by compliance attempts, split into tabs',
                'Sort by email, isolate records without email',
                'Count rows to determine workload',
              ]}
              newSteps={[
                'Open Dashboard — counts are already calculated',
                'Click Action Queue — properties are pre-grouped by action needed',
                'Check Compliance page for new buyer submissions',
              ]}
            />
          </SOPPhase>

          {/* ═══════════════════════════════════════
              PHASE 2: Sending Compliance Notices
              Replaces: K-drive template → Word merge → Outlook → save PDFs → K-drive
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={2}
            title="Sending Compliance Notices"
            subtitle="Select, preview, and send — all in one place"
            icon={ICONS.batchEmail}
          >
            <div className="mt-4 space-y-0">
              <SOPStep
                number={1}
                title="Select properties from the Action Queue"
                icon={ICONS.actionQueue}
                linkTo="/action-queue"
                details={[
                  'Use checkboxes to select individual properties, or "Select All" for a group',
                  'The queue already separates 1st attempt from 2nd attempt, warnings, and defaults',
                  'Only properties with email addresses are included for email — non-email records are flagged separately for snail mail',
                ]}
              >
                <p>
                  From the Action Queue, select the properties you want to send notices to.
                  They're already organized by which communication attempt is needed.
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
                tip="Templates are the portal's version of the Word documents on the K-drive. You edit them once here, and they auto-fill for every property."
              >
                <p>
                  The Template Manager holds all compliance letter templates. Each template
                  supports variants (1st request, 2nd request, warning, default notice) and
                  auto-merges property data — no more Word mail merge.
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
                  'Click Send — emails go out individually to each buyer',
                  'Each sent email is automatically logged in the Communication Log',
                  'No need to save PDFs or create compliance subfolders — it\'s all recorded',
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
                  'Use the same template — select "Print" instead of "Email"',
                  'The communication is still logged when you mark it as sent',
                ]}
              >
                <p>
                  For buyers without email, you'll still print and mail the letter. The
                  portal uses the same template system — just export to PDF for printing
                  instead of emailing.
                </p>
              </SOPStep>
            </div>

            <OldVsNew
              oldSteps={[
                'Navigate to K-drive for compliance letter templates',
                'Open Word, set up mail merge with your Excel file',
                'Select Recipients, choose the correct tab',
                'Uncheck non-email records, preview results',
                'Finish & Merge → Send Email via Outlook',
                'Go to Outlook sent mail, save each as PDF',
                'File each PDF into K-drive property folders',
                'Return to FileMaker, update attempt fields one by one',
              ]}
              newSteps={[
                'Select properties in Action Queue',
                'Preview template merge — confirm and send',
                'Emails are sent, logged, and attempt fields update automatically',
              ]}
            />
          </SOPPhase>

          {/* ═══════════════════════════════════════
              PHASE 3: Buyer Self-Service Portal
              Replaces: incoming email → manual review → FM data entry
              THIS IS THE BUYER PORTAL EXPLANATION FOR STAFF
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={3}
            title="How the Buyer Portal Works"
            subtitle="What happens when buyers receive their compliance link"
            icon={ICONS.userCheck}
          >
            <div className="mt-3 mb-4 px-4 py-3 bg-accent-blue/5 border border-accent-blue/15 rounded-lg">
              <div className="flex items-start gap-2.5">
                <AppIcon icon={ICONS.info} size={15} className="text-accent-blue mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text/80 leading-relaxed">
                  <span className="font-medium">This section explains the buyer's experience</span> so
                  you understand what they see and do. When a buyer completes their submission through
                  the portal, it eliminates the manual data entry step where you previously had to
                  read incoming emails and update FileMaker fields by hand.
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
                  'The link is tied to their specific property — they can only access their own data',
                  'No account creation needed — the token handles authentication',
                ]}
              >
                <p>
                  When you send a compliance notice (Phase 2), the email automatically includes
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
                  'Requirements are specific to their program — an R4R buyer sees rehabilitation phases, a Featured Homes buyer sees occupancy deadlines',
                ]}
              >
                <p>
                  The buyer portal shows the buyer exactly where they stand in their compliance
                  timeline. This replaces the phone calls and emails where buyers ask "what do I
                  need to do?"
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
                  Instead of buyers emailing photos and documents that you then have to manually
                  file, the portal collects everything in structured upload slots. Each file is
                  automatically attached to the correct property.
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
                tip="This is the step that replaces split-screening Outlook and FileMaker. Instead of reading an email, finding the property in FM, and manually updating fields, the buyer's submission arrives pre-structured and ready for one-click review."
              >
                <p>
                  Once the buyer submits, their progress report appears in your Compliance
                  review queue. You review the uploaded photos and documents, then approve
                  or request changes.
                </p>
              </SOPStep>
            </div>

            <OldVsNew
              oldSteps={[
                'Buyer sends email with attached photos',
                'Open email, download attachments',
                'Create compliance subfolder in K-drive property file',
                'Save photos/documents to subfolder',
                'Open FileMaker, find the property record',
                'Manually update compliance fields based on email content',
              ]}
              newSteps={[
                'Buyer clicks secure link and uploads directly to the portal',
                'Submission appears in your review queue with files already attached',
                'Approve the submission — compliance status updates automatically',
              ]}
            />
          </SOPPhase>

          {/* ═══════════════════════════════════════
              PHASE 4: Recording Completion
              Replaces: FM field updates + K-drive archival
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={4}
            title="Recording Compliance Completion"
            subtitle="Mark milestones complete and close out properties"
            icon={ICONS.success}
          >
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
                tip="For demolition compliance, always verify that the final certification was signed off by the local unit of government before marking complete. If you're unsure whether demolition proof is sufficient, consult with the demolition department."
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
                  taken on a property. This replaces the need to dig through K-drive folders
                  and Outlook archives to reconstruct a compliance history.
                </p>
              </SOPStep>
            </div>

            <OldVsNew
              oldSteps={[
                'Open FileMaker, find the property on the CP layout',
                'Navigate to the correct program tab (Featured, R4R, Demo)',
                'Update "Date Proof of Investment provided" or "Demo Final Cert Date"',
                'Property falls off the compliance report after date field is updated',
                'File documentation in K-drive property compliance subfolder',
              ]}
              newSteps={[
                'Open the property — all documentation is already attached',
                'Mark milestones complete — property updates across all reports automatically',
                'Full audit trail is maintained with no additional filing needed',
              ]}
            />
          </SOPPhase>

          {/* ═══════════════════════════════════════
              PHASE 5: VIP Program Compliance
              Replaces: dedicated VIP layout in FM + manual RC field tracking
              ═══════════════════════════════════════ */}
          <SOPPhase
            number={5}
            title="VIP Program Compliance"
            subtitle="Development agreement tracking and proactive outreach"
            icon={ICONS.users}
          >
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
                tip="In FileMaker, you had to select the correct compliance layout type on the CP layout's VIP tab. The portal determines this automatically based on the property's program and development type."
              >
                <p>
                  When a VIP property closing date is entered, the portal generates the
                  full development agreement timeline. The RC (required contact) dates
                  are calculated automatically — RC15 is 15 days after closing, RC30 is
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
                  'Each outreach is logged with the date — replacing the manual RC date fields',
                ]}
              >
                <p>
                  VIP compliance is proactive — if the buyer isn't reaching out at the
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
                  of their project, log it in the Communication Log. This replaces updating
                  the date fields next to each RC entry in FileMaker.
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

            <OldVsNew
              oldSteps={[
                'Open FileMaker VIP Compliance layout',
                'Check which RC dates have passed without buyer contact',
                'Reach out to buyer, then update the date field next to the RC entry',
                'Repeat for each contact interval until compliance is complete',
                'Select correct compliance type on CP layout VIP tab',
                'Sign and record release of lien when requirements are met',
              ]}
              newSteps={[
                'VIP milestones generate automatically from closing date',
                'Overdue contacts appear in the Action Queue alongside all other programs',
                'Log communications — milestone dates update automatically',
                'Final compliance status and lien release tracked as milestones',
              ]}
            />
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

            {/* Enforcement levels reference */}
            <Card title="Enforcement Levels" subtitle="Graduated response system">
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
