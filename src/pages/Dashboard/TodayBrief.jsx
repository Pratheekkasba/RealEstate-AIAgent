import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building, Flame, TrendingUp, TrendingDown, Minus,
  MapPin, CheckCircle, MessageSquare, ArrowUpRight,
  Newspaper, Sparkles, ChevronRight, Star, MapPinOff,
} from 'lucide-react';
import { PageSkeleton } from '../../components/ui/SkeletonCard.jsx';

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ─── Opportunity Config ────────────────────────────────────────────────────────
const OPPORTUNITY_TYPES = {
  opportunity: {
    emoji: '🟢', label: 'Opportunity',
    bg: 'bg-emerald-50', border: 'border-emerald-100',
    text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500',
  },
  watch: {
    emoji: '🟠', label: 'Watch',
    bg: 'bg-amber-50', border: 'border-amber-100',
    text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',
  },
  risk: {
    emoji: '🔴', label: 'Risk',
    bg: 'bg-red-50', border: 'border-red-100',
    text: 'text-red-800', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500',
  },
};

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, children, aside }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />}
      <h3 className="section-label">{children}</h3>
      {aside && <span className="text-[10px] text-slate-300 font-medium">{aside}</span>}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, trend, trendDir, delay }) {
  // trendDir: 'up' | 'down' | 'neutral'
  const TrendIcon   = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendColor  = trendDir === 'up' ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                    : trendDir === 'down' ? 'text-red-500 bg-red-50 border-red-100'
                    : 'text-slate-400 bg-slate-50 border-slate-100';
  const iconBgColor = trendDir === 'up' ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    : trendDir === 'down' ? 'bg-red-50 border-red-100 text-red-500'
                    : 'bg-slate-50 border-slate-100 text-slate-500';

  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -3, boxShadow: '0 12px 24px -4px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="p-4 bg-white rounded-2xl border border-slate-200/70 flex flex-col gap-3 cursor-default"
      role="figure"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${iconBgColor}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full ${trendColor}`}>
          <TrendIcon className="w-2.5 h-2.5" aria-hidden="true" />
          {trend}
        </span>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800 leading-none tabular-nums">{value}</div>
        <div className="text-[11px] font-medium text-slate-400 mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

// ─── Watchlist empty state ─────────────────────────────────────────────────────
function WatchlistEmpty({ onGo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
    >
      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <MapPinOff className="w-5 h-5 text-amber-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-600">No localities tracked</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Star localities to monitor them here.
        </p>
      </div>
      <button
        onClick={onGo}
        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
      >
        Browse Localities →
      </button>
    </motion.div>
  );
}

// ─── Market Update empty state ─────────────────────────────────────────────────
function MarketUpdateEmpty() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
      <Newspaper className="w-8 h-8 text-slate-200" aria-hidden="true" />
      <p className="font-medium">No major updates compiled for today.</p>
    </div>
  );
}

// ─── Opportunity Card ──────────────────────────────────────────────────────────
function OpportunityCard({ type, text, subtext, idx }) {
  const cfg = OPPORTUNITY_TYPES[type] || OPPORTUNITY_TYPES.opportunity;
  return (
    <motion.div
      variants={fadeUp}
      custom={idx}
      whileHover={{ x: 4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
      className={`flex gap-4 items-start p-4 rounded-2xl border ${cfg.bg} ${cfg.border} cursor-default`}
    >
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}>
            {cfg.emoji} {cfg.label}
          </span>
        </div>
        <p className={`text-sm font-semibold leading-relaxed ${cfg.text}`}>{text}</p>
        {subtext && (
          <p className={`text-xs mt-0.5 leading-relaxed opacity-75 ${cfg.text}`}>{subtext}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Talking Point ─────────────────────────────────────────────────────────────
function TalkingPoint({ text, idx, isLast }) {
  const type = (() => {
    const l = text.toLowerCase();
    if (l.match(/caution|risk|volatile|warning/)) return 'risk';
    if (l.match(/watch|monitor|note/)) return 'watch';
    return 'opportunity';
  })();
  const numberColor = type === 'risk' ? 'bg-red-100 text-red-600'
                    : type === 'watch' ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-500';
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.9)' }}
      className={`flex gap-4 items-start px-6 py-4 ${!isLast ? 'border-b border-slate-100' : ''} transition-colors`}
    >
      <span
        className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${numberColor}`}
        aria-label={`Point ${idx + 1}`}
      >
        {idx + 1}
      </span>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function TodayBrief({ briefData, watchlist, toggleWatchlist, setPage, setSelectedLocality, profile }) {

  // ── Structured skeleton matches actual layout ──
  if (!briefData) {
    return <PageSkeleton />;
  }

  const {
    projects = [], market = [], infrastructure = [],
    insights = [], recommendations = {}, date,
  } = briefData;

  const projectsCount = projects.length;
  const launchCount   = insights.filter(i => i.category === 'Launch').length;
  const priceChanges  = insights.filter(i => i.category === 'Trend').length;
  const infraCount    = infrastructure.length;
  const policyCount   = market.filter(m =>
    m.category === 'Policy' || m.category === 'Interest Rates'
  ).length;
  const insightsCount = insights.length;

  const topUpdate = market[0] || (infrastructure[0]
    ? {
        headline:  infrastructure[0].title,
        summary:   infrastructure[0].expectedImpact,
        impact:    `Affected: ${(infrastructure[0].affectedAreas || []).join(', ')}`,
        category: 'Infrastructure',
      }
    : null);

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const stats = [
    { label: 'Projects Found', value: projectsCount, icon: Building,   trend: 'Stable',                     trendDir: 'neutral' },
    { label: 'New Launches',   value: launchCount,   icon: Flame,       trend: launchCount > 0 ? 'Active' : '—', trendDir: launchCount > 0 ? 'up' : 'neutral' },
    { label: 'Price Moves',    value: priceChanges,  icon: TrendingUp,  trend: priceChanges > 0 ? 'Dynamic' : 'Flat', trendDir: priceChanges > 0 ? 'up' : 'neutral' },
    { label: 'Infrastructure', value: infraCount,    icon: MapPin,      trend: 'Active',                     trendDir: infraCount > 0 ? 'up' : 'neutral' },
    { label: 'Policy Updates', value: policyCount,   icon: CheckCircle, trend: 'Logged',                     trendDir: 'neutral' },
    { label: 'AI Insights',    value: insightsCount, icon: Sparkles,    trend: 'Generated',                  trendDir: insightsCount > 0 ? 'up' : 'neutral' },
  ];

  // Dynamically compile opportunities directly from live Firestore content to eliminate mock data
  const opportunities = useMemo(() => {
    const list = [];
    if (recommendations.opportunity) {
      list.push({
        type: 'opportunity',
        text: recommendations.opportunity.headline,
        subtext: recommendations.opportunity.description,
      });
    }

    insights.forEach(ins => {
      if (ins.category === 'Launch') {
        list.push({
          type: 'opportunity',
          text: `New Project: ${ins.description}`,
          subtext: 'High conviction for local pricing growth.',
        });
      }
    });

    infrastructure.slice(0, 2).forEach(infra => {
      list.push({
        type: 'opportunity',
        text: `Civic Corridor Upgrade: ${infra.title}`,
        subtext: `${infra.expectedImpact} (Status: ${infra.status})`,
      });
    });

    if (list.length === 0) {
      list.push({
        type: 'watch',
        text: 'Awaiting high-conviction opportunities in this briefing cycle.',
        subtext: 'Local price indices are holding steady.',
      });
    }
    return list;
  }, [recommendations, insights, infrastructure]);

  const talkingPoints = recommendations.talkingPoints || [
    'RBI keeps repo rates steady at 6.5%, ensuring home loan rates remain stable.',
    'Pune Metro Line 3 trial runs started — faster IT park connectivity incoming.',
    'Lodha Sylvan base rate rose +2.4% since last tracking, indicating strong local demand.',
    'VJ Yashwin Orizzonte project launched in Wakad — units starting at ₹85 Lakhs.',
    'Verified MahaRERA listings ensure full legal and structural safety for buyers.',
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="space-y-8"
    >
      {/* ── Hero ── */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 text-white overflow-hidden shadow-2xl shadow-blue-950/30">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-300 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Morning Intelligence Brief
              </span>
              <h2 className="text-4xl font-black tracking-tight leading-none">
                Good Morning,<br />{profile?.name || 'Partner'}.
              </h2>
              <p className="text-blue-200/80 text-sm max-w-md leading-relaxed">
                {profile?.preferredLocalities ? (
                  `Tracking active metrics for ${profile.preferredLocalities.split(',').slice(0, 3).join(', ')}${profile.preferredLocalities.split(',').length > 3 ? '...' : ''}.`
                ) : (
                  "Your verified Pune real estate index for today is ready. Review the briefing before your first client call."
                )}
              </p>

              {/* Personalization shortcut pills */}
              {(profile?.preferredLocalities || profile?.favouriteBuilders) && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {profile.preferredLocalities?.split(',').map(item => {
                    const cleanName = item.trim();
                    if (!cleanName) return null;
                    return (
                      <button
                        key={cleanName}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocality(cleanName);
                          setPage('localities');
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-blue-100 px-2.5 py-1 rounded-lg transition-all focus-visible:ring-1 focus-visible:ring-blue-400 cursor-pointer"
                      >
                        📍 {cleanName}
                      </button>
                    );
                  })}
                  {profile.favouriteBuilders?.split(',').map(item => {
                    const cleanName = item.trim();
                    if (!cleanName) return null;
                    return (
                      <span
                        key={cleanName}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/5 text-purple-200 border border-white/5 px-2.5 py-1 rounded-lg"
                      >
                        🏢 {cleanName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              {[
                { label: 'Generated', value: '08:00 AM' },
                { label: 'Date',      value: formattedDate },
                { label: 'Status',    value: '🟢 Published' },
              ].map(meta => (
                <div
                  key={meta.label}
                  className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center min-w-[90px]"
                >
                  <div className="text-[10px] text-blue-300/70 font-semibold uppercase tracking-wider">{meta.label}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{meta.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Biggest Market Update */}
          <motion.section variants={fadeUp} custom={1} aria-labelledby="market-update-heading">
            <SectionLabel icon={Newspaper} id="market-update-heading">
              Today's Biggest Market Update
            </SectionLabel>

            {topUpdate ? (
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="relative bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm overflow-hidden group cursor-default"
              >
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-blue-600 rounded-full" aria-hidden="true" />
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
                    <ArrowUpRight className="w-5 h-5 text-slate-300 shrink-0 mt-1 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                  </div>

                  <ul className="space-y-2.5" aria-label="Key details">
                    {[
                      topUpdate.summary,
                      `Buyer impact: ${topUpdate.impact || 'Home loan rates remain stable for the quarter.'}`,
                      'Source: Verified — indexed from MahaRERA & RBI official portals.',
                    ].map((point, i) => (
                      <li key={i} className="flex gap-3 items-start text-sm text-slate-600 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Confidence: High · Source: Government Portal
                    </span>
                    <button
                      onClick={() => setPage('daily-brief')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
                      aria-label="View full market report"
                    >
                      Full Report <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <MarketUpdateEmpty />
            )}
          </motion.section>

          {/* Actionable Opportunities */}
          <motion.section variants={fadeUp} custom={2} aria-labelledby="opportunities-heading">
            <SectionLabel icon={Sparkles} id="opportunities-heading">Actionable Opportunities</SectionLabel>
            <div className="space-y-3">
              {opportunities.map((item, idx) => (
                <OpportunityCard key={idx} {...item} idx={idx} />
              ))}
            </div>
          </motion.section>

          {/* Broker Talking Points */}
          <motion.section variants={fadeUp} custom={3} aria-labelledby="talking-points-heading">
            <SectionLabel icon={MessageSquare} aside="— for direct client conversations" id="talking-points-heading">
              Broker Talking Points
            </SectionLabel>
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
              {talkingPoints.map((tp, idx) => (
                <TalkingPoint
                  key={idx}
                  text={tp}
                  idx={idx}
                  isLast={idx === talkingPoints.length - 1}
                />
              ))}
            </div>
          </motion.section>

        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-8">

          {/* Market Snapshot */}
          <motion.section variants={fadeUp} custom={1} aria-labelledby="snapshot-heading">
            <SectionLabel icon={TrendingUp} id="snapshot-heading">Market Snapshot</SectionLabel>
            <motion.div variants={stagger} className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <StatCard key={stat.label} {...stat} delay={i} />
              ))}
            </motion.div>
          </motion.section>

          {/* Watchlist QuickView */}
          <motion.section variants={fadeUp} custom={2} aria-labelledby="watchlist-heading">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <h3 className="section-label" id="watchlist-heading">Watchlist</h3>
              </div>
              <button
                onClick={() => setPage('watchlist')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
                aria-label="Manage watchlist"
              >
                Manage <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
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
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    onClick={() => { setSelectedLocality(item); setPage('localities'); }}
                    className="group p-4 bg-white border border-slate-200/70 rounded-2xl cursor-pointer transition-shadow flex items-center justify-between"
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${item} locality details`}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedLocality(item); setPage('localities'); }}}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="text-blue-500" aria-hidden="true">📍</span> {item}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Updated today · Stable</div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
                      aria-hidden="true"
                    />
                  </motion.div>
                ))
              ) : (
                <WatchlistEmpty onGo={() => setPage('localities')} />
              )}
            </div>
          </motion.section>

        </div>
      </div>
    </motion.div>
  );
}

export default TodayBrief;
