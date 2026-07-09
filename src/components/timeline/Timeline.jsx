import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Building, Zap,
  FileText, Landmark, Star, RefreshCw, CheckCircle,
  ShieldCheck, AlertTriangle, Calendar, Info,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
/**
 * TimelineEvent shape:
 * {
 *   id?:        string | number,      — optional unique key
 *   date?:      string,               — ISO date or human label ("Today", "July 5")
 *   daysAgo?:   number,               — relative offset from today (0 = today)
 *   label:      string,               — primary event title
 *   sublabel?:  string,               — secondary detail line
 *   type?:      EventType,            — controls dot colour & icon
 *   badge?:     string,               — optional pill text shown right of dot
 *   icon?:      React.ComponentType,  — override icon (Lucide component)
 * }
 *
 * EventType (string):
 *   'price' | 'launch' | 'infra' | 'policy' | 'rera' |
 *   'brief' | 'insight' | 'update' | 'warning' | 'success' | 'default'
 */

// ─── Event Config ───────────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  price:   { dot: 'bg-blue-600',    icon: TrendingUp,    badge: 'Price Move',   badgeCls: 'bg-blue-50 text-blue-700 border-blue-100'    },
  launch:  { dot: 'bg-indigo-600',  icon: Building,      badge: 'New Launch',   badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  infra:   { dot: 'bg-amber-500',   icon: Zap,           badge: 'Infrastructure', badgeCls: 'bg-amber-50 text-amber-700 border-amber-100'  },
  policy:  { dot: 'bg-purple-600',  icon: Landmark,      badge: 'Policy',       badgeCls: 'bg-purple-50 text-purple-700 border-purple-100' },
  rera:    { dot: 'bg-emerald-600', icon: ShieldCheck,   badge: 'RERA',         badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  brief:   { dot: 'bg-slate-700',   icon: FileText,      badge: 'Brief',        badgeCls: 'bg-slate-100 text-slate-600 border-slate-200'   },
  insight: { dot: 'bg-violet-600',  icon: Star,          badge: 'Insight',      badgeCls: 'bg-violet-50 text-violet-700 border-violet-100' },
  update:  { dot: 'bg-slate-400',   icon: RefreshCw,     badge: 'Update',       badgeCls: 'bg-slate-100 text-slate-500 border-slate-200'   },
  warning: { dot: 'bg-red-500',     icon: AlertTriangle, badge: 'Warning',      badgeCls: 'bg-red-50 text-red-700 border-red-100'          },
  success: { dot: 'bg-emerald-500', icon: CheckCircle,   badge: 'Done',         badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  default: { dot: 'bg-slate-300',   icon: Info,          badge: '',             badgeCls: 'bg-slate-100 text-slate-500 border-slate-200'   },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function toDateLabel(event) {
  // Explicit label wins
  if (event.date && isNaN(Date.parse(event.date))) return event.date;

  const daysAgo = event.daysAgo ?? 0;
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7)   return `${daysAgo} days ago`;

  // Use ISO date if provided
  if (event.date) {
    return new Date(event.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    });
  }

  // Fallback relative
  if (daysAgo < 30)  return `${Math.floor(daysAgo / 7)}w ago`;
  return `${Math.floor(daysAgo / 30)}mo ago`;
}

function groupByDate(events) {
  const groups = new Map();
  events.forEach(ev => {
    const label = toDateLabel(ev);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(ev);
  });
  return Array.from(groups.entries()); // [[dateLabel, [events]], ...]
}

// ─── Single Event Row ──────────────────────────────────────────────────────────
function TimelineRow({ event, isLast }) {
  const cfg = EVENT_CONFIG[event.type || 'default'] || EVENT_CONFIG.default;
  const Icon = event.icon || cfg.icon;
  const badgeText = event.badge ?? cfg.badge;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative flex gap-4 group"
    >
      {/* Dot + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 ${cfg.dot} z-10 mt-1`} />
        {!isLast && (
          <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent mt-1.5 min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type icon */}
              <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.dot.replace('bg-', 'text-')}`} />
              <span className="text-sm font-bold text-slate-800 leading-snug">{event.label}</span>
            </div>
            {event.sublabel && (
              <p className="text-xs text-slate-500 leading-relaxed pl-5">{event.sublabel}</p>
            )}
          </div>

          {/* Badge */}
          {badgeText && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeCls}`}>
              {badgeText}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Date Group Header ─────────────────────────────────────────────────────────
function DateHeader({ label }) {
  const isToday     = label === 'Today';
  const isYesterday = label === 'Yesterday';

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
        isToday
          ? 'bg-blue-600 text-white'
          : isYesterday
          ? 'bg-slate-700 text-white'
          : 'bg-slate-100 text-slate-500'
      }`}>
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── Main Timeline Component ───────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {Array}   props.events          — array of TimelineEvent objects
 * @param {string}  [props.title]         — optional section title
 * @param {boolean} [props.grouped=true]  — group events under date headers
 * @param {boolean} [props.compact=false] — smaller padding / typography
 * @param {string}  [props.emptyMessage]  — shown when events is empty
 * @param {string}  [props.className]     — extra wrapper classes
 */
export function Timeline({
  events = [],
  title,
  grouped = true,
  compact = false,
  emptyMessage = 'No events recorded yet.',
  className = '',
}) {
  // Sort by daysAgo ascending (most recent first = 0, 1, 2…)
  const sorted = [...events].sort((a, b) => (a.daysAgo ?? 0) - (b.daysAgo ?? 0));

  if (sorted.length === 0) {
    return (
      <div className={`bg-white border border-slate-200/70 rounded-3xl p-6 ${className}`}>
        {title && <SectionTitle title={title} count={0} />}
        <div className={`py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl ${compact ? 'py-5' : ''}`}>
          <Calendar className="w-5 h-5 text-slate-300 mx-auto mb-2" />
          {emptyMessage}
        </div>
      </div>
    );
  }

  if (!grouped) {
    return (
      <div className={`bg-white border border-slate-200/70 rounded-3xl ${compact ? 'p-4' : 'p-6'} ${className}`}>
        {title && <SectionTitle title={title} count={sorted.length} />}
        <div className="pl-1">
          {sorted.map((ev, idx) => (
            <TimelineRow key={ev.id ?? idx} event={ev} isLast={idx === sorted.length - 1} />
          ))}
        </div>
      </div>
    );
  }

  // Grouped mode
  const groups = groupByDate(sorted);

  return (
    <div className={`bg-white border border-slate-200/70 rounded-3xl ${compact ? 'p-4' : 'p-6'} ${className}`}>
      {title && <SectionTitle title={title} count={sorted.length} />}
      <div className="space-y-2">
        {groups.map(([dateLabel, groupEvents], gIdx) => (
          <div key={dateLabel}>
            <DateHeader label={dateLabel} />
            <div className="pl-1">
              {groupEvents.map((ev, eIdx) => (
                <TimelineRow
                  key={ev.id ?? `${gIdx}-${eIdx}`}
                  event={ev}
                  isLast={eIdx === groupEvents.length - 1 && gIdx === groups.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, count }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      {count > 0 && (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {count} events
        </span>
      )}
    </div>
  );
}

// ─── Utility: Build timeline events from briefData ─────────────────────────────
/**
 * Derives a set of TimelineEvent objects from a raw briefData document.
 * Consumers can call this helper instead of mapping manually.
 *
 * @param {object} briefData
 * @param {string} [filterLocality]  — if provided, only events touching this locality
 * @returns {TimelineEvent[]}
 */
export function buildTimelineEvents(briefData = {}, filterLocality = '') {
  const { projects = [], market = [], infrastructure = [], insights = [] } = briefData;
  const fl = filterLocality.toLowerCase();
  const events = [];
  let id = 0;

  // Helper: check if an item is relevant to the filtered locality
  const relevant = (item) => {
    if (!fl) return true;
    return (
      (item.locality || '').toLowerCase() === fl ||
      (item.affectedAreas || []).some(a => a.toLowerCase() === fl) ||
      (item.headline || '').toLowerCase().includes(fl) ||
      (item.description || '').toLowerCase().includes(fl)
    );
  };

  projects.filter(relevant).forEach(p => {
    events.push({
      id: id++,
      daysAgo: 0,
      label: `${p.projectName} — pricing verified`,
      sublabel: `${p.builder} · ${p.locality} · ${p.pricePerSqFt || p.startingPrice || ''}`,
      type: 'price',
    });
    if (p.status === 'New Launch' || p.launchType === 'new') {
      events.push({
        id: id++,
        daysAgo: 2,
        label: `${p.projectName} launched`,
        sublabel: `Starting at ${p.startingPrice || '—'} · ${p.locality}`,
        type: 'launch',
      });
    }
    if (p.reraRegistered) {
      events.push({
        id: id++,
        daysAgo: 4,
        label: `${p.projectName} RERA verified`,
        sublabel: 'Maharashtra RERA Portal · Compliant',
        type: 'rera',
      });
    }
  });

  infrastructure.filter(relevant).forEach((infra, i) => {
    events.push({
      id: id++,
      daysAgo: 3 + i,
      label: infra.title,
      sublabel: `Status: ${infra.status} · ${(infra.affectedAreas || []).join(', ')}`,
      type: 'infra',
    });
  });

  market.filter(relevant).forEach((m, i) => {
    const type = (m.category === 'Policy' || m.category === 'Interest Rates') ? 'policy' : 'update';
    events.push({
      id: id++,
      daysAgo: 1 + i,
      label: m.headline,
      sublabel: m.summary?.slice(0, 100) || '',
      type,
    });
  });

  insights.filter(relevant).forEach((ins, i) => {
    events.push({
      id: id++,
      daysAgo: 0,
      label: ins.description?.slice(0, 80) || 'AI Insight generated',
      sublabel: ins.category || 'Insight',
      type: 'insight',
    });
  });

  return events;
}

export default Timeline;
