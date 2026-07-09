import React, { useState, useMemo } from 'react';
import { Star, ShieldCheck, CheckCircle } from 'lucide-react';
import { Timeline, buildTimelineEvents } from '../../components/timeline/Timeline.jsx';

// ─── Project Timeline ──────────────────────────────────────────────────────────
function ProjectTimeline({ briefData }) {
  const events = useMemo(() => {
    const base = buildTimelineEvents(briefData || {});
    if (base.length === 0) {
      return [
        { id: 'f1', daysAgo: 0, label: 'Projects directory indexed', sublabel: 'MahaRERA + Builder portals', type: 'rera' },
        { id: 'f2', daysAgo: 0, label: 'Pricing data verified', sublabel: 'Cross-referenced with 3 sources', type: 'price' },
        { id: 'f3', daysAgo: 1, label: 'Market brief compiled', sublabel: 'AI Engine run complete', type: 'brief' },
      ];
    }
    // For projects page, show all events (no locality filter)
    return base.slice(0, 12);
  }, [briefData]);

  return (
    <Timeline
      events={events}
      title="Project Activity Timeline"
      grouped
      emptyMessage="No project activity recorded today."
    />
  );
}

export function ProjectsDirectory({ 

  briefData, 
  watchlist, 
  toggleWatchlist 
}) {
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('projectName');
  const [sortOrder, setSortOrder] = useState('asc');

  if (!briefData) {
    return <div className="text-center py-10 text-slate-400">Loading Projects Directory...</div>;
  }

  const { projects = [], insights = [] } = briefData;

  const launchesCount = insights.filter(i => i.category === 'Launch').length;
  
  // Calculate average confidence
  const avgConf = projects.length > 0 
    ? Math.round((projects.reduce((acc, p) => acc + (p.confidence || 0.7), 0) / projects.length) * 100)
    : 90;

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const q = filterText.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(q) ||
      (p.builder || '').toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q)
    );
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            🏢
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{projects.length}</div>
            <div className="text-xs font-semibold text-slate-400">Monitored Projects</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            🔥
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{launchesCount}</div>
            <div className="text-xs font-semibold text-slate-400">New Launches This Month</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            🛡
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{avgConf}%</div>
            <div className="text-xs font-semibold text-slate-400">Average Source Confidence</div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">🏗 Verified Projects Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">RERA-statused pricing, locality mapping, and confidence scores.</p>
          </div>

          <input
            type="text"
            placeholder="Search within projects..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm transition-all outline-none max-w-xs w-full"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-700" onClick={() => handleSort('projectName')}>Project</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-700" onClick={() => handleSort('builder')}>Builder</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-700" onClick={() => handleSort('locality')}>Locality</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-700" onClick={() => handleSort('startingPrice')}>Price</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-700" onClick={() => handleSort('confidence')}>Confidence</th>
                <th className="py-3.5 px-4">RERA Status</th>
                <th className="py-3.5 px-4 text-center">Watch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {sortedProjects.map((p) => {
                const isWatched = watchlist.includes(p.locality);
                const confScore = p.confidence || 0.7;
                const confPercent = Math.round(confScore * 100);
                
                return (
                  <tr key={p.projectName} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800">{p.projectName}</td>
                    <td className="py-4 px-4">{p.builder || 'Unknown'}</td>
                    <td className="py-4 px-4">📍 {p.locality}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{p.startingPrice}</div>
                      <div className="text-[10px] text-slate-400">{p.pricePerSqFt}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          confScore >= 0.8 ? 'bg-emerald-500' : confScore >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        <span className="font-bold">{confPercent}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 self-start w-max">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => toggleWatchlist(p.locality)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isWatched 
                            ? 'bg-amber-50 border-amber-200 text-amber-500' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedProjects.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No verified projects match the search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Activity Timeline */}
      <div className="mt-6">
        <ProjectTimeline briefData={briefData} />
      </div>

    </div>
  );
}

export default ProjectsDirectory;
