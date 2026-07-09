import React from 'react';
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
  AlertTriangle, 
  ShieldAlert, 
  Terminal,
  LogOut
} from 'lucide-react';

export function Sidebar({ 
  page, 
  setPage, 
  adminMode, 
  setAdminMode, 
  adminPage, 
  setAdminPage 
}) {
  const customerLinks = [
    { id: 'brief', label: "Today's Brief", icon: BookOpen },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'projects', label: 'Projects', icon: Building },
    { id: 'localities', label: 'Localities', icon: MapPin },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'archive', label: 'Brief Archive', icon: Archive },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const adminLinks = [
    { id: 'overview', label: 'Overview', icon: Terminal },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'runs', label: 'System Runs', icon: Clock },
    { id: 'performance', label: 'Performance', icon: Cpu },
    { id: 'errors', label: 'Errors & Health', icon: ShieldAlert }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
          RE
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white leading-none">Antigravity</h1>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Market Engine</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {adminMode ? (
          <>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Admin Console
            </div>
            {adminLinks.map(link => {
              const Icon = link.icon;
              const isActive = adminPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setAdminPage(link.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </button>
              );
            })}
          </>
        ) : (
          <>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Broker Intelligence
            </div>
            {customerLinks.map(link => {
              const Icon = link.icon;
              const isActive = page === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setPage(link.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Switch Mode Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {adminMode ? (
          <button
            onClick={() => setAdminMode(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Morning Brief
          </button>
        ) : (
          <button
            onClick={() => setAdminMode(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-300 rounded-lg text-xs font-semibold transition-all border border-slate-800 hover:border-slate-700"
          >
            <Cpu className="w-3.5 h-3.5" />
            Developer Admin Console
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
