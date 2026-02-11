# SOP-Killer Demo — Design Document

**Goal:** Replace the manual 6-tool compliance SOP (FileMaker → Excel → Word → Outlook → K: drive → FileMaker) with a portal that handles the entire monthly compliance cycle in minutes. Build a demo compelling enough for the Executive Director and board.

**Audience:** Executive Director (operational efficiency, public image, audit readiness), management, and compliance staff.

**Key Argument:** "We're behind on compliance for hundreds of properties. This catches us up automatically."

---

## Demo Flow: Three Beats

### Beat 1: "Here's the problem" (30 seconds)
Show the current SOP: 6 tools, hours of manual work per monthly cycle, hundreds of properties.

### Beat 2: "Here's what the portal does instead" (2-3 minutes)
Live walkthrough of Features 1-3: see who needs letters, send them all, everything auto-updates.

### Beat 3: "Here's what leadership gets" (1 minute)
Show Features 4-5: geographic map, audit trail. Board-ready visibility at any moment.

---

## Features

### Feature 1: Compliance Action Queue
**Replaces SOP steps 1-3** (FileMaker export → Excel sorting → Word mail merge)

Single page showing properties grouped by needed action:
- "Needs 1st Attempt" — never contacted
- "Needs 2nd Attempt" — contacted once, no response
- "Needs Default Notice" — contacted twice, no response

Each group shows count, property list, and "Send All" action.

### Feature 2: Mail Merge
**Replaces SOP steps 4-5** (Outlook send → save PDFs to K: drive)

Hit "Mail Merge" on a batch → emails sent via Resend → every email auto-logged in communication log per-property. No Outlook, no Word, no PDFs, no K: drive.

### Feature 3: Follow-ups
**Replaces SOP step 6** (manually updating FileMaker records one-by-one)

When a batch is sent, property compliance status auto-updates. Next month, non-responders automatically appear in the next queue. Zero manual record updating.

### Feature 4: Geographic Compliance Map
**New capability — high board presentation value**

Map of Flint with property pins color-coded by compliance status. Click a pin for property details. Filter by program type and enforcement level. Neighborhood-level cluster patterns visible at a glance.

### Feature 5: Audit Trail / Document Retention View
**New capability — audit readiness**

Per-property chronological timeline of every communication, status change, and document. Searchable across all properties. Retention tags per record type. One-click export for auditors.

---

## Build Priority

| # | Feature | Demo Impact | SOP Steps Replaced |
|---|---------|-------------|-------------------|
| 1 | Compliance Action Queue | "Here's who needs letters right now" | Steps 1-3 |
| 2 | Mail Merge | "One button, all sent and logged" | Steps 4-5 |
| 3 | Follow-ups | "Next month it's already sorted" | Step 6 |
| 4 | Geographic Compliance Map | Board wow factor | New capability |
| 5 | Audit Trail / Retention View | "Auditor asks? Here's everything." | New capability |

---

*Design validated February 10, 2026*
