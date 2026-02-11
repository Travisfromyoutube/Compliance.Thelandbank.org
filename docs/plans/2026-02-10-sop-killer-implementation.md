# SOP-Killer Demo — Implementation Plan

> **For Claude:** Use /execute-plan to implement this plan task-by-task.

**Goal:** Build 5 features that replace the manual 6-tool compliance SOP and demo compellingly to the Executive Director.

**Architecture:** All features are new pages or enhancements to existing pages in the admin portal. They use the existing PropertyContext, computeComplianceTiming engine, and communication system. Two features (Map, Audit Trail) require new pages and routes. Mock data needs expansion from 10 to ~40 properties for demo realism.

**Tech Stack:** React, Tailwind CSS (design tokens), Leaflet.js (map), existing compliance engine

---

### Task 1: Expand Mock Data for Demo Realism

The current 10 mock properties don't convey "hundreds of properties" scale. We need ~40 properties with realistic distribution across programs, enforcement levels, and compliance states so the demo dashboard numbers feel real.

**Files:**
- Create: `src/data/mockDataGenerator.js`
- Modify: `src/data/mockData.js` — import and spread generated properties after the existing 10

**Step 1: Create the generator**

Create `src/data/mockDataGenerator.js` that exports a `generateDemoProperties(count)` function:
- Generates properties with IDs starting at P011
- Uses real Flint street names and address format: `{number} {street}, Flint, MI {zip}`
- Flint zips: 48502, 48503, 48504, 48505, 48506, 48507
- Real-sounding Flint street names (Saginaw St, Court St, Kearsley St, Ballenger Hwy, MLK Ave, Davison Rd, Fenton Rd, Corunna Rd, Dort Hwy, Pierson Rd, Carpenter Rd, Beecher Rd, Robert T Longway Blvd, Industrial Ave, Lippincott Blvd, Dupont St, Lapeer Rd, Pasadena Ave, Lewis St, Mason St, Welch Blvd, Begole St, Chevrolet Ave, Leith St)
- Realistic distribution: 40% Featured Homes, 30% R4R, 15% Demo, 15% VIP
- Varied close dates (spread across 2024-06 through 2025-10)
- Enforcement levels weighted: 35% level 0, 25% level 1, 20% level 2, 12% level 3, 8% level 4
- Some have emails, some don't (~70% have emails)
- Compliance attempt dates set realistically based on enforcement level
- Communications arrays matching attempt dates
- Generates proper program-specific fields (occupancy dates for Featured, rehab fields for R4R, demo dates for Demo, rcDates for VIP)
- Each property gets `lat` and `lng` fields for the map (Flint city bounds: lat 42.95-43.07, lng -83.65 to -83.78)

**Step 2: Add lat/lng to existing 10 mock properties**

Add `lat` and `lng` fields to each of the existing P001-P010 properties in `mockData.js`. Use realistic Flint coordinates matching their addresses.

**Step 3: Import and merge in mockData.js**

At the bottom of `mockData.js`, import the generator and spread 30 additional properties:
```javascript
import { generateDemoProperties } from './mockDataGenerator';
const generatedProperties = generateDemoProperties(30);
// Append after existing mockProperties array definition
export const mockProperties = [...existingProperties, ...generatedProperties];
```

**Step 4: Verify**

Run: `npm run build`
Expected: 0 errors. All existing pages should still load with the expanded dataset.

**Step 5: Commit**

```bash
git add src/data/mockDataGenerator.js src/data/mockData.js
git commit -m "feat(data): expand mock data to ~40 properties for demo realism"
```

---

### Task 2: Compliance Action Queue Page

This is the centerpiece feature — a single page that replaces SOP steps 1-3 (FileMaker export → Excel sorting → Word mail merge). It groups properties by what action they need RIGHT NOW.

**Files:**
- Create: `src/pages/ActionQueue.jsx`
- Modify: `src/main.jsx` — add route `/action-queue`
- Modify: `src/components/Layout.jsx` — add sidebar nav item

**Step 1: Create the Action Queue page**

Create `src/pages/ActionQueue.jsx`:

**Page structure:**
- `AdminPageHeader` with icon `ListChecks` (from Lucide), title "Compliance Action Queue", subtitle "Properties grouped by required action"
- **Summary stat cards row** (4 cards):
  - "Needs 1st Attempt" — count of properties where `timing.isDueNow && timing.currentAction === 'ATTEMPT_1'`
  - "Needs 2nd Attempt" — count where `timing.isDueNow && timing.currentAction === 'ATTEMPT_2'`
  - "Needs Warning" — count where `timing.isDueNow && timing.currentAction === 'WARNING'`
  - "Needs Default Notice" — count where `timing.isDueNow && timing.currentAction === 'DEFAULT_NOTICE'`
- **Action groups** — one collapsible `Card` per action type, only shown if count > 0:
  - Header: action label (from `ACTION_LABELS`), count badge, "Select All" checkbox, "Send All" button
  - Body: `DataTable` showing properties in that group:
    - Columns: checkbox, address, buyer name, program type (StatusPill), days overdue (font-mono, red if >30), last contact date, enforcement level (StatusPill)
    - Mobile columns: address, days overdue
  - Each row is selectable
  - "Send All" button is primary (`bg-accent text-white`), disabled if none selected
- **"No Email" callout** — below the action groups, a subtle warning card listing properties that need action but have no buyer email on file (these need snail mail per the SOP). Show count and list addresses.
- Program filter dropdown at the top (All, Featured Homes, Ready4Rehab, Demolition, VIP)

**Data flow:**
```javascript
const { properties, batchLogCommunications } = useProperties();
const timingsMap = useMemo(() => {
  const map = {};
  properties.forEach(p => { map[p.id] = computeComplianceTiming(p); });
  return map;
}, [properties]);

// Group by currentAction where isDueNow === true
const actionGroups = useMemo(() => {
  const groups = { ATTEMPT_1: [], ATTEMPT_2: [], WARNING: [], DEFAULT_NOTICE: [] };
  properties.forEach(p => {
    const timing = timingsMap[p.id];
    if (timing?.isDueNow && groups[timing.currentAction]) {
      groups[timing.currentAction].push({ ...p, timing });
    }
  });
  return groups;
}, [properties, timingsMap]);
```

**"Send All" handler for a group:**
- Opens the existing `EmailPreview` modal with the selected properties and the corresponding action
- Uses `findTemplateForAction()` from `templateRenderer.js` to auto-select the right template
- On approve, calls `batchLogCommunications()` which auto-updates `compliance1stAttempt`/`compliance2ndAttempt` fields
- Shows success toast/alert with count

**Step 2: Add route**

In `src/main.jsx`, add:
```jsx
import ActionQueue from './pages/ActionQueue';
// Inside Router, within Layout:
<Route path="/action-queue" element={<ActionQueue />} />
```

**Step 3: Add sidebar nav**

In `src/components/Layout.jsx`, add nav item after "Batch Email":
```javascript
{ to: '/action-queue', label: 'Action Queue', icon: 'listChecks' }
```
Add `listChecks: ListChecks` to the icon imports from Lucide.

**Step 4: Verify**

Run: `npm run build`
Expected: 0 errors. Navigate to `/action-queue` — should show grouped properties.

**Step 5: Commit**

```bash
git add src/pages/ActionQueue.jsx src/main.jsx src/components/Layout.jsx
git commit -m "feat(compliance): add Action Queue page replacing SOP steps 1-3"
```

---

### Task 3: Mail Merge Enhancement

The Action Queue needs a polished send flow that makes the demo compelling — a "mail merge" that replaces the Word/Outlook manual process. The existing `EmailPreview` component and `batchLogCommunications` handle the mechanics — this task focuses on the UX of "review → approve → done" with a success state.

**Files:**
- Modify: `src/pages/ActionQueue.jsx` — add send flow, success state, and send confirmation
- Modify: `src/components/EmailPreview.jsx` — if needed, ensure it accepts a pre-selected action and template

**Step 1: Add send flow state to ActionQueue**

Add state for tracking the send workflow:
```javascript
const [sendingGroup, setSendingGroup] = useState(null); // 'ATTEMPT_1' etc.
const [sendResult, setSendResult] = useState(null); // { sent: N, failed: N, noEmail: N }
const [showPreview, setShowPreview] = useState(false);
```

**Step 2: Add success celebration state**

After a successful batch send, show a success card:
- Green background (`bg-success-light`)
- Checkmark icon
- "Sent {N} compliance emails. {M} properties need snail mail (no email on file)."
- "All communications logged automatically."
- "View Communication Log" link
- Auto-dismiss after 10 seconds or on click

**Step 3: Wire "Mail Merge" button to EmailPreview**

When user clicks "Mail Merge" on an action group:
1. Set `sendingGroup` to the action type
2. Auto-select the appropriate template via `findTemplateForAction()`
3. Open `EmailPreview` with the selected properties (filtered to those with email)
4. On approval callback from EmailPreview → call `batchLogCommunications(entries)` → set `sendResult`
5. Properties without email go to the "Needs Snail Mail" callout

**Step 4: Verify**

Run: `npm run build`
Expected: 0 errors. The send flow should work end-to-end with mock data.

**Step 5: Commit**

```bash
git add src/pages/ActionQueue.jsx src/components/EmailPreview.jsx
git commit -m "feat(compliance): mail merge send flow with success confirmation"
```

---

### Task 4: Follow-ups (Auto-Escalation Logic)

This feature makes it so that after sending a batch, the next monthly cycle automatically shows non-responders at the next escalation level. The compliance engine already handles most of this — this task verifies it works end-to-end and makes the behavior visible in the UI.

**Files:**
- Modify: `src/pages/ActionQueue.jsx` — add "Follow-up Summary" section
- Modify: `src/lib/computeDueNow.js` — verify escalation logic handles all edge cases

**Step 1: Verify escalation logic**

Read through `computeDueNow.js` and verify:
- When `compliance1stAttempt` is set (ATTEMPT_1 was sent), `completedActions` includes ATTEMPT_1
- The engine then looks for the next uncompleted action (ATTEMPT_2)
- If enough days have passed for ATTEMPT_2, it returns `isDueNow: true, currentAction: 'ATTEMPT_2'`
- Document any edge cases or fixes needed

**Step 2: Add "Follow-up Summary" to Action Queue**

Below the action groups, add a "Follow-up Summary" Card:
- Title: "Automatic Follow-ups" with an info icon
- Body text: "Properties that have been contacted but haven't responded are automatically tracked. When they reach the next milestone, they'll appear in the appropriate action group above."
- Show a timeline visualization:
  - "1st Attempt sent → [grace period] → 2nd Attempt queue"
  - "2nd Attempt sent → [grace period] → Warning queue"
  - "Warning sent → [grace period] → Default Notice queue"
- Below the timeline, show counts:
  - "Awaiting response to 1st Attempt: {N}" — properties where ATTEMPT_1 sent but not yet due for ATTEMPT_2
  - "Awaiting response to 2nd Attempt: {N}" — properties where ATTEMPT_2 sent but not yet due for WARNING

**Step 3: Verify**

Run: `npm run build`
Expected: 0 errors. Follow-up summary shows realistic counts.

**Step 4: Commit**

```bash
git add src/pages/ActionQueue.jsx src/lib/computeDueNow.js
git commit -m "feat(compliance): follow-up tracking with automatic escalation visibility"
```

---

### Task 5: Geographic Compliance Map

A new page showing every property on a map of Flint, color-coded by compliance status. This is the board-presentation wow factor.

**Files:**
- Create: `src/pages/ComplianceMap.jsx`
- Modify: `src/main.jsx` — add route `/map`
- Modify: `src/components/Layout.jsx` — add sidebar nav item
- Modify: `package.json` — add `leaflet` and `react-leaflet` dependencies

**Step 1: Install dependencies**

```bash
npm install leaflet react-leaflet
```

**Step 2: Add Leaflet CSS**

In `src/main.jsx` or `index.html`, add Leaflet CSS import:
```javascript
import 'leaflet/dist/leaflet.css';
```

**Step 3: Create the Map page**

Create `src/pages/ComplianceMap.jsx`:

**Page structure:**
- `AdminPageHeader` with icon `MapPin` (Lucide), title "Compliance Map", subtitle "Geographic view of property compliance status"
- **Filter bar** (horizontal row above map):
  - Program filter dropdown (All, Featured Homes, Ready4Rehab, Demolition, VIP)
  - Enforcement level filter (All, Compliant, Level 1-2, Level 3-4)
  - Summary text: "Showing {N} of {total} properties"
- **Map container** — full width, `h-[calc(100vh-280px)]` or similar to fill the viewport
  - Center on Flint: `[43.0125, -83.6875]`, zoom 13
  - OpenStreetMap tile layer (free, no API key needed)
  - Circle markers for each property:
    - Color based on enforcement level: 0=`#10b981` (emerald), 1=`#eab308` (yellow), 2=`#f97316` (orange), 3-4=`#ef4444` (red)
    - Radius: 8px
    - Opacity: 0.8
  - Click marker → popup showing:
    - Property address (bold)
    - Buyer name
    - Program type (with colored badge)
    - Compliance status (StatusPill-style)
    - Days overdue (if any)
    - Current action needed
    - "View Details" link to `/properties/{id}`
- **Legend** — positioned bottom-right on the map or below it:
  - Colored circles with labels: Compliant, Level 1-2, Level 3-4

**Step 4: Fix Leaflet default icon issue**

Leaflet's default marker icons break in Vite/webpack builds. Add the standard fix:
```javascript
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: undefined,
  iconUrl: undefined,
  shadowUrl: undefined,
});
```
We use `CircleMarker` instead of default markers, so this is just defensive.

**Step 5: Add route**

In `src/main.jsx`:
```jsx
import ComplianceMap from './pages/ComplianceMap';
<Route path="/map" element={<ComplianceMap />} />
```

**Step 6: Add sidebar nav**

In `src/components/Layout.jsx`, add nav item (suggest placing after "Reports"):
```javascript
{ to: '/map', label: 'Compliance Map', icon: 'mapPin' }
```
Add `mapPin: MapPin` to Lucide imports.

**Step 7: Verify**

Run: `npm run build`
Expected: 0 errors, no Leaflet CSS warnings. Map renders with colored pins.

**Step 8: Commit**

```bash
git add src/pages/ComplianceMap.jsx src/main.jsx src/components/Layout.jsx package.json package-lock.json
git commit -m "feat(map): geographic compliance map with color-coded property pins"
```

---

### Task 6: Audit Trail / Document Retention View

A per-property chronological timeline plus a portfolio-wide search. Makes the communication log look like a proper audit trail.

**Files:**
- Create: `src/pages/AuditTrail.jsx`
- Modify: `src/main.jsx` — add route `/audit`
- Modify: `src/components/Layout.jsx` — add sidebar nav item

**Step 1: Create the Audit Trail page**

Create `src/pages/AuditTrail.jsx`:

**Page structure:**
- `AdminPageHeader` with icon `ShieldCheck` (Lucide), title "Audit Trail", subtitle "Complete compliance record for every property"
- **Search bar** at top:
  - Full-width text input: "Search by address, buyer name, or template..."
  - Searches across all properties' communications
  - Results show instantly (client-side filter)
- **Summary stats row** (3 StatCards):
  - "Total Records" — sum of all communications across all properties
  - "Properties with Full Trail" — count of properties that have at least one communication per enforcement step they've passed through
  - "Retention Compliance" — percentage (for demo, calculate as: properties where all sent communications have dates / total properties with comms)
- **Property Timeline View** — the main content area:
  - Dropdown to select a property (address + buyer name) OR auto-populated from search results
  - When a property is selected, show:
    - Property header: address, parcel ID, buyer name, program type, date sold, current enforcement level
    - **Vertical timeline** showing all events in chronological order:
      - Each event is a card on the timeline with:
        - Date (font-mono, left side)
        - Event type icon (Mail for email, FileText for mail, Phone for phone, Activity for system)
        - Template name / description
        - Status badge (sent, pending, failed, logged)
        - If it's a compliance attempt: "1st Attempt" / "2nd Attempt" badge
        - Retention tag: small pill showing retention period ("5yr correspondence" / "7yr inspection" / "permanent")
      - Timeline line connecting events (vertical left border, civic green accent)
    - If no property selected, show a grid of all properties with their communication count, last contact date, and a "View Trail" button

**Retention tag logic:**
```javascript
const getRetentionTag = (comm) => {
  if (comm.action === 'DEFAULT_NOTICE') return { label: 'Permanent', years: '∞' };
  if (comm.type === 'system' && comm.template?.includes('Inspection')) return { label: '7yr inspection', years: 7 };
  return { label: '5yr correspondence', years: 5 };
};
```

**Step 2: Add route**

In `src/main.jsx`:
```jsx
import AuditTrail from './pages/AuditTrail';
<Route path="/audit" element={<AuditTrail />} />
```

**Step 3: Add sidebar nav**

In `src/components/Layout.jsx`, add nav item (after "Compliance Map"):
```javascript
{ to: '/audit', label: 'Audit Trail', icon: 'shieldCheck' }
```
Add `shieldCheck: ShieldCheck` to Lucide imports.

**Step 4: Verify**

Run: `npm run build`
Expected: 0 errors. Timeline renders for each property with mock communication data.

**Step 5: Commit**

```bash
git add src/pages/AuditTrail.jsx src/main.jsx src/components/Layout.jsx
git commit -m "feat(audit): audit trail page with per-property timeline and retention tags"
```

---

### Task 7: Final Polish and Demo Flow

Ensure the demo flows smoothly from the Dashboard → Action Queue → Send → Map → Audit Trail.

**Files:**
- Modify: `src/pages/Dashboard.jsx` — add "Action Queue" call-to-action card
- Modify: `src/pages/ActionQueue.jsx` — add navigation links to Map and Audit Trail in success state

**Step 1: Add Action Queue call-to-action to Dashboard**

On the Dashboard, add a prominent card (perhaps replacing or augmenting an existing stat):
- Title: "Compliance Action Queue"
- Show count: "{N} properties need action"
- Subtitle: "1st attempts: {X} | 2nd attempts: {Y} | Warnings: {Z}"
- CTA button: "Review & Send" → navigates to `/action-queue`
- Use `bg-warm-100 border-accent` styling to make it stand out

**Step 2: Add cross-links in ActionQueue success state**

After a successful batch send, add links:
- "View on Map →" links to `/map`
- "View Audit Trail →" links to `/audit`

**Step 3: Verify full demo flow**

1. Start at Dashboard → see "N properties need action" card
2. Click through to Action Queue → see grouped properties
3. Select all in "Needs 1st Attempt" → click Send All
4. Preview renders → click Approve
5. Success state shows → click "View on Map"
6. Map shows properties with updated colors
7. Click a property pin → see details → click "View Details"
8. Navigate to Audit Trail → see the communication just sent in the timeline

Run: `npm run build`
Expected: 0 errors. Full demo flow works end-to-end.

**Step 4: Commit**

```bash
git add src/pages/Dashboard.jsx src/pages/ActionQueue.jsx
git commit -m "feat(demo): dashboard CTA and cross-navigation for demo flow"
```

---

## Execution Summary

| Task | Feature | Est. Size | Dependencies |
|------|---------|-----------|-------------|
| 1 | Expand Mock Data | Medium | None |
| 2 | Action Queue Page | Large | Task 1 (for demo realism) |
| 3 | Mail Merge | Medium | Task 2 |
| 4 | Follow-ups | Small | Task 2 |
| 5 | Geographic Map | Large | Task 1 (for lat/lng data) |
| 6 | Audit Trail | Large | None (can parallel with 2-4) |
| 7 | Demo Polish | Small | Tasks 2-6 |

**Recommended batches:**
- Batch 1: Tasks 1-3 (core SOP replacement)
- Batch 2: Tasks 4-5 (follow-ups + map)
- Batch 3: Tasks 6-7 (audit trail + polish)
