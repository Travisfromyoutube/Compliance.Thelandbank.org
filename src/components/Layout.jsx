import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppIcon } from './ui';
import ICONS from '../icons/iconMap';
import { useProperties } from '../context/PropertyContext';

/* ── Clerk user button (lazy - only bundled when key is set) ── */
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const ClerkUserButton = CLERK_KEY
  ? lazy(() => import('@clerk/clerk-react').then((m) => ({ default: m.UserButton })))
  : null;

/* ══════════════════════════════════════════════════
   Navigation Structure - grouped by mental model
   ══════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  {
    id: 'howItWorks',
    label: 'How it Works',
    icon: ICONS.bookOpen,
    collapsible: true,
    items: [
      { label: 'Data Integration & Security',  icon: ICONS.database, path: '/bridge' },
      { label: 'How to Use the Portal',         icon: ICONS.clipboardList, path: '/how-to-use' },
    ],
  },
  {
    id: 'overview',
    label: 'Overview',
    icon: ICONS.overview,
    collapsible: true,
    items: [
      { label: 'Dashboard',      icon: ICONS.dashboard,   path: '/',     shortcut: 'D' },
      { label: 'Compliance Map',  icon: ICONS.mapPin,      path: '/map',  shortcut: 'M' },
      { label: 'Reports',         icon: ICONS.reports,     path: '/reports' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: ICONS.enforcement,
    collapsible: false,
    items: [
      { label: 'Action Queue',   icon: ICONS.actionQueue,   path: '/action-queue', badge: 'needsAction', shortcut: 'Q' },
      { label: 'Properties',     icon: ICONS.properties,    path: '/properties', shortcut: 'P' },
      { label: 'Milestones',     icon: ICONS.milestones,    path: '/milestones' },
      { label: 'Compliance',     icon: ICONS.compliance,    path: '/compliance', badge: 'pendingSubmissions' },
      { label: 'Audit Trail',    icon: ICONS.auditTrail,    path: '/audit' },
    ],
  },
  {
    id: 'outreach',
    label: 'Outreach',
    icon: ICONS.outreach,
    collapsible: false,
    items: [
      { label: 'Communication',  icon: ICONS.communication, path: '/communications', shortcut: 'C' },
      { label: 'Templates',      icon: ICONS.file,          path: '/templates' },
    ],
  },
];

/* ── Single nav link ──────────────────────────── */

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'group flex items-center gap-2.5 pl-9 pr-3 py-[7px] text-[13px] rounded-md transition-all duration-150',
          isActive
            ? 'bg-white/10 text-white font-medium shadow-[inset_2px_0_0_0_theme(colors.accent.DEFAULT)]'
            : 'text-blue-200/60 font-medium hover:bg-white/[0.05] hover:text-blue-100',
        ].join(' ')
      }
    >
      <AppIcon icon={item.icon} size={15} />
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <kbd className="hidden lg:inline text-[9px] font-mono text-blue-200/30 bg-white/[0.04] px-1.5 py-0.5 rounded leading-none">
          Alt+{item.shortcut}
        </kbd>
      )}
    </NavLink>
  );
}

/* ── Nav item with live badge ────────────────── */

function NavItemWithBadge({ item, onClick, badgeCount }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'group flex items-center gap-2.5 pl-9 pr-3 py-[7px] text-[13px] rounded-md transition-all duration-150',
          isActive
            ? 'bg-white/10 text-white font-medium shadow-[inset_2px_0_0_0_theme(colors.accent.DEFAULT)]'
            : 'text-blue-200/60 font-medium hover:bg-white/[0.05] hover:text-blue-100',
        ].join(' ')
      }
    >
      <AppIcon icon={item.icon} size={15} />
      <span className="flex-1">{item.label}</span>
      {badgeCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-[10px] font-mono font-medium text-center leading-none">
          {badgeCount}
        </span>
      )}
    </NavLink>
  );
}

/* ── Section header (shared by both types) ────── */

function SectionHeader({ section, isOpen, hasActiveChild, onClick }) {
  const isCollapsible = section.collapsible;

  const Tag = isCollapsible ? 'button' : 'div';
  const extraProps = isCollapsible ? { onClick } : {};

  return (
    <Tag
      {...extraProps}
      className={[
        'w-full flex items-center gap-2 px-3 py-2 text-[12px] font-label font-semibold tracking-[0.08em] uppercase rounded-md transition-colors duration-150',
        isCollapsible ? 'cursor-pointer' : 'cursor-default',
        hasActiveChild
          ? 'text-accent bg-white/[0.06]'
          : 'text-blue-200/50',
        isCollapsible && !hasActiveChild ? 'hover:text-blue-200/70 hover:bg-white/[0.04]' : '',
      ].join(' ')}
    >
      <AppIcon icon={section.icon} size={15} />
      <span className="flex-1 text-left">{section.label}</span>
      {isCollapsible && (
        <span
          className={[
            'transition-transform duration-200 opacity-50',
            isOpen ? 'rotate-0' : '-rotate-90',
          ].join(' ')}
        >
          <AppIcon icon={ICONS.chevronDown} size={13} />
        </span>
      )}
    </Tag>
  );
}

/* ── Nav section (handles both collapsible + static) */

function NavSection({ section, openSections, toggleSection, onNavClick, badgeCounts }) {
  const location = useLocation();
  const isCollapsible = section.collapsible;
  const isOpen = !isCollapsible || openSections.includes(section.id);
  const hasActiveChild = section.items.some(
    (item) => item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
  );

  const renderItem = (item) => {
    if (item.badge && badgeCounts?.[item.badge] !== undefined) {
      return (
        <NavItemWithBadge
          key={item.label}
          item={item}
          onClick={onNavClick}
          badgeCount={badgeCounts[item.badge]}
        />
      );
    }
    return <NavItem key={item.path} item={item} onClick={onNavClick} />;
  };

  return (
    <div>
      <SectionHeader
        section={section}
        isOpen={isOpen}
        hasActiveChild={hasActiveChild}
        onClick={() => isCollapsible && toggleSection(section.id)}
      />

      {isCollapsible ? (
        /* Animated collapse for Overview */
        <div
          className={[
            'overflow-hidden transition-all duration-200 ease-out',
            isOpen ? 'max-h-[500px] opacity-100 mt-0.5' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <div className="space-y-px pb-1">
            {section.items.map(renderItem)}
          </div>
        </div>
      ) : (
        /* Always visible for Compliance & Outreach */
        <div className="space-y-px mt-0.5 pb-1">
          {section.items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

/* ── FileMaker sync status ───────────────────── */

function FileMakerSyncStatus() {
  const [fmStatus, setFmStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    let intervalId = null;
    async function check() {
      try {
        const res = await fetch('/api/filemaker?action=status');
        const data = await res.json();
        if (mounted) {
          setFmStatus(data);
          // Only start polling if FileMaker is actually configured
          if (data.configured && !intervalId && mounted) {
            intervalId = setInterval(check, 5 * 60 * 1000);
          }
        }
      } catch {
        if (mounted) setFmStatus({ connected: false, configured: false });
      }
    }
    check();
    return () => { mounted = false; if (intervalId) clearInterval(intervalId); };
  }, []);

  const connected = fmStatus?.connected;
  const configured = fmStatus?.configured;

  return (
    <div className="px-2.5 pb-2">
      <Link
        to="/bridge"
        className="block px-3 py-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <AppIcon icon={ICONS.database} size={13} className="text-blue-200/60" />
          <span className="text-[11px] font-label font-semibold tracking-[0.06em] uppercase text-blue-200/50">
            FileMaker Bridge
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/60 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-accent' : configured ? 'bg-warning' : 'bg-blue-200/30'}`} />
          </span>
          <span className={`text-[10px] font-medium ${connected ? 'text-accent-light' : 'text-blue-200/40'}`}>
            {fmStatus === null ? 'Checking...' : connected ? 'Connected' : configured ? 'Disconnected' : 'Awaiting setup'}
          </span>
          <span className="text-[10px] text-blue-200/30 ml-auto font-mono">
            {connected ? 'Bidirectional' : ''}
          </span>
        </div>
        {connected && fmStatus.sync && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AppIcon icon={ICONS.sync} size={10} className="text-blue-200/30" />
            <span className="text-[9px] text-blue-200/30 font-mono">
              {fmStatus.sync.inSync
                ? `${fmStatus.sync.fmRecords} records in sync`
                : `${fmStatus.sync.delta} records behind`}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}

/* ── Batch Mail nudge widget ──────────────────── */

function BatchMailNudge() {
  return (
    <div className="px-2.5 pb-2">
      <Link
        to="/batch-email"
        className="group block px-3 py-2.5 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-accent/30 transition-all duration-150"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0 w-7 h-7 rounded bg-accent/15 flex items-center justify-center">
            <AppIcon icon={ICONS.batchEmail} size={14} className="text-accent-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white leading-tight">
              Batch Mail
            </p>
            <p className="text-[10px] text-blue-200/40 mt-0.5 group-hover:text-blue-200/60 transition-colors">
              Send compliance emails →
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Sidebar chrome ──────────────────────────── */

function Sidebar({ onNavClick }) {
  const location = useLocation();
  const { properties, pendingSubmissions } = useProperties();

  const badgeCounts = useMemo(() => ({
    needsAction: properties.filter((p) => p.enforcementLevel > 0).length,
    pendingSubmissions: pendingSubmissions || 0,
  }), [properties, pendingSubmissions]);

  // Only collapsible sections need open/close state
  const getActiveSections = () =>
    NAV_SECTIONS
      .filter((s) => s.collapsible)
      .filter((s) =>
        s.items.some((item) =>
          item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
        )
      )
      .map((s) => s.id);

  const [openSections, setOpenSections] = useState(getActiveSections);

  useEffect(() => {
    const active = getActiveSections();
    setOpenSections((prev) => {
      const merged = new Set([...prev, ...active]);
      return [...merged];
    });
  }, [location.pathname]);

  const toggleSection = (id) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <aside className="w-[232px] sidebar-bg text-white flex flex-col flex-shrink-0 h-full">
      {/* ── Brand ────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-baseline gap-2">
          <h1 className="font-heading text-[17px] font-bold tracking-tight text-white leading-none">
            GCLBA
          </h1>
          <span className="text-[10px] font-mono text-blue-200/40 tracking-widest uppercase leading-none">
            v1.1
          </span>
        </div>
        <p className="text-[10px] font-label text-blue-200/50 mt-1 tracking-[0.15em] uppercase">
          Compliance Portal
        </p>
      </div>

      {/* ── Navigation ───────────────────────── */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto scrollbar-thin space-y-2">
        {NAV_SECTIONS.map((section) => (
          <NavSection
            key={section.id}
            section={section}
            openSections={openSections}
            toggleSection={toggleSection}
            onNavClick={onNavClick}
            badgeCounts={badgeCounts}
          />
        ))}
      </nav>

      {/* ── Batch Mail nudge ──────────────────── */}
      <BatchMailNudge />

      {/* ── FileMaker sync status ───────────── */}
      <FileMakerSyncStatus />

      {/* ── Footer ───────────────────────────── */}
      <div className="px-2.5 pb-1.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-md transition-colors duration-150',
              isActive
                ? 'bg-white/10 text-white font-medium'
                : 'text-blue-200/50 hover:bg-white/[0.05] hover:text-blue-100',
            ].join(' ')
          }
        >
          <AppIcon icon={ICONS.settings} size={15} />
          <span>Settings</span>
        </NavLink>
      </div>

      <div className="px-2.5 pb-3">
        <a
          href="/submit"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavClick}
          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-blue-200/50 hover:bg-white/[0.05] hover:text-blue-100 rounded-md transition-colors duration-150"
        >
          <AppIcon icon={ICONS.buyerPortal} size={15} />
          <span>Buyer Portal</span>
          <AppIcon icon={ICONS.arrowRight} size={11} />
        </a>
      </div>

      {/* ── Clerk user button (when auth is enabled) ── */}
      {ClerkUserButton && (
        <div className="px-4 pb-3 flex items-center gap-2.5 border-t border-white/[0.06] pt-3">
          <Suspense fallback={null}>
            <ClerkUserButton
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7',
                  userButtonPopoverCard: 'shadow-lg',
                },
              }}
            />
          </Suspense>
          <span className="text-[12px] text-blue-200/60 truncate">Staff Account</span>
        </div>
      )}

    </aside>
  );
}

/* ══════════════════════════════════════════════════
   Layout Shell
   ══════════════════════════════════════════════════ */

/* ── Keyboard shortcut map ───────────────────── */
const SHORTCUT_MAP = {};
NAV_SECTIONS.forEach((s) =>
  s.items.forEach((item) => {
    if (item.shortcut) SHORTCUT_MAP[item.shortcut.toLowerCase()] = item.path;
  })
);

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ── Keyboard shortcuts (Alt+key) ────────── */
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const path = SHORTCUT_MAP[e.key.toLowerCase()];
      if (path) {
        e.preventDefault();
        navigate(path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 md:hidden sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[232px] md:hidden sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto app-bg">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 md:hidden sidebar-bg px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-white hover:bg-white/10 active:bg-white/15 transition-colors"
            aria-label="Open navigation"
          >
            <AppIcon icon={ICONS.menu} size={22} />
          </button>
          <div className="text-center">
            <h1 className="font-heading text-sm font-bold text-white tracking-tight">GCLBA</h1>
            <p className="text-[9px] font-label text-blue-200/60 tracking-widest uppercase">
              Compliance Portal
            </p>
          </div>
          <div className="w-10" />
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
