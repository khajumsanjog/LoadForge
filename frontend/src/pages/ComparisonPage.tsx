import React, { useState } from 'react';
import { TestRun, ComparisonResult } from '../types';
import { api } from '../services/api';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ComparisonPageProps {
  runs: TestRun[];
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ runs }) => {
  const [baselineId, setBaselineId] = useState<string>(runs[1]?.id || runs[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(runs[0]?.id || '');
  const [cmpResult, setCmpResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!baselineId || !targetId) {
      alert('Please select both a baseline run and target run to compare.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.compareRuns(baselineId, targetId);
      setCmpResult(res);
    } catch (e: any) {
      alert('Comparison error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-sky-400" /> Test Run Performance Comparison & Regression Engine
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Compare two load benchmark runs side-by-side to detect latency regressions, throughput drops, and error rate changes
        </p>
      </div>

      {/* Selectors Card */}
      <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Baseline Run (e.g. v1.2.0)</label>
            <select
              value={baselineId}
              onChange={(e) => setBaselineId(e.target.value)}
              className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:border-sky-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.testName} — {new Date(r.startTime).toLocaleString()} (P95: {r.p95LatencyMs.toFixed(0)}ms)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Target Run (e.g. v1.3.0)</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:border-sky-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.testName} — {new Date(r.startTime).toLocaleString()} (P95: {r.p95LatencyMs.toFixed(0)}ms)
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <GitCompare className="w-4 h-4" />
          <span>{loading ? 'Analyzing Differences...' : 'Run Side-by-Side Comparison'}</span>
        </button>
      </div>

      {/* Comparison Results */}
      {cmpResult && (
        <div className="space-y-6">
          {/* Summary Alert Banner */}
          <div
            className={`border rounded-2xl p-6 flex items-center justify-between backdrop-blur-sm ${
              cmpResult.regressionAlert === 'REGRESSION DETECTED'
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-400'
                : cmpResult.regressionAlert === 'IMPROVED'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-4">
              {cmpResult.regressionAlert === 'REGRESSION DETECTED' ? (
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              )}
              <div>
                <span className="font-extrabold text-lg tracking-wide">{cmpResult.regressionAlert}</span>
                <p className="text-xs text-slate-300 mt-0.5">{cmpResult.summaryText}</p>
              </div>
            </div>
          </div>

          {/* Delta Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Throughput Delta (RPS)</div>
              <div className={`text-2xl font-extrabold ${cmpResult.deltaRPS >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {cmpResult.deltaRPS >= 0 ? '+' : ''}{cmpResult.deltaRPS.toFixed(1)}%
              </div>
            </div>

            <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">P95 Latency Delta</div>
              <div className={`text-2xl font-extrabold ${cmpResult.deltaP95Ms > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {cmpResult.deltaP95Ms >= 0 ? '+' : ''}{cmpResult.deltaP95Ms.toFixed(1)}%
              </div>
            </div>

            <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Error Rate Change</div>
              <div className={`text-2xl font-extrabold ${cmpResult.deltaErrorRate > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {cmpResult.deltaErrorRate >= 0 ? '+' : ''}{cmpResult.deltaErrorRate.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Endpoint Diff Table */}
          <div className="bg-dark-800 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 font-bold text-white text-base">
              Per-Endpoint Regression Breakdown
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4 font-semibold">Endpoint</th>
                  <th className="p-4 font-semibold">Baseline P95</th>
                  <th className="p-4 font-semibold">Target P95</th>
                  <th className="p-4 font-semibold">% Latency Delta</th>
                  <th className="p-4 font-semibold">Error Delta</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {cmpResult.endpointDiffs.map((diff, idx) => (
                  <tr key={idx} className={diff.hasRegression ? 'bg-rose-500/10' : 'hover:bg-slate-800/40'}>
                    <td className="p-4 text-slate-200">{diff.method} {diff.endpoint}</td>
                    <td className="p-4 text-slate-300">{diff.baseP95Ms.toFixed(0)} ms</td>
                    <td className="p-4 text-slate-300">{diff.targetP95Ms.toFixed(0)} ms</td>
                    <td className={`p-4 font-bold ${diff.pctChangeP95 > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {diff.pctChangeP95 >= 0 ? '+' : ''}{diff.pctChangeP95.toFixed(1)}%
                    </td>
                    <td className="p-4 text-slate-300">{diff.targetErrorPct.toFixed(1)}%</td>
                    <td className="p-4 font-sans">
                      {diff.hasRegression ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          REGRESSION
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          STABLE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
