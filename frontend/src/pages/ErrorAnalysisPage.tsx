import React, { useState } from 'react';
import { TestRun, ErrorDetail } from '../types';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Code2,
  Clock,
  Lock,
  X,
  FileText
} from 'lucide-react';

interface ErrorAnalysisPageProps {
  run: TestRun | null;
}

export const ErrorAnalysisPage: React.FC<ErrorAnalysisPageProps> = ({ run }) => {
  const [maskSecrets, setMaskSecrets] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorDetail | null>(null);

  if (!run || !run.errors || run.errors.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 max-w-xl mx-auto mt-12 bg-dark-800 border border-slate-800 rounded-2xl">
        <AlertCircle className="w-12 h-12 mx-auto text-emerald-400 opacity-60" />
        <h2 className="text-lg font-bold text-white">Zero Request Errors Recorded</h2>
        <p className="text-xs">All requests executed cleanly with 2xx/3xx HTTP status codes in this test run!</p>
      </div>
    );
  }

  // Group errors by Endpoint & Status Code
  const groupedErrors: Record<string, ErrorDetail[]> = {};
  run.errors.forEach((err) => {
    const key = `${err.method} ${err.endpoint} (Status: ${err.statusCode || 'Net Error'})`;
    if (!groupedErrors[key]) groupedErrors[key] = [];
    groupedErrors[key].push(err);
  });

  const sanitizeText = (text?: string) => {
    if (!text) return '';
    if (!maskSecrets) return text;
    let res = text;
    res = res.replace(/("token"\s*:\s*")[^"]+(")/gi, '$1[MASKED_SECRET]$2');
    res = res.replace(/("password"\s*:\s*")[^"]+(")/gi, '$1[MASKED_SECRET]$2');
    res = res.replace(/(Bearer\s+)[^\s"']+/gi, '$1[MASKED_TOKEN]');
    return res;
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-400" /> Error & Payload Inspector
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Grouped error traces, failed request headers, and response payloads for <strong className="text-sky-300">{run.testName}</strong>
          </p>
        </div>

        <button
          onClick={() => setMaskSecrets(!maskSecrets)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
            maskSecrets
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}
        >
          {maskSecrets ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>Secret Masking: {maskSecrets ? 'ENABLED' : 'DISABLED'}</span>
        </button>
      </div>

      {/* Grouped Errors List */}
      <div className="space-y-6">
        {Object.entries(groupedErrors).map(([groupTitle, errList]) => (
          <div key={groupTitle} className="bg-dark-800 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 bg-dark-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="font-mono text-sm font-bold text-rose-400">{groupTitle}</div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {errList.length} Errors Captured
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {errList.slice(0, 5).map((errItem) => (
                <div
                  key={errItem.id}
                  onClick={() => setSelectedError(errItem)}
                  className="p-4 hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-slate-400">{new Date(errItem.timestamp).toLocaleTimeString()}</span>
                    <span className="font-semibold text-xs text-slate-200">{errItem.errorMessage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-400">{errItem.latencyMs.toFixed(0)} ms</span>
                    <button className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold">
                      Inspect Payload <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Payload Modal / Drawer */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-dark-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-400" /> Error Request / Response Payload
              </h3>
              <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Endpoint:</span> <span className="text-sky-300 font-bold">{selectedError.method} {selectedError.endpoint}</span>
              </div>
              <div className="bg-dark-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Status Code:</span> <span className="text-rose-400 font-bold">{selectedError.statusCode}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Request Body Payload</label>
              <pre className="mt-1 bg-dark-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-300 overflow-x-auto">
                {sanitizeText(selectedError.reqBody) || '(Empty Body)'}
              </pre>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Response Body Payload</label>
              <pre className="mt-1 bg-dark-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-rose-300 overflow-x-auto max-h-48">
                {sanitizeText(selectedError.respBody) || '(Empty Response)'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
