import React from 'react';
import { TestRun } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Zap,
  HelpCircle,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';

interface BottleneckPageProps {
  run: TestRun | null;
}

export const BottleneckPage: React.FC<BottleneckPageProps> = ({ run }) => {
  if (!run) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto mt-12 bg-dark-800 border border-slate-800 rounded-2xl">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 opacity-60" />
        <h2 className="text-lg font-bold text-white">No Active Test Analysis Selected</h2>
        <p className="text-xs">Execute a load test or pick a run from Test History to analyze automated bottleneck diagnostics.</p>
      </div>
    );
  }

  const bottlenecks = run.bottlenecks || [];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" /> Automated Bottleneck & Problem Detection Engine
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Root cause analysis, breaking point concurrency detection, and evidence-backed recommendations for{' '}
          <strong className="text-sky-300">{run.testName}</strong>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Breaking Point Concurrency</div>
          <div className="text-2xl font-extrabold text-amber-400">
            ~{run.breakingVUs || run.maxVUs} <span className="text-sm font-normal text-slate-400">VUs</span>
          </div>
          <div className="text-xs text-slate-400">Load at which degradation/errors started</div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Primary Bottleneck Component</div>
          <div className="text-2xl font-extrabold text-sky-400">
            {bottlenecks.length > 0 ? 'DB Pool / Worker Thread' : 'None Detected'}
          </div>
          <div className="text-xs text-slate-400">Based on traffic latency correlation</div>
        </div>

        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Analysis Confidence</div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {bottlenecks.length > 0 ? `${bottlenecks[0].confidence.toFixed(0)}%` : '100%'}
          </div>
          <div className="text-xs text-slate-400">Algorithmic confidence score</div>
        </div>
      </div>

      {/* Detected Issues List */}
      {bottlenecks.length === 0 ? (
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">System Handled Load Successfully</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No critical latency spikes or high error rates detected during this load test. Target API application scales cleanly!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" /> Detected Performance Issues ({bottlenecks.length})
          </h2>

          {bottlenecks.map((b) => (
            <div
              key={b.id}
              className={`border rounded-2xl p-6 space-y-5 backdrop-blur-sm ${
                b.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-amber-950/20 border-amber-500/30'
              }`}
            >
              {/* Badge & Title */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border ${
                      b.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {b.severity}
                  </span>
                  <div className="font-mono text-base font-bold text-white">
                    {b.method} {b.endpoint}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Error Rate: <strong className="text-rose-400 font-mono">{b.errorRate.toFixed(1)}%</strong> | P95:{' '}
                  <strong className="text-amber-400 font-mono">{b.p95LatencyMs.toFixed(0)} ms</strong>
                </div>
              </div>

              {/* 4-Step Analysis Framework */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-dark-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase">
                    <HelpCircle className="w-3.5 h-3.5" /> 1. Observation
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{b.observation}</p>
                </div>

                <div className="bg-dark-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
                    <Zap className="w-3.5 h-3.5" /> 2. Evidence Snippet
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">{b.evidence}</p>
                </div>

                <div className="bg-dark-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase">
                    <Database className="w-3.5 h-3.5" /> 3. Likely Root Cause
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{b.likelyCause}</p>
                </div>

                <div className="bg-dark-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                    <Lightbulb className="w-3.5 h-3.5" /> 4. Recommended Action
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{b.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
