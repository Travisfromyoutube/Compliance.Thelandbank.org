import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { AppIcon } from './ui';
import ICONS from '../icons/iconMap';
import { useProperties } from '../context/PropertyContext';

/* ══════════════════════════════════════════════════
   Navigation Structure — grouped by mental model
   ══════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: ICONS.overview,
    collapsible: true,
    items: [
      { label: 'Dashboard',      icon: ICONS.dashboard,   path: '/' },
      { label: 'Compliance Map',  icon: ICONS.mapPin,      path: '/map' },
      { label: 'Reports',         icon: ICONS.reports,     path: '/reports' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: ICONS.enforcement,
    collapsible: false,
    items: [
      { label: 'Action Queue',   icon: ICONS.actionQueue,   path: '/action-queue', badge: 'needsAction' },
      { label: 'Properties',     icon: ICONS.properties,    path: '/properties' },
      { label: 'Milestones',     icon: ICONS.milestones,    path: '/milestones' },
      { label: 'Compliance',     icon: ICONS.compliance,    path: '/compliance' },
      { label: 'Audit Trail',    icon: ICONS.auditTrail,    path: '/audit' },
    ],
  },
  {
    id: 'outreach',
    label: 'Outreach',
    icon: ICONS.outreach,
    collapsible: false,
    items: [
      { label: 'Communication',  icon: ICONS.communication, path: '/communications' },
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
            : 'text-blue-200/60 hover:bg-white/[0.05] hover:text-blue-100',
        ].join(' ')
      }
    >
      <AppIcon icon={item.icon} size={15} />
      <span className="truncate">{item.label}</span>
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
            : 'text-blue-200/60 hover:bg-white/[0.05] hover:text-blue-100',
        ].join(' ')
      }
    >
      <AppIcon icon={item.icon} size={15} />
      <span className="truncate flex-1">{item.label}</span>
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
        'w-full flex items-center gap-2 px-3 py-2 text-[12px] font-mono font-semibold tracking-[0.08em] uppercase rounded-md transition-colors duration-150',
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
  const { properties } = useProperties();

  const badgeCounts = useMemo(() => ({
    needsAction: properties.filter((p) => p.enforcementLevel > 0).length,
  }), [properties]);

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
        <p className="text-[10px] font-mono text-blue-200/50 mt-1 tracking-[0.15em] uppercase">
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

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-mono font-medium tracking-wider uppercase bg-accent/20 text-accent-light">
            Prototype
          </span>
        </div>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════
   Layout Shell
   ══════════════════════════════════════════════════ */

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
            <p className="text-[9px] font-mono text-blue-200/60 tracking-widest uppercase">
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
