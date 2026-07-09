import React from 'react';
import { MapPin, TrendingUp, Building, Star, CheckCircle, HelpCircle } from 'lucide-react';

export function LocalitiesDirectory({ 
  briefData, 
  watchlist, 
  toggleWatchlist, 
  selectedLocality, 
  setSelectedLocality 
}) {
  if (!briefData) {
    return <div className="text-center py-10 text-slate-400">Loading Localities Profiles...</div>;
  }

  const { projects = [], market = [], infrastructure = [], insights = [] } = briefData;

  // Extract all unique localities
  const localitiesSet = new Set(["Baner", "Wakad", "Kharadi", "Hinjewadi"]);
  projects.forEach(p => { if (p.locality) localitiesSet.add(p.locality); });
  infrastructure.forEach(i => { (i.affectedAreas || []).forEach(area => localitiesSet.add(area)); });
  
  const localities = Array.from(localitiesSet);
  const currentLocality = selectedLocality || localities[0];

  // Filter items matching current locality
  const localityProjects = projects.filter(p => p.locality.toLowerCase() === currentLocality.toLowerCase());
  const localityInfra = infrastructure.filter(i => 
    (i.affectedAreas || []).some(area => area.toLowerCase() === currentLocality.toLowerCase())
  );
  const localityTrends = insights.filter(i => 
    i.description.toLowerCase().includes(currentLocality.toLowerCase()) || 
    (i.supportingFacts || []).some(fact => String(fact).toLowerCase().includes(currentLocality.toLowerCase()))
  );

  const isWatched = watchlist.includes(currentLocality);

  // Compute average stats for the locality
  const priceList = localityProjects
    .map(p => {
      const num = parseFloat(String(p.pricePerSqFt).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    })
    .filter(Boolean);
  
  const avgPriceSqFt = priceList.length > 0
    ? Math.round(priceList.reduce((acc, p) => acc + p, 0) / priceList.length)
    : 8500;

  return (
    <div className="space-y-6">
      
      {/* Selector Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">Localities:</span>
        {localities.map(loc => (
          <button
            key={loc}
            onClick={() => setSelectedLocality(loc)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              currentLocality === loc
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-600'
            }`}
          >
            📍 {loc}
          </button>
        ))}
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 size): Profile Stats & Projects list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Locality Header Profile Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-800">{currentLocality}</h2>
                <button
                  onClick={() => toggleWatchlist(currentLocality)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    isWatched 
                      ? 'bg-amber-50 border-amber-200 text-amber-500' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
              <p className="text-xs text-slate-400">Premium residential sub-market profiling Pune West</p>
            </div>

            <div className="flex gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Index Price</div>
                <div className="text-xl font-black text-slate-800 mt-1">₹{avgPriceSqFt}/sq.ft</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend</div>
                <div className="text-xl font-black text-emerald-600 mt-1">▲ +2.4%</div>
              </div>
            </div>
          </div>

          {/* Projects in Locality */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">🏗 Projects in {currentLocality}</h3>
            
            <div className="space-y-3">
              {localityProjects.map(proj => (
                <div key={proj.projectName} className="p-4 bg-slate-50 hover:bg-slate-100/40 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{proj.projectName}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{proj.builder}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 text-sm">{proj.startingPrice}</div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                      {proj.pricePerSqFt}
                    </span>
                  </div>
                </div>
              ))}
              {localityProjects.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No new projects listed in {currentLocality} today.</p>
              )}
            </div>
          </div>

          {/* Infrastructure Impact */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">🚇 Infrastructure & Connectivity Impacts</h3>
            <div className="space-y-4">
              {localityInfra.map((infra, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-blue-50/20 border border-blue-50/50 p-4 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    🚇
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">{infra.title}</h4>
                    <p className="text-xs text-slate-600">{infra.expectedImpact}</p>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                      Status: {infra.status}
                    </span>
                  </div>
                </div>
              ))}
              {localityInfra.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No new infrastructure upgrades logged for {currentLocality} today.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 size): AI Recommendations & Local news */}
        <div className="space-y-6">
          
          {/* AI Recommendation */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              💡 {currentLocality} AI Recommendation
            </h3>
            
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
              <h4 className="font-bold text-blue-900 text-xs">Opportunity Recommendation</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                {localityTrends.length > 0 
                  ? localityTrends[0].description
                  : `Strong mid-term investment outlook for ${currentLocality} due to connectivity boosts. Recommended to pitch premium 2BHK/3BHK units to home buyers.`
                }
              </p>
            </div>
          </div>

          {/* Timeline events */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              📅 Recent Timeline
            </h3>
            
            <div className="relative border-l border-slate-100 pl-4 space-y-5 text-xs text-slate-500">
              <div className="relative">
                <span className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-blue-600 border border-white"></span>
                <span className="font-bold text-slate-700 block">Pricing delta verified</span>
                <span className="text-[10px] text-slate-400">Today</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-slate-300 border border-white"></span>
                <span className="font-bold text-slate-700 block">RERA project listed</span>
                <span className="text-[10px] text-slate-400">2 days ago</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-slate-300 border border-white"></span>
                <span className="font-bold text-slate-700 block">Metro test runs announced</span>
                <span className="text-[10px] text-slate-400">7 days ago</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default LocalitiesDirectory;
