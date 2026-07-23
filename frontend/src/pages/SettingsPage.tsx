import React from 'react';
import { Settings, Shield, Lock, HardDrive, AlertTriangle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-sky-400" /> LoadForge Platform Settings & Security
        </h1>
        <p className="text-slate-400 text-sm mt-1">Local persistence, safety guardrails, and secret masking configurations</p>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4 text-amber-300 text-xs leading-relaxed">
        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-200 font-bold block mb-1">AUTHORIZED TESTING NOTICE</strong>
          Only test applications, endpoints, and systems you own or have explicit written authorization to test. High concurrency load testing against unauthorized targets may violate terms of service or local regulation.
        </div>
      </div>

      {/* Settings Grid */}
      <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" /> Safety & Sanitization
        </h2>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-4 bg-dark-900 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-slate-200">Automatic Secret & Token Masking</div>
              <p className="text-slate-400 mt-0.5">Mask Bearer tokens, API keys, passwords, and Authorization headers in HTML/PDF export reports.</p>
            </div>
            <span className="px-3 py-1 rounded-full font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ENABLED BY DEFAULT
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-dark-900 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-slate-200">Localhost Isolation Policy</div>
              <p className="text-slate-400 mt-0.5">LoadForge backend listens exclusively on localhost loopback interfaces to prevent unauthorized remote network triggers.</p>
            </div>
            <span className="px-3 py-1 rounded-full font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-dark-900 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-slate-200">SQLite Local Persistence</div>
              <p className="text-slate-400 mt-0.5">Database stored locally at <code className="font-mono text-sky-300">~/.loadforge/loadforge.db</code>. No external database servers required.</p>
            </div>
            <span className="px-3 py-1 rounded-full font-extrabold bg-slate-800 text-slate-300">
              EMBEDDED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
