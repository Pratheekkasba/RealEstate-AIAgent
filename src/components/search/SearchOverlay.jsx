import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Clock, Building, MapPin, Zap, Landmark,
  BookOpen, FileText, ArrowRight, CornerDownLeft, Hash,
  ChevronUp, ChevronDown, Command,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────
const RECENTS_KEY = 're_search_recents';
const MAX_RECENTS = 6;

// ─── Category Config ────────────────────────────────────────────────────────────
const CATEGORIES = {
  localities:     { label: 'Localities',         icon: MapPin,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
  projects:       { label: 'Projects',            icon: Building,  color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  builders:       { label: 'Builders',            icon: Hash,      color: 'text-violet-600',  bg: 'bg-violet-50'  },
  infrastructure: { label: 'Infrastructure',      icon: Zap,       color: 'text-amber-600',   bg: 'bg-amber-50'   },
  policies:       { label: 'Policies & News',     icon: Landmark,  color: 'text-purple-600',  bg: 'bg-purple-50'  },
  reports:        { label: 'Reports',             icon: FileText,  color: 'text-slate-600',   bg: 'bg-slate-100'  },
};

// ─── Text Highlight ─────────────────────────────────────────────────────────────
function Highlight({ text = '', query = '' }) {
  if (!query.trim() || !text) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-blue-100 text-blue-900 rounded-sm px-0.5 not-italic font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ─── Recent searches helper ─────────────────────────────────────────────────────
function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); }
  catch { return []; }
}
function saveRecent(term) {
  if (!term.trim()) return;
  const existing = loadRecents().filter(r => r.toLowerCase() !== term.toLowerCase());
  const updated  = [term, ...existing].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
}
function removeRecent(term) {
  const updated = loadRecents().filter(r => r !== term);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
}

// ─── Build flat result list from briefData ──────────────────────────────────────
function buildResults(data, query) {
  const q   = query.toLowerCase().trim();
  const all = [];

  if (!q) return all;

  const has = (str) => (str || '').toLowerCase().includes(q);

  // Localities (from projects + infra)
  const localSet = new Set();
  (data.projects || []).forEach(p => { if (p.locality) localSet.add(p.locality); });
  (data.infrastructure || []).forEach(i => (i.affectedAreas || []).forEach(a => localSet.add(a)));
  Array.from(localSet).filter(l => has(l)).forEach(loc => {
    all.push({
      category: 'localities',
      id: `loc::${loc}`,
      primary: loc,
      secondary: 'Locality',
      action: { type: 'locality', value: loc },
    });
  });

  // Projects
  (data.projects || []).forEach(p => {
    if (has(p.projectName) || has(p.builder) || has(p.locality)) {
      all.push({
        category: 'projects',
        id: `proj::${p.projectName}`,
        primary: p.projectName,
        secondary: `${p.builder || 'Unknown'} · ${p.locality}`,
        meta: p.startingPrice || p.pricePerSqFt || '',
        action: { type: 'page', value: 'projects' },
      });
    }
  });

  // Builders (deduplicated)
  const builderSet = new Set();
  (data.projects || []).forEach(p => {
    if (p.builder && has(p.builder) && !builderSet.has(p.builder)) {
      builderSet.add(p.builder);
      const count = (data.projects || []).filter(x => x.builder === p.builder).length;
      all.push({
        category: 'builders',
        id: `builder::${p.builder}`,
        primary: p.builder,
        secondary: `${count} project${count !== 1 ? 's' : ''} listed`,
        action: { type: 'page', value: 'projects' },
      });
    }
  });

  // Infrastructure
  (data.infrastructure || []).forEach(i => {
    if (has(i.title) || has(i.authority) || (i.affectedAreas || []).some(has)) {
      all.push({
        category: 'infrastructure',
        id: `infra::${i.title}`,
        primary: i.title,
        secondary: (i.affectedAreas || []).join(', ') || i.authority || '',
        meta: i.status || '',
        action: { type: 'locality', value: (i.affectedAreas || [])[0] || '' },
      });
    }
  });

  // Policies & News
  (data.market || []).forEach(m => {
    if (has(m.headline) || has(m.summary) || has(m.category)) {
      all.push({
        category: 'policies',
        id: `policy::${m.headline}`,
        primary: m.headline,
        secondary: m.category || '',
        meta: m.impact || '',
        action: { type: 'page', value: 'market' },
      });
    }
  });

  // Reports (insights)
  (data.insights || []).forEach((ins, i) => {
    if (has(ins.description) || has(ins.category)) {
      all.push({
        category: 'reports',
        id: `insight::${i}`,
        primary: ins.description?.slice(0, 60) || 'AI Insight',
        secondary: ins.category || 'Insight',
        action: { type: 'page', value: 'daily-brief' },
      });
    }
  });

  return all;
}

// ─── Group results by category (preserving declaration order) ──────────────────
function groupResults(results) {
  const groups = {};
  const order  = Object.keys(CATEGORIES);
  results.forEach(r => {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  });
  return order.filter(k => groups[k]?.length).map(k => ({ key: k, items: groups[k].slice(0, 5) }));
}

// ─── Single Result Row ──────────────────────────────────────────────────────────
function ResultRow({ result, query, isActive, onClick, onMouseEnter }) {
  const cfg  = CATEGORIES[result.category];
  const Icon = cfg.icon;
  const ref  = useRef(null);

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isActive]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
        isActive
          ? 'bg-blue-50 ring-1 ring-blue-200/60'
          : 'hover:bg-slate-50'
      }`}
    >
      {/* Category icon chip */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">
          <Highlight text={result.primary} query={query} />
        </div>
        {result.secondary && (
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            <Highlight text={result.secondary} query={query} />
          </div>
        )}
      </div>

      {/* Meta */}
      {result.meta && (
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
          {result.meta}
        </span>
      )}

      {/* Arrow */}
      <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-all ${
        isActive ? 'text-blue-500 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'
      }`} />
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
/**
 * @param {object} props
 * @param {boolean}  props.open
 * @param {Function} props.onClose
 * @param {object}   props.data          — briefData from Firestore
 * @param {Function} props.setPage
 * @param {Function} props.setSelectedLocality
 */
export function SearchOverlay({ open, onClose, data = {}, setPage, setSelectedLocality }) {
  const [query,   setQuery]   = useState('');
  const [active,  setActive]  = useState(0);  // flat index across all visible results
  const [recents, setRecents] = useState(loadRecents);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery('');
      setActive(0);
    }
  }, [open]);

  // Refresh recents whenever overlay opens
  useEffect(() => {
    if (open) setRecents(loadRecents());
  }, [open]);

  const results = useMemo(() => buildResults(data, query), [data, query]);
  const groups  = useMemo(() => groupResults(results), [results]);

  // Build a flat navigable list
  const flatList = useMemo(() => groups.flatMap(g => g.items), [groups]);

  // Clamp active index
  useEffect(() => {
    setActive(prev => Math.min(prev, Math.max(0, flatList.length - 1)));
  }, [flatList.length]);

  // ── Navigate ──────────────────────────────────────────────────────────────────
  const executeResult = useCallback((result) => {
    saveRecent(query.trim() || result.primary);
    setRecents(loadRecents());

    if (result.action.type === 'locality') {
      setSelectedLocality(result.action.value);
      setPage('localities');
    } else {
      setPage(result.action.value);
    }
    onClose();
  }, [query, setPage, setSelectedLocality, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') { onClose(); return; }

    if (flatList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatList[active]) executeResult(flatList[active]);
    }
  }, [open, flatList, active, executeResult, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setActive(0);
  };

  const clearRecent = (term, e) => {
    e.stopPropagation();
    removeRecent(term);
    setRecents(loadRecents());
  };

  // Compute flat index of an item for active tracking
  let flatIdx = 0;
  const getFlatIdx = () => flatIdx++;

  const showRecents = !query.trim() && recents.length > 0;
  const showEmpty   = query.trim() && results.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50"
          />

          {/* ── Dialog ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden">

              {/* ── Input Bar ── */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search projects, builders, localities, policies…"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button onClick={() => { setQuery(''); setActive(0); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                  ESC
                </kbd>
              </div>

              {/* ── Body ── */}
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain">

                {/* ── Recent Searches ── */}
                {showRecents && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Searches</span>
                      <button
                        onClick={() => { localStorage.removeItem(RECENTS_KEY); setRecents([]); }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recents.map(term => (
                        <div
                          key={term}
                          className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 rounded-xl cursor-pointer transition-all"
                          onClick={() => { setQuery(term); setActive(0); }}
                        >
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-600">{term}</span>
                          <button
                            onClick={(e) => clearRecent(term, e)}
                            className="text-slate-300 hover:text-slate-500 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Grouped Results ── */}
                {!showRecents && !showEmpty && groups.map(({ key, items }) => {
                  const cfg  = CATEGORIES[key];
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className="px-2 pt-3 pb-1">
                      {/* Group header */}
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <Icon className={`w-3 h-3 ${cfg.color}`} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {cfg.label}
                        </span>
                        <span className="text-[9px] text-slate-300 font-semibold">· {items.length}</span>
                      </div>

                      {items.map(result => {
                        const fi = getFlatIdx();
                        return (
                          <ResultRow
                            key={result.id}
                            result={result}
                            query={query}
                            isActive={fi === active}
                            onClick={() => executeResult(result)}
                            onMouseEnter={() => setActive(fi)}
                          />
                        );
                      })}
                    </div>
                  );
                })}

                {/* ── Empty State ── */}
                {showEmpty && (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No results for <span className="text-slate-800">"{query}"</span></p>
                    <p className="text-xs text-slate-400 mt-1">Try searching for a project name, builder, or locality.</p>
                  </div>
                )}

                {/* ── Default State ── */}
                {!query && !showRecents && (
                  <div className="py-10 text-center text-slate-400">
                    <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium">Start typing to search</p>
                    <p className="text-xs mt-1">Projects · Builders · Localities · Policies · Reports</p>
                  </div>
                )}
              </div>

              {/* ── Footer: keyboard hints ── */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                {[
                  { keys: ['↑', '↓'], label: 'Navigate' },
                  { keys: ['↵'],       label: 'Select'   },
                  { keys: ['Esc'],     label: 'Close'    },
                ].map(({ keys, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {keys.map(k => (
                        <kbd key={k} className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded-md">
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                  </div>
                ))}
                <div className="ml-auto text-[10px] text-slate-400 font-medium">
                  {results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SearchOverlay;
