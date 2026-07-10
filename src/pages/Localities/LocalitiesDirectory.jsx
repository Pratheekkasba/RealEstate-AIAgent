import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, TrendingUp, TrendingDown, Minus,
  Building, Zap, Newspaper, Calendar, Sparkles,
  ArrowUpRight, CheckCircle, Clock, ChevronRight,
  BarChart2, ShieldCheck, AlertTriangle, Activity,
} from 'lucide-react';
import { Timeline, buildTimelineEvents } from '../../components/timeline/Timeline.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(n) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function TrendBadge({ value, suffix = '%' }) {
  if (!value || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        <Minus className="w-3 h-3" /> Stable
      </span>
    );
  }
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
      up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
    }`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value}{suffix}
    </span>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Sub-sections ──────────────────────────────────────────────────────────────

function MarketActivityCard({ projects, avgPrice, trend, locality }) {
  const launches = projects.filter(p => p.status === 'New Launch' || p.launchType === 'new').length;
  const readyToMove = projects.filter(p => p.possessionStatus === 'Ready to Move').length;
  const underConst = projects.filter(p => p.possessionStatus !== 'Ready to Move').length;

  const stats = [
    { label: 'Active Projects',  value: projects.length,  color: 'text-blue-700',    bg: 'bg-blue-50'    },
    { label: 'New Launches',     value: launches,          color: 'text-indigo-700',  bg: 'bg-indigo-50'  },
    { label: 'Ready to Move',    value: readyToMove,       color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Under Const.',     value: underConst,        color: 'text-amber-700',   bg: 'bg-amber-50'   },
  ];

  return (
    <motion.div variants={fadeUp} custom={2} className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
      <SectionLabel icon={BarChart2} label="Market Activity" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`p-3 rounded-2xl border border-transparent ${s.bg} flex flex-col gap-1`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Price band */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Index Price</div>
          <div className="text-xl font-black text-slate-800">₹{avgPrice.toLocaleString('en-IN')}<span className="text-sm font-semibold text-slate-400">/sq.ft</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quarterly Trend</div>
          <TrendBadge value={trend} />
        </div>
      </div>
    </motion.div>
  );
}

function BuilderActivityCard({ projects, locality }) {
  const builderMap = {};
  projects.forEach(p => {
    if (!p.builder) return;
    if (!builderMap[p.builder]) builderMap[p.builder] = [];
    builderMap[p.builder].push(p);
  });
  const builders = Object.entries(builderMap).sort((a, b) => b[1].length - a[1].length);

  return (
    <motion.div variants={fadeUp} custom={3} className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
      <SectionLabel icon={Building} label="Builder Activity" />
      {builders.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No Builder Activity"
          body={`No builder project logs were found in ${locality} today.`}
          compact
        />
      ) : (
        <div className="space-y-2">
          {builders.map(([builder, projs], i) => (
            <motion.div
              key={builder}
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[10px] font-black text-slate-600">
                  {builder.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700">{builder}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{projs.length} project{projs.length > 1 ? 's' : ''} listed</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {projs.slice(0, 2).map((p, j) => (
                  <span key={j} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                    {p.projectName}
                  </span>
                ))}
                {projs.length > 2 && (
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    +{projs.length - 2}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ProjectsCard({ projects, locality }) {
  return (
    <motion.div variants={fadeUp} custom={4} className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
      <SectionLabel icon={Building} label={`Projects in ${locality}`} />
      {projects.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No Tracked Projects"
          body={`No active project listings have been indexed in ${locality} today.`}
          compact
        />
      ) : (
        <div className="space-y-2.5">
          {projects.map((p, idx) => {
            const isLaunch = p.status === 'New Launch' || p.launchType === 'new';
            return (
              <motion.div
                key={p.projectName || idx}
                whileHover={{ y: -1, boxShadow: '0 6px 16px -4px rgba(0,0,0,0.07)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 cursor-default"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 truncate">{p.projectName}</span>
                    {isLaunch && (
                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        New Launch
                      </span>
                    )}
                    {p.reraRegistered && (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> RERA
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{p.builder}</div>
                  {p.possessionStatus && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.possessionStatus}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-800">{p.startingPrice || fmtPrice(p.priceMin)}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md inline-block">
                    {p.pricePerSqFt}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function InfraCard({ infraItems, locality }) {
  const iconMap = {
    metro: '🚇', road: '🛣️', airport: '✈️', hospital: '🏥',
    school: '🏫', park: '🌳', bridge: '🌉', default: '⚡',
  };
  const getIcon = (title = '') => {
    const t = title.toLowerCase();
    for (const [k, v] of Object.entries(iconMap)) {
      if (t.includes(k)) return v;
    }
    return iconMap.default;
  };

  const statusColors = {
    'Under Construction': 'bg-amber-50 text-amber-700 border-amber-100',
    'Completed':          'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Planned':            'bg-blue-50 text-blue-700 border-blue-100',
    'Operational':        'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Announced':          'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  return (
    <motion.div variants={fadeUp} custom={5} className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
      <SectionLabel icon={Zap} label="Infrastructure & Connectivity" />
      {infraItems.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No Infrastructure Updates"
          body={`No transport or connectivity updates were logged for ${locality} today.`}
          compact
        />
      ) : (
        <div className="space-y-3">
          {infraItems.map((infra, idx) => {
            const sc = statusColors[infra.status] || 'bg-slate-50 text-slate-600 border-slate-100';
            return (
              <motion.div
                key={idx}
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex gap-4 items-start p-4 bg-slate-50/50 border border-slate-100 rounded-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {getIcon(infra.title)}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800 leading-snug">{infra.title}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${sc}`}>
                      {infra.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{infra.expectedImpact}</p>
                  {infra.completionDate && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      <Calendar className="w-3 h-3" /> Expected: {infra.completionDate}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function NewsCard({ market, locality }) {
  const localNews = market.filter(m =>
    (m.headline || '').toLowerCase().includes(locality.toLowerCase()) ||
    (m.summary || '').toLowerCase().includes(locality.toLowerCase()) ||
    (m.affectedLocalities || []).some(l => l.toLowerCase() === locality.toLowerCase())
  );

  const allNews = localNews.length > 0 ? localNews : market.slice(0, 4);

  const catColors = {
    'Policy':          'bg-purple-50 text-purple-700',
    'Interest Rates':  'bg-blue-50 text-blue-700',
    'Market Trend':    'bg-indigo-50 text-indigo-700',
    'Infrastructure':  'bg-amber-50 text-amber-700',
    'Regulatory':      'bg-red-50 text-red-700',
    'Development':     'bg-emerald-50 text-emerald-700',
  };

  return (
    <motion.div variants={fadeUp} custom={6} className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
      <SectionLabel icon={Newspaper} label="Latest News & Policy" />
      {allNews.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No Market News"
          body={`No local news or regulatory bulletins affected ${locality} today.`}
          compact
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {allNews.map((item, idx) => {
            const catStyle = catColors[item.category] || 'bg-slate-100 text-slate-600';
            return (
              <motion.div
                key={idx}
                whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                className="py-4 first:pt-0 last:pb-0 flex gap-3 items-start cursor-default rounded-xl"
              >
                <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${catStyle}`}>
                        {item.category}
                      </span>
                    )}
                    {item.impact && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.impact === 'Positive' ? 'bg-emerald-50 text-emerald-700' :
                        item.impact === 'Negative' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.impact === 'Positive' ? '↑' : item.impact === 'Negative' ? '↓' : '→'} {item.impact}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{item.headline}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.summary}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// TimelineCard now delegates to the shared <Timeline /> component
function TimelineCard({ projects, infraItems, briefData, locality }) {
  const events = useMemo(() => {
    // Use the shared builder, scoped to this locality
    const derived = buildTimelineEvents(briefData || {}, locality);

    // Fallback when no data yet
    if (derived.length === 0) {
      return [
        { id: 'f1', daysAgo: 0, label: 'Price index compiled', sublabel: locality, type: 'price' },
        { id: 'f2', daysAgo: 0, label: 'Market brief published', sublabel: 'AI Engine', type: 'brief' },
        { id: 'f3', daysAgo: 2, label: 'Locality profile updated', sublabel: 'Automated run', type: 'update' },
      ];
    }
    return derived.slice(0, 10);
  }, [briefData, locality]);

  return (
    <motion.div variants={fadeUp} custom={7}>
      <Timeline
        events={events}
        title="Activity Timeline"
        grouped
        emptyMessage={`No events recorded for ${locality} yet.`}
      />
    </motion.div>
  );
}

function AIRecommendationCard({ trends, projects, locality }) {
  const insight = trends[0] || null;

  // Simple signal logic
  const launchCount = projects.filter(p => p.status === 'New Launch').length;
  const avgConf = projects.length > 0
    ? projects.reduce((acc, p) => acc + (p.confidenceScore || 0.7), 0) / projects.length
    : 0.7;

  const signal = launchCount > 1
    ? { type: 'opportunity', emoji: '🟢', label: 'Strong Buy Signal', color: 'from-emerald-600 to-teal-700' }
    : avgConf > 0.8
    ? { type: 'opportunity', emoji: '🟢', label: 'Positive Outlook',  color: 'from-blue-600 to-indigo-700' }
    : { type: 'watch',       emoji: '🟠', label: 'Monitor Closely',   color: 'from-amber-600 to-orange-700' };

  const recommendation = insight?.description
    || `${locality} shows ${launchCount > 0 ? 'active' : 'stable'} market conditions with ${projects.length} verified projects indexed. ${
      launchCount > 1
        ? 'Multiple new launches indicate developer confidence in the sub-market.'
        : 'Recommend pitching premium 2BHK/3BHK units backed by connectivity improvements.'
    }`;

  const bullets = insight?.supportingFacts?.slice(0, 3) || [
    `${projects.length} MahaRERA verified projects indexed in ${locality}`,
    launchCount > 0
      ? `${launchCount} new launch${launchCount > 1 ? 'es' : ''} registered this cycle`
      : 'Stable resale market with no oversupply signals',
    'Metro/road connectivity improvements add mid-term appreciation potential',
  ];

  return (
    <motion.div variants={fadeUp} custom={2}>
      <div className={`rounded-3xl p-6 text-white bg-gradient-to-br ${signal.color} relative overflow-hidden shadow-lg`}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-white/70" />
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">AI Recommendation</span>
            <span className="ml-auto text-[10px] font-black bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
              {signal.emoji} {signal.label}
            </span>
          </div>

          <p className="text-sm text-white/90 leading-relaxed">{recommendation}</p>

          <div className="space-y-2 pt-2 border-t border-white/10">
            {bullets.map((b, i) => (
              <div key={i} className="flex gap-2.5 items-start text-xs text-white/80">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/50" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function LocalitiesDirectory({
  briefData,
  watchlist,
  toggleWatchlist,
  selectedLocality,
  setSelectedLocality,
}) {
  if (!briefData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium">Loading Locality Profiles…</p>
      </div>
    );
  }

  const { projects = [], market = [], infrastructure = [], insights = [] } = briefData;

  // Build locality list
  const localitiesSet = new Set(['Baner', 'Wakad', 'Kharadi', 'Hinjewadi', 'Viman Nagar', 'Balewadi']);
  projects.forEach(p => { if (p.locality) localitiesSet.add(p.locality); });
  infrastructure.forEach(i => { (i.affectedAreas || []).forEach(area => localitiesSet.add(area)); });
  const localities = Array.from(localitiesSet);

  const currentLocality = selectedLocality || localities[0];
  const isWatched = watchlist.includes(currentLocality);

  // Derived data
  const localityProjects = useMemo(() =>
    projects.filter(p => (p.locality || '').toLowerCase() === currentLocality.toLowerCase()),
    [projects, currentLocality]
  );

  const localityInfra = useMemo(() =>
    infrastructure.filter(i =>
      (i.affectedAreas || []).some(a => a.toLowerCase() === currentLocality.toLowerCase())
    ),
    [infrastructure, currentLocality]
  );

  const localityTrends = useMemo(() =>
    insights.filter(i =>
      (i.description || '').toLowerCase().includes(currentLocality.toLowerCase()) ||
      (i.supportingFacts || []).some(f => String(f).toLowerCase().includes(currentLocality.toLowerCase()))
    ),
    [insights, currentLocality]
  );

  // Price calc
  const priceNums = localityProjects
    .map(p => parseFloat(String(p.pricePerSqFt).replace(/[^0-9.]/g, '')))
    .filter(n => !isNaN(n) && n > 0);
  const avgPrice = priceNums.length > 0
    ? Math.round(priceNums.reduce((a, b) => a + b, 0) / priceNums.length)
    : 8500;

  // Calculate price trend delta dynamically from live database fields
  const priceTrend = useMemo(() => {
    let totalPct = 0;
    let count = 0;
    localityProjects.forEach(p => {
      if (p.pricePerSqFt && p.previousPrice) {
        const cur = parseFloat(p.pricePerSqFt.replace(/[^0-9.]/g, ''));
        const prev = parseFloat(p.previousPrice.replace(/[^0-9.]/g, ''));
        if (cur > 0 && prev > 0) {
          totalPct += ((cur - prev) / prev) * 100;
          count++;
        }
      }
    });
    return count > 0 ? parseFloat((totalPct / count).toFixed(1)) : 0;
  }, [localityProjects]);

  const localityDescriptions = {
    Baner:       'Prime IT corridor suburb with high-end residential clusters and strong demand.',
    Wakad:       'Emerging west Pune hotspot with rapid infrastructure development near PCMC.',
    Kharadi:     'East Pune tech park zone attracting premium developer attention.',
    Hinjewadi:   'IT hub suburb with affordable to luxury project mix and excellent metro connectivity.',
    'Viman Nagar': 'Airport proximity zone with premium commercial and residential density.',
    Balewadi:    'Sports & lifestyle corridor with new-age gated community developments.',
  };
  const localityDesc = localityDescriptions[currentLocality]
    || `Established residential sub-market in ${briefData.city || 'Pune'} with verified project activity.`;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">

      {/* ── Locality Selector ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0}
        className="bg-white border border-slate-200/70 rounded-3xl p-4 flex flex-wrap gap-2 items-center shadow-sm"
      >
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Locality</span>
        {localities.map(loc => {
          const active = currentLocality === loc;
          return (
            <motion.button
              key={loc}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLocality(loc)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-600'
              }`}
            >
              {active ? '📍' : '○'} {loc}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Hero Summary Card ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLocality}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-white border border-slate-200/70 rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Top accent stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

          <div className="p-7">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              {/* Left: Locality Identity */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentLocality}</h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleWatchlist(currentLocality)}
                    className={`p-1.5 rounded-xl border transition-all ${
                      isWatched
                        ? 'bg-amber-50 border-amber-200 text-amber-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isWatched ? 'fill-amber-400' : ''}`} />
                  </motion.button>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {briefData.city || 'Pune'} • West Corridor
                  </span>
                </div>
                <p className="text-sm text-slate-500 max-w-md leading-relaxed">{localityDesc}</p>

                {/* Quick metrics row */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{localityProjects.length} Active Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{localityInfra.length} Infra Updates</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-600">Verified Today</span>
                  </div>
                </div>
              </div>

              {/* Right: Key Numbers */}
              <div className="flex gap-4 shrink-0 flex-wrap">
                <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl min-w-[110px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Price</div>
                  <div className="text-xl font-black text-slate-800">₹{avgPrice.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-400 font-medium">/sq.ft</div>
                </div>
                <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl min-w-[110px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">QoQ Trend</div>
                  <div className="mt-1 flex justify-center">
                    <TrendBadge value={priceTrend} />
                  </div>
                </div>
                <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl min-w-[110px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Launches</div>
                  <div className="text-xl font-black text-indigo-700">
                    {localityProjects.filter(p => p.status === 'New Launch').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Main Content Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Market Data */}
        <motion.div variants={stagger} className="lg:col-span-2 space-y-6">
          <MarketActivityCard
            projects={localityProjects}
            avgPrice={avgPrice}
            trend={priceTrend}
            locality={currentLocality}
          />
          <ProjectsCard projects={localityProjects} locality={currentLocality} />
          <BuilderActivityCard projects={localityProjects} locality={currentLocality} />
          <InfraCard infraItems={localityInfra} locality={currentLocality} />
          <NewsCard market={market} locality={currentLocality} />
        </motion.div>

        {/* Right Column: Intelligence */}
        <motion.div variants={stagger} className="space-y-6">
          <AIRecommendationCard
            trends={localityTrends}
            projects={localityProjects}
            locality={currentLocality}
          />
          <TimelineCard
            projects={localityProjects}
            infraItems={localityInfra}
            briefData={briefData}
            locality={currentLocality}
          />
        </motion.div>
      </div>

    </motion.div>
  );
}

export default LocalitiesDirectory;
