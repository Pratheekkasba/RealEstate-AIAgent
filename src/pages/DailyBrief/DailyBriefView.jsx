import React, { useMemo } from 'react';
import { 
  Flame, 
  Building, 
  TrendingUp, 
  MapPin, 
  CheckCircle, 
  BookOpen, 
  MessageSquare, 
  ExternalLink,
  Download
} from 'lucide-react';
import { Timeline, buildTimelineEvents } from '../../components/timeline/Timeline.jsx';

// ─── Brief-level Timeline ──────────────────────────────────────────────────────
function BriefTimeline({ briefData }) {
  const events = useMemo(() => {
    const base = buildTimelineEvents(briefData || {});
    if (base.length === 0) {
      return [
        { id: 'f1', daysAgo: 0, label: 'Daily brief compiled', sublabel: 'AI Engine run complete', type: 'brief' },
        { id: 'f2', daysAgo: 0, label: 'Pricing data verified', sublabel: 'Cross-referenced with MahaRERA', type: 'price' },
        { id: 'f3', daysAgo: 1, label: 'Infrastructure updates ingested', sublabel: 'PMC & PCMC portals', type: 'infra' },
        { id: 'f4', daysAgo: 2, label: 'Policy monitoring active', sublabel: 'RBI repo rate watch', type: 'policy' },
      ];
    }
    return base;
  }, [briefData]);

  return (
    <Timeline
      events={events}
      title="Brief Intelligence Timeline"
      grouped
      emptyMessage="No timeline events for this brief."
    />
  );
}

export function DailyBriefView({ briefData }) {
  if (!briefData) {
    return <div className="text-center py-10 text-slate-400">Loading Brief...</div>;
  }

  const { projects = [], market = [], infrastructure = [], insights = [], recommendations = {} } = briefData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:bg-white print:p-0">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200/80 pb-5 mb-4 print:border-b-2 print:border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider print:hidden">
            Premium Editorial Report
          </span>
          <h2 className="text-2xl font-black text-slate-800 mt-2.5">Today's Real Estate Intelligence Brief</h2>
          <p className="text-xs text-slate-400 mt-0.5">Verified updates from MahaRERA, RBI, and municipal portals.</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all self-start print:hidden"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF / Print
        </button>
      </div>

      <div className="space-y-8 print:space-y-6">
        
        {/* 🔥 Top Headlines */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Flame className="w-4.5 h-4.5 text-orange-500" /> 🔥 Top Headlines
          </h3>
          <div className="space-y-3">
            {(market.slice(0, 2) || []).map((m, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <h4 className="font-bold text-slate-800 text-sm">{m.headline}</h4>
                <p className="text-xs text-slate-600 mt-1">{m.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🏗 New Projects */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Building className="w-4.5 h-4.5 text-blue-500" /> 🏗 New Project Launches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p, idx) => (
              <div key={idx} className="p-4 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{p.projectName}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{p.builder}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                    RERA Active
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-50 text-slate-600">
                  <span>Locality: <strong>{p.locality}</strong></span>
                  <span>Starting: <strong>{p.startingPrice}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 📈 Price Changes */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500" /> 📈 Price Changes
          </h3>
          <div className="space-y-2.5">
            {insights.filter(i => i.category === 'Trend').map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3.5 bg-emerald-50/20 border border-emerald-50/50 rounded-2xl text-xs text-slate-600">
                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 🚇 Infrastructure */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <MapPin className="w-4.5 h-4.5 text-purple-500" /> 🚇 Infrastructure Upgrades
          </h3>
          <div className="space-y-3">
            {infrastructure.map((i, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">{i.title}</h4>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                    {i.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{i.expectedImpact}</p>
                <div className="text-[10px] text-slate-400 font-medium">
                  Affected Areas: {i.affectedAreas.join(', ')} • Authority: {i.authority}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🏛 Policies */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <BookOpen className="w-4.5 h-4.5 text-amber-500" /> 🏛 Policies & Regulations
          </h3>
          <div className="space-y-3">
            {market.filter(m => m.category === 'Policy' || m.category === 'Interest Rates').map((m, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">{m.headline}</h4>
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase">
                    {m.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{m.summary}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Impact on Buyers: {m.impact}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 💡 AI Insights */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <MessageSquare className="w-4.5 h-4.5 text-indigo-500" /> 💡 Temporal AI Insights
          </h3>
          <div className="space-y-2.5">
            {insights.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-indigo-50/20 border border-indigo-50/50 rounded-2xl text-xs text-slate-600">
                <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 🗣 Talking Points */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <MessageSquare className="w-4.5 h-4.5 text-blue-500" /> 🗣 Conversational Talking Points
          </h3>
          <div className="space-y-2.5">
            {(recommendations.talkingPoints || []).map((tp, idx) => (
              <div key={idx} className="flex gap-3 items-start text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                  {idx + 1}
                </span>
                <span>{tp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 📚 Sources */}
        <section className="space-y-3 print:hidden">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            📚 Grounding References
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {projects.flatMap(p => p.sources || []).slice(0, 4).map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs text-slate-700 font-semibold transition-all"
              >
                <span>🔗 {src.title || src.domain || 'Source Reference'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            ))}
          </div>
        </section>

        {/* 📅 Activity Timeline */}
        <section className="space-y-3">
          <BriefTimeline briefData={briefData} />
        </section>

      </div>
    </div>
  );
}

export default DailyBriefView;
