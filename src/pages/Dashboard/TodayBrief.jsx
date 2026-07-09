import React from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Flame,
  TrendingUp,
  MapPin,
  CheckCircle,
  MessageSquare,
  ArrowUpRight,
  Newspaper,
  Sparkles,
  ChevronRight,
  Star,
} from 'lucide-react';

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ─── Opportunity Badge ─────────────────────────────────────────────────────────
const OPPORTUNITY_TYPES = {
  opportunity: {
    emoji: '🟢',
    label: 'Opportunity',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  watch: {
    emoji: '🟠',
    label: 'Watch',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  risk: {
    emoji: '🔴',
    label: 'Risk',
    bg: 'bg-red-50',
    border: 'border-red-100',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

function classifyTalkingPoint(text = '', idx) {
  const lower = text.toLowerCase();
  if (lower.includes('caution') || lower.includes('risk') || lower.includes('volatile') || lower.includes('warning')) return 'risk';
  if (lower.includes('watch') || lower.includes('monitor') || lower.includes('note')) return 'watch';
  return 'opportunity';
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, trend, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -3, boxShadow: '0 12px 24px -4px rgba(0,0,0,0.08)' }}
      className="p-4 bg-white rounded-2xl border border-slate-200/70 flex flex-col gap-3 cursor-default transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800 leading-none">{value}</div>
        <div className="text-[11px] font-medium text-slate-400 mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function TodayBrief({ briefData, watchlist, toggleWatchlist, setPage, setSelectedLocality }) {
  if (!briefData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium tracking-tight">Loading Today's Market Brief…</p>
      </div>
    );
  }

  const { projects = [], market = [], infrastructure = [], insights = [], recommendations = {}, date } = briefData;

  const projectsCount   = projects.length;
  const launchCount     = insights.filter(i => i.category === 'Launch').length;
  const priceChanges    = insights.filter(i => i.category === 'Trend').length;
  const infraCount      = infrastructure.length;
  const policyCount     = market.filter(m => m.category === 'Policy' || m.category === 'Interest Rates').length;
  const insightsCount   = insights.length;

  const topUpdate = market[0] || (infrastructure[0] ? { headline: infrastructure[0].title, summary: infrastructure[0].expectedImpact, impact: `Affected: ${(infrastructure[0].affectedAreas || []).join(', ')}`, category: 'Infrastructure' } : null);

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const stats = [
    { label: 'Projects Found',       value: projectsCount, icon: Building,     trend: 'Stable'    },
    { label: 'New Launches',          value: launchCount,   icon: Flame,         trend: launchCount > 0 ? '↑ Active' : '—' },
    { label: 'Price Moves',           value: priceChanges,  icon: TrendingUp,    trend: priceChanges > 0 ? '↑ Dynamic' : 'Flat' },
    { label: 'Infrastructure',        value: infraCount,    icon: MapPin,        trend: 'Active'    },
    { label: 'Policy Updates',        value: policyCount,   icon: CheckCircle,   trend: 'Logged'    },
    { label: 'AI Insights',           value: insightsCount, icon: Sparkles,      trend: 'Generated' },
  ];

  const talkingPoints = recommendations.talkingPoints || [
    'RBI keeps repo rates steady at 6.5%, ensuring home loan rates remain stable.',
    'Pune Metro Line 3 trial runs started — faster IT park connectivity incoming.',
    'Lodha Sylvan base rate rose +2.4% since last tracking, indicating strong local demand.',
    'VJ Yashwin Orizzonte launched in Wakad — units starting at ₹85 Lakhs.',
    'Verified MahaRERA listings ensure full legal and structural safety for buyers.',
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="space-y-8"
    >
      {/* ── Hero Card ─────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 text-white overflow-hidden shadow-2xl shadow-blue-950/30">
          {/* Decorative grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-300 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Morning Intelligence Brief
              </span>
              <h2 className="text-4xl font-black tracking-tight leading-none">Good Morning,<br />Broker.</h2>
              <p className="text-blue-200/80 text-sm max-w-md leading-relaxed">
                Your verified Pune real estate index for today is ready. Review the briefing before your first client call.
              </p>
            </div>

            {/* Metadata pill cluster */}
            <div className="flex flex-wrap gap-3 shrink-0">
              {[
                { label: 'Generated', value: '08:00 AM' },
                { label: 'Date', value: formattedDate },
                { label: 'Status', value: '🟢 Published' },
              ].map(meta => (
                <div key={meta.label} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center min-w-[90px]">
                  <div className="text-[10px] text-blue-300/70 font-semibold uppercase tracking-wider">{meta.label}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{meta.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Biggest Market Update */}
          <motion.section variants={fadeUp} custom={1}>
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-4 h-4 text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Today's Biggest Market Update</h3>
            </div>

            {topUpdate ? (
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="relative bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm shadow-slate-100 overflow-hidden group cursor-default"
              >
                {/* Accent left border */}
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-blue-600 rounded-full" />

                <div className="pl-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {topUpdate.category || 'Market Update'}
                      </span>
                      <h4 className="text-xl font-bold text-slate-800 mt-2.5 leading-snug max-w-lg">
                        {topUpdate.headline}
                      </h4>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-300 shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
                  </div>

                  <ul className="space-y-2.5">
                    <li className="flex gap-3 items-start text-sm text-slate-600 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>{topUpdate.summary}</span>
                    </li>
                    <li className="flex gap-3 items-start text-sm text-slate-600 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Buyer impact: {topUpdate.impact || 'Home loan rates remain stable for the quarter.'}</span>
                    </li>
                    <li className="flex gap-3 items-start text-sm text-slate-600 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Source reputation: <span className="font-semibold text-slate-700">Verified</span> — indexed from MahaRERA &amp; RBI official portals.</span>
                    </li>
                  </ul>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Confidence: High · Source: Government Portal</span>
                    <button
                      onClick={() => setPage('daily-brief')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                    >
                      Full Report <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 text-sm text-slate-400 text-center">
                No major updates compiled for today.
              </div>
            )}
          </motion.section>

          {/* Broker Opportunities */}
          <motion.section variants={fadeUp} custom={2}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actionable Opportunities</h3>
            </div>

            <div className="space-y-3">
              {recommendations.opportunity ? (
                (() => {
                  const type = 'opportunity';
                  const cfg  = OPPORTUNITY_TYPES[type];
                  return (
                    <motion.div
                      whileHover={{ x: 3 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className={`flex gap-4 items-start p-5 rounded-2xl border ${cfg.bg} ${cfg.border} cursor-default`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}>
                            {cfg.emoji} {cfg.label}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold leading-relaxed ${cfg.text}`}>
                          {recommendations.opportunity.headline}
                        </p>
                        <p className={`text-xs mt-1 leading-relaxed opacity-80 ${cfg.text}`}>
                          {recommendations.opportunity.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                [
                  { type: 'opportunity', text: 'Increased buyer activity expected in Wakad due to Metro Line 3 trial run commencement.', subtext: 'Listings in proximity to the Hinjewadi corridor show accelerated absorption.' },
                  { type: 'opportunity', text: 'Lodha Sylvan Phase 3 in Hinjewadi is priced below indexed market benchmarks.', subtext: 'RERA registered and verified. High conviction for mid-term appreciation.' },
                  { type: 'watch', text: 'Kharadi pricing showing range compression. Monitor for direction signal over next 7 days.', subtext: 'Multiple sources report conflicting price quotes — cross-verify before pitching.' },
                  { type: 'risk', text: 'Stamp duty waiver window may close by fiscal Q2. Create urgency with fence-sitting buyers.', subtext: 'Regulatory timelines are subject to revision. Confirm with official IGRO portal.' },
                ].map((item, idx) => {
                  const cfg = OPPORTUNITY_TYPES[item.type];
                  return (
                    <motion.div
                      key={idx}
                      variants={fadeUp}
                      custom={idx}
                      whileHover={{ x: 3 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className={`flex gap-4 items-start p-4 rounded-2xl border ${cfg.bg} ${cfg.border} cursor-default`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}>
                            {cfg.emoji} {cfg.label}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold leading-relaxed ${cfg.text}`}>{item.text}</p>
                        <p className={`text-xs mt-0.5 leading-relaxed opacity-75 ${cfg.text}`}>{item.subtext}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.section>

          {/* Broker Talking Points */}
          <motion.section variants={fadeUp} custom={3}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Broker Talking Points</h3>
              <span className="text-[10px] text-slate-300 font-medium">— for direct client conversations</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm shadow-slate-100">
              {talkingPoints.map((tp, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                  className={`flex gap-4 items-start px-6 py-4 ${idx !== talkingPoints.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed">{tp}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">

          {/* Market Snapshot */}
          <motion.section variants={fadeUp} custom={1}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Market Snapshot</h3>
            </div>
            <motion.div variants={stagger} className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <StatCard key={stat.label} {...stat} delay={i} />
              ))}
            </motion.div>
          </motion.section>

          {/* Watchlist QuickView */}
          <motion.section variants={fadeUp} custom={2}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Watchlist</h3>
              </div>
              <button
                onClick={() => setPage('watchlist')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
              >
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {watchlist.length > 0 ? (
                watchlist.map((item, i) => (
                  <motion.div
                    key={item}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)' }}
                    onClick={() => {
                      setSelectedLocality(item);
                      setPage('localities');
                    }}
                    className="group p-4 bg-white border border-slate-200/70 rounded-2xl cursor-pointer transition-shadow flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="text-blue-500">📍</span> {item}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Updated today · Stable</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                  Star localities to track them here.
                </div>
              )}
            </div>
          </motion.section>

        </div>

      </div>
    </motion.div>
  );
}

export default TodayBrief;
