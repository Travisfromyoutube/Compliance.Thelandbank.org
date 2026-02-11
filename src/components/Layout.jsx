import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AppIcon } from './ui';
import ICONS from '../icons/iconMap';

const CORE_NAV = [
  { label: 'Dashboard',     icon: ICONS.dashboard,     path: '/' },
  { label: 'Action Queue',  icon: ICONS.actionQueue,   path: '/action-queue' },
  { label: 'Properties',    icon: ICONS.properties,    path: '/properties' },
  { label: 'Milestones',    icon: ICONS.milestones,    path: '/milestones' },
  { label: 'Compliance',    icon: ICONS.compliance,    path: '/compliance' },
  { label: 'Communication', icon: ICONS.communication, path: '/communications' },
  { label: 'Reports',       icon: ICONS.reports,       path: '/reports' },
  { label: 'Compliance Map', icon: ICONS.mapPin,       path: '/map' },
  { label: 'Audit Trail',   icon: ICONS.auditTrail,    path: '/audit' },
];

const UTIL_NAV = [
  { label: 'Settings',    icon: ICONS.settings,   path: '/settings' },
  { label: 'Batch Email', icon: ICONS.batchEmail, path: '/batch-email' },
  { label: 'Templates',   icon: ICONS.file,       path: '/templates' },
];

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-2.5 md:py-2 text-sm rounded-md transition-colors border-l-2',
          isActive
            ? 'bg-white/8 text-white font-medium border-accent'
            : 'text-blue-200/70 hover:bg-white/6 hover:text-blue-100 border-transparent',
        ].join(' ')
      }
    >
      <AppIcon icon={item.icon} size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function Sidebar({ onNavClick }) {
  return (
    <aside className="w-60 sidebar-bg text-white flex flex-col flex-shrink-0 h-full">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="font-heading text-lg font-bold tracking-tight text-white">GCLBA</h1>
        <p className="text-[11px] font-mono text-blue-200/60 mt-0.5 font-medium tracking-widest uppercase">
          Compliance Portal
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {CORE_NAV.map((item) => (
            <NavItem key={item.path} item={item} onClick={onNavClick} />
          ))}
        </div>

        <div className="h-px bg-white/8 my-3" />

        <div className="space-y-1">
          {UTIL_NAV.map((item) => (
            <NavItem key={item.path} item={item} onClick={onNavClick} />
          ))}
        </div>
      </nav>

      <div className="px-3 pb-2">
        <a
          href="/submit"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavClick}
          className="flex items-center gap-3 px-4 py-2.5 md:py-2 text-sm text-blue-200/70 hover:bg-white/6 hover:text-blue-100 rounded-md transition-colors border-l-2 border-transparent"
        >
          <AppIcon icon={ICONS.buyerPortal} size={18} />
          <span>Buyer Portal</span>
        </a>
      </div>

      <div className="px-5 py-4 border-t border-white/10">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider uppercase bg-white/10 text-blue-200/80">
          Prototype
        </span>
        <p className="text-[10px] font-mono text-blue-200/40 mt-1.5 tracking-wide">v1.0.0</p>
      </div>
    </aside>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Auto-close sidebar when resizing above md breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — always visible at md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 md:hidden sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-60 md:hidden sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto app-bg">
        {/* Mobile top bar — shown only below md */}
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
          {/* Spacer for centering */}
          <div className="w-10" />
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
