import React from 'react';
import { Star, StarOff, TrendingUp, MapPin, AlertCircle } from 'lucide-react';

export function WatchlistPage({ 
  watchlist, 
  toggleWatchlist, 
  briefData, 
  setPage, 
  setSelectedLocality 
}) {
  if (!briefData) {
    return <div className="text-center py-10 text-slate-400">Loading Watchlist Data...</div>;
  }

  const { projects = [], insights = [], infrastructure = [] } = briefData;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[500px]">
      
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-xl font-bold text-slate-800">⭐ Starred Watchlist</h2>
        <p className="text-xs text-slate-400 mt-0.5">Locality change metrics and active triggers compiled in the last 24 hours.</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <AlertCircle className="w-10 h-10 text-slate-300" />
          <span className="text-sm">Your watchlist is currently empty.</span>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Star localities on the Localities profile or Projects directory to receive instant market delta alerts here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlist.map(item => {
            // Calculate variables for this locality
            const localityProjects = projects.filter(p => p.locality.toLowerCase() === item.toLowerCase());
            const localityInsights = insights.filter(i => 
              i.description.toLowerCase().includes(item.toLowerCase())
            );
            const localityInfra = infrastructure.filter(i => 
              (i.affectedAreas || []).some(area => area.toLowerCase() === item.toLowerCase())
            );

            const isWatched = watchlist.includes(item);

            return (
              <div 
                key={item}
                className="p-5 bg-slate-50 hover:bg-slate-100/40 border border-slate-200/60 rounded-3xl space-y-4 transition-all relative group"
              >
                {/* Unwatch star absolute trigger */}
                <button
                  onClick={() => toggleWatchlist(item)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg bg-white border border-slate-200 text-amber-500 hover:text-slate-400 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>

                <div 
                  onClick={() => {
                    setSelectedLocality(item);
                    setPage('localities');
                  }}
                  className="cursor-pointer space-y-3"
                >
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">📍 {item}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Updated 2 hours ago</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md uppercase">
                      ▲ +2.4% Index
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md uppercase">
                      {localityProjects.length} launches
                    </span>
                    {localityInfra.length > 0 && (
                      <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md uppercase">
                        Corridor Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {localityInsights.length > 0 
                      ? localityInsights[0].description
                      : `Capital values in ${item} are stabilizing. Metro expansion schedules support buyer volume increases.`
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default WatchlistPage;
