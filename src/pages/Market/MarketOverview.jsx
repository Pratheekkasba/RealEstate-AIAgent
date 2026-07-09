import React, { useState } from 'react';
import { TrendingUp, MapPin, CheckCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function MarketOverview({ briefData }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!briefData) {
    return <div className="text-center py-10 text-slate-400">Loading Market Data...</div>;
  }

  const { projects = [], market = [], infrastructure = [], insights = [] } = briefData;

  const priceChanges = insights.filter(i => i.category === 'Trend');
  const infraUpdates = infrastructure;
  const policyUpdates = market.filter(m => m.category === 'Policy' || m.category === 'Interest Rates' || m.headline.toLowerCase().includes('stamp') || m.headline.toLowerCase().includes('repo'));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'pricing', label: 'Pricing Movement', icon: TrendingUp },
    { id: 'infrastructure', label: 'Infrastructure', icon: MapPin },
    { id: 'policies', label: 'Policies & Regulations', icon: CheckCircle }
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[500px]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">📊 Market Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">Aggregated pricing indicators, metro schedules, and municipal policies.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl self-start">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indexed Price Delta</div>
              <div className="text-2xl font-black text-slate-800 mt-2">▲ +2.4%</div>
              <div className="text-xs text-slate-400 mt-1">Average price per sq.ft across monitored projects.</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Infra Projects Logged</div>
              <div className="text-2xl font-black text-slate-800 mt-2">{infraUpdates.length} Updates</div>
              <div className="text-xs text-slate-400 mt-1">Major transport corridors undergoing test/launch.</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Policy Triggers</div>
              <div className="text-2xl font-black text-slate-800 mt-2">{policyUpdates.length} Bulletins</div>
              <div className="text-xs text-slate-400 mt-1">Monetary changes affecting broker commissions & buyer margins.</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700">📌 Market Pulse Summaries</h3>
            <div className="space-y-3">
              {priceChanges.slice(0, 3).map((pc, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 bg-blue-50/20 border border-blue-50/50 rounded-2xl text-xs text-slate-600">
                  <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>{pc.description}</span>
                </div>
              ))}
              {priceChanges.length === 0 && (
                <p className="text-xs text-slate-400 italic">No pricing changes recorded for this briefing period.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">📈 Price Movement & Delta Indices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Locality / Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price Trend Log Description</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {priceChanges.map((change, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      Pune Real Estate Index
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                        {change.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{change.description}</td>
                    <td className="py-3.5 px-4 text-slate-400">Today</td>
                  </tr>
                ))}
                {priceChanges.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">
                      No price changes recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">🚇 Active Transport Corridors & Infrastructures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infraUpdates.map((infra, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{infra.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{infra.authority}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                    {infra.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong>Expected Impact:</strong> {infra.expectedImpact}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  Affected Localities: {infra.affectedAreas.join(', ')}
                </div>
              </div>
            ))}
            {infraUpdates.length === 0 && (
              <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                No infrastructure updates verified today.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">🏛 Regulatory Policies & Municipal Mandates</h3>
          <div className="space-y-3">
            {policyUpdates.map((policy, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">{policy.headline}</h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md uppercase">
                    {policy.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{policy.summary}</p>
                <div className="text-[10px] text-slate-400 font-medium pt-1">
                  Buyer Impact: {policy.impact || 'None logged.'}
                </div>
              </div>
            ))}
            {policyUpdates.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                No policy bulletins logged today.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default MarketOverview;
