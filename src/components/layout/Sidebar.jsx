import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, TrendingUp, Building, MapPin, Star,
  Archive, Settings, Cpu, Activity, Clock,
  ShieldAlert, Terminal, LogOut,
} from 'lucide-react';

// ─── Customer navigation links ───────────────────────────────────────────────
const CUSTOMER_LINKS = [
  { id: 'brief',      label: "Today's Brief",  icon: BookOpen,    title: 'Morning Intelligence Brief' },
  { id: 'market',     label: 'Market',          icon: TrendingUp,  title: 'Market Intelligence' },
  { id: 'projects',   label: 'Projects',        icon: Building,    title: 'Projects Directory' },
  { id: 'localities', label: 'Localities',      icon: MapPin,      title: 'Localities Directory' },
  { id: 'watchlist',  label: 'Watchlist',       icon: Star,        title: 'Tracked Localities' },
  { id: 'archive',    label: 'Brief Archive',   icon: Archive,     title: 'Historical Briefs' },
  { id: 'settings',   label: 'Settings',        icon: Settings,    title: 'Settings' },
];

const ADMIN_LINKS = [
  { id: 'overview',      label: 'Overview',         icon: Terminal,    title: 'System Overview' },
  { id: 'observability', label: 'Observability',    icon: Activity,    title: 'Observability' },
  { id: 'runs',          label: 'System Runs',      icon: Clock,       title: 'System Runs' },
  { id: 'performance',   label: 'Performance',      icon: Cpu,         title: 'Performance' },
  { id: 'errors',        label: 'Errors & Health',  icon: ShieldAlert, title: 'Errors & Health' },
];

// ─── Single nav item ─────────────────────────────────────────────────────────
function NavItem({ link, isActive, accentActive, onClick }) {
  const Icon = link.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(link.id)}
      title={link.title}
      aria-current={isActive ? 'page' : undefined}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
        isActive
          ? accentActive
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-400"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon
        className={`w-4 h-4 shrink-0 transition-colors ${
          isActive ? '' : 'group-hover:text-slate-300'
        }`}
        aria-hidden="true"
      />
      <span className="truncate">{link.label}</span>
    </motion.button>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ page, setPage, adminMode, setAdminMode, adminPage, setAdminPage }) {
  const links      = adminMode ? ADMIN_LINKS    : CUSTOMER_LINKS;
  const activePage = adminMode ? adminPage      : page;
  const setActive  = adminMode ? setAdminPage   : setPage;

  const accentActive = adminMode
    ? 'bg-amber-500/10 text-amber-300 pl-4'
    : 'bg-blue-500/10 text-blue-300 pl-4';

  return (
    <aside
      className="w-60 bg-slate-950 text-slate-100 flex flex-col min-h-screen border-r border-slate-800/60 shrink-0"
      role="navigation"
      aria-label={adminMode ? 'Admin navigation' : 'Main navigation'}
    >
      {/* ── Brand ── */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[11px] font-black text-white shadow-md shadow-blue-600/30 shrink-0">
            RE
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-none">Antigravity</div>
            <div className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">
              Market Engine
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav section label ── */}
      <div className="px-5 pt-5 pb-1.5">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
          {adminMode ? 'Admin Console' : 'Broker Intelligence'}
        </span>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 px-3 space-y-0.5 pb-4">
        {links.map(link => (
          <NavItem
            key={link.id}
            link={link}
            isActive={activePage === link.id}
            accentActive={accentActive}
            onClick={setActive}
          />
        ))}
      </nav>

      {/* ── Mode switch footer ── */}
      <div className="p-4 border-t border-slate-800/60 space-y-2">
        {adminMode ? (
          <button
            onClick={() => setAdminMode(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Switch back to broker dashboard"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Morning Brief
          </button>
        ) : (
          <button
            onClick={() => setAdminMode(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-white/5 text-slate-600 hover:text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-800 hover:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open admin console"
          >
            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
            Admin Console
          </button>
        )}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/30 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
