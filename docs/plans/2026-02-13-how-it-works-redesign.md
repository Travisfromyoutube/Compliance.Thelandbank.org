# "How This Portal Works" Page Redesign

**Date:** 2026-02-13
**Page:** FileMakerBridge.jsx → renamed conceptually to "How This Portal Works"
**Goal:** Replace the static brochure-style explainer with a hands-on interactive experience that works as both a demo showpiece and a practical staff reference.

---

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Layout | Split-panel: persistent React Flow diagram (left 40%) + scrollable chapters (right 60%) | Spatial anchor always visible; bidirectional linking between map and content |
| Interactivity | Each chapter gets a purpose-built interaction pattern | File trees want expand/collapse, data flows want step-through, security wants layered reveal — one pattern doesn't fit all |
| Architecture diagram | React Flow (~50KB) | For 6-7 nodes with animated edges, hover states, and click-to-navigate, a proper graph library pays for itself vs. custom SVG wrangling |
| MacOS 9 window | Kept for Chapter 2 (File Explorer) only | Natural file browser metaphor; removed from all other topics |
| Tone | Direct, factual, conversational | Kill corporate/marketing voice. No "your data," no vendor whitepaper jargon. "Syncs with FileMaker" → "FileMaker records and this portal talk to each other automatically." |
| SyncButton location | Moved from page header into Chapter 6 (Sync Status) | Contextually belongs where sync is explained, not floating in global chrome |
| Mobile fallback | Diagram collapses to horizontal mini-map strip; chapters stack full-width | Split-panel doesn't work below 1024px |
| New dependencies | `@xyflow/react` (React Flow v12) | Only new dep. All animations via CSS transitions + Intersection Observer. No Framer Motion. |

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Header: "How This Portal Works"                             │
│  Subtitle: "A behind-the-scenes look at how the system works"│
├────────────────────────┬─────────────────────────────────────┤
│                        │                                     │
│   REACT FLOW DIAGRAM   │   CHAPTER 1: What This System Does  │
│   (sticky, 40% width)  │                                     │
│                        │   CHAPTER 2: What's Inside           │
│   Nodes:               │                                     │
│   - Buyer Portal       │   CHAPTER 3: The Tech Behind It      │
│   - Admin Portal       │                                     │
│   - Vercel API Layer   │   CHAPTER 4: How Data Moves          │
│   - Neon Database      │                                     │
│   - FileMaker          │   CHAPTER 5: How Data Stays Safe     │
│   - Compliance Engine  │                                     │
│   - Resend Email       │   CHAPTER 6: What Stays in Sync      │
│                        │                                     │
│   ┌──────────────────┐ │                                     │
│   │ System Status Bar│ │                                     │
│   └──────────────────┘ │                                     │
├────────────────────────┴─────────────────────────────────────┤
│  (Mobile: diagram collapses to pill strip at top)            │
└──────────────────────────────────────────────────────────────┘
```

### Left Panel — System Map

- **Sticky positioning**: `position: sticky; top: 0; height: 100vh` within a flex container
- **React Flow canvas** with 6-7 custom-styled nodes using the civic design tokens
- **Animated edges**: dashed lines pulse in the direction data flows. Edge color matches the civic palette (accent green for sync, info blue for API calls, warning amber for compliance checks)
- **Node interaction**:
  - Hover: node subtly scales up, connected edges brighten, unrelated nodes dim to 40% opacity
  - Click: node gets an accent glow ring, right panel smooth-scrolls to the matching chapter
- **Bidirectional sync**: Intersection Observer on each chapter heading. When a chapter enters the viewport, its corresponding node auto-highlights on the diagram
- **System Status Bar**: compact bar at the bottom of the left panel showing FM / Neon / Vercel / Sync health dots (relocated from current page footer)
- **Controls**: React Flow minimap disabled (too small to be useful at 40% width). Zoom/pan enabled but subtle — no visible controls, just scroll-to-zoom and drag-to-pan

### Right Panel — Chapters

- **Scrollable container** with 6 sections
- Each chapter has a consistent header pattern:
  - Colored icon (matches its React Flow node)
  - Title in `font-heading` (Bitter)
  - One-sentence summary in `text-muted`
- Thin left border with an accent-colored progress indicator showing active chapter
- `scroll-behavior: smooth` for programmatic scrolling from node clicks

### Mobile Layout (below `lg` / 1024px)

- Diagram collapses into a **horizontal pill strip** fixed at top:
  - Each node becomes a tappable pill (icon + short label)
  - Active pill has accent background
  - Tapping a pill scrolls to its chapter
- Chapters render full-width below the strip
- All chapter interactions (flip cards, tree explorer, pipelines) adapt to single-column

---

## Chapter Designs

### Chapter 1: "What This System Does"

**Replaces:** Hero explainer + 3 static feature cards
**Interaction:** Flip cards

**Content:**
Three cards side by side (stack on mobile):

| Card Front | Card Back |
|-----------|-----------|
| **Syncs Records** — "FileMaker records and this portal talk to each other automatically. No copy-pasting." | How: Portal connects to FileMaker's Data API every 15 minutes. Field names are translated automatically. New properties appear here within one sync cycle. |
| **Tracks Deadlines** — "Compliance milestones are computed from the close date. The system knows what's due before you do." | How: Each program (Featured Homes, R4R, Demolition, VIP) has a built-in schedule. An hourly check flags anything overdue and escalates the enforcement level. |
| **Sends Notices** — "One click sends a compliance email from compliance@thelandbank.org. No switching to Outlook." | How: Email templates are pre-written for each enforcement step. The Action Queue groups properties by what's due, so you can send 20 notices in one batch. |

**Interaction details:**
- Click to flip (not hover — prevents accidental flips on touch devices)
- Flip animation: 0.4s CSS `transform: rotateY(180deg)` with `backface-visibility: hidden`
- When a card flips, the corresponding React Flow edge pulses:
  - "Syncs Records" → FileMaker ↔ Neon edge
  - "Tracks Deadlines" → Compliance Engine → Admin Portal edge
  - "Sends Notices" → Vercel API → Resend edge

---

### Chapter 2: "What's Inside"

**Replaces:** MacOS Window "Files" tab
**Interaction:** Interactive file tree explorer inside the MacOS 9 window chrome
**Container:** Retains `macos9-*` CSS classes for the window frame, title bar, and traffic light dots

**Content:**
Same file tree data as current `FILE_TREE` constant, enhanced:

**Interaction details:**
- Folders collapsed by default. Click to expand/collapse with `max-height` transition (0.2s ease)
- Files are clickable — selecting one shows a **popover** (positioned right of the tree, inside the window) with:
  - File name in mono
  - 1-2 sentence explanation in conversational tone
  - Which React Flow node it belongs to (e.g., "Part of the API Layer")
- **Color-coded icons** by domain:
  - Green (`text-accent`): API routes (`api/`)
  - Blue (`text-info`): Frontend pages and components (`src/pages/`, `src/components/`)
  - Amber (`text-warning`): Config and integration (`src/config/`, `prisma/`)
  - Neutral (`text-muted`): Docs and other
- **Folder count badges**: e.g., `api/ (8 endpoints)` in a small `bg-accent/10` pill
- **Search input** at top of the tree: type to filter. Matching files highlight, non-matching files dim to 30% opacity. Debounced 200ms.
- MacOS window title bar text: "Inside the Portal" (unchanged)
- Remove the tab bar entirely — no more Technology/APIs/Security tabs. Those topics now have their own chapters.

---

### Chapter 3: "The Tech Behind It"

**Replaces:** MacOS Window "Technology" tab (9-item grid)
**Interaction:** Layered stack with hoverable expansion

**Content:**
Technologies grouped into 4 horizontal layers:

| Layer Label (staff-friendly) | Technologies |
|------------------------------|-------------|
| "What you see" | React 18, Tailwind CSS |
| "What handles requests" | Vite 5, Vercel Serverless |
| "Where data lives" | Prisma ORM, Neon PostgreSQL, FileMaker |
| "Services that help" | Resend (email), Leaflet (maps) |

**Interaction details:**
- Each layer is a horizontal row with a label on the left and tech chips on the right
- Chips are compact pills (`px-3 py-1.5 rounded-full border`) in resting state showing just the name
- **Click a chip** to expand it inline — the pill grows to reveal the "aha moment" explanation below the name. Only one chip expanded at a time (clicking another collapses the previous).
- Expanded chip gets a subtle accent border glow
- **React Flow sync**: When a chip is expanded, the corresponding node in the diagram subtly glows:
  - React/Tailwind/Vite → Admin Portal + Buyer Portal nodes
  - Prisma/Neon → Neon Database node
  - FileMaker → FileMaker node
  - Resend → Resend Email node
  - Leaflet → Admin Portal node
- Layer rows have a subtle left border in alternating shades for visual separation
- No jargon labels — "ORM" never appears. "Prisma" chip's expanded text: "Type-safe database queries — prevents data mismatch bugs before they happen"

---

### Chapter 4: "How Data Moves"

**Replaces:** MacOS Window "APIs" tab (3 static flow sections)
**Interaction:** Step-through pipeline with animated data packet

**Content:**
Three flow scenarios as tab pills at the top of the chapter:

**Flow A: "Property Sync" (FileMaker → Portal)**
1. Authenticate → "Portal logs into FileMaker with a 15-minute session token"
2. Pull Records → "Reads property data from the PARC layout"
3. Translate Fields → "filemakerFieldMap.js converts 50+ field names between systems"
4. Store Locally → "Prisma upserts records into the Neon database cache"

**Flow B: "Compliance Emails" (Portal → Buyer)**
1. Pick Template → "Each enforcement step (Attempt 1, Warning, Default Notice) has a pre-written template"
2. Merge Data → "Buyer name, address, and deadline are inserted into the template"
3. Send via Resend → "Email dispatched from compliance@thelandbank.org"

**Flow C: "Buyer Access Links" (Secure Token Flow)**
1. Generate Token → "A unique code tied to one buyer, one property, with an expiration"
2. Email the Link → "Token embedded in the submission URL"
3. Buyer Clicks → "Portal verifies the token is valid and unused"
4. Submit Updates → "Buyer uploads photos and docs through the verified form"
5. Token Expires → "After use or timeout, the link stops working"

**Interaction details:**
- Three tab pills at top: "Property Sync," "Compliance Emails," "Buyer Access Links." Active tab has accent fill.
- Pipeline renders as connected circles (step indicators) on a horizontal line
- **Active step**: filled accent circle with scale-up. Detail card below shows the step's label + explanation
- **Inactive steps**: hollow circles with muted border
- **Navigation**: click any step to jump to it, or use ← → arrow buttons flanking the pipeline
- **Data packet animation**: a small accent dot (4px) travels along the connector line between steps when you advance. CSS `@keyframes` with `translateX`. Duration: 0.3s.
- **React Flow sync**: the relevant edges in the diagram pulse in sequence as you step through. Flow A steps 1-2 pulse the FileMaker → API edge, steps 3-4 pulse the API → Neon edge.
- Pipeline is horizontal on desktop, vertical on mobile (same as current DataFlowDiagram responsive behavior)

---

### Chapter 5: "How Data Stays Safe"

**Replaces:** SecurityLayers component (4 static cards) + MacOS Window "Security" tab
**Interaction:** Peelable layer stack

**Content:**
Four layers (unchanged data, rewritten tone):

| Layer | Plain-English Items |
|-------|-------------------|
| Encrypted Connections | All traffic is encrypted in transit. Security certificates are automatic. Browsers must use secure connections. |
| Access Controls | Staff features require authorization. Only approved apps can access data. Security checks run before any data loads. |
| Buyer Verification | Each buyer gets a unique, time-limited link. Links work once and expire automatically. No account creation needed. |
| Encrypted Storage | Portal database is encrypted at rest. FileMaker data is encrypted at rest. Queries are protected against tampering. |

**Interaction details:**
- Four layers rendered as overlapping cards in a vertical stack with 12px offset per card (like a fanned deck)
- Top layer is fully visible. Layers beneath show just their top edge with the layer title peeking out
- **Click the top layer** (or click "Next layer" button): top card animates up and fades out (`translateY(-20px) + opacity: 0`, 0.3s), revealing the layer beneath which slides into the primary position
- **Vertical progress dots** on the right side: 4 dots, filled as you peel through. Click any dot to jump directly to that layer.
- Each visible layer shows:
  - Layer name as a bold heading
  - A shield-style icon (reusing existing ICONS)
  - 3 bullet points in conversational tone
  - A colored accent bar on the left edge (green → blue → amber → purple, matching current `SECURITY_MEASURES` colors)
- **"Reset" link** at the bottom to re-stack all layers
- **React Flow sync**: the edge closest to the current layer subtly glows (layer 1 → all external edges, layer 2 → API edge, layer 3 → Buyer Portal edge, layer 4 → Neon + FM nodes)

---

### Chapter 6: "What Stays in Sync"

**Replaces:** Two static "From FM / Back to FM" cards + SyncButton in header + SystemHealthBar in footer
**Interaction:** Live bidirectional flow with hover detail + embedded sync controls

**Content:**
Two columns with animated directional arrows between them:

**From FileMaker (left column):**
- Property records and addresses
- Buyer names and contact info
- Sale dates and program types
- Sold status and parcel details

**Back to FileMaker (right column):**
- Buyer compliance submissions and photos
- Email communication logs
- Enforcement level changes
- Staff notes and field edits

**Interaction details:**
- Two card columns with a central "bridge" area containing animated arrows
- Arrows are CSS-animated: left-to-right arrows for "From FM" items, right-to-left for "Back to FM" items. Subtle dashed-line animation (`stroke-dashoffset` keyframe)
- **Hover a row**: its corresponding arrow highlights (thicker, accent color), and a tooltip appears showing a concrete example:
  - "Property records" → "1234 Elm St, Flint — parcel 46-35-457-003"
  - "Enforcement level changes" → "Level 0 → Level 2 for 5678 Oak Ave"
- **SyncButton**: embedded between the two columns, centered. Shows "Last synced: X min ago" with the manual sync trigger. Uses the existing `SyncButton` component, restyled to fit.
- **System Health Bar**: compact footer within this chapter. Same 4-dot health check (FM, Neon, Vercel, Sync) as current, just relocated here.
- **React Flow sync**: the FileMaker ↔ Neon edge in the diagram animates bidirectionally (arrows pulse both ways) when this chapter is in view

---

## Tone Guide

All copy on this page follows these rules:

| Rule | Example |
|------|---------|
| No "your" — not a sales pitch | "Data stays safe" not "Your data stays safe" |
| No jargon without context | "Prisma" is fine but "ORM" never appears alone |
| Active voice, present tense | "The system flags missed deadlines" not "Missed deadlines are flagged by the system" |
| Concrete over abstract | "Sends email from compliance@thelandbank.org" not "Facilitates automated communications" |
| Short sentences | Max ~15 words per sentence in explanations |
| No exclamation marks | Confident, not excited |

---

## React Flow Node Design

Each node is a custom React Flow node component styled with Tailwind:

```
┌─────────────────────┐
│  [Icon]  Label       │   ← 48px height, rounded-lg
│          subtitle    │   ← text-[10px] text-muted
└─────────────────────┘
```

- Background: `bg-white` with `border border-border` in resting state
- Hover: `border-accent shadow-md scale-105` transition
- Active (clicked or scroll-synced): `ring-2 ring-accent/40 bg-accent/5`
- Icon: `AppIcon` from the existing icon system, 18px, `text-accent`
- Dimensions: auto-width based on content, consistent 48px height
- Node subtitles (optional): "7 endpoints" for API Layer, "9 tables" for Neon, etc.

### Edge Design

- Default: `stroke: accent/20`, dashed (`strokeDasharray: "6 3"`), animated dash offset
- Active (chapter in view): `stroke: accent`, `strokeWidth: 2`, faster dash animation
- Hover (connected to hovered node): `stroke: accent/60`

---

## Components to Create / Modify

| Component | Action | Purpose |
|-----------|--------|---------|
| `src/pages/HowItWorks.jsx` | **Create** (rename from FileMakerBridge) | Page shell: split layout, React Flow canvas, chapter container |
| `src/components/howItWorks/SystemMap.jsx` | **Create** | React Flow diagram with custom nodes, edges, and scroll-sync logic |
| `src/components/howItWorks/SystemNode.jsx` | **Create** | Custom React Flow node component |
| `src/components/howItWorks/ChapterHeader.jsx` | **Create** | Reusable chapter heading (icon + title + subtitle) |
| `src/components/howItWorks/FlipCard.jsx` | **Create** | Chapter 1 flip card interaction |
| `src/components/howItWorks/FileExplorer.jsx` | **Create** | Chapter 2 interactive tree (inside MacOS window) |
| `src/components/howItWorks/TechStack.jsx` | **Create** | Chapter 3 layered stack with expandable chips |
| `src/components/howItWorks/DataFlowPipeline.jsx` | **Create** | Chapter 4 step-through pipeline |
| `src/components/howItWorks/SecurityStack.jsx` | **Create** | Chapter 5 peelable layer stack |
| `src/components/howItWorks/SyncFlow.jsx` | **Create** | Chapter 6 bidirectional flow + sync controls |
| `src/components/howItWorks/MobileNavStrip.jsx` | **Create** | Mobile fallback: horizontal pill navigator |
| `src/components/bridge/MacOSWindow.jsx` | **Modify** | Remove tab bar and non-Files content. Accept `children` prop instead of hardcoded tabs. |
| `src/components/bridge/DataFlowDiagram.jsx` | **Remove** | Replaced by DataFlowPipeline |
| `src/components/bridge/SecurityLayers.jsx` | **Remove** | Replaced by SecurityStack |
| `src/pages/FileMakerBridge.jsx` | **Remove** | Replaced by HowItWorks.jsx |
| `src/main.jsx` | **Modify** | Update lazy import path from FileMakerBridge to HowItWorks |
| `src/components/Layout.jsx` | **Modify** | Update sidebar nav label/route if path changes |

---

## New Dependency

```
npm install @xyflow/react
```

- `@xyflow/react` is React Flow v12 (the current version, rebranded from `reactflow`)
- ~50KB gzipped
- Add to `manualChunks` in `vite.config.js` as `'vendor-flow'` for long-term caching
- MIT licensed

---

## Files Unchanged

- `src/data/mockData.js` — chapter content pulls from existing constants
- `src/config/complianceRules.js` — Chapter 1 references but doesn't modify
- `src/config/filemakerFieldMap.js` — Chapter 4 references but doesn't modify
- `src/components/bridge/index.js` — update exports (remove DataFlowDiagram, SecurityLayers; keep MacOSWindow)
- `tailwind.config.js` — no new tokens needed; existing palette covers all designs
- `src/index.css` — `macos9-*` classes stay (used by Chapter 2)

---

## Acceptance Criteria

- [ ] Split-panel layout renders: sticky React Flow diagram left, scrollable chapters right
- [ ] All 7 React Flow nodes visible with animated edges
- [ ] Clicking a node smooth-scrolls to the matching chapter
- [ ] Scrolling through chapters auto-highlights the corresponding node (Intersection Observer)
- [ ] Chapter 1: Three flip cards with CSS flip animation; edge pulses on flip
- [ ] Chapter 2: File tree inside MacOS window; expand/collapse folders; click files for popover; search filter
- [ ] Chapter 3: Four layer rows with expandable tech chips; node glow on expansion
- [ ] Chapter 4: Three-scenario tabbed pipeline; step-through with animated dot; edge sync
- [ ] Chapter 5: Four peelable layer cards; progress dots; jump-to-layer; reset
- [ ] Chapter 6: Bidirectional hover flow; SyncButton embedded; System Health bar as footer
- [ ] Mobile (< 1024px): diagram collapses to pill strip; chapters stack full-width
- [ ] All copy follows tone guide (no "your," no jargon, active voice)
- [ ] No new dependencies beyond `@xyflow/react`
- [ ] `vendor-flow` chunk added to vite.config.js manualChunks
- [ ] Existing page route and sidebar nav updated
