import { useMemo } from 'react';
import { ReactFlow, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ICONS from '../../icons/iconMap';
import SystemNode from './SystemNode';
import AnnotationNode from './AnnotationNode';

/**
 * SystemMap - React Flow architecture diagram (persistent left panel).
 *
 * 7 system nodes, HTML overlay title, and dynamic annotation nodes.
 * Annotations change content based on activeChapter to show how
 * the portal streamlines the previous compliance SOP.
 *
 * All interactivity (drag, zoom, pan) is disabled - this is a read-only
 * spatial anchor, not an editor. preventScrolling=false lets native
 * scroll pass through so the right panel can scroll normally.
 */

const nodeTypes = { system: SystemNode, annotation: AnnotationNode };

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

/* ── Annotation positions (absolute canvas coords) ── */
/* Kept symmetric around node range (0–300) so fitView centers cleanly */
const ANNOTATION_POSITIONS = {
  buyer:      { x: -190, y: 30  },
  admin:      { x: 490,  y: 30  },
  api:        { x: 490,  y: 250 },
  neon:       { x: -190, y: 460 },
  filemaker:  { x: 490,  y: 460 },
  compliance: { x: -190, y: 680 },
  resend:     { x: 490,  y: 680 },
};

/* ── System nodes with descriptions ─────────── */
/* y-range stretched to ~750 to fill the tall portrait panel */
const BASE_NODES = [
  { id: 'buyer',      position: { x: 0,   y: 0   }, data: { label: 'Buyer Portal',      subtitle: 'Submissions',    description: 'Buyers get a secure link, upload documents, and confirm occupancy', icon: ICONS.user } },
  { id: 'admin',      position: { x: 300, y: 0   }, data: { label: 'Admin Portal',      subtitle: '14 pages',       description: 'Where we pull reports, review compliance status, and send batch mail', icon: ICONS.dashboard } },
  { id: 'api',        position: { x: 150, y: 190 }, data: { label: 'Vercel API',        subtitle: '8 endpoints',    description: 'Routes requests between the portals, FileMaker, and email', icon: ICONS.zap } },
  { id: 'neon',       position: { x: 0,   y: 400 }, data: { label: 'Neon Database',     subtitle: '9 tables',       description: 'Local cache so pages load fast between syncs', icon: ICONS.database } },
  { id: 'filemaker',  position: { x: 300, y: 400 }, data: { label: 'FileMaker',         subtitle: 'Master records',  description: 'The master record. The portal reads from it and writes back to it', icon: ICONS.sync } },
  { id: 'compliance', position: { x: 0,   y: 620 }, data: { label: 'Compliance Engine', subtitle: 'Hourly check',   description: 'Calculates milestones from the close date and updates levels automatically', icon: ICONS.shieldCheck } },
  { id: 'resend',     position: { x: 300, y: 620 }, data: { label: 'Resend Email',      subtitle: 'Notices',         description: 'Write and send emails from compliance@ without leaving the portal', icon: ICONS.batchEmail } },
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

  const nodes = useMemo(() => {
    // System nodes with active/dimmed state + descriptions
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

    // Annotation nodes: all are always in the DOM for smooth opacity transitions.
    // Only the active chapter's annotations are visible.
    const annotationNodes = Object.entries(CHAPTER_ANNOTATIONS).flatMap(
      ([chapter, annotations]) =>
        annotations.map((ann, i) => {
          const pos = ANNOTATION_POSITIONS[ann.targetNode] || { x: 0, y: 0 };
          return {
            id: `ann-${chapter}-${i}`,
            type: 'annotation',
            position: { x: pos.x, y: pos.y },
            data: { text: ann.text, visible: activeChapter === chapter },
            selectable: false,
            draggable: false,
          };
        })
    );

    return [...systemNodes, ...annotationNodes];
  }, [activeChapter, activeNodeIds, onNodeClick]);

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
      labelStyle: { fontSize: 11, fill: '#8c8c8c', fontWeight: 600 },
      labelBgStyle: { fill: '#f4f6f5', fillOpacity: 0.85 },
    })),
    [activeChapter, activeEdgeIds]
  );

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* HTML overlay title — outside React Flow so it doesn't affect fitView bounding box */}
      <div className="flex-shrink-0 text-center px-4 pt-4 pb-2">
        <h2 className="font-heading text-base font-bold text-text leading-tight">
          System Architecture
        </h2>
        <p className="text-[11px] text-muted italic mt-0.5">
          How each piece streamlines the compliance workflow
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.08 }}
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
    </div>
  );
}
