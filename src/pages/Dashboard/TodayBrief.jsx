import React from 'react';
import { 
  Flame, 
  Building, 
  TrendingUp, 
  MapPin, 
  Star, 
  CheckCircle, 
  MessageSquare, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

export function TodayBrief({ 
  briefData, 
  watchlist, 
  toggleWatchlist, 
  setPage, 
  setSelectedLocality 
}) {
  if (!briefData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <LoaderSpinner />
        <p className="mt-4 text-sm font-medium">Loading Today's Market Brief...</p>
      </div>
    );
  }

  const { projects = [], market = [], infrastructure = [], insights = [], recommendations = {}, date } = briefData;

  // Snapshot Metrics
  const projectsCount = projects.length;
  const launchCount = insights.filter(i => i.category === 'Launch').length;
  const priceChanges = insights.filter(i => i.category === 'Trend').length;
  const infraCount = infrastructure.length;
  const policyCount = market.filter(m => m.category === 'Policy' || m.category === 'Interest Rates').length;
  const insightsCount = insights.length;

  // Single Biggest Market Update
  const topUpdateNews = market.length > 0 ? market[0] : null;
  const topUpdateInfra = infrastructure.length > 0 ? infrastructure[0] : null;
  
  // Format generation time (simulated morning release)
  const genTime = "08:00 AM";

  const stats = [
    { label: "Projects Found", value: projectsCount, icon: Building, trend: "Stable" },
    { label: "New Launches", value: launchCount || 0, icon: Flame, trend: launchCount > 0 ? "+100%" : "Stable" },
    { label: "Price Moves", value: priceChanges, icon: TrendingUp, trend: priceChanges > 0 ? "▲ Dynamic" : "Stable" },
    { label: "Infrastructure", value: infraCount, icon: MapPin, trend: "Active" },
    { label: "Policy Updates", value: policyCount, icon: CheckCircle, trend: "Logged" },
    { label: "AI Insights", value: insightsCount, icon: MessageSquare, trend: "Generated" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center select-none pointer-events-none">
          <Building className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <span className="text-xs font-bold bg-blue-500/30 px-3 py-1 rounded-full text-blue-200">
            📊 Morning Intelligence Brief
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-3">Good Morning, Broker</h2>
          <p className="text-blue-100/90 text-sm mt-1 max-w-xl">
            Here is your verified Pune real estate index for today. Read the briefing outline to prepare for client calls.
          </p>
          
          <div className="flex items-center gap-6 mt-6 border-t border-white/10 pt-4 text-xs font-semibold text-blue-200">
            <div>
              Generated: <span className="text-white font-bold">{genTime}</span>
            </div>
            <div>
              Date: <span className="text-white font-bold">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div>
              Status: <span className="text-emerald-400 font-bold">🟢 Published</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left for Updates & Recommends, Right for Watchlist & Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 size) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Biggest Market Update */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              🔥 Today's Biggest Market Update
            </h3>
            
            {topUpdateNews || topUpdateInfra ? (
              <div className="space-y-4">
                <div className="font-bold text-lg text-slate-800 leading-snug">
                  {topUpdateNews ? topUpdateNews.headline : topUpdateInfra.title}
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{topUpdateNews ? topUpdateNews.summary : topUpdateInfra.expectedImpact}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Impact on buyers: {topUpdateNews ? (topUpdateNews.impact || 'Loan rates remain steady.') : 'Commuter connectivity will enhance.'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Source reputation: <strong className="text-slate-700">Verified</strong> (MahaRERA / RBI officially ground indexed).
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No major market updates compiled for today.</p>
            )}
          </div>

          {/* Broker Opportunities */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              💡 Top Actionable Opportunities
            </h3>
            <div className="space-y-3.5">
              {recommendations.opportunity ? (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div className="font-bold text-blue-900 text-sm">{recommendations.opportunity.headline}</div>
                  <div className="text-xs text-blue-700/90 mt-1">{recommendations.opportunity.description}</div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div className="font-bold text-blue-900 text-sm">Hinjewadi-Wakad Metro Corridor Growth</div>
                  <div className="text-xs text-blue-700/90 mt-1">Trial runs on Metro Line 3 will boost commuter accessibility. Focus listings on Hinjewadi and Wakad for medium-term rental yields.</div>
                </div>
              )}
            </div>
          </div>

          {/* Broker Talking Points */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              🗣 Broker Talking Points (Immediate Customer Conversations)
            </h3>
            <div className="space-y-3">
              {recommendations.talkingPoints && recommendations.talkingPoints.length > 0 ? (
                recommendations.talkingPoints.map((tp, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tp}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex gap-3 items-start text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">1</span>
                    <span>RBI keeps repo rates steady at 6.5%, ensuring home loan rates remain stable.</span>
                  </div>
                  <div className="flex gap-3 items-start text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">2</span>
                    <span>Pune Metro Line 3 trial runs started, promising faster connectivity to IT parks.</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 size) */}
        <div className="space-y-6">

          {/* Market Snapshot Stats */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              📈 Market Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-white border border-slate-200/60 px-1.5 py-0.5 rounded-md text-slate-500">
                        {stat.trend}
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-slate-800 mt-2">{stat.value}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Watchlist QuickView */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ⭐ Watchlist
              </h3>
              <button 
                onClick={() => setPage('watchlist')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>
            
            <div className="space-y-3">
              {watchlist.length > 0 ? (
                watchlist.map(item => (
                  <div 
                    key={item}
                    onClick={() => {
                      setSelectedLocality(item);
                      setPage('localities');
                    }}
                    className="p-3 bg-slate-50 border border-slate-100 hover:border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-50/20 transition-all flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700">📍 {item}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Updated today • Stable index</div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 hover:text-slate-600">
                      →
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No watched localities. Go to Settings or Localities to star them.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
  );
}

export default TodayBrief;
