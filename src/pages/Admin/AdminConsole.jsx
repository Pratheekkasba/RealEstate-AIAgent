import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, 
  Clock, Cpu, TrendingUp, Database, 
  Zap, ChevronDown, ChevronRight, Activity 
} from 'lucide-react';

// Tiny reusable badge
function StatusBadge({ status }) {
  const map = {
    healthy: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
    success: 'bg-emerald-100 text-emerald-700',
    partial_success: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    needs_review: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
  };
  const icon = {
    healthy: <CheckCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    critical: <XCircle className="w-3 h-3" />,
    success: <CheckCircle className="w-3 h-3" />,
    partial_success: <AlertTriangle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    needs_review: <AlertTriangle className="w-3 h-3" />,
    published: <CheckCircle className="w-3 h-3" />,
  };

  const key = (status || 'healthy').toLowerCase();
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${map[key] || 'bg-slate-100 text-slate-600'}`}>
      {icon[key]} {status}
    </span>
  );
}

function AgentRow({ name, metrics }) {
  if (!metrics) return null;
  const durationSec = ((metrics.durationMs || 0) / 1000).toFixed(2);
  const statusColor = metrics.status === 'success' ? 'text-emerald-600' : metrics.status === 'failed' ? 'text-red-500' : 'text-amber-500';

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors text-xs">
      <td className="py-3.5 px-4 font-semibold text-slate-700 capitalize">{name}</td>
      <td className={`py-3.5 px-4 font-bold ${statusColor} capitalize`}>{metrics.status}</td>
      <td className="py-3.5 px-4 text-slate-500">{durationSec}s</td>
      <td className="py-3.5 px-4 text-slate-500">{metrics.errorCount || 0}</td>
    </tr>
  );
}

export function AdminConsole({ latestRun, recentRuns = [], adminPage }) {

  const [expandedRun, setExpandedRun] = useState(null);

  const run = latestRun || {};
  const health = run.health || { status: 'healthy', reason: 'No run data available yet.' };
  const agents = run.agents || {};
  const search = run.search || {};
  const entities = run.entities || {};
  const quality = run.quality || {};
  const errors = run.errors || [];

  const cacheHitRate = (search.cacheHits || 0) + (search.cacheMisses || 0) > 0
    ? Math.round(((search.cacheHits || 0) / ((search.cacheHits || 0) + (search.cacheMisses || 0))) * 100)
    : 0;

  const totalDuration = run.totalDurationMs
    ? `${(run.totalDurationMs / 1000).toFixed(1)}s`
    : '--';

  if (adminPage === 'runs') {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-1">🔄 System Runs</h2>
        <p className="text-xs text-slate-400 mb-6">All historical engine execution telemetry.</p>
        <div className="space-y-3">
          {recentRuns.length === 0 && !latestRun && (
            <div className="text-center py-12 text-slate-400 text-sm">No run history found.</div>
          )}
          {latestRun && (
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedRun(expandedRun === 'latest' ? null : 'latest')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-slate-800">{run.runId || 'latest'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{run.startTime} • {run.city}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={run.status} />
                  {expandedRun === 'latest' ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {expandedRun === 'latest' && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div><span className="text-slate-400 block">Duration</span><strong>{totalDuration}</strong></div>
                  <div><span className="text-slate-400 block">Quality Score</span><strong>{quality.overallScore || '--'}%</strong></div>
                  <div><span className="text-slate-400 block">Searches</span><strong>{search.queriesExecuted || 0}</strong></div>
                  <div><span className="text-slate-400 block">Cache Hits</span><strong>{cacheHitRate}%</strong></div>
                  <div><span className="text-slate-400 block">Projects</span><strong>{entities.projectsValidated || 0}</strong></div>
                  <div><span className="text-slate-400 block">Insights</span><strong>{entities.insightsGenerated || 0}</strong></div>
                  <div><span className="text-slate-400 block">Fallback Used</span><strong>{search.fallbackUsed ? 'Yes' : 'No'}</strong></div>
                  <div><span className="text-slate-400 block">Errors</span><strong className={errors.length > 0 ? 'text-red-600' : ''}>{errors.length}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (adminPage === 'performance') {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-1">⚡ Agent Performance</h2>
          <p className="text-xs text-slate-400 mb-6">Execution time breakdown for each registered agent in the last run.</p>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Errors</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(agents).map(([name, metrics]) => (
                <AgentRow key={name} name={name} metrics={metrics} />
              ))}
              {Object.keys(agents).length === 0 && (
                <tr><td colSpan="4" className="py-8 text-center text-xs text-slate-400">No agent run data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">🔍 Search Provider Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Primary Provider', value: search.primaryProvider || 'tavily' },
              { label: 'Fallback Used', value: search.fallbackUsed ? 'Yes ⚠️' : 'No ✅' },
              { label: 'Queries Executed', value: search.queriesExecuted || 0 },
              { label: 'Cache Hit Rate', value: `${cacheHitRate}%` },
              { label: 'Cache Hits', value: search.cacheHits || 0 },
              { label: 'Cache Misses', value: search.cacheMisses || 0 },
              { label: 'Search Failures', value: search.searchFailures || 0 },
              { label: 'Retry Count', value: search.retryCount || 0 },
            ].map(item => (
              <div key={item.label} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
                <div className="text-lg font-black text-slate-800 mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (adminPage === 'errors') {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-1">⚠️ Errors & Health Timeline</h2>
        <p className="text-xs text-slate-400 mb-6">All captured warnings and errors from the last execution run.</p>

        <div className="mb-4 p-4 rounded-2xl border flex gap-3 items-start
          ${health.status === 'healthy' ? 'bg-emerald-50/50 border-emerald-100' : health.status === 'warning' ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'}">
          <StatusBadge status={health.status} />
          <p className="text-xs text-slate-600">{health.reason}</p>
        </div>

        {errors.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-2" />
            <p className="text-sm">No errors captured. Engine ran cleanly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.map((err, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border text-xs space-y-1 ${
                err.severity === 'error' ? 'bg-red-50/40 border-red-100' : 'bg-amber-50/40 border-amber-100'
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                    err.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{err.severity}</span>
                  <span className="font-bold text-slate-700 capitalize">[{err.agent}]</span>
                  <span className="text-slate-400 ml-auto">{err.timestamp}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{err.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (adminPage === 'observability') {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-1">🔎 Observability Dashboard</h2>
        <p className="text-xs text-slate-400 mb-6">Schema and engine versioning for the latest run.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Run ID', value: run.runId || '--' },
            { label: 'Engine Version', value: run.engineVersion || '1.1.0' },
            { label: 'Schema Version', value: run.schemaVersion || '1.0.0' },
            { label: 'City', value: run.city || '--' },
            { label: 'Trigger Source', value: run.triggerSource || 'manual' },
            { label: 'Run Status', value: run.status || '--' },
            { label: 'Start Time', value: run.startTime ? new Date(run.startTime).toLocaleTimeString() : '--' },
            { label: 'End Time', value: run.endTime ? new Date(run.endTime).toLocaleTimeString() : '--' },
            { label: 'Total Duration', value: totalDuration },
          ].map(item => (
            <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
              <div className="font-mono text-sm font-bold text-slate-800 mt-1 truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Overview page
  return (
    <div className="space-y-6">
      {/* System Health Hero */}
      <div className={`rounded-3xl p-6 text-white shadow-lg ${
        health.status === 'healthy' 
          ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
          : health.status === 'warning'
          ? 'bg-gradient-to-r from-amber-600 to-orange-700'
          : 'bg-gradient-to-r from-red-600 to-red-800'
      }`}>
        <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">System Health Status</div>
        <h2 className="text-3xl font-black capitalize">{health.status}</h2>
        <p className="text-sm text-white/90 mt-1 max-w-xl">{health.reason}</p>
        <div className="flex gap-6 mt-5 border-t border-white/10 pt-4 text-xs font-semibold text-white/80">
          <div>Run ID: <span className="text-white font-mono font-bold">{run.runId || '--'}</span></div>
          <div>Duration: <span className="text-white font-bold">{totalDuration}</span></div>
          <div>Status: <span className="text-white font-bold capitalize">{run.status || '--'}</span></div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Quality Score', value: `${quality.overallScore || 0}%`, icon: Activity, color: 'text-blue-600 bg-blue-50' },
          { label: 'Cache Hit Rate', value: `${cacheHitRate}%`, icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Projects Validated', value: entities.projectsValidated || 0, icon: Database, color: 'text-purple-600 bg-purple-50' },
          { label: 'Insights Generated', value: entities.insightsGenerated || 0, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Searches Executed', value: search.queriesExecuted || 0, icon: Cpu, color: 'text-slate-600 bg-slate-100' },
          { label: 'Fallback Provider', value: search.fallbackUsed ? 'Triggered' : 'Not Used', icon: AlertTriangle, color: search.fallbackUsed ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100' },
          { label: 'Total Errors', value: errors.length, icon: XCircle, color: errors.length > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100' },
          { label: 'Run Duration', value: totalDuration, icon: Clock, color: 'text-teal-600 bg-teal-50' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-800">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Entity Metrics */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">📦 Entity Pipeline Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { label: 'Projects Extracted', value: entities.projectsExtracted || 0 },
            { label: 'Projects Validated', value: entities.projectsValidated || 0 },
            { label: 'Projects Rejected', value: entities.projectsRejected || 0 },
            { label: 'Market Updates', value: entities.marketUpdates || 0 },
            { label: 'Infra Updates', value: entities.infrastructureUpdates || 0 },
            { label: 'Duplicates Removed', value: entities.duplicatesRemoved || 0 },
            { label: 'Validation Failures', value: entities.validationFailures || 0 },
            { label: 'Insights Generated', value: entities.insightsGenerated || 0 },
          ].map(item => (
            <div key={item.label} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
              <div className="text-lg font-black text-slate-800 mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminConsole;
