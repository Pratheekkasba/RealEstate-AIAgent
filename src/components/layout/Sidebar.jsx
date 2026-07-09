import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  Building,
  MapPin,
  Star,
  Archive,
  Settings,
  Cpu,
  Activity,
  Clock,
  ShieldAlert,
  Terminal,
  LogOut,
} from 'lucide-react';

export function Sidebar({
  page,
  setPage,
  adminMode,
  setAdminMode,
  adminPage,
  setAdminPage,
}) {
  const customerLinks = [
    { id: 'brief',     label: "Today's Brief",  icon: BookOpen   },
    { id: 'market',    label: 'Market',          icon: TrendingUp },
    { id: 'projects',  label: 'Projects',        icon: Building   },
    { id: 'localities',label: 'Localities',      icon: MapPin     },
    { id: 'watchlist', label: 'Watchlist',       icon: Star       },
    { id: 'archive',   label: 'Brief Archive',   icon: Archive    },
    { id: 'settings',  label: 'Settings',        icon: Settings   },
  ];

  const adminLinks = [
    { id: 'overview',      label: 'Overview',       icon: Terminal    },
    { id: 'observability', label: 'Observability',  icon: Activity    },
    { id: 'runs',          label: 'System Runs',    icon: Clock       },
    { id: 'performance',   label: 'Performance',    icon: Cpu         },
    { id: 'errors',        label: 'Errors & Health',icon: ShieldAlert },
  ];

  const links     = adminMode ? adminLinks  : customerLinks;
  const activePage= adminMode ? adminPage   : page;
  const setActive = adminMode ? setAdminPage: setPage;
  const accentActive = adminMode
    ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500'
    : 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500';

  return (
    <aside className="w-60 bg-slate-950 text-slate-100 flex flex-col min-h-screen border-r border-slate-800/60 shrink-0">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[11px] font-black text-white shadow-md shadow-blue-600/30 shrink-0">
            RE
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-none">Antigravity</div>
            <div className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">Market Engine</div>
          </div>
        </div>
      </div>

      {/* Nav Section Label */}
      <div className="px-5 pt-5 pb-1.5">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
          {adminMode ? 'Admin Console' : 'Broker Intelligence'}
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-0.5 pb-4">
        {links.map((link) => {
          const Icon     = link.icon;
          const isActive = activePage === link.id;
          return (
            <motion.button
              key={link.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActive(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? accentActive
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? '' : 'group-hover:text-slate-300'}`} />
              <span className="truncate">{link.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Mode Switch Footer */}
      <div className="p-4 border-t border-slate-800/60">
        {adminMode ? (
          <button
            onClick={() => setAdminMode(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Morning Brief
          </button>
        ) : (
          <button
            onClick={() => setAdminMode(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-white/5 text-slate-600 hover:text-slate-400 rounded-lg text-xs font-bold transition-all border border-slate-800 hover:border-slate-700"
          >
            <Cpu className="w-3.5 h-3.5" />
            Admin Console
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
