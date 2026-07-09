import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, RefreshCw, ChevronDown, Check } from 'lucide-react';

export function TopNavigation({
  selectedCity,
  setSelectedCity,
  onOpenSearch,
  onTriggerRefresh,
  isRefreshing,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const cities = ['Pune', 'Mumbai', 'Bangalore'];

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // ── Close dropdown on Escape ────────────────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setDropdownOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dropdownOpen]);

  return (
    <header
      className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40"
      style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.04), 0 2px 8px 0 rgba(0,0,0,0.02)' }}
      role="banner"
    >
      {/* ── Left: City + Date ── */}
      <div className="flex items-center gap-5">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={`Selected city: ${selectedCity}. Click to change.`}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm border border-slate-200/70 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span aria-hidden="true">📍</span>
            <span>{selectedCity}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.ul
                role="listbox"
                aria-label="Select city"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/8 py-1 z-50 overflow-hidden"
              >
                {cities.map(city => (
                  <li key={city} role="option" aria-selected={selectedCity === city}>
                    <button
                      onClick={() => { setSelectedCity(city); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:bg-slate-50 focus-visible:outline-none"
                    >
                      {city}
                      {selectedCity === city && (
                        <Check className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <span className="text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-5 hidden sm:inline tracking-wide">
          {todayStr}
        </span>
      </div>

      {/* ── Centre: Search trigger ── */}
      <div className="flex-1 max-w-sm mx-6">
        <button
          onClick={onOpenSearch}
          aria-label="Open search (Ctrl+K or Cmd+K)"
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 rounded-xl text-sm text-slate-400 transition-all group focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left text-sm">Search projects, localities…</span>
          <div className="flex items-center gap-0.5 ml-auto" aria-hidden="true">
            <kbd className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              {isMac ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded-md">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* ── Right: Refresh + Bell + Avatar ── */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onTriggerRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? 'Refreshing data…' : 'Refresh market data'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isRefreshing
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200'
          }`}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
        </motion.button>

        <button
          className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Notifications (1 unread)"
          title="Notifications"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full badge-pop"
            aria-hidden="true"
          />
        </button>

        <div className="pl-2 border-l border-slate-200">
          <div
            className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-sm cursor-default select-none"
            role="img"
            aria-label="Logged in as broker"
            title="Broker account"
          >
            PB
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNavigation;
