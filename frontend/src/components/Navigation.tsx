import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  PlusCircle,
  History,
  BarChart3,
  AlertTriangle,
  GitCompare,
  FileText,
  Settings,
  Activity,
  Zap
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRunning: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Test', icon: PlusCircle },
    {
      id: 'running',
      label: 'Live Test',
      icon: PlayCircle,
      badge: isRunning ? 'RUNNING' : undefined,
    },
    { id: 'history', label: 'Test History', icon: History },
    { id: 'api-analysis', label: 'API Analysis', icon: BarChart3 },
    { id: 'bottlenecks', label: 'Bottlenecks', icon: AlertTriangle },
    { id: 'compare', label: 'Comparisons', icon: GitCompare },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-wide flex items-center gap-1.5">
            LoadForge <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-medium">v1.0</span>
          </h1>
          <p className="text-xs text-slate-400">Local-First Observability</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="p-4 border-t border-slate-800 bg-dark-900/40">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Local Engine</span>
          </div>
          <span className="text-emerald-400 font-mono font-semibold">READY</span>
        </div>
      </div>
    </aside>
  );
};
