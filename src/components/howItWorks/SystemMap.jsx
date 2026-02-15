import { useMemo } from 'react';
import { ReactFlow, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ICONS from '../../icons/iconMap';
import SystemNode from './SystemNode';
import AnnotationNode from './AnnotationNode';
import LegendNode from './LegendNode';

/**
 * SystemMap - Dark blueprint architecture diagram (full-width hero card).
 *
 * Landscape layout: 7 system nodes arranged in 3 tiers across a wide card
 * on a dark civic-green background. Nodes have color-coded left borders
 * by category (portal/service/integration).
 *
 * Active chapter highlights relevant nodes and animates their connecting edges
 * with directional dash-flow animation and colored glow.
 *
 * Annotations show SOP-improvement callouts per chapter, positioned near
 * their target nodes. All annotations are always in the DOM with opacity
 * transitions to prevent fitView recalculation.
 */

const nodeTypes = { system: SystemNode, annotation: AnnotationNode, legend: LegendNode };

/* ── Category color constants ────────────── */
const CATEGORY_COLORS = {
  portal:      '#2d7a4a',  // civic green
  service:     '#2b5f8a',  // civic blue
  integration: '#b07d2e',  // warm ochre
};

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
  'what-it-does':    ['e-buyer-api', 'e-admin-api'],
  'whats-inside':    ['e-api-neon', 'e-fm-api'],
  'tech-behind-it':  ['e-api-neon', 'e-fm-api', 'e-api-resend', 'e-comp-neon'],
  'how-data-moves':  ['e-fm-api', 'e-api-neon', 'e-api-resend', 'e-api-buyer'],
  'data-stays-safe': ['e-buyer-api', 'e-api-neon', 'e-comp-neon', 'e-comp-admin'],
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
    { targetNode: 'compliance', text: 'Runs the logic that used to live in Excel formulas and Word merge fields' },
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

/* ── Landscape node positions ─────────────────
   Same anchored topology: Buyer Portal left, Admin Portal right,
   services in the center. Now with category colors.

   ┌─────────┐                                         ┌─────────┐
   │  Buyer  │───→  API Hub  ←───  FileMaker           │  Admin  │
   │ (portal)│          │              │                │(portal) │
   └─────────┘    Neon   Compliance   Resend            └─────────┘
*/
const BASE_NODES = [
  // Anchors: Portals
  { id: 'buyer', position: { x: 0,   y: 110 }, data: { label: 'Buyer Portal', subtitle: 'Submissions', description: 'Secure link for documents and occupancy confirmation', icon: ICONS.home, anchor: true, category: 'portal' } },
  { id: 'admin', position: { x: 840, y: 110 }, data: { label: 'Admin Portal', subtitle: '14 pages',    description: 'Reports, compliance status, and batch mail',        icon: ICONS.dashboard, anchor: true, category: 'portal' } },
  // Row 1: API Hub
  { id: 'api',        position: { x: 440, y: 0   }, data: { label: 'Vercel API',        subtitle: '8 endpoints',    description: 'Routes requests between portals, FileMaker, and email', icon: ICONS.zap, category: 'service' } },
  // Row 2: Services + integrations
  { id: 'neon',       position: { x: 290, y: 200 }, data: { label: 'Neon Database',     subtitle: '10 tables',      description: 'Fast local cache between syncs', icon: ICONS.database, category: 'integration' } },
  { id: 'compliance', position: { x: 290, y: 330 }, data: { label: 'Compliance Engine', subtitle: 'Hourly check',   description: 'Auto-calculates milestones and levels', icon: ICONS.shieldCheck, category: 'service' } },
  { id: 'filemaker',  position: { x: 570, y: 200 }, data: { label: 'FileMaker',         subtitle: 'Master records',  description: 'The master record system', icon: ICONS.sync, category: 'integration' } },
  { id: 'resend',     position: { x: 570, y: 330 }, data: { label: 'Resend Email',      subtitle: 'Notices',         description: 'Compliance emails without Outlook', icon: ICONS.batchEmail, category: 'integration' } },
];

/* ── Legend node position (below diagram center) ── */
const LEGEND_NODE = {
  id: 'legend',
  type: 'legend',
  position: { x: 340, y: 430 },
  data: {},
  selectable: false,
  draggable: false,
};

/* ── Annotation positions (near their target node) ── */
const ANNOTATION_POSITIONS = {
  buyer:      { x: -10,  y: -40  },
  admin:      { x: 850,  y: -40  },
  api:        { x: 660,  y: -30  },
  neon:       { x: 80,   y: 200  },
  filemaker:  { x: 790,  y: 200  },
  compliance: { x: 80,   y: 340  },
  resend:     { x: 790,  y: 340  },
};

const BASE_EDGES = [
  { id: 'e-buyer-api',  source: 'buyer',      target: 'api',        sourceHandle: 'right', targetHandle: 'left', label: 'Submit' },
  { id: 'e-admin-api',  source: 'admin',      target: 'api',        sourceHandle: 'left',  targetHandle: 'right', label: 'Review' },
  { id: 'e-api-neon',   source: 'api',        target: 'neon',       label: 'Store' },
  { id: 'e-fm-api',     source: 'filemaker',  target: 'api',        label: 'Sync' },
  { id: 'e-api-resend', source: 'api',        target: 'resend',     label: 'Send' },
  { id: 'e-comp-admin', source: 'compliance', target: 'admin',      sourceHandle: 'right', targetHandle: 'left', label: 'Alert' },
  { id: 'e-comp-neon',  source: 'compliance', target: 'neon',       label: 'Check' },
  { id: 'e-api-buyer',  source: 'api',        target: 'buyer',      sourceHandle: 'left',  targetHandle: 'right', label: 'Token' },
];

/* ── Map edge to a category color based on its source node ── */
function getEdgeColor(edgeId) {
  const sourceMap = {};
  BASE_EDGES.forEach((e) => { sourceMap[e.id] = e.source; });
  const nodeMap = {};
  BASE_NODES.forEach((n) => { nodeMap[n.id] = n.data.category; });

  const sourceId = sourceMap[edgeId];
  const category = nodeMap[sourceId];
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.portal;
}

export default function SystemMap({ activeChapter, onNodeClick }) {
  const activeNodeIds = CHAPTER_NODE_MAP[activeChapter] || [];
  const activeEdgeIds = CHAPTER_EDGE_MAP[activeChapter] || [];

  const nodes = useMemo(() => {
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

    // Annotation nodes: always in DOM for smooth opacity transitions
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

    return [...systemNodes, ...annotationNodes, LEGEND_NODE];
  }, [activeChapter, activeNodeIds, onNodeClick]);

  const edges = useMemo(() =>
    BASE_EDGES.map((e) => {
      const isActive = activeEdgeIds.includes(e.id);
      const edgeColor = getEdgeColor(e.id);
      return {
        ...e,
        type: 'default',
        animated: isActive,
        className: isActive ? 'edge-flow-active' : '',
        style: {
          stroke: isActive ? edgeColor : 'rgba(255, 255, 255, 0.12)',
          strokeWidth: isActive ? 2.5 : 1.5,
          strokeDasharray: isActive ? '8 4' : '6 3',
          transition: 'stroke 0.4s ease, stroke-width 0.3s ease',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? edgeColor : 'rgba(255, 255, 255, 0.12)',
          width: isActive ? 20 : 16,
          height: isActive ? 20 : 16,
        },
        labelStyle: {
          fontSize: 11,
          fill: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
          fontWeight: isActive ? 700 : 500,
          transition: 'fill 0.3s ease',
        },
        labelBgStyle: { fill: 'transparent', fillOpacity: 0 },
      };
    }),
    [activeChapter, activeEdgeIds]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
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
