import React, { useState } from 'react';
import { TestRun, EndpointStat } from '../types';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Search,
  Zap
} from 'lucide-react';

interface EndpointAnalysisPageProps {
  run: TestRun | null;
}

export const EndpointAnalysisPage: React.FC<EndpointAnalysisPageProps> = ({ run }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof EndpointStat>('p95Ms');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedEp, setSelectedEp] = useState<EndpointStat | null>(null);

  if (!run || !run.endpoints || run.endpoints.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto mt-12 bg-dark-800 border border-slate-800 rounded-2xl">
        <BarChart3 className="w-12 h-12 mx-auto text-sky-400 opacity-60" />
        <h2 className="text-lg font-bold text-white">No Endpoint Data Selected</h2>
        <p className="text-xs">Run a load test or select a historical run from Test History to analyze individual API endpoint latency and error stats.</p>
      </div>
    );
  }

  const handleSort = (field: keyof EndpointStat) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredEndpoints = run.endpoints
    .filter(
      (ep) =>
        ep.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.method.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Endpoint-Level Performance Breakdown</h1>
          <p className="text-slate-400 text-sm mt-1">
            Test Run: <strong className="text-sky-300">{run.testName}</strong> | Base URL: <code className="font-mono text-slate-300">{run.targetBaseUrl}</code>
          </p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search API endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-sky-500"
          />
        </div>
      </div>

      {/* Endpoint Table */}
      <div className="bg-dark-800 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('endpoint')}>
                  Endpoint <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('totalRequests')}>
                  Requests <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('rps')}>
                  RPS <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('successRate')}>
                  Success % <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('p50Ms')}>
                  P50 <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('p95Ms')}>
                  P95 <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('p99Ms')}>
                  P99 <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="p-4 font-semibold">5xx Errors</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEndpoints.map((ep, idx) => {
                const isProblem = ep.isBottleneck || ep.errorRate > 5.0 || ep.p95Ms > 2000;
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedEp(ep)}
                    className={`cursor-pointer transition-colors ${
                      isProblem ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="p-4 font-bold text-sky-400">{ep.method}</td>
                    <td className="p-4 font-mono text-slate-200">{ep.endpoint}</td>
                    <td className="p-4 font-mono text-slate-300">{ep.totalRequests.toLocaleString()}</td>
                    <td className="p-4 font-mono text-slate-300">{ep.rps.toFixed(1)}</td>
                    <td className="p-4 font-mono font-semibold text-emerald-400">{ep.successRate.toFixed(1)}%</td>
                    <td className="p-4 font-mono text-slate-300">{ep.p50Ms.toFixed(0)} ms</td>
                    <td className="p-4 font-mono font-bold text-amber-400">{ep.p95Ms.toFixed(0)} ms</td>
                    <td className="p-4 font-mono font-bold text-rose-400">{ep.p99Ms.toFixed(0)} ms</td>
                    <td className="p-4 font-mono text-slate-300">{ep.status5xx}</td>
                    <td className="p-4">
                      {isProblem ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" /> BOTTLENECK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> HEALTHY
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timing Waterfall Drawer */}
      {selectedEp && (
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" /> Timing Waterfall Breakdown: {selectedEp.method} {selectedEp.endpoint}
            </h3>
            <button onClick={() => setSelectedEp(null)} className="text-slate-400 hover:text-white text-xs">Close</button>
          </div>

          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">DNS Lookup</div>
              <div className="text-base font-bold text-sky-400 mt-1">{selectedEp.timing.dnsMs.toFixed(1)} ms</div>
            </div>
            <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">TCP Handshake</div>
              <div className="text-base font-bold text-indigo-400 mt-1">{selectedEp.timing.tcpMs.toFixed(1)} ms</div>
            </div>
            <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">TLS Connect</div>
              <div className="text-base font-bold text-purple-400 mt-1">{selectedEp.timing.tlsMs.toFixed(1)} ms</div>
            </div>
            <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">TTFB (Server Process)</div>
              <div className="text-base font-bold text-amber-400 mt-1">{selectedEp.timing.ttfbMs.toFixed(1)} ms</div>
            </div>
            <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Content Download</div>
              <div className="text-base font-bold text-emerald-400 mt-1">{selectedEp.timing.downloadMs.toFixed(1)} ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
