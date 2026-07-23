import React, { useState, useEffect } from 'react';
import { TestRun, MetricSnapshot } from '../types';
import { useLoadForgeWebSocket, api } from '../services/api';
import {
  Square,
  Activity,
  Zap,
  Users,
  Clock,
  AlertTriangle,
  Radio,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Info,
  ShieldCheck,
  Flame
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

interface LiveTestPageProps {
  activeRun: TestRun | null;
  onTestStopped: () => void;
}

export const LiveTestPage: React.FC<LiveTestPageProps> = ({ activeRun, onTestStopped }) => {
  const { snapshot, isConnected } = useLoadForgeWebSocket();
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  const [showGuide, setShowGuide] = useState(true);

  // Initialize history from activeRun.timeSeries when activeRun is loaded
  useEffect(() => {
    if (activeRun?.timeSeries && activeRun.timeSeries.length > 0 && history.length === 0) {
      setHistory(activeRun.timeSeries);
    }
  }, [activeRun]);

  useEffect(() => {
    if (snapshot) {
      setHistory((prev) => {
        const next = [...prev, snapshot];
        if (next.length > 120) return next.slice(next.length - 120);
        return next;
      });
    }
  }, [snapshot]);

  const displaySeries = history.length > 0 ? history : (activeRun?.timeSeries || []);
  const latest = snapshot || activeRun?.latestSnapshot || (displaySeries.length > 0 ? displaySeries[displaySeries.length - 1] : null);

  const handleStop = async () => {
    await api.stopTest();
    onTestStopped();
  };

  // Locust-style Chart Data mapping
  const chartData = displaySeries.map((s) => {
    const totalRPS = Number((s.currentRPS ?? 0).toFixed(1));
    const errRatePct = s.errorRate ?? 0;
    const failuresPerSec = Number(((totalRPS * errRatePct) / 100).toFixed(1));

    return {
      time: `${s.elapsedSec}s`,
      totalRPS: totalRPS,
      failuresRPS: failuresPerSec,
      p50: Number((s.p50Ms ?? 0).toFixed(0)),
      p95: Number((s.p95Ms ?? 0).toFixed(0)),
      p99: Number((s.p99Ms ?? 0).toFixed(0)),
      maxMs: Number((s.maxLatencyMs ?? 0).toFixed(0)),
      errorRatePct: Number(errRatePct.toFixed(2)),
      vus: s.activeVUs ?? 0,
    };
  });

  const statusDistribution = latest && latest.statusCounts
    ? [
        { status: '2xx OK (Success)', count: latest.statusCounts['2xx'] || 0, fill: '#22c55e' },
        { status: '3xx Redirect', count: latest.statusCounts['3xx'] || 0, fill: '#38bdf8' },
        { status: '4xx Client Err', count: latest.statusCounts['4xx'] || 0, fill: '#f59e0b' },
        { status: '5xx Server Err', count: latest.statusCounts['5xx'] || 0, fill: '#ef4444' },
      ]
    : [];

  const isTestRunning = activeRun?.status === 'running';

  // Live Server Health Assessment for beginners
  const currentErrPct = latest ? (latest.errorRate ?? 0) : (activeRun?.errorRate ?? 0);
  const currentP95 = latest ? (latest.p95Ms ?? 0) : (activeRun?.p95LatencyMs ?? 0);

  let healthStatus = 'HEALTHY';
  let healthMessage = 'Your server is processing requests cleanly with fast response times.';
  let healthColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  if (currentErrPct > 10 || currentP95 > 4000) {
    healthStatus = 'CRITICAL OVERLOAD';
    healthMessage = 'Severe errors or latency spikes detected! Server capacity is saturated under current load.';
    healthColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (currentErrPct > 2 || currentP95 > 1500) {
    healthStatus = 'DEGRADED PERFORMANCE';
    healthMessage = 'Response times are slowing down as traffic concurrency increases.';
    healthColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isTestRunning
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
              : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
          }`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isTestRunning ? 'Live Traffic & Response Time Telemetry' : 'Load Test Performance Results'}
              </h1>
              {isTestRunning ? (
                <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
                  LOCUST-STYLE LIVE STREAM
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
                  {activeRun?.status?.toUpperCase() || 'COMPLETED'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Host: <code className="text-sky-300 font-mono">{activeRun?.targetBaseUrl || 'localhost'}</code> | Engine:{' '}
              <span className="text-emerald-400 font-semibold">High-Concurrency Goroutines</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showGuide ? 'Hide Beginner Guide' : 'Load Testing Guide'}</span>
          </button>

          {isTestRunning && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/25 transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Load Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Beginner Guide Card (Toggleable) */}
      {showGuide && (
        <div className="bg-gradient-to-r from-sky-950/30 via-slate-900 to-indigo-950/30 border border-sky-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-sky-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" /> Beginner Guide: How to Read Load Testing Graphs (Locust-Style)
            </h3>
            <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="bg-dark-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">1. Total RPS vs Failures/sec</span>
              <p className="text-slate-400 leading-relaxed">
                Green line is successful requests per second. Red line is failing requests/sec. You want total RPS high and failures at zero.
              </p>
            </div>
            <div className="bg-dark-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">2. P50 Median Latency</span>
              <p className="text-slate-400 leading-relaxed">
                50% of your users experienced response times faster than this number. This represents your average user experience.
              </p>
            </div>
            <div className="bg-dark-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">3. P95 & P99 Tail Latency</span>
              <p className="text-slate-400 leading-relaxed">
                95% and 99% of users were faster than these times. High P95/P99 latency indicates server queueing or DB bottlenecks.
              </p>
            </div>
            <div className="bg-dark-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 block">4. Active Users (VUs)</span>
              <p className="text-slate-400 leading-relaxed">
                Number of concurrent virtual users hitting your server simultaneously as traffic ramps up.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Server Health Assessment Banner */}
      <div className={`border rounded-2xl p-4 flex items-center justify-between ${healthColor}`}>
        <div className="flex items-center gap-3">
          {healthStatus === 'HEALTHY' ? (
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          ) : (
            <Flame className="w-6 h-6 text-rose-400 animate-pulse" />
          )}
          <div>
            <div className="font-bold text-sm uppercase tracking-wider">{healthStatus}</div>
            <p className="text-xs text-slate-300 mt-0.5">{healthMessage}</p>
          </div>
        </div>
        <div className="text-xs font-mono font-bold">
          P95: {currentP95.toFixed(0)} ms | Error Rate: {currentErrPct.toFixed(2)}%
        </div>
      </div>

      {/* Primary Locust-Style Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total RPS (RPS)</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {latest ? (latest.currentRPS ?? 0).toFixed(1) : (activeRun?.avgRPS ?? 0).toFixed(1)}
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Failures / sec</div>
          <div className={`text-2xl font-extrabold mt-1 ${currentErrPct > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {latest && latest.currentRPS ? ((latest.currentRPS * latest.errorRate) / 100).toFixed(1) : '0.0'}
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Users (VUs)</div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">
            {latest ? (latest.activeVUs ?? 0) : (activeRun?.maxVUs ?? 0)}
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">P50 (Median)</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {latest ? (latest.p50Ms ?? 0).toFixed(0) : (activeRun?.avgLatencyMs ?? 0).toFixed(0)} ms
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">P95 Latency</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {latest ? (latest.p95Ms ?? 0).toFixed(0) : (activeRun?.p95LatencyMs ?? 0).toFixed(0)} ms
          </div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">P99 Latency</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            {latest ? (latest.p99Ms ?? 0).toFixed(0) : (activeRun?.p99LatencyMs ?? 0).toFixed(0)} ms
          </div>
        </div>
      </div>

      {/* Detailed Locust-Style Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Total RPS vs Failures/sec (Classic Locust Main Chart) */}
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> Requests per Second (RPS) vs Failures/sec
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Locust Standard View</span>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Waiting for telemetry data points...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#22c55e" fontSize={11} label={{ value: 'RPS', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#c084fc" fontSize={11} label={{ value: 'Users', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="totalRPS" name="Total RPS (Requests/sec)" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="failuresRPS" name="Failures/sec" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="vus" name="Number of Users (VUs)" stroke="#c084fc" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Response Times (ms) Breakdown (P50, P95, P99, Max) */}
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Response Times (ms) — Percentile Spectrum
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">P50 / P95 / P99 / Max</span>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Waiting for telemetry data points...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="p50" name="50% Median (P50)" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95" name="95% Line (P95)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99" name="99% Line (P99)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="maxMs" name="Max Latency" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 3: Active Virtual Users Ramp Curve */}
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Active Virtual Users (VUs) Concurrency
          </h3>
          <div className="h-60 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Waiting for telemetry data points...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLocustVU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="vus" name="Concurrent Users" stroke="#c084fc" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLocustVU)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: HTTP Status Code Breakdown */}
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" /> HTTP Status Code Count Distribution
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution}>
                <XAxis dataKey="status" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
