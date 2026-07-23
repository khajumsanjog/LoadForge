import React, { useState } from 'react';
import { TestConfig, LoadPatternType, ScenarioStep } from '../types';
import { api } from '../services/api';
import {
  Play,
  Save,
  Plus,
  Trash2,
  FileCode,
  Layers,
  Settings2,
  Zap,
  Globe,
  Lock,
  Code2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface CreateTestPageProps {
  onStartTest: (config: TestConfig) => void;
}

export const CreateTestPage: React.FC<CreateTestPageProps> = ({ onStartTest }) => {
  const [activeSubTab, setActiveSubTab] = useState<'configure' | 'scenario' | 'import'>('configure');

  // Form State
  const [testName, setTestName] = useState('E-Commerce API Load Benchmark');
  const [envName, setEnvName] = useState('Staging');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/mock/echo');
  const [headersText, setHeadersText] = useState('Content-Type: application/json\nUser-Agent: LoadForge/1.0');
  const [bodyType, setBodyType] = useState('json');
  const [body, setBody] = useState('{\n  "sku": "ITEM-101",\n  "quantity": 2\n}');

  // Auth State
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apikey'>('none');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Load Profile State
  const [pattern, setPattern] = useState<LoadPatternType>('ramp_up');
  const [durationSec, setDurationSec] = useState(30);
  const [targetUsers, setTargetUsers] = useState(100);
  const [initialUsers, setInitialUsers] = useState(10);
  const [rampUpSec, setRampUpSec] = useState(10);
  const [targetRPS, setTargetRPS] = useState(0);

  // Import State
  const [importType, setImportType] = useState<'curl' | 'postman' | 'openapi'>('curl');
  const [importContent, setImportContent] = useState('curl -X POST http://localhost:8080/api/mock/echo -H "Content-Type: application/json" -d \'{"test":true}\'');

  // Scenarios State
  const [steps, setSteps] = useState<ScenarioStep[]>([
    {
      id: 'step_1',
      name: 'Get Auth Token',
      method: 'POST',
      url: '{{base_url}}/api/mock/echo',
      bodyType: 'json',
      body: '{"username":"admin","password":"secret"}',
      thinkTimeMs: 100,
    },
    {
      id: 'step_2',
      name: 'Fetch Products List',
      method: 'GET',
      url: '{{base_url}}/api/mock/slow',
      bodyType: 'json',
      body: '',
      thinkTimeMs: 200,
    },
  ]);

  // Preview Load Profile Data for Recharts
  const generatePreviewData = () => {
    const data = [];
    const points = 20;
    const interval = durationSec / points;
    for (let i = 0; i <= points; i++) {
      const t = i * interval;
      let vus = initialUsers;

      if (pattern === 'constant') {
        vus = targetUsers;
      } else if (pattern === 'ramp_up') {
        if (t >= rampUpSec) vus = targetUsers;
        else vus = initialUsers + Math.floor((t / rampUpSec) * (targetUsers - initialUsers));
      } else if (pattern === 'spike') {
        if (t >= durationSec / 3 && t <= (durationSec / 3) + 5) vus = targetUsers * 5;
        else vus = initialUsers;
      } else if (pattern === 'stress') {
        vus = initialUsers + Math.floor(t * 5);
      } else {
        vus = targetUsers;
      }
      data.push({ time: `${Math.round(t)}s`, vus });
    }
    return data;
  };

  const handleImport = async () => {
    try {
      let cfg: TestConfig;
      if (importType === 'curl') {
        cfg = await api.importCURL(importContent);
      } else if (importType === 'postman') {
        cfg = await api.importPostman(importContent);
      } else {
        cfg = await api.importOpenAPI(importContent);
      }

      setTestName(cfg.name);
      setBaseUrl(cfg.baseUrl);
      setMethod(cfg.method);
      setPath(cfg.path);
      if (cfg.steps && cfg.steps.length > 0) {
        setSteps(cfg.steps);
      }
      setActiveSubTab('configure');
      alert('Imported configuration successfully!');
    } catch (e: any) {
      alert('Import failed: ' + e.message);
    }
  };

  const handleLaunch = () => {
    const headersMap: Record<string, string> = {};
    headersText.split('\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length === 2) {
        headersMap[parts[0].trim()] = parts[1].trim();
      }
    });

    const config: TestConfig = {
      id: `cfg_${Date.now()}`,
      name: testName,
      envName: envName,
      baseUrl: baseUrl,
      method: method,
      path: path,
      headers: headersMap,
      bodyType: bodyType,
      body: body,
      auth: {
        type: authType,
        token,
        username,
        password,
      },
      loadProfile: {
        pattern,
        durationSeconds: durationSec,
        initialUsers,
        targetUsers,
        rampUpSeconds: rampUpSec,
        spikeUsers: targetUsers * 3,
        spikeDurationSec: 5,
        targetRPS,
        thinkTimeMs: 50,
        randomDelayMs: 20,
        breakpointMaxErrors: 5.0,
        breakpointMaxP95Ms: 2000.0,
      },
      connection: {
        enableHttp2: true,
        keepAlive: true,
        maxConnsPerHost: 500,
        timeoutMs: 10000,
        followRedirects: true,
        insecureTLS: true,
      },
      steps: activeSubTab === 'scenario' ? steps : undefined,
    };

    onStartTest(config);
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create & Configure Load Test</h1>
          <p className="text-slate-400 text-sm mt-1">Design target HTTP scenarios, concurrency patterns, and user journeys</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Execute Test</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('configure')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeSubTab === 'configure'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>HTTP Request & Pattern</span>
        </button>
        <button
          onClick={() => setActiveSubTab('scenario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeSubTab === 'scenario'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>User Journey Scenarios ({steps.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeSubTab === 'import'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Import (OpenAPI / Postman / cURL)</span>
        </button>
      </div>

      {activeSubTab === 'import' && (
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-sky-400" /> Import Definition
          </h2>
          <div className="flex gap-4">
            {(['curl', 'postman', 'openapi'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setImportType(type)}
                className={`px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider ${
                  importType === type ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <textarea
            value={importContent}
            onChange={(e) => setImportContent(e.target.value)}
            rows={8}
            className="w-full bg-dark-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-sky-300 focus:outline-none focus:border-sky-500"
            placeholder="Paste your cURL command, Postman JSON collection, or OpenAPI YAML/JSON spec here..."
          />
          <button
            onClick={handleImport}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Parse & Convert to Test Config
          </button>
        </div>
      )}

      {activeSubTab === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Request Config Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Card */}
            <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" /> Target URL & Methods
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Test Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Environment</label>
                  <input
                    type="text"
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-dark-900 border border-slate-700 rounded-xl px-3 py-2.5 font-bold text-sm text-sky-400 focus:border-sky-500"
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Base URL (e.g. http://localhost:8080)"
                  className="flex-1 bg-dark-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-sky-500"
                />
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/path"
                  className="w-1/3 bg-dark-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-sky-500"
                />
              </div>
            </div>

            {/* Request Payload & Headers */}
            <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" /> Headers & Request Body
              </h2>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">HTTP Headers (Key: Value per line)</label>
                <textarea
                  value={headersText}
                  onChange={(e) => setHeadersText(e.target.value)}
                  rows={3}
                  className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl p-3 font-mono text-xs text-sky-300 focus:border-sky-500"
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Request Body (JSON)</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl p-3 font-mono text-xs text-sky-300 focus:border-sky-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Load Profile Sidebar Visualizer */}
          <div className="space-y-6">
            <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" /> Load Pattern & Concurrency
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Pattern Strategy</label>
                <select
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value as LoadPatternType)}
                  className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-sky-500"
                >
                  <option value="constant">Constant Load</option>
                  <option value="ramp_up">Ramp Up</option>
                  <option value="spike">Spike Test</option>
                  <option value="stress">Stress Test</option>
                  <option value="soak">Soak Test</option>
                  <option value="breakpoint">Breakpoint Auto-Stop</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Duration (Sec)</label>
                  <input
                    type="number"
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Target VUs</label>
                  <input
                    type="number"
                    value={targetUsers}
                    onChange={(e) => setTargetUsers(Number(e.target.value))}
                    className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {pattern === 'ramp_up' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Ramp-Up Time (Sec)</label>
                  <input
                    type="number"
                    value={rampUpSec}
                    onChange={(e) => setRampUpSec(Number(e.target.value))}
                    className="w-full mt-1 bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              )}

              {/* Visual Curve Chart */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-400 mb-2">Simulated Load Curve Preview</div>
                <div className="h-36 w-full bg-dark-900/80 rounded-xl p-2 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generatePreviewData()}>
                      <defs>
                        <linearGradient id="colorVU" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="vus" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorVU)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'scenario' && (
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Multi-Step Scenario User Journey</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sequential steps passing extracted variables (e.g. token extraction)</p>
            </div>
            <button
              onClick={() =>
                setSteps([
                  ...steps,
                  {
                    id: `step_${steps.length + 1}`,
                    name: `New Step ${steps.length + 1}`,
                    method: 'GET',
                    url: '{{base_url}}/api/endpoint',
                    bodyType: 'json',
                    body: '',
                    thinkTimeMs: 100,
                  },
                ])
              }
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Journey Step
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="bg-dark-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-500/30">
                  #{idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx].name = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="font-bold text-sm bg-dark-800 text-white px-3 py-1.5 rounded-lg border border-slate-700"
                    />
                    <select
                      value={step.method}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx].method = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="font-bold text-xs bg-dark-800 text-sky-400 px-3 py-1.5 rounded-lg border border-slate-700"
                    >
                      {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={step.url}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx].url = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="flex-1 font-mono text-xs bg-dark-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
