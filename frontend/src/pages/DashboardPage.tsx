import React from 'react';
import { TestRun } from '../types';
import {
  Activity,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Users,
  Zap,
  TrendingUp,
  Play,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface DashboardPageProps {
  runs: TestRun[];
  activeRun: TestRun | null;
  onNavigate: (tab: string) => void;
  onSelectRun: (run: TestRun) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  runs,
  activeRun,
  onNavigate,
  onSelectRun,
}) => {
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === 'completed').length;
  const failedRuns = runs.filter((r) => r.errorRate > 5.0).length;

  const totalRequestsSum = runs.reduce((acc, r) => acc + r.totalRequests, 0);
  const avgRPS = runs.length > 0 ? runs.reduce((acc, r) => acc + r.avgRPS, 0) / runs.length : 0;
  const peakRPS = runs.reduce((max, r) => (r.peakRPS > max ? r.peakRPS : max), 0);
  const avgP95 = runs.length > 0 ? runs.reduce((acc, r) => acc + r.p95LatencyMs, 0) / runs.length : 0;
  const maxVUs = runs.reduce((max, r) => (r.maxVUs > max ? r.maxVUs : max), 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Performance Observability Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">High-concurrency traffic simulation & endpoint bottleneck analysis</p>
        </div>
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-sky-500/25 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>New Load Test</span>
        </button>
      </div>

      {/* Active Run Alert Banner if test is running */}
      {activeRun && activeRun.status === 'running' && (
        <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-purple-900/40 border border-sky-500/30 rounded-2xl p-5 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center animate-pulse">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">{activeRun.testName}</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
                  TEST RUNNING
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Target: <code className="text-sky-300 font-mono">{activeRun.targetBaseUrl}</code> | Active VUs: {activeRun.latestSnapshot?.activeVUs || activeRun.maxVUs}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('running')}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
          >
            <span>View Live Telemetry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tests Executed</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalRuns}</div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{completedRuns} Passed</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">{failedRuns} Failed</span>
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Throughput (RPS)</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{peakRPS.toFixed(1)} <span className="text-sm font-normal text-slate-400">Peak</span></div>
          <div className="text-xs text-slate-400">Average: <span className="text-slate-200 font-mono">{avgRPS.toFixed(1)} RPS</span></div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg P95 Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{avgP95.toFixed(0)} <span className="text-sm font-normal text-slate-400">ms</span></div>
          <div className="text-xs text-slate-400">Across {totalRequestsSum.toLocaleString()} total requests</div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Max Concurrency</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{maxVUs} <span className="text-sm font-normal text-slate-400">VUs</span></div>
          <div className="text-xs text-slate-400">Goroutine worker pool architecture</div>
        </div>
      </div>

      {/* Recent Test History */}
      <div className="bg-dark-800 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-white">Recent Test History</h2>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="font-medium text-slate-400">No test runs recorded yet.</p>
            <button
              onClick={() => onNavigate('create')}
              className="inline-flex items-center gap-2 bg-sky-500 text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-sky-400 transition"
            >
              Configure First Load Test
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4 font-semibold">Test Name</th>
                  <th className="p-4 font-semibold">Target URL</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Requests</th>
                  <th className="p-4 font-semibold">Peak RPS</th>
                  <th className="p-4 font-semibold">P95 Latency</th>
                  <th className="p-4 font-semibold">Error Rate</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {runs.slice(0, 5).map((run) => {
                  const isFailed = run.errorRate > 5.0;
                  return (
                    <tr key={run.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-semibold text-slate-200">{run.testName}</td>
                      <td className="p-4 font-mono text-xs text-sky-400">{run.targetBaseUrl}</td>
                      <td className="p-4">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertOctagon className="w-3.5 h-3.5" /> FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-slate-300">{run.totalRequests.toLocaleString()}</td>
                      <td className="p-4 font-mono text-slate-300">{run.peakRPS.toFixed(1)}</td>
                      <td className="p-4 font-mono text-slate-300">{run.p95LatencyMs.toFixed(0)} ms</td>
                      <td className="p-4 font-mono font-semibold text-slate-200">
                        <span className={isFailed ? 'text-rose-400' : 'text-emerald-400'}>
                          {run.errorRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            onSelectRun(run);
                            onNavigate('api-analysis');
                          }}
                          className="text-xs font-semibold text-sky-400 hover:underline"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
