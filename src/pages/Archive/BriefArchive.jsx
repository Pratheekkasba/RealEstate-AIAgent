import React from 'react';
import { motion } from 'framer-motion';
import { Archive, ExternalLink, Calendar, CheckCircle, Clock } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

// ─── Animations ────────────────────────────────────────────────────────────────
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: 'easeOut' },
  }),
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// ─── Date label helper ─────────────────────────────────────────────────────────
const today = new Date().toISOString().substring(0, 10);

function getBriefLabel(date) {
  const diff = Math.floor((new Date(today) - new Date(date)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { label: 'Today',       color: 'bg-blue-100 text-blue-700' };
  if (diff === 1) return { label: 'Yesterday',   color: 'bg-slate-100 text-slate-600' };
  if (diff <= 7)  return { label: `${diff}d ago`, color: 'bg-slate-100 text-slate-500' };
  return { label: date, color: 'bg-slate-100 text-slate-400' };
}

// ─── Archive Row ───────────────────────────────────────────────────────────────
function ArchiveRow({ brief, idx, onClick }) {
  const { label, color } = getBriefLabel(brief.date || today);
  const projectCount     = (brief.projects || []).length;
  const insightCount     = (brief.insights || []).length;
  const status           = brief.quality?.status || 'published';
  const dateStr          = new Date(brief.date || today).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <motion.div
      variants={rowVariants}
      custom={idx}
      whileHover={{ x: 3, backgroundColor: 'rgb(248, 250, 252)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl cursor-pointer group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open brief for ${dateStr}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {/* Date icon */}
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
        <Calendar className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800 text-sm">{dateStr}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
          {status === 'published' ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" aria-hidden="true" />
              Published
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Needs Review
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {projectCount} projects · {insightCount} insights · {brief.city || 'Pune'}
        </p>
      </div>

      {/* Arrow */}
      <ExternalLink
        className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors"
        aria-hidden="true"
      />
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function BriefArchive({ briefs = [], onOpenBrief }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[500px]">

      {/* ── Header ── */}
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Archive className="w-5 h-5 text-blue-600" aria-hidden="true" />
          Brief Archive
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Full history of published daily market intelligence briefs.
        </p>
      </div>

      {/* ── Content ── */}
      {briefs.length === 0 ? (
        <EmptyState
          icon="archive"
          title="No archived briefs yet"
          body="Run the intelligence engine to generate your first daily brief. It will appear here once published."
        />
      ) : (
        <motion.div
          className="space-y-2.5"
          variants={listVariants}
          initial="hidden"
          animate="show"
          role="list"
          aria-label="Brief archive"
        >
          {briefs.map((brief, idx) => (
            <ArchiveRow
              key={brief.date || idx}
              brief={brief}
              idx={idx}
              onClick={() => onOpenBrief && onOpenBrief(brief)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default BriefArchive;
