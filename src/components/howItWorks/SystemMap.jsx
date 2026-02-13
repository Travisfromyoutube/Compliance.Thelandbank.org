import { useMemo } from 'react';
import { ReactFlow, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ICONS from '../../icons/iconMap';
import SystemNode from './SystemNode';

/**
 * SystemMap — React Flow architecture diagram (persistent left panel).
 *
 * 7 nodes representing system components, 8 edges showing data flow.
 * Accepts activeChapter to highlight relevant nodes/edges.
 * Accepts onNodeClick to scroll the right panel to the matching chapter.
 *
 * All interactivity (drag, zoom, pan) is disabled — this is a read-only
 * spatial anchor, not an editor. preventScrolling=false lets native
 * scroll pass through so the right panel can scroll normally.
 */

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
  { id: 'buyer',      position: { x: 0,   y: 0   }, data: { label: 'Buyer Portal',      subtitle: 'Submissions',   icon: ICONS.user } },
  { id: 'admin',      position: { x: 260, y: 0   }, data: { label: 'Admin Portal',      subtitle: '14 pages',      icon: ICONS.dashboard } },
  { id: 'api',        position: { x: 130, y: 110 }, data: { label: 'Vercel API',        subtitle: '8 endpoints',   icon: ICONS.zap } },
  { id: 'neon',       position: { x: 0,   y: 220 }, data: { label: 'Neon Database',     subtitle: '9 tables',      icon: ICONS.database } },
  { id: 'filemaker',  position: { x: 260, y: 220 }, data: { label: 'FileMaker',         subtitle: 'Master records', icon: ICONS.sync } },
  { id: 'compliance', position: { x: 0,   y: 330 }, data: { label: 'Compliance Engine', subtitle: 'Hourly check',  icon: ICONS.shieldCheck } },
  { id: 'resend',     position: { x: 260, y: 330 }, data: { label: 'Resend Email',      subtitle: 'Notices',       icon: ICONS.batchEmail } },
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
      labelStyle: { fontSize: 11, fill: '#8c8c8c', fontWeight: 600 },
      labelBgStyle: { fill: '#f4f6f5', fillOpacity: 0.85 },
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
  );
}
