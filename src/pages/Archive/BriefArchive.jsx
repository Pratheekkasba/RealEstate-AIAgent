import React from 'react';
import { Archive, ExternalLink, Calendar, CheckCircle, Clock } from 'lucide-react';

export function BriefArchive({ briefs = [], onOpenBrief }) {
  const today = new Date().toISOString().substring(0, 10);

  const getBriefLabel = (date) => {
    const diff = Math.floor((new Date(today) - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { label: 'Today', color: 'bg-blue-100 text-blue-700' };
    if (diff === 1) return { label: 'Yesterday', color: 'bg-slate-100 text-slate-600' };
    if (diff <= 7) return { label: `${diff} days ago`, color: 'bg-slate-100 text-slate-500' };
    return { label: date, color: 'bg-slate-100 text-slate-400' };
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[500px]">
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-xl font-bold text-slate-800">📚 Brief Archive</h2>
        <p className="text-xs text-slate-400 mt-0.5">Full history of published daily market intelligence briefs.</p>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm">No archived briefs found.</p>
          <p className="text-xs mt-1">Run the engine to generate the first daily brief.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefs.map((brief, idx) => {
            const { label, color } = getBriefLabel(brief.date || today);
            const projectCount = (brief.projects || []).length;
            const insightCount = (brief.insights || []).length;
            const status = brief.quality?.status || 'published';

            return (
              <div
                key={brief.date || idx}
                className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer"
                onClick={() => onOpenBrief && onOpenBrief(brief)}
              >
                {/* Date Icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">
                      {new Date(brief.date || today).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    {status === 'published' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Needs Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {projectCount} projects • {insightCount} insights • {brief.city || 'Pune'}
                  </p>
                </div>

                {/* Open Link */}
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BriefArchive;
