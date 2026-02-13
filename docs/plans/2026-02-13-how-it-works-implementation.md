# "How This Portal Works" Implementation Plan

> **For Claude:** REQUIRED: Use /execute-plan to implement this plan task-by-task.

**Goal:** Replace the static FileMakerBridge explainer page with an interactive split-panel experience — React Flow architecture diagram on the left, 6 interactive chapters on the right.

**Architecture:** Split-panel layout (40/60) with persistent sticky React Flow diagram as spatial anchor. Each chapter has a purpose-built interaction (flip cards, file tree, expandable chips, step-through pipeline, peelable layers, bidirectional flow). Bidirectional sync via Intersection Observer: clicking a node scrolls to its chapter, scrolling a chapter highlights its node.

**Tech Stack:** React 18, @xyflow/react (React Flow v12), Tailwind CSS, CSS transitions (no Framer Motion)

**Design Spec:** `docs/plans/2026-02-13-how-it-works-redesign.md`

---

## Task 1: Install @xyflow/react and configure vendor chunk

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

**Step 1: Install the dependency**

Run: `npm install @xyflow/react`
Expected: Package added to dependencies in package.json

**Step 2: Add vendor chunk to vite.config.js**

In `vite.config.js`, add `'vendor-flow'` to `manualChunks`:

```js
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-map': ['leaflet', 'react-leaflet'],
  'vendor-flow': ['@xyflow/react'],
},
```

**Step 3: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds. Output should show a `vendor-flow` chunk in the dist/assets listing.

**Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "chore(deps): add @xyflow/react and vendor-flow chunk"
```

---

## Task 2: Create the custom React Flow node component

**Files:**
- Create: `src/components/howItWorks/SystemNode.jsx`

**Step 1: Create the howItWorks directory**

Run: `mkdir -p "src/components/howItWorks"`

**Step 2: Write SystemNode.jsx**

This is a custom React Flow node. It receives `data` with `label`, `subtitle`, `icon`, `active`, and `dimmed` props. It renders using the project's `AppIcon` and Tailwind design tokens.

```jsx
import { Handle, Position } from '@xyflow/react';
import { AppIcon } from '../ui';

export default function SystemNode({ data }) {
  const { label, subtitle, icon, active, dimmed, onClick } = data;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-4 py-2.5 rounded-lg border bg-white
        transition-all duration-200 cursor-pointer select-none
        ${active
          ? 'ring-2 ring-accent/40 bg-accent/5 border-accent shadow-md'
          : dimmed
            ? 'border-border/40 opacity-40'
            : 'border-border hover:border-accent hover:shadow-md hover:scale-105'
        }
      `}
    >
      <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
        <AppIcon icon={icon} size={18} className="text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text leading-tight truncate">{label}</p>
        {subtitle && (
          <p className="text-[10px] text-muted leading-tight truncate">{subtitle}</p>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-accent/30 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-accent/30 !w-2 !h-2 !border-0" />
    </div>
  );
}
```

**Step 3: Verify no syntax errors**

Run: `npm run build`
Expected: Build succeeds (component not yet imported anywhere, just validates syntax)

**Step 4: Commit**

```bash
git add src/components/howItWorks/SystemNode.jsx
git commit -m "feat(how-it-works): add custom React Flow node component"
```

---

## Task 3: Create the SystemMap (React Flow diagram)

**Files:**
- Create: `src/components/howItWorks/SystemMap.jsx`

**Step 1: Write SystemMap.jsx**

This is the React Flow canvas with 7 nodes and animated edges. It accepts `activeChapter` (string) and `onNodeClick` (callback) props from the parent page. Node positions are manually laid out for a clean vertical arrangement that fits a 40%-width panel.

```jsx
import { useCallback, useMemo } from 'react';
import { ReactFlow, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ICONS from '../../icons/iconMap';
import SystemNode from './SystemNode';

const nodeTypes = { system: SystemNode };

/* ── Chapter-to-node mapping ───────────────── */
const CHAPTER_NODE_MAP = {
  'what-it-does':    ['buyer', 'admin'],
  'whats-inside':    ['api', 'neon'],
  'tech-behind-it':  ['api', 'neon', 'filemaker', 'resend'],
  'how-data-moves':  ['api', 'filemaker', 'neon', 'resend'],
  'data-stays-safe': ['api', 'compliance'],
  'what-stays-sync': ['filemaker', 'neon'],
};

/* ── Edge-to-chapter pulse mapping ──────────── */
const CHAPTER_EDGE_MAP = {
  'what-it-does':    ['e-fm-api', 'e-api-neon', 'e-comp-admin', 'e-api-resend'],
  'whats-inside':    [],
  'tech-behind-it':  [],
  'how-data-moves':  ['e-fm-api', 'e-api-neon', 'e-api-resend', 'e-api-buyer'],
  'data-stays-safe': ['e-buyer-api', 'e-api-neon', 'e-fm-api'],
  'what-stays-sync': ['e-fm-api', 'e-api-neon'],
};

const BASE_NODES = [
  { id: 'buyer',      position: { x: 20,  y: 20  }, data: { label: 'Buyer Portal',      subtitle: 'Submissions',   icon: ICONS.user } },
  { id: 'admin',      position: { x: 200, y: 20  }, data: { label: 'Admin Portal',      subtitle: '14 pages',      icon: ICONS.dashboard } },
  { id: 'api',        position: { x: 110, y: 140 }, data: { label: 'Vercel API',        subtitle: '8 endpoints',   icon: ICONS.zap } },
  { id: 'neon',       position: { x: 20,  y: 270 }, data: { label: 'Neon Database',     subtitle: '9 tables',      icon: ICONS.database } },
  { id: 'filemaker',  position: { x: 200, y: 270 }, data: { label: 'FileMaker',         subtitle: 'Master records', icon: ICONS.sync } },
  { id: 'compliance', position: { x: 20,  y: 390 }, data: { label: 'Compliance Engine', subtitle: 'Hourly check',  icon: ICONS.shieldCheck } },
  { id: 'resend',     position: { x: 200, y: 390 }, data: { label: 'Resend Email',      subtitle: 'Notices',       icon: ICONS.batchEmail } },
];

const BASE_EDGES = [
  { id: 'e-buyer-api',  source: 'buyer',      target: 'api',        label: 'Submit' },
  { id: 'e-admin-api',  source: 'admin',      target: 'api',        label: 'Review' },
  { id: 'e-api-neon',   source: 'api',        target: 'neon',       sourceHandle: 'right', targetHandle: 'left', label: 'Store' },
  { id: 'e-fm-api',     source: 'filemaker',  target: 'api',        sourceHandle: 'left',  targetHandle: 'right', label: 'Sync' },
  { id: 'e-api-resend', source: 'api',        target: 'resend',     label: 'Send' },
  { id: 'e-comp-admin', source: 'compliance', target: 'admin',      sourceHandle: 'left',  targetHandle: 'left', label: 'Alert' },
  { id: 'e-comp-neon',  source: 'compliance', target: 'neon',       label: 'Check' },
  { id: 'e-api-buyer',  source: 'api',        target: 'buyer',      sourceHandle: 'left',  targetHandle: 'left', label: 'Token' },
];

export default function SystemMap({ activeChapter, onNodeClick }) {
  const activeNodeIds = CHAPTER_NODE_MAP[activeChapter] || [];
  const activeEdgeIds = CHAPTER_EDGE_MAP[activeChapter] || [];

  const nodes = useMemo(() =>
    BASE_NODES.map((n) => ({
      ...n,
      type: 'system',
      data: {
        ...n.data,
        active: activeNodeIds.includes(n.id),
        dimmed: activeChapter && !activeNodeIds.includes(n.id),
        onClick: () => onNodeClick?.(n.id),
      },
    })),
    [activeChapter, activeNodeIds, onNodeClick]
  );

  const edges = useMemo(() =>
    BASE_EDGES.map((e) => ({
      ...e,
      type: 'default',
      animated: activeEdgeIds.includes(e.id),
      style: {
        stroke: activeEdgeIds.includes(e.id) ? '#2d7a4a' : '#e2e0dc',
        strokeWidth: activeEdgeIds.includes(e.id) ? 2 : 1,
        strokeDasharray: '6 3',
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: activeEdgeIds.includes(e.id) ? '#2d7a4a' : '#e2e0dc' },
      labelStyle: { fontSize: 9, fill: '#8c8c8c', fontWeight: 600 },
      labelBgStyle: { fill: '#f6f5f3', fillOpacity: 0.9 },
    })),
    [activeChapter, activeEdgeIds]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}
```

Key design decisions in this code:
- `nodesDraggable={false}` — this is an explainer, not an editor. Nodes don't move.
- `panOnDrag={false}` + `zoomOnScroll={false}` — the diagram is static at the right zoom level. Prevents users from losing the view.
- `preventScrolling={false}` — critical: lets the browser's native scroll pass through the React Flow container so the right panel can scroll.
- `proOptions={{ hideAttribution: true }}` — clean presentation for demos.
- Edges use `animated: true` when their chapter is active (React Flow's built-in dashed animation).
- Node `onClick` is passed through `data` because custom nodes receive their config via `data`.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/howItWorks/SystemMap.jsx
git commit -m "feat(how-it-works): add React Flow system map with 7 nodes and animated edges"
```

---

## Task 4: Create ChapterHeader reusable component

**Files:**
- Create: `src/components/howItWorks/ChapterHeader.jsx`

**Step 1: Write ChapterHeader.jsx**

Consistent heading for all 6 chapters: icon + title + subtitle.

```jsx
import { AppIcon } from '../ui';

export default function ChapterHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
        <AppIcon icon={icon} size={18} className="text-accent" />
      </div>
      <div>
        <h2 className="font-heading text-lg font-semibold text-text">{title}</h2>
        <p className="text-sm text-muted mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/howItWorks/ChapterHeader.jsx
git commit -m "feat(how-it-works): add ChapterHeader component"
```

---

## Task 5: Create Chapter 1 — FlipCard component

**Files:**
- Create: `src/components/howItWorks/FlipCard.jsx`
- Modify: `src/index.css` (add flip animation CSS)

**Step 1: Add flip card CSS to index.css**

Add these classes at the end of `src/index.css` (before any closing comments):

```css
/* ── Flip card ───────────────────────────── */
.flip-card {
  perspective: 800px;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  transition: transform 0.4s ease;
  transform-style: preserve-3d;
}
.flip-card-inner.flipped {
  transform: rotateY(180deg);
}
.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-card-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}
```

**Step 2: Write FlipCard.jsx**

Three flip cards for Chapter 1. Each card has a front (icon + headline + summary) and back (how it works). Clicking flips the card.

```jsx
import { useState } from 'react';
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';
import ChapterHeader from './ChapterHeader';

const CARDS = [
  {
    id: 'sync',
    icon: ICONS.sync,
    frontTitle: 'Syncs Records',
    frontDetail: 'FileMaker records and this portal talk to each other automatically. No copy-pasting.',
    backTitle: 'How it works',
    backDetail: 'Portal connects to FileMaker\'s Data API every 15 minutes. Field names are translated automatically. New properties appear here within one sync cycle.',
    edgeHint: 'filemaker-neon',
  },
  {
    id: 'deadlines',
    icon: ICONS.clock,
    frontTitle: 'Tracks Deadlines',
    frontDetail: 'Compliance milestones are computed from the close date. The system knows what\'s due before you do.',
    backTitle: 'How it works',
    backDetail: 'Each program (Featured Homes, R4R, Demolition, VIP) has a built-in schedule. An hourly check flags anything overdue and escalates the enforcement level.',
    edgeHint: 'compliance-admin',
  },
  {
    id: 'notices',
    icon: ICONS.batchEmail,
    frontTitle: 'Sends Notices',
    frontDetail: 'One click sends a compliance email from compliance@thelandbank.org. No switching to Outlook.',
    backTitle: 'How it works',
    backDetail: 'Email templates are pre-written for each enforcement step. The Action Queue groups properties by what\'s due, so you can send 20 notices in one batch.',
    edgeHint: 'api-resend',
  },
];

function FlipCardItem({ card }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="flip-card cursor-pointer"
      onClick={() => setFlipped((f) => !f)}
    >
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div className="flip-card-front rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
            <AppIcon icon={card.icon} size={20} className="text-accent" />
          </div>
          <h3 className="font-heading text-sm font-bold text-text mb-1.5">{card.frontTitle}</h3>
          <p className="text-xs text-muted leading-relaxed">{card.frontDetail}</p>
          <p className="text-[10px] text-accent mt-3 font-medium">Click to see how &rarr;</p>
        </div>
        {/* Back */}
        <div className="flip-card-back rounded-lg border border-accent/30 bg-accent/5 p-5">
          <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2">{card.backTitle}</p>
          <p className="text-xs text-text leading-relaxed">{card.backDetail}</p>
          <p className="text-[10px] text-muted mt-3 font-medium">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}

export default function FlipCards() {
  return (
    <div>
      <ChapterHeader
        icon={ICONS.home}
        title="What This System Does"
        subtitle="Three things the portal handles so staff don't have to"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((card) => (
          <FlipCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/howItWorks/FlipCard.jsx src/index.css
git commit -m "feat(how-it-works): add Chapter 1 flip cards with CSS animation"
```

---

## Task 6: Modify MacOSWindow to accept children, create FileExplorer (Chapter 2)

**Files:**
- Modify: `src/components/bridge/MacOSWindow.jsx`
- Create: `src/components/howItWorks/FileExplorer.jsx`

**Step 1: Simplify MacOSWindow to accept children**

Replace the entire content of `src/components/bridge/MacOSWindow.jsx` with a simplified version that accepts `children` and `title` props. No more tabs, no more hardcoded content:

```jsx
/**
 * MacOSWindow — Skeuomorphic Mac OS 9 window chrome
 *
 * Now accepts children instead of hardcoded tab content.
 * Used as the container for the File Explorer in Chapter 2.
 */
export default function MacOSWindow({ title = 'Inside the Portal', children }) {
  return (
    <div className="macos9-desktop">
      <div className="macos9-window">
        {/* Title bar */}
        <div className="macos9-titlebar">
          <span className="macos9-btn macos9-btn-close" />
          <span className="macos9-btn macos9-btn-minimize" />
          <span className="macos9-btn macos9-btn-zoom" />
          <span className="macos9-titlebar-text">{title}</span>
        </div>
        {/* Content */}
        <div className="macos9-content">
          {children}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Write FileExplorer.jsx**

Interactive file tree with expand/collapse, search filter, color-coded icons, and click-to-inspect popovers.

```jsx
import { useState, useMemo } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import { MacOSWindow } from '../bridge';
import ChapterHeader from './ChapterHeader';

/* ── File tree data ──────────────────────────── */
const FILE_TREE = [
  { type: 'folder', name: 'api/', domain: 'api', count: 8, annotation: 'Vercel Serverless Functions', children: [
    { type: 'file', name: 'filemaker.js', domain: 'api', annotation: 'The bridge to FileMaker. Handles sync, push, and status checks.', node: 'FileMaker' },
    { type: 'file', name: 'tokens.js', domain: 'api', annotation: 'Creates unique buyer links for secure submission access.', node: 'Vercel API' },
    { type: 'file', name: 'submissions.js', domain: 'api', annotation: 'Handles buyer compliance form submissions.', node: 'Vercel API' },
    { type: 'file', name: 'email.js', domain: 'api', annotation: 'Sends compliance emails via Resend.', node: 'Resend Email' },
    { type: 'file', name: 'communications.js', domain: 'api', annotation: 'Logs every outreach to a property.', node: 'Vercel API' },
    { type: 'file', name: 'properties.js', domain: 'api', annotation: 'Property list and detail endpoints.', node: 'Vercel API' },
    { type: 'file', name: 'compliance.js', domain: 'api', annotation: 'Compliance timing calculations.', node: 'Compliance Engine' },
    { type: 'folder', name: 'cron/', domain: 'api', count: 1, annotation: '', children: [
      { type: 'file', name: 'compliance-check.js', domain: 'api', annotation: 'Runs hourly to flag overdue properties.', node: 'Compliance Engine' },
    ]},
  ]},
  { type: 'folder', name: 'src/', domain: 'frontend', count: null, annotation: 'Frontend Application', children: [
    { type: 'folder', name: 'config/', domain: 'config', count: 2, annotation: '', children: [
      { type: 'file', name: 'filemakerFieldMap.js', domain: 'config', annotation: 'Translates field names between portal and FM.', node: 'FileMaker' },
      { type: 'file', name: 'complianceRules.js', domain: 'config', annotation: 'Defines when milestones are due per program.', node: 'Compliance Engine' },
    ]},
    { type: 'folder', name: 'lib/', domain: 'config', count: 2, annotation: '', children: [
      { type: 'file', name: 'filemakerClient.js', domain: 'config', annotation: 'REST client for FM Data API sessions.', node: 'FileMaker' },
      { type: 'file', name: 'db.js', domain: 'config', annotation: 'Prisma connection to Neon (serverless-safe).', node: 'Neon Database' },
    ]},
    { type: 'folder', name: 'pages/', domain: 'frontend', count: 14, annotation: 'React page components', children: [] },
    { type: 'folder', name: 'components/', domain: 'frontend', count: null, annotation: 'Shared UI + buyer portal components', children: [] },
  ]},
  { type: 'folder', name: 'prisma/', domain: 'config', count: 1, annotation: '', children: [
    { type: 'file', name: 'schema.prisma', domain: 'config', annotation: 'Blueprint for 9 data tables.', node: 'Neon Database' },
  ]},
];

const DOMAIN_COLORS = {
  api: 'text-accent',
  frontend: 'text-info',
  config: 'text-warning',
  docs: 'text-muted',
};

/* ── Helpers ──────────────────────────────────── */

function matchesFilter(item, filter) {
  if (!filter) return true;
  const lower = filter.toLowerCase();
  if (item.name.toLowerCase().includes(lower)) return true;
  if (item.annotation?.toLowerCase().includes(lower)) return true;
  if (item.children) return item.children.some((c) => matchesFilter(c, filter));
  return false;
}

/* ── Tree item ───────────────────────────────── */

function TreeItem({ item, depth = 0, filter, selectedFile, onSelectFile }) {
  const [expanded, setExpanded] = useState(false);
  const isFolder = item.type === 'folder';
  const matches = matchesFilter(item, filter);
  const dimmed = filter && !matches;

  return (
    <>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-sm cursor-pointer transition-all duration-150
          ${dimmed ? 'opacity-30' : 'hover:bg-surface-alt'}
          ${selectedFile === item.name ? 'bg-accent/10' : ''}
        `}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
        onClick={() => {
          if (isFolder) setExpanded((e) => !e);
          else onSelectFile?.(selectedFile === item.name ? null : item);
        }}
      >
        {isFolder ? (
          <AppIcon
            icon={expanded ? ICONS.chevronDown : ICONS.chevronRight}
            size={12}
            className="text-muted flex-shrink-0"
          />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className={`${isFolder ? 'macos9-folder' : 'macos9-document'} flex-shrink-0`} />
        <span className={`text-xs font-mono font-semibold ${DOMAIN_COLORS[item.domain] || 'text-text'}`}>
          {item.name}
        </span>
        {isFolder && item.count != null && (
          <span className="text-[9px] font-mono text-muted bg-accent/10 px-1.5 py-0.5 rounded-full">
            {item.count}
          </span>
        )}
      </div>

      {/* Expanded children */}
      <div
        className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-[2000px]' : 'max-h-0'}`}
      >
        {isFolder && item.children?.map((child, i) => (
          <TreeItem
            key={`${child.name}-${i}`}
            item={child}
            depth={depth + 1}
            filter={filter}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </>
  );
}

/* ── Main ─────────────────────────────────────── */

export default function FileExplorer() {
  const [filter, setFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.file}
        title="What's Inside"
        subtitle="The key files that power the portal"
      />
      <MacOSWindow title="Inside the Portal">
        <div className="flex gap-0">
          {/* Tree panel */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-surface-alt">
                <AppIcon icon={ICONS.search} size={13} className="text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-xs bg-transparent outline-none w-full text-text placeholder:text-muted/60"
                />
              </div>
            </div>
            {/* Tree */}
            <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
              {FILE_TREE.map((item, i) => (
                <TreeItem
                  key={i}
                  item={item}
                  depth={0}
                  filter={filter}
                  selectedFile={selectedFile?.name}
                  onSelectFile={setSelectedFile}
                />
              ))}
            </div>
          </div>

          {/* Detail popover */}
          {selectedFile && (
            <div className="w-56 flex-shrink-0 border-l border-border pl-4 ml-4">
              <p className="text-[10px] font-mono font-bold text-accent mb-1">{selectedFile.name}</p>
              <p className="text-[11px] text-muted leading-relaxed mb-2">{selectedFile.annotation}</p>
              {selectedFile.node && (
                <p className="text-[9px] text-muted">
                  Part of <span className="font-semibold text-accent">{selectedFile.node}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </MacOSWindow>
    </div>
  );
}
```

**Step 3: Update bridge barrel export**

Replace `src/components/bridge/index.js` with:

```js
export { default as MacOSWindow } from './MacOSWindow';
```

(Remove `DataFlowDiagram` and `SecurityLayers` exports — they'll be deleted later.)

**Step 4: Verify build**

Run: `npm run build`
Expected: Build may warn about unused imports in FileMakerBridge.jsx (it still imports the removed exports). That's OK — FileMakerBridge.jsx gets deleted in a later task.

**Step 5: Commit**

```bash
git add src/components/bridge/MacOSWindow.jsx src/components/bridge/index.js src/components/howItWorks/FileExplorer.jsx
git commit -m "feat(how-it-works): add Chapter 2 file explorer, simplify MacOSWindow to children pattern"
```

---

## Task 7: Create Chapter 3 — TechStack (expandable chips)

**Files:**
- Create: `src/components/howItWorks/TechStack.jsx`

**Step 1: Write TechStack.jsx**

Four horizontal layer rows with expandable tech chips. Only one chip expanded at a time.

```jsx
import { useState } from 'react';
import ICONS from '../../icons/iconMap';
import ChapterHeader from './ChapterHeader';

const LAYERS = [
  {
    label: 'What you see',
    techs: [
      { name: 'React 18', aha: 'Component-based UI — every card, table, and form is a reusable piece', nodeHint: ['buyer', 'admin'] },
      { name: 'Tailwind CSS', aha: 'Consistent design tokens — every color and spacing follows the civic theme', nodeHint: ['buyer', 'admin'] },
    ],
  },
  {
    label: 'What handles requests',
    techs: [
      { name: 'Vite 5', aha: 'Sub-second hot reload — changes appear instantly during development', nodeHint: ['api'] },
      { name: 'Vercel Serverless', aha: 'Auto-deploy on every push — new features go live in under 60 seconds', nodeHint: ['api'] },
    ],
  },
  {
    label: 'Where data lives',
    techs: [
      { name: 'Prisma', aha: 'Type-safe database queries — prevents data mismatch bugs before they happen', nodeHint: ['neon'] },
      { name: 'Neon PostgreSQL', aha: 'Serverless database — scales automatically, connects from any edge location', nodeHint: ['neon'] },
      { name: 'FileMaker', aha: 'Master property database — reads and writes records securely over HTTPS', nodeHint: ['filemaker'] },
    ],
  },
  {
    label: 'Services that help',
    techs: [
      { name: 'Resend', aha: 'Transactional email from compliance@thelandbank.org — direct to Outlook', nodeHint: ['resend'] },
      { name: 'Leaflet', aha: 'Interactive map with color-coded pins — visualize compliance across Genesee County', nodeHint: ['admin'] },
    ],
  },
];

const LAYER_BORDERS = ['border-l-accent', 'border-l-info', 'border-l-warning', 'border-l-accent-blue'];

export default function TechStack() {
  const [expandedChip, setExpandedChip] = useState(null);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.zap}
        title="The Tech Behind It"
        subtitle="The tools and services that make it work"
      />
      <div className="space-y-3">
        {LAYERS.map((layer, layerIdx) => (
          <div
            key={layer.label}
            className={`flex items-start gap-4 pl-4 border-l-[3px] ${LAYER_BORDERS[layerIdx]} py-3`}
          >
            <p className="text-[11px] font-semibold text-muted w-36 flex-shrink-0 pt-1.5">{layer.label}</p>
            <div className="flex flex-wrap gap-2">
              {layer.techs.map((tech) => {
                const isExpanded = expandedChip === tech.name;
                return (
                  <button
                    key={tech.name}
                    onClick={() => setExpandedChip(isExpanded ? null : tech.name)}
                    className={`
                      text-left transition-all duration-200 rounded-full border
                      ${isExpanded
                        ? 'bg-accent/5 border-accent/40 shadow-sm px-4 py-2 rounded-lg'
                        : 'bg-white border-border hover:border-accent/30 px-3 py-1.5'
                      }
                    `}
                  >
                    <span className={`text-xs font-semibold ${isExpanded ? 'text-accent' : 'text-text'}`}>
                      {tech.name}
                    </span>
                    {isExpanded && (
                      <p className="text-[11px] text-muted leading-relaxed mt-1">{tech.aha}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/howItWorks/TechStack.jsx
git commit -m "feat(how-it-works): add Chapter 3 tech stack with expandable chips"
```

---

## Task 8: Create Chapter 4 — DataFlowPipeline (step-through)

**Files:**
- Create: `src/components/howItWorks/DataFlowPipeline.jsx`
- Modify: `src/index.css` (add pipeline animation CSS)

**Step 1: Add pipeline CSS to index.css**

Add at the end of `src/index.css`:

```css
/* ── Pipeline data packet ─────────────────── */
@keyframes travelRight {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(100% + 8px)); }
}
.pipeline-packet {
  animation: travelRight 0.3s ease forwards;
}
```

**Step 2: Write DataFlowPipeline.jsx**

Three tabbed flow scenarios with step-through navigation and animated data packet.

```jsx
import { useState, useCallback } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import ChapterHeader from './ChapterHeader';

const FLOWS = [
  {
    id: 'sync',
    label: 'Property Sync',
    steps: [
      { label: 'Authenticate', detail: 'Portal logs into FileMaker with a 15-minute session token.' },
      { label: 'Pull Records', detail: 'Reads property data from the PARC layout.' },
      { label: 'Translate Fields', detail: 'filemakerFieldMap.js converts 50+ field names between systems.' },
      { label: 'Store Locally', detail: 'Prisma upserts records into the Neon database cache.' },
    ],
  },
  {
    id: 'email',
    label: 'Compliance Emails',
    steps: [
      { label: 'Pick Template', detail: 'Each enforcement step (Attempt 1, Warning, Default Notice) has a pre-written template.' },
      { label: 'Merge Data', detail: 'Buyer name, address, and deadline are inserted into the template.' },
      { label: 'Send via Resend', detail: 'Email dispatched from compliance@thelandbank.org.' },
    ],
  },
  {
    id: 'token',
    label: 'Buyer Access Links',
    steps: [
      { label: 'Generate Token', detail: 'A unique code tied to one buyer, one property, with an expiration.' },
      { label: 'Email the Link', detail: 'Token embedded in the submission URL.' },
      { label: 'Buyer Clicks', detail: 'Portal verifies the token is valid and unused.' },
      { label: 'Submit Updates', detail: 'Buyer uploads photos and docs through the verified form.' },
      { label: 'Token Expires', detail: 'After use or timeout, the link stops working.' },
    ],
  },
];

function StepIndicator({ index, total, active, onClick }) {
  return (
    <div className="flex items-center">
      <button
        onClick={() => onClick(index)}
        className={`
          w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
          transition-all duration-200 flex-shrink-0
          ${active
            ? 'bg-accent text-white scale-110 shadow-sm'
            : 'bg-white border-2 border-border text-muted hover:border-accent/40'
          }
        `}
      >
        {index + 1}
      </button>
      {/* Connector line */}
      {index < total - 1 && (
        <div className="relative w-8 sm:w-12 h-[2px] bg-border mx-1">
          {/* Packet dot placeholder — animated via CSS class */}
        </div>
      )}
    </div>
  );
}

export default function DataFlowPipeline() {
  const [activeFlow, setActiveFlow] = useState('sync');
  const [activeStep, setActiveStep] = useState(0);

  const flow = FLOWS.find((f) => f.id === activeFlow);

  const handleFlowChange = useCallback((id) => {
    setActiveFlow(id);
    setActiveStep(0);
  }, []);

  const handlePrev = () => setActiveStep((s) => Math.max(0, s - 1));
  const handleNext = () => setActiveStep((s) => Math.min(flow.steps.length - 1, s + 1));

  return (
    <div>
      <ChapterHeader
        icon={ICONS.dataFlow}
        title="How Data Moves"
        subtitle="Step through three key workflows"
      />

      {/* Flow selector tabs */}
      <div className="flex gap-2 mb-5">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            onClick={() => handleFlowChange(f.id)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
              ${activeFlow === f.id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white border border-border text-muted hover:border-accent/30'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pipeline — horizontal on desktop */}
      <div className="hidden sm:flex items-center justify-center mb-5">
        {flow.steps.map((_, i) => (
          <StepIndicator
            key={`${activeFlow}-${i}`}
            index={i}
            total={flow.steps.length}
            active={i === activeStep}
            onClick={setActiveStep}
          />
        ))}
      </div>

      {/* Pipeline — vertical on mobile */}
      <div className="sm:hidden flex flex-col items-start gap-1 mb-5 pl-2">
        {flow.steps.map((step, i) => (
          <div key={`${activeFlow}-${i}`} className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep(i)}
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                transition-all duration-200
                ${i === activeStep
                  ? 'bg-accent text-white scale-110'
                  : 'bg-white border-2 border-border text-muted'
                }
              `}
            >
              {i + 1}
            </button>
            <span className={`text-xs ${i === activeStep ? 'text-text font-semibold' : 'text-muted'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Detail card */}
      <div className="bg-white rounded-lg border border-border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-accent">Step {activeStep + 1}</span>
          <span className="text-sm font-semibold text-text">{flow.steps[activeStep].label}</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">{flow.steps[activeStep].detail}</p>

        {/* Nav buttons */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
          <button
            onClick={handlePrev}
            disabled={activeStep === 0}
            className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <AppIcon icon={ICONS.arrowLeft} size={12} /> Previous
          </button>
          <button
            onClick={handleNext}
            disabled={activeStep === flow.steps.length - 1}
            className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <AppIcon icon={ICONS.arrowRight} size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/howItWorks/DataFlowPipeline.jsx src/index.css
git commit -m "feat(how-it-works): add Chapter 4 step-through data flow pipeline"
```

---

## Task 9: Create Chapter 5 — SecurityStack (peelable layers)

**Files:**
- Create: `src/components/howItWorks/SecurityStack.jsx`

**Step 1: Write SecurityStack.jsx**

Four peelable layer cards with progress dots and a reset control.

```jsx
import { useState } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import ChapterHeader from './ChapterHeader';

const LAYERS = [
  {
    id: 'tls',
    label: 'Encrypted Connections',
    icon: ICONS.globe,
    color: '#2d7a4a',
    items: [
      'All traffic is encrypted in transit.',
      'Security certificates are automatic.',
      'Browsers must use secure connections.',
    ],
  },
  {
    id: 'cors',
    label: 'Access Controls',
    icon: ICONS.shield,
    color: '#2b5f8a',
    items: [
      'Staff features require authorization.',
      'Only approved apps can access data.',
      'Security checks run before any data loads.',
    ],
  },
  {
    id: 'auth',
    label: 'Buyer Verification',
    icon: ICONS.outreach,
    color: '#b07d2e',
    items: [
      'Each buyer gets a unique, time-limited link.',
      'Links work once and expire automatically.',
      'No account creation needed.',
    ],
  },
  {
    id: 'db',
    label: 'Encrypted Storage',
    icon: ICONS.database,
    color: '#7c3aed',
    items: [
      'Portal database is encrypted at rest.',
      'FileMaker data is encrypted at rest.',
      'Queries are protected against tampering.',
    ],
  },
];

export default function SecurityStack() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < LAYERS.length - 1) setActiveIndex((i) => i + 1);
  };

  const handleReset = () => setActiveIndex(0);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.shieldCheck}
        title="How Data Stays Safe"
        subtitle="Four layers of protection, from network to storage"
      />

      <div className="flex gap-6">
        {/* Layer stack */}
        <div className="flex-1 relative" style={{ minHeight: '220px' }}>
          {LAYERS.map((layer, i) => {
            // Cards above active are "peeled away" (hidden)
            const isPeeled = i < activeIndex;
            const isActive = i === activeIndex;
            const offset = (i - activeIndex) * 12;

            return (
              <div
                key={layer.id}
                className={`
                  absolute inset-x-0 rounded-lg border bg-white p-5 shadow-sm
                  transition-all duration-300 cursor-pointer
                  ${isPeeled ? 'opacity-0 -translate-y-5 pointer-events-none' : ''}
                  ${isActive ? 'z-20' : 'z-10'}
                `}
                style={{
                  top: isPeeled ? 0 : `${offset}px`,
                  borderLeftWidth: '4px',
                  borderLeftColor: layer.color,
                }}
                onClick={isActive ? handleNext : () => setActiveIndex(i)}
              >
                {isActive ? (
                  <>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${layer.color}15` }}
                      >
                        <AppIcon icon={layer.icon} size={16} style={{ color: layer.color }} />
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: layer.color }}>{layer.label}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {layer.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: layer.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {i < LAYERS.length - 1 && (
                      <p className="text-[10px] text-muted mt-3 font-medium">Click to reveal next layer &rarr;</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs font-semibold" style={{ color: layer.color }}>{layer.label}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="flex flex-col items-center gap-2 pt-2">
          {LAYERS.map((layer, i) => (
            <button
              key={layer.id}
              onClick={() => setActiveIndex(i)}
              className="w-3 h-3 rounded-full border-2 transition-all duration-200"
              style={{
                borderColor: layer.color,
                background: i <= activeIndex ? layer.color : 'transparent',
              }}
              title={layer.label}
            />
          ))}
          {activeIndex > 0 && (
            <button
              onClick={handleReset}
              className="text-[9px] text-muted hover:text-accent mt-1 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/howItWorks/SecurityStack.jsx
git commit -m "feat(how-it-works): add Chapter 5 peelable security layer stack"
```

---

## Task 10: Create Chapter 6 — SyncFlow (bidirectional flow + sync controls)

**Files:**
- Create: `src/components/howItWorks/SyncFlow.jsx`
- Modify: `src/index.css` (add arrow animation CSS)

**Step 1: Add sync arrow CSS to index.css**

Add at the end of `src/index.css`:

```css
/* ── Sync flow arrows ─────────────────────── */
@keyframes dashFlow {
  to { stroke-dashoffset: -12; }
}
.sync-arrow-right {
  animation: dashFlow 0.8s linear infinite;
}
.sync-arrow-left {
  animation: dashFlow 0.8s linear infinite reverse;
}
```

**Step 2: Write SyncFlow.jsx**

Bidirectional flow with hover-to-highlight, embedded SyncButton, and system health bar.

```jsx
import { useState, useCallback, useEffect } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import ChapterHeader from './ChapterHeader';

const FROM_FM = [
  { label: 'Property records and addresses', example: '1234 Elm St, Flint — parcel 46-35-457-003' },
  { label: 'Buyer names and contact info', example: 'John Smith — jsmith@email.com' },
  { label: 'Sale dates and program types', example: 'Closed 2025-11-15 — Featured Homes' },
  { label: 'Sold status and parcel details', example: 'Status: Sold — SEV: $12,500' },
];

const TO_FM = [
  { label: 'Buyer compliance submissions and photos', example: 'Progress photo uploaded Jan 30' },
  { label: 'Email communication logs', example: 'Attempt 1 sent to buyer on Feb 3' },
  { label: 'Enforcement level changes', example: 'Level 0 → Level 2 for 5678 Oak Ave' },
  { label: 'Staff notes and field edits', example: 'Note: Buyer requested 30-day extension' },
];

function SyncRow({ item, direction, isHovered, onHover, onLeave }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-default
        transition-all duration-150
        ${isHovered ? 'bg-accent/5 text-text' : 'text-muted hover:bg-surface-alt'}
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isHovered && (
        <span className="text-[10px] text-accent italic ml-2 whitespace-nowrap">
          e.g. {item.example}
        </span>
      )}
    </div>
  );
}

function StatusDot({ connected, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent' : 'bg-danger'}`} />
      <span className="text-[10px] font-mono text-muted">{label}</span>
    </div>
  );
}

export default function SyncFlow() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/filemaker?action=status');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, configured: false });
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch('/api/filemaker?action=sync');
      await fetchStatus();
    } catch {
      // status will show error state
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div>
      <ChapterHeader
        icon={ICONS.sync}
        title="What Stays in Sync"
        subtitle="Data flows both ways between FileMaker and the portal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* From FileMaker */}
        <div className="rounded-lg border border-info/20 bg-info-light/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-info/10 flex items-center justify-center">
              <AppIcon icon={ICONS.arrowRight} size={14} className="text-info" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text">From FileMaker</p>
              <p className="text-[10px] text-muted">Every 15 minutes or on demand</p>
            </div>
          </div>
          <div className="space-y-0.5">
            {FROM_FM.map((item, i) => (
              <SyncRow
                key={i}
                item={item}
                direction="right"
                isHovered={hoveredItem === `from-${i}`}
                onHover={() => setHoveredItem(`from-${i}`)}
                onLeave={() => setHoveredItem(null)}
              />
            ))}
          </div>
        </div>

        {/* Center: Sync button */}
        <div className="flex flex-col items-center gap-3 self-center py-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center shadow-sm hover:scale-105 disabled:opacity-60 transition-all"
          >
            <AppIcon icon={ICONS.sync} size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
          <span className="text-[9px] font-mono text-muted">
            {status?.connected ? `${status.latencyMs || '?'}ms` : 'Offline'}
          </span>
        </div>

        {/* Back to FileMaker */}
        <div className="rounded-lg border border-success/20 bg-success-light/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center">
              <AppIcon icon={ICONS.arrowLeft} size={14} className="text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text">Back to FileMaker</p>
              <p className="text-[10px] text-muted">When staff or buyers take action</p>
            </div>
          </div>
          <div className="space-y-0.5">
            {TO_FM.map((item, i) => (
              <SyncRow
                key={i}
                item={item}
                direction="left"
                isHovered={hoveredItem === `to-${i}`}
                onHover={() => setHoveredItem(`to-${i}`)}
                onLeave={() => setHoveredItem(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* System Health Bar */}
      <div className="mt-5 rounded-lg border border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status?.connected ? 'bg-accent' : 'bg-danger'}`} />
          <span className={`text-sm font-medium ${status?.connected ? 'text-accent' : 'text-danger'}`}>
            {status?.connected ? 'All systems operational' : 'Some systems need attention'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <StatusDot connected={status?.connected} label="FileMaker" />
          <StatusDot connected={true} label="Neon DB" />
          <StatusDot connected={true} label="Vercel" />
          <StatusDot connected={status?.sync?.inSync} label="Sync" />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/howItWorks/SyncFlow.jsx src/index.css
git commit -m "feat(how-it-works): add Chapter 6 bidirectional sync flow with live status"
```

---

## Task 11: Create MobileNavStrip

**Files:**
- Create: `src/components/howItWorks/MobileNavStrip.jsx`

**Step 1: Write MobileNavStrip.jsx**

Horizontal pill navigator for mobile (replaces the React Flow diagram below `lg` breakpoint).

```jsx
import { AppIcon } from '../ui';
import ICONS from '../../icons/iconMap';

const NAV_ITEMS = [
  { id: 'what-it-does',    icon: ICONS.home,        label: 'Overview' },
  { id: 'whats-inside',    icon: ICONS.file,        label: 'Files' },
  { id: 'tech-behind-it',  icon: ICONS.zap,         label: 'Tech' },
  { id: 'how-data-moves',  icon: ICONS.dataFlow,    label: 'Data' },
  { id: 'data-stays-safe', icon: ICONS.shieldCheck, label: 'Security' },
  { id: 'what-stays-sync', icon: ICONS.sync,        label: 'Sync' },
];

export default function MobileNavStrip({ activeChapter, onNavigate }) {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-border px-3 py-2 -mx-4 sm:-mx-6">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium
              whitespace-nowrap flex-shrink-0 transition-all duration-150
              ${activeChapter === item.id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white border border-border text-muted hover:border-accent/30'
              }
            `}
          >
            <AppIcon icon={item.icon} size={12} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/howItWorks/MobileNavStrip.jsx
git commit -m "feat(how-it-works): add mobile navigation pill strip"
```

---

## Task 12: Create the HowItWorks page (main page shell)

**Files:**
- Create: `src/pages/HowItWorks.jsx`

**Step 1: Write HowItWorks.jsx**

This is the main page component. It assembles the split-panel layout, wires up React Flow ↔ chapter scroll sync via Intersection Observer, and renders all 6 chapters.

```jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import ICONS from '../icons/iconMap';
import { AdminPageHeader } from '../components/ui';
import SystemMap from '../components/howItWorks/SystemMap';
import MobileNavStrip from '../components/howItWorks/MobileNavStrip';
import FlipCards from '../components/howItWorks/FlipCard';
import FileExplorer from '../components/howItWorks/FileExplorer';
import TechStack from '../components/howItWorks/TechStack';
import DataFlowPipeline from '../components/howItWorks/DataFlowPipeline';
import SecurityStack from '../components/howItWorks/SecurityStack';
import SyncFlow from '../components/howItWorks/SyncFlow';

const CHAPTERS = [
  { id: 'what-it-does',    nodeId: 'buyer' },
  { id: 'whats-inside',    nodeId: 'api' },
  { id: 'tech-behind-it',  nodeId: 'neon' },
  { id: 'how-data-moves',  nodeId: 'filemaker' },
  { id: 'data-stays-safe', nodeId: 'compliance' },
  { id: 'what-stays-sync', nodeId: 'filemaker' },
];

/* ── Node-to-chapter mapping (for click-to-scroll) ── */
const NODE_TO_CHAPTER = {
  buyer:      'what-it-does',
  admin:      'what-it-does',
  api:        'whats-inside',
  neon:       'tech-behind-it',
  filemaker:  'how-data-moves',
  compliance: 'data-stays-safe',
  resend:     'how-data-moves',
};

export default function HowItWorks() {
  usePageTitle('How This Portal Works');
  const [activeChapter, setActiveChapter] = useState('what-it-does');
  const chapterRefs = useRef({});
  const scrollContainerRef = useRef(null);

  /* ── Intersection Observer: scroll → highlight node ── */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    Object.values(chapterRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── Click node → scroll to chapter ── */
  const handleNodeClick = useCallback((nodeId) => {
    const chapterId = NODE_TO_CHAPTER[nodeId];
    if (!chapterId) return;
    const el = chapterRefs.current[chapterId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveChapter(chapterId);
    }
  }, []);

  /* ── Mobile nav → scroll to chapter ── */
  const handleMobileNav = useCallback((chapterId) => {
    const el = chapterRefs.current[chapterId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveChapter(chapterId);
    }
  }, []);

  const setChapterRef = useCallback((id) => (el) => {
    chapterRefs.current[id] = el;
  }, []);

  return (
    <div className="space-y-0">
      <AdminPageHeader
        title="How This Portal Works"
        subtitle="A behind-the-scenes look at how the system works"
        icon={ICONS.bookOpen}
      />

      {/* Mobile nav strip */}
      <MobileNavStrip activeChapter={activeChapter} onNavigate={handleMobileNav} />

      {/* Split panel layout */}
      <div className="flex gap-6">
        {/* Left: System Map (hidden on mobile) */}
        <div className="hidden lg:block w-[40%] flex-shrink-0">
          <div className="sticky top-0 h-[calc(100vh-100px)] rounded-lg border border-border bg-bg overflow-hidden">
            <SystemMap activeChapter={activeChapter} onNodeClick={handleNodeClick} />
          </div>
        </div>

        {/* Right: Chapters */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 space-y-12 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 scroll-smooth"
        >
          <div id="what-it-does" ref={setChapterRef('what-it-does')}>
            <FlipCards />
          </div>
          <div id="whats-inside" ref={setChapterRef('whats-inside')}>
            <FileExplorer />
          </div>
          <div id="tech-behind-it" ref={setChapterRef('tech-behind-it')}>
            <TechStack />
          </div>
          <div id="how-data-moves" ref={setChapterRef('how-data-moves')}>
            <DataFlowPipeline />
          </div>
          <div id="data-stays-safe" ref={setChapterRef('data-stays-safe')}>
            <SecurityStack />
          </div>
          <div id="what-stays-sync" ref={setChapterRef('what-stays-sync')}>
            <SyncFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (page not yet routed)

**Step 3: Commit**

```bash
git add src/pages/HowItWorks.jsx
git commit -m "feat(how-it-works): add main page shell with split-panel layout and scroll sync"
```

---

## Task 13: Wire up routing, update sidebar nav, remove old files

**Files:**
- Modify: `src/main.jsx` (swap lazy import)
- Modify: `src/components/Layout.jsx` (update sidebar label if desired)
- Remove: `src/pages/FileMakerBridge.jsx`
- Remove: `src/components/bridge/DataFlowDiagram.jsx`
- Remove: `src/components/bridge/SecurityLayers.jsx`

**Step 1: Update main.jsx lazy import**

In `src/main.jsx`, replace:
```js
const FileMakerBridge = React.lazy(() => import('./pages/FileMakerBridge'))
```
with:
```js
const HowItWorks = React.lazy(() => import('./pages/HowItWorks'))
```

And in the route definition, replace:
```jsx
<Route path="/bridge" element={<ProtectedRoute><FileMakerBridge /></ProtectedRoute>} />
```
with:
```jsx
<Route path="/bridge" element={<ProtectedRoute><HowItWorks /></ProtectedRoute>} />
```

(Keep the same `/bridge` path to avoid breaking the sidebar nav link and any bookmarks.)

**Step 2: Remove old files**

```bash
rm src/pages/FileMakerBridge.jsx
rm src/components/bridge/DataFlowDiagram.jsx
rm src/components/bridge/SecurityLayers.jsx
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors. May have warnings from other files — that's fine.

**Step 4: Verify dev server**

Run: `npm run dev`
Navigate to `http://localhost:5173/bridge`
Expected: The new "How This Portal Works" page renders with:
- Split-panel layout (React Flow on left, chapters on right) on desktop
- Mobile nav strip on narrow screens
- All 6 chapters visible and interactive

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(how-it-works): wire up routing, remove old FileMakerBridge page and unused bridge components"
```

---

## Task 14: Visual polish pass — verify all interactions work

**Files:**
- Potentially modify: any component from Tasks 2-12 based on testing

**Step 1: Test all 6 chapter interactions**

Open `http://localhost:5173/bridge` and verify each chapter:

1. **Flip cards**: Click each card — should flip with smooth animation. Click again to flip back.
2. **File explorer**: Expand folders, click files, verify popover shows. Type in search filter — non-matching files should dim.
3. **Tech stack**: Click chips — should expand one at a time. Clicking another collapses the previous.
4. **Data flow pipeline**: Switch between 3 flow tabs. Click steps or use prev/next. Verify detail card updates.
5. **Security stack**: Click top layer to peel. Click progress dots to jump. Click reset to re-stack.
6. **Sync flow**: Hover rows — should show example tooltips. Click sync button — should animate.

**Step 2: Test React Flow ↔ chapter sync**

1. Click a node on the React Flow diagram → right panel should smooth-scroll to the matching chapter
2. Scroll through chapters on the right → corresponding node should highlight on the diagram
3. Verify inactive nodes dim when a chapter is active

**Step 3: Test mobile layout**

Resize browser below 1024px:
1. React Flow diagram should disappear
2. Mobile pill strip should appear at top
3. Tapping pills should scroll to chapters
4. All chapter interactions should work in single-column layout

**Step 4: Fix any issues found**

Apply fixes to the relevant component files.

**Step 5: Commit**

```bash
git add -A
git commit -m "fix(how-it-works): visual polish and interaction fixes from testing"
```

---

## Task 15: Final build verification and deploy

**Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds. Verify `vendor-flow` chunk appears in output.

**Step 2: Preview production build**

Run: `npm run preview`
Navigate to the preview URL, visit `/bridge`, verify everything works in production mode.

**Step 3: Commit and push**

```bash
git push origin main
```

Then deploy:

```bash
npx vercel@50.15.0 --prod
```

Expected: Deployment succeeds. Visit live URL and verify the page works.

---

## Summary

| Task | What | New Files |
|------|------|-----------|
| 1 | Install @xyflow/react, vendor chunk | — |
| 2 | SystemNode (custom React Flow node) | `SystemNode.jsx` |
| 3 | SystemMap (React Flow canvas) | `SystemMap.jsx` |
| 4 | ChapterHeader (reusable) | `ChapterHeader.jsx` |
| 5 | Chapter 1: FlipCards + CSS | `FlipCard.jsx` |
| 6 | Chapter 2: FileExplorer + MacOSWindow refactor | `FileExplorer.jsx` |
| 7 | Chapter 3: TechStack | `TechStack.jsx` |
| 8 | Chapter 4: DataFlowPipeline + CSS | `DataFlowPipeline.jsx` |
| 9 | Chapter 5: SecurityStack | `SecurityStack.jsx` |
| 10 | Chapter 6: SyncFlow + CSS | `SyncFlow.jsx` |
| 11 | MobileNavStrip | `MobileNavStrip.jsx` |
| 12 | HowItWorks page shell | `HowItWorks.jsx` |
| 13 | Wire routing, remove old files | — |
| 14 | Visual polish pass | — |
| 15 | Build, preview, deploy | — |
