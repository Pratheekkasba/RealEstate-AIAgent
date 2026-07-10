import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, MapPin, CheckCircle, BarChart2,
  Zap, Landmark, AlertCircle,
} from 'lucide-react';
import { SkeletonCard } from '../../components/ui/SkeletonCard.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

// ─── Animations ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const tabContent = {
  hidden: { opacity: 0, x: 8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:   { opacity: 0, x: -8, transition: { duration: 0.16 } },
};

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',       label: 'Overview',               icon: BarChart2   },
  { id: 'pricing',        label: 'Pricing',                icon: TrendingUp  },
  { id: 'infrastructure', label: 'Infrastructure',         icon: MapPin      },
  { id: 'policies',       label: 'Policy',                 icon: CheckCircle },
];

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ icon, children }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />}
      <h3 className="section-label">{children}</h3>
    </div>
  );
}

// ─── Stat strip card ───────────────────────────────────────────────────────────
function MetricCard({ label, value, sub }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 24px -4px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="p-5 bg-white border border-slate-200/70 rounded-2xl"
    >
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-black text-slate-800 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1 leading-snug">{sub}</div>}
    </motion.div>
  );
}

// ─── Infrastructure card ───────────────────────────────────────────────────────
function InfraCard({ infra }) {
  const statusColor = infra.status === 'Completed'
    ? 'bg-emerald-100 text-emerald-700'
    : infra.status === 'Under Construction'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-blue-100 text-blue-700';

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.07)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="p-5 bg-white border border-slate-200/70 rounded-2xl space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-800 text-sm leading-snug">{infra.title}</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{infra.authority}</span>
        </div>
        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0 ${statusColor}`}>
          {infra.status}
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        <strong className="font-semibold text-slate-700">Expected impact:</strong> {infra.expectedImpact}
      </p>
      {infra.affectedAreas?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {infra.affectedAreas.map(a => (
            <span key={a} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
              {a}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Policy card ───────────────────────────────────────────────────────────────
function PolicyCard({ policy }) {
  const catColor = policy.category === 'Policy' ? 'bg-blue-50 text-blue-700'
                 : policy.category === 'Interest Rates' ? 'bg-purple-50 text-purple-700'
                 : 'bg-amber-50 text-amber-700';
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.07)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="p-5 bg-white border border-slate-200/70 rounded-2xl space-y-2.5"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold text-slate-800 text-sm leading-snug flex-1">{policy.headline}</h4>
        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0 ${catColor}`}>
          {policy.category}
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{policy.summary}</p>
      {policy.impact && (
        <p className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2">
          Buyer impact: {policy.impact}
        </p>
      )}
    </motion.div>
  );
}

// ─── Market skeleton ───────────────────────────────────────────────────────────
function MarketSkeleton() {
  return (
    <div className="space-y-5 animate-pulse-slow" aria-label="Loading…" role="status">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <SkeletonCard key={i} variant="stat" />)}
      </div>
      <SkeletonCard rows={4} className="p-4 bg-white border border-slate-200/70 rounded-2xl" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function MarketOverview({ briefData }) {
  const [activeTab, setActiveTab] = useState('overview');

  const priceDelta = useMemo(() => {
    if (!briefData || !briefData.projects) return 2.4;
    let totalPct = 0;
    let count = 0;
    briefData.projects.forEach(p => {
      if (p.pricePerSqFt && p.previousPrice) {
        const cur = parseFloat(p.pricePerSqFt.replace(/[^0-9.]/g, ''));
        const prev = parseFloat(p.previousPrice.replace(/[^0-9.]/g, ''));
        if (cur > 0 && prev > 0) {
          totalPct += ((cur - prev) / prev) * 100;
          count++;
        }
      }
    });
    return count > 0 ? totalPct / count : 2.4;
  }, [briefData]);

  if (!briefData) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[500px]">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="skeleton w-48 h-6 rounded-lg" />
          <div className="skeleton w-80 h-3 rounded-md mt-2" />
        </div>
        <MarketSkeleton />
      </div>
    );
  }

  const { projects = [], market = [], infrastructure = [], insights = [] } = briefData;

  const priceChanges   = insights.filter(i => i.category === 'Trend');
  const infraUpdates   = infrastructure;
  const policyUpdates  = market.filter(m =>
    m.category === 'Policy' ||
    m.category === 'Interest Rates' ||
    (m.headline || '').toLowerCase().match(/stamp|repo/)
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[500px]">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
            Market Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated pricing indicators, metro schedules, and municipal policies.
          </p>
        </div>

        {/* ── Animated tab pill ── */}
        <div
          className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl self-start shrink-0"
          role="tablist"
          aria-label="Market views"
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="market-tab-bg"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm shadow-slate-200"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab panels ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={tabContent}
            initial="hidden"
            animate="show"
            exit="exit"
            role="tabpanel"
            id="tabpanel-overview"
            aria-labelledby="tab-overview"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Indexed Price Delta"
                value={`${priceDelta >= 0 ? '▲ +' : '▼ '}${priceDelta.toFixed(1)}%`}
                sub="Average price per sq.ft across monitored projects."
              />
              <MetricCard
                label="Infra Projects Logged"
                value={`${infraUpdates.length} Updates`}
                sub="Major transport corridors undergoing test/launch."
              />
              <MetricCard
                label="Active Policy Triggers"
                value={`${policyUpdates.length} Bulletins`}
                sub="Monetary changes affecting broker commissions & buyer margins."
              />
            </div>

            <div className="space-y-3">
              <SectionHeading icon={TrendingUp}>Market Pulse Summaries</SectionHeading>
              {priceChanges.length > 0 ? (
                <div className="space-y-2.5">
                  {priceChanges.slice(0, 3).map((pc, idx) => (
                    <motion.div
                      key={idx}
                      variants={fadeUp}
                      className="flex gap-3 items-start p-4 bg-blue-50/40 border border-blue-50 rounded-2xl text-xs text-slate-600"
                    >
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5" aria-hidden="true">•</span>
                      <span>{pc.description}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BarChart2}
                  title="No price changes this cycle"
                  body="Pricing stayed flat across all monitored localities. Check back in the next brief."
                  compact
                />
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'pricing' && (
          <motion.div
            key="pricing"
            variants={tabContent}
            initial="hidden"
            animate="show"
            exit="exit"
            role="tabpanel"
            id="tabpanel-pricing"
            aria-labelledby="tab-pricing"
            className="space-y-4"
          >
            <SectionHeading icon={TrendingUp}>Price Movement & Delta Indices</SectionHeading>
            {priceChanges.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Locality / Project</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Trend Log</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {priceChanges.map((change, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 transition-colors focus-within:bg-slate-50/70"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800">Pune Real Estate Index</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                            {change.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 leading-relaxed">{change.description}</td>
                        <td className="py-3.5 px-4 text-slate-400">Today</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No price movements recorded"
                body="All tracked localities are holding steady this cycle. No significant deltas logged."
                compact
              />
            )}
          </motion.div>
        )}

        {activeTab === 'infrastructure' && (
          <motion.div
            key="infrastructure"
            variants={tabContent}
            initial="hidden"
            animate="show"
            exit="exit"
            role="tabpanel"
            id="tabpanel-infrastructure"
            aria-labelledby="tab-infrastructure"
            className="space-y-4"
          >
            <SectionHeading icon={Zap}>Active Transport Corridors & Infrastructure</SectionHeading>
            {infraUpdates.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {infraUpdates.map((infra, idx) => <InfraCard key={idx} infra={infra} />)}
              </motion.div>
            ) : (
              <EmptyState
                icon={MapPin}
                title="No infrastructure updates today"
                body="No transport or civic infrastructure changes verified this briefing cycle."
                compact
              />
            )}
          </motion.div>
        )}

        {activeTab === 'policies' && (
          <motion.div
            key="policies"
            variants={tabContent}
            initial="hidden"
            animate="show"
            exit="exit"
            role="tabpanel"
            id="tabpanel-policies"
            aria-labelledby="tab-policies"
            className="space-y-4"
          >
            <SectionHeading icon={Landmark}>Regulatory Policies & Municipal Mandates</SectionHeading>
            {policyUpdates.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-3"
              >
                {policyUpdates.map((policy, idx) => <PolicyCard key={idx} policy={policy} />)}
              </motion.div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No policy bulletins today"
                body="Market is operating under the existing RBI and state regulatory framework. No changes logged."
                compact
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MarketOverview;
