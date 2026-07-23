import React from 'react';
import { TestRun } from '../types';
import {
  FileText,
  Download,
  FileCode,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertOctagon,
  Zap,
  ShieldAlert
} from 'lucide-react';

interface ReportsPageProps {
  run: TestRun | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ run }) => {
  if (!run) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto mt-12 bg-dark-800 border border-slate-800 rounded-2xl">
        <FileText className="w-12 h-12 mx-auto text-sky-400 opacity-60" />
        <h2 className="text-lg font-bold text-white">No Test Run Selected for Export</h2>
        <p className="text-xs">Run a load test or select a historical test from history to generate downloadable HTML/PDF/JSON reports.</p>
      </div>
    );
  }

  const isFailed = run.errorRate > 5.0;

  const handleDownload = (format: 'html' | 'json' | 'csv') => {
    const url = `/api/reports/${run.id}/${format}`;
    window.open(url, '_blank');
  };

  const handlePrintPDF = () => {
    window.open(`/api/reports/${run.id}/html`, '_blank');
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-400" /> Performance Report Exporter
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate executive HTML, PDF, JSON, and CSV benchmarks for <strong className="text-sky-300">{run.testName}</strong>
          </p>
        </div>

        {/* Download Buttons Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('html')}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-4 py-2 rounded-xl text-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> HTML Report
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={() => handleDownload('json')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5" /> JSON Data
          </button>
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Spreadsheet
          </button>
        </div>
      </div>

      {/* Interactive Report Executive Card */}
      <div className="bg-dark-800 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="text-xs font-bold text-sky-400 uppercase tracking-widest">LoadForge Executive Summary</div>
            <h2 className="text-xl font-extrabold text-white mt-1">{run.testName}</h2>
            <div className="text-xs text-slate-400 font-mono mt-1">
              Target Base URL: {run.targetBaseUrl} | Executed: {new Date(run.startTime).toLocaleString()}
            </div>
          </div>

          <div>
            {isFailed ? (
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 uppercase">
                <AlertOctagon className="w-4 h-4" /> TEST FAILED (Error Rate &gt; 5%)
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4" /> TEST PASSED
              </span>
            )}
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-900 p-4 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Requests</div>
            <div className="text-xl font-extrabold text-white mt-1">{run.totalRequests.toLocaleString()}</div>
          </div>

          <div className="bg-dark-900 p-4 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Peak Throughput</div>
            <div className="text-xl font-extrabold text-sky-400 mt-1">{run.peakRPS.toFixed(1)} RPS</div>
          </div>

          <div className="bg-dark-900 p-4 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">P95 Latency</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">{run.p95LatencyMs.toFixed(0)} ms</div>
          </div>

          <div className="bg-dark-900 p-4 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Error Rate</div>
            <div className={`text-xl font-extrabold mt-1 ${isFailed ? 'text-rose-400' : 'text-emerald-400'}`}>
              {run.errorRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-dark-900/60 p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Key Conclusion & Next Action Recommendation
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {run.bottlenecks && run.bottlenecks.length > 0
              ? run.bottlenecks[0].recommendation
              : 'Target application handled load with minimal latency degradation. Recommend setting up continuous regression testing in CI/CD pipeline.'}
          </p>
        </div>
      </div>
    </div>
  );
};
