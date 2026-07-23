import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { CreateTestPage } from './pages/CreateTestPage';
import { LiveTestPage } from './pages/LiveTestPage';
import { EndpointAnalysisPage } from './pages/EndpointAnalysisPage';
import { BottleneckPage } from './pages/BottleneckPage';
import { ErrorAnalysisPage } from './pages/ErrorAnalysisPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { TestConfig, TestRun } from './types';

const validTabs = [
  'dashboard',
  'create',
  'running',
  'history',
  'api-analysis',
  'bottlenecks',
  'compare',
  'reports',
  'settings',
];

const getInitialTab = (): string => {
  const hash = window.location.hash.replace('#', '');
  if (validTabs.includes(hash)) {
    return hash;
  }
  const saved = localStorage.getItem('loadforge_active_tab');
  if (saved && validTabs.includes(saved)) {
    return saved;
  }
  return 'dashboard';
};

export function App() {
  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(() => {
    return localStorage.getItem('loadforge_selected_run_id') || null;
  });

  const setActiveTab = (tab: string) => {
    if (!validTabs.includes(tab)) return;
    setActiveTabState(tab);
    window.location.hash = tab;
    localStorage.setItem('loadforge_active_tab', tab);
  };

  const handleSelectRun = (run: TestRun, targetTab = 'api-analysis') => {
    setSelectedRunId(run.id);
    localStorage.setItem('loadforge_selected_run_id', run.id);
    setActiveTab(targetTab);
  };

  // Synchronize hash changes (browser back / forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Poll active test & history on mount and every 3 seconds
  const fetchState = async () => {
    try {
      const runsData = await api.getRuns();
      setRuns(runsData);

      const activeRes = await api.getActiveTest();
      if (activeRes.active && activeRes.run) {
        setActiveRun(activeRes.run);
      } else {
        setActiveRun(null);
      }
    } catch (e) {
      console.error('Failed to fetch state:', e);
    }
  };

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleStartTest = async (config: TestConfig) => {
    try {
      const run = await api.startTest(config);
      setActiveRun(run);
      handleSelectRun(run, 'running');
      fetchState();
    } catch (e: any) {
      alert('Error starting test: ' + e.message);
    }
  };

  const handleTestStopped = () => {
    setActiveRun(null);
    fetchState();
  };

  const currentRunToDisplay =
    runs.find((r) => r.id === selectedRunId) ||
    activeRun ||
    (runs.length > 0 ? runs[0] : null);

  return (
    <div className="flex min-h-screen bg-dark-900 text-slate-100 font-sans">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={!!(activeRun && activeRun.status === 'running')}
      />

      <main className="flex-1 overflow-y-auto min-h-screen">
        {activeTab === 'dashboard' && (
          <DashboardPage
            runs={runs}
            activeRun={activeRun}
            onNavigate={setActiveTab}
            onSelectRun={(run) => handleSelectRun(run, 'api-analysis')}
          />
        )}

        {activeTab === 'create' && (
          <CreateTestPage onStartTest={handleStartTest} />
        )}

        {activeTab === 'running' && (
          <LiveTestPage activeRun={activeRun} onTestStopped={handleTestStopped} />
        )}

        {activeTab === 'history' && (
          <DashboardPage
            runs={runs}
            activeRun={activeRun}
            onNavigate={setActiveTab}
            onSelectRun={(run) => handleSelectRun(run, 'api-analysis')}
          />
        )}

        {activeTab === 'api-analysis' && (
          <EndpointAnalysisPage run={currentRunToDisplay} />
        )}

        {activeTab === 'bottlenecks' && (
          <BottleneckPage run={currentRunToDisplay} />
        )}

        {activeTab === 'compare' && (
          <ComparisonPage runs={runs} />
        )}

        {activeTab === 'reports' && (
          <ReportsPage run={currentRunToDisplay} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}

export default App;
