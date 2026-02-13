# Diagram Annotations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a title node, static node descriptions, and dynamic SOP callout annotations to the React Flow diagram panel on the How It Works page.

**Architecture:** Three new React Flow node types (title, annotation, system with descriptions) rendered inside the existing SystemMap. Annotations swap content based on `activeChapter` prop using the same chapter mapping infrastructure already in place. No new dependencies.

**Tech Stack:** React, @xyflow/react, Tailwind CSS

---

### Task 1: Create TitleNode Component

**Files:**
- Create: `src/components/howItWorks/TitleNode.jsx`

**Step 1: Create the title node component**

```jsx
/**
 * TitleNode — persistent header at the top of the React Flow diagram.
 * No border, no background — just text on the drafting paper.
 * Never dims regardless of active chapter.
 */
export default function TitleNode({ data }) {
  return (
    <div className="text-center select-none pointer-events-none px-4">
      <h2 className="font-heading text-lg font-bold text-text leading-tight">
        {data.title}
      </h2>
      <p className="text-xs text-muted italic mt-0.5">{data.subtitle}</p>
    </div>
  );
}
```

**Step 2: Verify no syntax errors**

Run: `cd "/Users/travisgilbert/Library/Mobile Documents/com~apple~CloudDocs/Tech Dev/Compliance.Thelandbank.org-main 3" && npx vite build 2>&1 | tail -5`
Expected: Build succeeds (will fail on import — that's fine, wired in Task 4)

**Step 3: Commit**

```bash
git add src/components/howItWorks/TitleNode.jsx
git commit -m "feat(how-it-works): add TitleNode component for diagram header"
```

---

### Task 2: Create AnnotationNode Component

**Files:**
- Create: `src/components/howItWorks/AnnotationNode.jsx`

**Step 1: Create the annotation node component**

The annotation node fades in/out based on a `visible` prop. Always rendered in the DOM (for smooth opacity transitions), but invisible when not active.

```jsx
/**
 * AnnotationNode — small SOP callout that appears near a system node.
 * Fades in when its chapter is active, fades out otherwise.
 * Dashed left border accent, italic text, no background.
 */
export default function AnnotationNode({ data }) {
  const { text, visible } = data;

  return (
    <div
      className={`
        select-none pointer-events-none max-w-[180px]
        border-l-2 border-dashed border-accent/30 pl-2 py-0.5
        transition-opacity duration-300 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="text-[10px] text-muted italic leading-snug">{text}</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/howItWorks/AnnotationNode.jsx
git commit -m "feat(how-it-works): add AnnotationNode component for SOP callouts"
```

---

### Task 3: Update SystemNode with Descriptions

**Files:**
- Modify: `src/components/howItWorks/SystemNode.jsx`

The design spec says each node gets a longer `description` field below the subtitle. The current node renders `label` + `subtitle`. Add a `description` line below subtitle.

**Step 1: Add description rendering to SystemNode**

In `SystemNode.jsx`, after the subtitle `<p>` tag, add:

```jsx
{data.description && (
  <p className="text-[9px] text-muted/70 leading-snug mt-0.5 line-clamp-2">{data.description}</p>
)}
```

The full `<div className="min-w-0">` block becomes:

```jsx
<div className="min-w-0">
  <p className="font-heading text-sm font-semibold text-text leading-tight truncate">{label}</p>
  {subtitle && (
    <p className="text-xs text-muted leading-tight truncate">{subtitle}</p>
  )}
  {description && (
    <p className="text-[9px] text-muted/70 leading-snug mt-0.5 line-clamp-2">{description}</p>
  )}
</div>
```

Also destructure `description` from `data` at the top of the component:

```jsx
const { label, subtitle, description, icon, active, dimmed, onClick } = data;
```

**Step 2: Commit**

```bash
git add src/components/howItWorks/SystemNode.jsx
git commit -m "feat(how-it-works): add description field to SystemNode"
```

---

### Task 4: Wire Everything into SystemMap

**Files:**
- Modify: `src/components/howItWorks/SystemMap.jsx`

This is the main integration task. Changes:
1. Import TitleNode and AnnotationNode
2. Register them in `nodeTypes`
3. Add title node to the node list
4. Add `description` to each BASE_NODE's data
5. Add CHAPTER_ANNOTATION_MAP with callout content
6. Generate annotation nodes from the map based on `activeChapter`
7. Shift all system nodes down to make room for title
8. Adjust fitView padding

**Step 1: Update imports and nodeTypes**

At the top of SystemMap.jsx, add imports:

```jsx
import TitleNode from './TitleNode';
import AnnotationNode from './AnnotationNode';
```

Update nodeTypes:

```jsx
const nodeTypes = { system: SystemNode, title: TitleNode, annotation: AnnotationNode };
```

**Step 2: Add annotation content map**

After CHAPTER_EDGE_MAP, add:

```jsx
/* ── Chapter-to-annotation callout mapping ──── */
const CHAPTER_ANNOTATIONS = {
  'what-it-does': [
    { targetNode: 'admin', text: 'Compliance reports used to start with an Excel export. Now they\'re always live.' },
    { targetNode: 'resend', text: 'Mail merge across Word and Outlook → one click batch send' },
  ],
  'whats-inside': [
    { targetNode: 'api', text: 'One system handles what used to take FileMaker reports, Excel sorting, and Word templates' },
    { targetNode: 'neon', text: 'Property data stays current. No more saving spreadsheets to the K: drive' },
  ],
  'tech-behind-it': [
    { targetNode: 'filemaker', text: 'Still the master record. The portal reads from it and writes back.' },
    { targetNode: 'api', text: 'Runs the logic that used to live in Excel formulas and Word merge fields' },
  ],
  'how-data-moves': [
    { targetNode: 'resend', text: 'Emails go out from compliance@. No more saving Outlook PDFs to property folders' },
    { targetNode: 'buyer', text: 'Buyers submit directly through a secure link. No phone tag or paper forms' },
  ],
  'data-stays-safe': [
    { targetNode: 'compliance', text: 'Levels update automatically. No split screen FM updates after each send' },
    { targetNode: 'api', text: 'Every action is logged. No manual field entry per record' },
  ],
  'what-stays-sync': [
    { targetNode: 'filemaker', text: 'Same FM layouts, same data. The portal handles the back and forth' },
    { targetNode: 'neon', text: 'Portal keeps its own copy so pages load fast between syncs' },
  ],
};
```

**Step 3: Update BASE_NODES with descriptions and shifted positions**

Title node sits at y: -100. System nodes shift down by 100 to make room. Add `description` to each node's data.

```jsx
const TITLE_NODE = {
  id: 'title',
  type: 'title',
  position: { x: 50, y: -100 },
  data: { title: 'System Architecture', subtitle: 'How each piece streamlines the compliance workflow' },
  selectable: false,
  draggable: false,
};

const BASE_NODES = [
  { id: 'buyer',      position: { x: 0,   y: 40  }, data: { label: 'Buyer Portal',      subtitle: 'Submissions',    description: 'Buyers get a secure link, upload documents, and confirm occupancy', icon: ICONS.user } },
  { id: 'admin',      position: { x: 260, y: 40  }, data: { label: 'Admin Portal',      subtitle: '14 pages',       description: 'Where we pull reports, review compliance status, and send batch mail', icon: ICONS.dashboard } },
  { id: 'api',        position: { x: 130, y: 220 }, data: { label: 'Vercel API',        subtitle: '8 endpoints',    description: 'Routes requests between the portals, FileMaker, and email', icon: ICONS.zap } },
  { id: 'neon',       position: { x: 0,   y: 400 }, data: { label: 'Neon Database',     subtitle: '9 tables',       description: 'Local cache so pages load fast between syncs', icon: ICONS.database } },
  { id: 'filemaker',  position: { x: 260, y: 400 }, data: { label: 'FileMaker',         subtitle: 'Master records',  description: 'The master record. The portal reads from it and writes back to it', icon: ICONS.sync } },
  { id: 'compliance', position: { x: 0,   y: 580 }, data: { label: 'Compliance Engine', subtitle: 'Hourly check',   description: 'Calculates milestones from the close date and updates levels automatically', icon: ICONS.shieldCheck } },
  { id: 'resend',     position: { x: 260, y: 580 }, data: { label: 'Resend Email',      subtitle: 'Notices',         description: 'Write and send emails from compliance@ without leaving the portal', icon: ICONS.batchEmail } },
];
```

**Step 4: Add annotation position lookup**

Annotations need positions relative to their target nodes. Add a position map that offsets annotations to the left or right of target nodes:

```jsx
/* ── Annotation positions (offset from target node) ── */
const ANNOTATION_OFFSETS = {
  buyer:      { x: -190, y: 10  },
  admin:      { x: 260,  y: 70  },
  api:        { x: -190, y: 190 },
  neon:       { x: -190, y: 410 },
  filemaker:  { x: 260,  y: 470 },
  compliance: { x: -190, y: 590 },
  resend:     { x: 260,  y: 650 },
};
```

Note: These are absolute positions on the canvas. Since annotations reference different target nodes per chapter, some nodes get annotations from the left (x: -190) and some from the right (x: 260+). Tune during visual review.

**Step 5: Generate annotation nodes in the nodes useMemo**

Replace the current `nodes` useMemo with one that also generates annotation nodes:

```jsx
const nodes = useMemo(() => {
  // System nodes with active/dimmed state
  const systemNodes = BASE_NODES.map((n) => ({
    ...n,
    type: 'system',
    data: {
      ...n.data,
      active: activeNodeIds.includes(n.id),
      dimmed: activeChapter && !activeNodeIds.includes(n.id),
      onClick: () => onNodeClick?.(n.id),
    },
  }));

  // Annotation nodes — all chapters' annotations are always in the DOM,
  // but only the active chapter's are visible (opacity transition)
  const annotationNodes = Object.entries(CHAPTER_ANNOTATIONS).flatMap(
    ([chapter, annotations]) =>
      annotations.map((ann, i) => {
        const offset = ANNOTATION_OFFSETS[ann.targetNode] || { x: 0, y: 0 };
        return {
          id: `ann-${chapter}-${i}`,
          type: 'annotation',
          position: { x: offset.x, y: offset.y },
          data: { text: ann.text, visible: activeChapter === chapter },
          selectable: false,
          draggable: false,
        };
      })
  );

  return [TITLE_NODE, ...systemNodes, ...annotationNodes];
}, [activeChapter, activeNodeIds, onNodeClick]);
```

**Step 6: Adjust fitView padding**

Change from `0.08` to `0.12` to accommodate the title node above:

```jsx
fitViewOptions={{ padding: 0.12 }}
```

**Step 7: Build and verify**

Run: `cd "/Users/travisgilbert/Library/Mobile Documents/com~apple~CloudDocs/Tech Dev/Compliance.Thelandbank.org-main 3" && npm run build 2>&1 | tail -5`
Expected: Build succeeds with 0 errors

**Step 8: Commit**

```bash
git add src/components/howItWorks/SystemMap.jsx
git commit -m "feat(how-it-works): wire title, descriptions, and annotation nodes into SystemMap"
```

---

### Task 5: Visual Tuning and Deploy

**Files:**
- Possibly adjust: `src/components/howItWorks/SystemMap.jsx` (annotation positions)
- Possibly adjust: `src/components/howItWorks/SystemNode.jsx` (description styling)
- Possibly adjust: `src/components/howItWorks/TitleNode.jsx` (title sizing)

**Step 1: Run dev server and visually inspect**

Run: `cd "/Users/travisgilbert/Library/Mobile Documents/com~apple~CloudDocs/Tech Dev/Compliance.Thelandbank.org-main 3" && npm run dev`

Check in browser at `localhost:5173/bridge`:
- [ ] Title "System Architecture" visible at top of diagram panel
- [ ] All 7 system nodes show description text below subtitle
- [ ] Scrolling through chapters on the right shows/hides annotation callouts
- [ ] Annotations fade smoothly (300ms opacity transition)
- [ ] Annotations don't overlap system nodes or edges
- [ ] `fitView` scales everything to fill the panel without clipping
- [ ] Nodes are still clickable (scroll to chapter)

**Step 2: Adjust ANNOTATION_OFFSETS if annotations overlap**

The initial offset values are estimates. If annotations overlap edges or nodes, adjust the x/y values in `ANNOTATION_OFFSETS`. Left-side annotations use negative x (~-190), right-side use positive x (~260+).

**Step 3: Final build check**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 4: Commit any tuning changes**

```bash
git add -A
git commit -m "style(how-it-works): tune annotation positions and sizing"
```

**Step 5: Push and deploy**

```bash
git push origin main
npx vercel@50.15.0 --prod
```

Expected: Deploy succeeds, aliased to https://compliance.thelandbank.org

---

## Content Rules (for all text in this feature)

- No dashes in callout text (use periods or arrows →)
- Never use the word "enforcement" (use "levels" or rephrase)
- Tone: respectful evolution of the SOP, not criticism
- The SOP author will view this page
