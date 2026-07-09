import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, RefreshCw, ChevronDown, Check, X } from 'lucide-react';

export function TopNavigation({
  selectedCity,
  setSelectedCity,
  searchQuery,
  setSearchQuery,
  onTriggerRefresh,
  isRefreshing,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cities = ['Pune', 'Mumbai', 'Bangalore'];

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40"
      style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.04), 0 2px 8px 0 rgba(0,0,0,0.02)' }}
    >
      {/* Left: City + Date */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm border border-slate-200/70 transition-all"
          >
            <span className="text-sm">📍</span>
            <span>{selectedCity}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50"
              >
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => { setSelectedCity(city); setDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {city}
                    {selectedCity === city && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-5 hidden sm:inline tracking-wide">
          {todayStr}
        </span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm mx-6 relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search projects, builders, localities…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-sm transition-all outline-none placeholder:text-slate-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Refresh + Bell + Avatar */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onTriggerRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            isRefreshing
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </motion.button>

        <button className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
        </button>

        <div className="pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-sm">
            PB
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNavigation;
