import { useState } from 'react';
import ICONS from '../../icons/iconMap';
import { AppIcon } from '../ui';
import { MacOSWindow } from '../bridge';
import ChapterHeader from './ChapterHeader';

/**
 * FileExplorer — Chapter 2: "What's Inside"
 *
 * Interactive file tree wrapped in the MacOS 9 window chrome.
 * Features: expand/collapse folders, search filter, color-coded domain icons,
 * and a detail popover when clicking a file.
 */

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
        subtitle="Where things actually live in the codebase"
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
