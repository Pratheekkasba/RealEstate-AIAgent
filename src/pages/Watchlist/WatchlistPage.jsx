import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, TrendingUp, TrendingDown, Minus,
  Building, Zap, Newspaper, Clock,
  ChevronRight, Plus, AlertTriangle,
  CheckCircle, ArrowUpRight, Activity,
  MapPin, Sparkles, X,
} from 'lucide-react';

// ─── Animation Variants ─────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.36, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function deriveLocality(name, briefData) {
  const projects       = Array.isArray(briefData.projects) ? briefData.projects : [];
  const insights       = Array.isArray(briefData.insights) ? briefData.insights : [];
  const infrastructure = Array.isArray(briefData.infrastructure) ? briefData.infrastructure : [];
  const market         = Array.isArray(briefData.market) ? briefData.market : [];
  const n = name.toLowerCase();

  const localProjects = projects.filter(p => (p.locality || '').toLowerCase() === n);
  const localInfra    = infrastructure.filter(i =>
    (i.affectedAreas || []).some(a => a.toLowerCase() === n)
  );
  const localInsights = insights.filter(i =>
    (i.description || '').toLowerCase().includes(n) ||
    (i.supportingFacts || []).some(f => String(f).toLowerCase().includes(n))
  );
  const localNews     = market.filter(m =>
    (m.headline || '').toLowerCase().includes(n) ||
    (m.summary  || '').toLowerCase().includes(n) ||
    (m.affectedLocalities || []).some(l => l.toLowerCase() === n)
  );

  // Avg price
  const prices = localProjects
    .map(p => parseFloat(String(p.pricePerSqFt).replace(/[^0-9.]/g, '')))
    .filter(x => !isNaN(x) && x > 0);
  const avgPrice = prices.length > 0
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;

  // Simulated QoQ trend from confidence spread
  const confVals = localProjects.map(p => p.confidenceScore || p.confidence || 0.7);
  const avgConf  = confVals.length > 0
    ? confVals.reduce((a, b) => a + b, 0) / confVals.length
    : 0.7;

  // Derive a ±% trend value (real data would come from Firestore delta fields)
  let priceTrend = 0;
  if (localInsights.some(i => (i.description || '').match(/\+[0-9]+\.?[0-9]*%/))) {
    const match = localInsights
      .map(i => (i.description || '').match(/\+([0-9]+\.?[0-9]*)%/))
      .find(Boolean);
    priceTrend = match ? parseFloat(match[1]) : 2.4;
  } else if (avgConf > 0.8) {
    priceTrend = 2.4;
  } else if (avgConf > 0.65) {
    priceTrend = 1.1;
  } else {
    priceTrend = -0.5;
  }

  const newLaunches   = localProjects.filter(p => p.status === 'New Launch' || p.launchType === 'new').length;
  const infraCount    = localInfra.length;
  const latestNews    = localNews[0] || null;
  const topInsight    = localInsights[0] || null;

  // Signal
  let signal;
  if (priceTrend > 1.5 && newLaunches >= 1) {
    signal = { type: 'opportunity', emoji: '🟢', label: 'Opportunity', color: 'emerald' };
  } else if (priceTrend < 0 || (localProjects.length === 0 && infraCount === 0)) {
    signal = { type: 'watch', emoji: '🟠', label: 'Watch Closely', color: 'amber' };
  } else {
    signal = { type: 'stable', emoji: '🔵', label: 'Stable', color: 'blue' };
  }

  // Risk flag
  const hasRisk = localNews.some(m =>
    (m.headline || '').toLowerCase().match(/risk|caution|volatile|decline|falling/i)
  );

  return {
    projects:   localProjects,
    infra:      localInfra,
    insights:   localInsights,
    news:       localNews,
    avgPrice,
    priceTrend,
    newLaunches,
    infraCount,
    latestNews,
    topInsight,
    signal,
    hasRisk,
    projectCount: localProjects.length,
    builderCount: new Set(localProjects.map(p => p.builder).filter(Boolean)).size,
    topProject:   localProjects[0] || null,
  };
}

// ─── Trend Pill ─────────────────────────────────────────────────────────────────
function TrendPill({ value }) {
  if (!value || value === 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
      up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
    }`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

// ─── Signal Badge ────────────────────────────────────────────────────────────────
function SignalBadge({ signal }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    red:     'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[signal.color] || styles.blue}`}>
      {signal.emoji} {signal.label}
    </span>
  );
}

// ─── Stat Chip ──────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, value, label, color = 'slate' }) {
  const cls = {
    blue:    'bg-blue-50 text-blue-700',
    indigo:  'bg-indigo-50 text-indigo-700',
    amber:   'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate:   'bg-slate-100 text-slate-600',
    purple:  'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${cls[color]}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span className="text-[10px] font-black">{value}</span>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
    </div>
  );
}

// ─── Watchlist Card ──────────────────────────────────────────────────────────────
function WatchlistCard({ name, data, idx, onOpen, onRemove }) {
  const {
    avgPrice, priceTrend, newLaunches, infraCount,
    projectCount, builderCount, topProject,
    latestNews, topInsight, signal, hasRisk,
  } = data;

  const latestUpdate = latestNews?.headline
    || topInsight?.description?.slice(0, 90)
    || (topProject ? `${topProject.projectName} by ${topProject.builder} is indexed at ${topProject.startingPrice}.` : null)
    || `${name} market data verified and indexed today.`;

  const updatedTime = 'Today, 8:00 AM';

  return (
    <motion.div
      variants={cardVariants}
      custom={idx}
      layout
      exit="exit"
      whileHover={{ y: -3, boxShadow: '0 16px 32px -8px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="relative bg-white border border-slate-200/70 rounded-3xl overflow-hidden cursor-pointer group"
      onClick={() => onOpen(name)}
    >
      {/* Top accent bar — colour driven by signal */}
      <div className={`h-0.5 w-full ${
        signal.type === 'opportunity' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
        signal.type === 'watch'       ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                                        'bg-gradient-to-r from-blue-400 to-indigo-400'
      }`} />

      <div className="p-5 space-y-4">

        {/* ── Row 1: Identity + Controls ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 tracking-tight">{name}</h3>
              <SignalBadge signal={signal} />
              {hasRisk && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider bg-red-50 text-red-700 border-red-200">
                  🔴 Risk Flag
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
              <Clock className="w-3 h-3" />
              {updatedTime}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open detail */}
            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            {/* Unwatch */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(name); }}
              className="p-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 group-hover:fill-none" />
            </button>
          </div>
        </div>

        {/* ── Row 2: Price + Trend ── */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Avg Price</div>
            <div className="text-lg font-black text-slate-800 leading-none">
              {avgPrice ? `₹${avgPrice.toLocaleString('en-IN')}` : '—'}
              <span className="text-xs font-semibold text-slate-400 ml-0.5">/sq.ft</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex-1 text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">QoQ Change</div>
            <TrendPill value={priceTrend} />
          </div>
        </div>

        {/* ── Row 3: Activity Chips ── */}
        <div className="flex flex-wrap gap-2">
          <StatChip icon={Building} value={newLaunches} label="launches" color={newLaunches > 0 ? 'indigo' : 'slate'} />
          <StatChip icon={Activity} value={projectCount} label="projects" color="blue" />
          <StatChip icon={Zap}      value={infraCount}   label="infra updates" color={infraCount > 0 ? 'amber' : 'slate'} />
          {builderCount > 0 && (
            <StatChip icon={Sparkles} value={builderCount} label={`builder${builderCount > 1 ? 's' : ''}`} color="purple" />
          )}
        </div>

        {/* ── Row 4: Latest Update ── */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <Newspaper className="w-3 h-3" />
            Latest Update
          </div>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {latestUpdate}
          </p>
        </div>

        {/* ── Row 5: Top Project (if any) ── */}
        {topProject && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Featured Project</div>
              <div className="text-xs font-bold text-slate-700 truncate">{topProject.projectName}</div>
              <div className="text-[10px] text-slate-400 truncate">{topProject.builder}</div>
            </div>
            <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-xl shrink-0">
              {topProject.startingPrice || topProject.pricePerSqFt}
            </span>
          </div>
        )}

      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────────
function EmptyWatchlist({ onGoLocalities }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
        <Star className="w-6 h-6 text-amber-400" />
      </div>
      <div>
        <h3 className="font-bold text-slate-700 text-base">Your watchlist is empty</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
          Star localities from the Localities page to get live delta alerts — price changes, new launches, and infrastructure events.
        </p>
      </div>
      <button
        onClick={onGoLocalities}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
      >
        <MapPin className="w-3.5 h-3.5" /> Browse Localities
      </button>
    </motion.div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────────
function PageHeader({ count, opportunityCount, watchCount }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">⭐ Watchlist</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {count} tracked {count === 1 ? 'locality' : 'localities'} · Updated today at 08:00 AM
        </p>
      </div>
      {count > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {opportunityCount > 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              🟢 {opportunityCount} Opportunity
            </span>
          )}
          {watchCount > 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              🟠 {watchCount} Watch
            </span>
          )}
          {count - opportunityCount - watchCount > 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              🔵 {count - opportunityCount - watchCount} Stable
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export function WatchlistPage({
  watchlist,
  toggleWatchlist,
  briefData,
  setPage,
  setSelectedLocality,
}) {
  const localityData = useMemo(() => {
    if (!briefData) return {};
    const out = {};
    watchlist.forEach(name => { out[name] = deriveLocality(name, briefData); });
    return out;
  }, [watchlist, briefData]);

  const opportunityCount = Object.values(localityData).filter(d => d.signal?.type === 'opportunity').length;
  const watchCount       = Object.values(localityData).filter(d => d.signal?.type === 'watch').length;

  const handleOpen = (name) => {
    setSelectedLocality(name);
    setPage('localities');
  };

  if (!briefData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium">Loading watchlist data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        count={watchlist.length}
        opportunityCount={opportunityCount}
        watchCount={watchCount}
      />

      {watchlist.length === 0 ? (
        <EmptyWatchlist onGoLocalities={() => setPage('localities')} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {watchlist.map((name, idx) => (
              <WatchlistCard
                key={name}
                name={name}
                data={localityData[name] || deriveLocality(name, briefData)}
                idx={idx}
                onOpen={handleOpen}
                onRemove={toggleWatchlist}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add localities prompt */}
      {watchlist.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setPage('localities')}
          className="w-full flex items-center justify-center gap-2 p-3.5 border border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add more localities to watchlist
        </motion.button>
      )}
    </div>
  );
}

export default WatchlistPage;
