import React from 'react';
import { Building, MapPin, TrendingUp, BookOpen, AlertTriangle } from 'lucide-react';

export function SearchOverlay({ 
  searchQuery, 
  setSearchQuery, 
  data, 
  setPage, 
  setSelectedLocality 
}) {
  if (!searchQuery) return null;

  const query = searchQuery.toLowerCase();
  
  // Categorize results
  const matches = {
    projects: [],
    localities: new Set(),
    infrastructure: [],
    policies: []
  };

  // 1. Match Projects
  (data.projects || []).forEach(p => {
    if (
      p.projectName.toLowerCase().includes(query) ||
      (p.builder || '').toLowerCase().includes(query) ||
      p.locality.toLowerCase().includes(query)
    ) {
      matches.projects.push(p);
      matches.localities.add(p.locality);
    }
  });

  // 2. Match Infrastructure
  (data.infrastructure || []).forEach(i => {
    if (
      i.title.toLowerCase().includes(query) ||
      (i.authority || '').toLowerCase().includes(query) ||
      (i.affectedAreas || []).some(area => area.toLowerCase().includes(query))
    ) {
      matches.infrastructure.push(i);
      (i.affectedAreas || []).forEach(area => matches.localities.add(area));
    }
  });

  // 3. Match Policies
  (data.market || []).forEach(m => {
    if (
      m.headline.toLowerCase().includes(query) ||
      m.summary.toLowerCase().includes(query) ||
      (m.category || '').toLowerCase().includes(query)
    ) {
      matches.policies.push(m);
    }
  });

  const localitiesList = Array.from(matches.localities).filter(l => l.toLowerCase().includes(query));
  const hasResults = 
    matches.projects.length > 0 || 
    localitiesList.length > 0 || 
    matches.infrastructure.length > 0 || 
    matches.policies.length > 0;

  return (
    <div className="absolute left-6 right-6 top-16 bg-white border border-slate-200 shadow-2xl rounded-2xl max-h-[500px] overflow-y-auto p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Results</span>
        <button 
          onClick={() => setSearchQuery('')}
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          Clear
        </button>
      </div>

      {!hasResults ? (
        <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-slate-300" />
          <span className="text-sm">No matches found for "{searchQuery}"</span>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Localities Group */}
          {localitiesList.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Localities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {localitiesList.slice(0, 4).map(loc => (
                  <button
                    key={loc}
                    onClick={() => {
                      setSelectedLocality(loc);
                      setPage('localities');
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl text-left text-sm text-slate-700 hover:text-blue-700 transition-all font-medium"
                  >
                    📍 {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects Group */}
          {matches.projects.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                <Building className="w-3 h-3" /> Projects
              </h3>
              <div className="space-y-1.5">
                {matches.projects.slice(0, 4).map(p => (
                  <button
                    key={p.projectName}
                    onClick={() => {
                      setPage('projects');
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 rounded-xl text-left border border-slate-50 hover:border-slate-100 transition-all"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{p.projectName}</div>
                      <div className="text-xs text-slate-400">{p.builder} • {p.locality}</div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {p.startingPrice}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Infrastructure Group */}
          {matches.infrastructure.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Infrastructure
              </h3>
              <div className="space-y-1.5">
                {matches.infrastructure.slice(0, 3).map(i => (
                  <button
                    key={i.title}
                    onClick={() => {
                      setSelectedLocality((i.affectedAreas || [])[0] || 'Baner');
                      setPage('localities');
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-50 rounded-xl text-left border border-slate-50 hover:border-slate-100 transition-all"
                  >
                    <div className="text-sm font-semibold text-slate-800">{i.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{i.expectedImpact}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Policies Group */}
          {matches.policies.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Policies & Market Updates
              </h3>
              <div className="space-y-1.5">
                {matches.policies.slice(0, 3).map(m => (
                  <button
                    key={m.headline}
                    onClick={() => {
                      setPage('market');
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-50 rounded-xl text-left border border-slate-50 hover:border-slate-100 transition-all"
                  >
                    <div className="text-sm font-semibold text-slate-800">{m.headline}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{m.summary}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default SearchOverlay;
