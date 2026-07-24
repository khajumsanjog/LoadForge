import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Code2,
  Zap,
  Layers,
  FileCode,
  BarChart3,
  Shield,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle,
  Lightbulb,
  Github
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const docSections = [
    {
      id: 'getting-started',
      title: '🚀 Getting Started',
      description: 'Quick start guide, single binary execution & architecture overview',
    },
    {
      id: 'load-patterns',
      title: '⚡ Load Testing Patterns',
      description: 'Constant, Ramp-Up, Spike, Stress, Soak & Breakpoint auto-stop',
    },
    {
      id: 'scenarios',
      title: '🔄 Multi-Step Scenarios',
      description: 'User journeys, variable interpolation & response extractions',
    },
    {
      id: 'importers',
      title: '📥 Importing Definitions',
      description: 'OpenAPI / Swagger, Postman Collections, cURL commands & HAR',
    },
    {
      id: 'metrics',
      title: '📊 Metrics & Quantiles',
      description: 'P50, P95, P99 latency percentiles & request timing waterfalls',
    },
    {
      id: 'api-reference',
      title: '🛠️ REST & WebSocket API',
      description: 'Complete backend REST endpoints & WebSocket telemetry format',
    },
    {
      id: 'security',
      title: '🛡️ Security & Privacy',
      description: 'Localhost isolation policy & automatic secret payload masking',
    },
  ];

  const filteredSections = docSections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0d1117] text-slate-100 font-sans overflow-hidden">
      {/* GitHub Docs Left Sidebar Navigation */}
      <aside className="w-72 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full shrink-0">
        {/* Header & Search */}
        <div className="p-5 border-b border-[#30363d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>LoadForge Docs</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Section List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Documentation Topics
          </div>
          {filteredSections.map((sec) => {
            const isActive = activeTopic === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTopic(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/30'
                    : 'text-slate-300 hover:bg-[#21262d] hover:text-white'
                }`}
              >
                <span>{sec.title}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117]/60 text-xs text-slate-400 flex items-center justify-between">
          <span>Version 1.0.0</span>
          <span className="text-emerald-400 font-mono font-semibold">Self-Hosted</span>
        </div>
      </aside>

      {/* Main Documentation Viewer Area */}
      <main className="flex-1 overflow-y-auto p-10 max-w-4xl space-y-10">
        {/* GETTING STARTED */}
        {activeTopic === 'getting-started' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Overview</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">LoadForge Getting Started Guide</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                LoadForge is a local-first, self-hosted performance testing and observability platform designed as a modern, user-friendly alternative to Apache JMeter, Locust, and k6.
              </p>
            </div>

            {/* Callout */}
            <div className="bg-[#161b22] border-l-4 border-sky-500 rounded-r-xl p-4 text-xs text-slate-300 space-y-1">
              <strong className="text-sky-400 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Single Executable Architecture
              </strong>
              <p>
                LoadForge runs out-of-the-box as a compiled binary. You do not need to install Node.js, Python, Redis, or MySQL. Embedded SQLite handles local persistence.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Running LoadForge via Command Line</h2>
              <p className="text-xs text-slate-400">Download or build the binary and launch it in your terminal:</p>

              <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-4 font-mono text-xs text-sky-300">
                <button
                  onClick={() => copyToClipboard('./loadforge -port 8080 -browser', 'cmd1')}
                  className="absolute right-3 top-3 p-1.5 rounded-md hover:bg-[#30363d] text-slate-400 hover:text-white transition"
                  title="Copy command"
                >
                  {copiedCode === 'cmd1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <code>./loadforge -port 8080 -browser</code>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">CLI Flags & Parameters</h2>
              <div className="overflow-x-auto bg-[#161b22] border border-[#30363d] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#21262d] text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="p-3">Flag</th>
                      <th className="p-3">Default</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d] font-mono text-slate-300">
                    <tr>
                      <td className="p-3 text-sky-400 font-bold">-port</td>
                      <td className="p-3">8080</td>
                      <td className="p-3 font-sans">HTTP server port for dashboard & API</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sky-400 font-bold">-db</td>
                      <td className="p-3">~/.loadforge/loadforge.db</td>
                      <td className="p-3 font-sans">SQLite database storage file path</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sky-400 font-bold">-browser</td>
                      <td className="p-3">false</td>
                      <td className="p-3 font-sans">Automatically opens web dashboard in default browser on launch</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LOAD PATTERNS */}
        {activeTopic === 'load-patterns' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Traffic Strategy</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Load Testing Patterns</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                LoadForge supports multiple load generation profile strategies to test server baseline performance, ramp-up stability, and breaking points.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <span className="font-bold text-sky-400 block text-sm">Constant Load</span>
                <p className="text-slate-400 leading-relaxed">
                  Maintains a fixed number of concurrent virtual users (VUs) for a set duration (e.g. 100 VUs for 5 minutes). Great for measuring steady-state throughput and baseline latency.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <span className="font-bold text-sky-400 block text-sm">Ramp Up</span>
                <p className="text-slate-400 leading-relaxed">
                  Gradually escalates user concurrency over time (e.g. 10 VUs → 500 VUs over 2 minutes). Helps identify the exact load where latency begins to degrade.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <span className="font-bold text-sky-400 block text-sm">Spike Test</span>
                <p className="text-slate-400 leading-relaxed">
                  Simulates sudden massive traffic surges (e.g. 20 VUs → 2,000 VUs in 5 seconds). Tests auto-scaling response time and circuit breakers.
                </p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <span className="font-bold text-sky-400 block text-sm">Breakpoint Auto-Stop</span>
                <p className="text-slate-400 leading-relaxed">
                  Automatically increases traffic until error rate exceeds threshold (e.g. &gt;5% 5xx errors) or P95 latency exceeds target limit. Pinpoints breaking point concurrency.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MULTI-STEP SCENARIOS */}
        {activeTopic === 'scenarios' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">User Journeys</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Multi-Step API Scenarios</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Define realistic multi-step user journeys (e.g. Login → Extract JWT Token → Fetch Catalog → Checkout Order) with dynamic variable passing.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Dynamic Variables & Extractions</h2>
              <p className="text-xs text-slate-400">
                Use <code className="text-sky-300 font-mono">{`{{base_url}}`}</code> and extracted variables in headers or request bodies:
              </p>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 font-mono text-xs text-sky-300 space-y-2">
                <div>Step 1 Response (JSON):</div>
                <pre className="text-slate-300">{`{\n  "token": "eyJhbGciOiJIUzI1Ni..."\n}`}</pre>
                <div className="pt-2 text-emerald-400">Extraction Rule: source="body_json", varName="jwt_token", expression="$.token"</div>
                <div className="pt-2 text-indigo-400">Step 2 Header: Authorization: Bearer {`{{jwt_token}}`}</div>
              </div>
            </div>
          </div>
        )}

        {/* IMPORTERS */}
        {activeTopic === 'importers' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Converters</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Importing API Definitions</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Convert existing OpenAPI/Swagger specs, Postman Collections, cURL command strings, or HAR files directly into LoadForge load test configurations.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-xs text-slate-300 space-y-2">
              <strong className="text-sky-400 font-bold block">Supported Importer Formats:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong>cURL String</strong>: Paste standard cURL requests; automatically parses HTTP method, URL, headers, and request body payload.</li>
                <li><strong>Postman Collection v2.1</strong>: Converts all collection items and folders into sequential journey steps.</li>
                <li><strong>OpenAPI v2/v3 / Swagger</strong>: Converts path operations into load testing endpoints.</li>
              </ul>
            </div>
          </div>
        )}

        {/* METRICS & QUANTILES */}
        {activeTopic === 'metrics' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Telemetry</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Metrics, Percentiles & Waterfalls</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Understand how LoadForge calculates requests per second (RPS), latency quantiles, and timing waterfalls.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-1">
                <span className="font-bold text-emerald-400 block text-sm">P50 (Median Latency)</span>
                <p className="text-slate-400">50% of requests were faster than this value. Represents typical user experience.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-1">
                <span className="font-bold text-amber-400 block text-sm">P95 & P99 Tail Latency</span>
                <p className="text-slate-400">95% and 99% of requests were faster than these times. Critical for detecting server thread queueing and database lock contention.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-1">
                <span className="font-bold text-sky-400 block text-sm">Timing Waterfall Breakdown</span>
                <p className="text-slate-400">Measures DNS Lookup + TCP Connect + TLS Handshake + Time to First Byte (TTFB) + Content Download time for every endpoint.</p>
              </div>
            </div>
          </div>
        )}

        {/* REST & WEBSOCKET API REFERENCE */}
        {activeTopic === 'api-reference' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Developer API</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">REST API & WebSocket Reference</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Integrate LoadForge with your local scripts, CI/CD automation pipelines, or custom dashboards.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                  <span className="text-white font-bold">/api/configs</span>
                </div>
                <p className="text-slate-400 font-sans">Returns list of saved load test configurations.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">POST</span>
                  <span className="text-white font-bold">/api/tests/start</span>
                </div>
                <p className="text-slate-400 font-sans">Starts a new load test run asynchronously with the provided JSON TestConfig payload.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">POST</span>
                  <span className="text-white font-bold">/api/tests/stop</span>
                </div>
                <p className="text-slate-400 font-sans">Stops the currently executing load test.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">WS</span>
                  <span className="text-white font-bold">/ws</span>
                </div>
                <p className="text-slate-400 font-sans">WebSocket connection endpoint broadcasting real-time metric snapshots at sub-second intervals.</p>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY & PRIVACY */}
        {activeTopic === 'security' && (
          <div className="space-y-6">
            <div className="border-b border-[#30363d] pb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono">Safety</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Security & Privacy Policy</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                LoadForge prioritizes local-first privacy, local SQLite storage, and automatic payload secret sanitization.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 text-xs text-slate-300 space-y-3">
              <strong className="text-emerald-400 font-bold block text-sm">Security Policy Principles:</strong>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li><strong>Localhost Loopback Isolation</strong>: Server binds to local interfaces so remote unauthenticated external networks cannot trigger load tests.</li>
                <li><strong>Automatic Secret Masking</strong>: Authorization headers, JWT tokens, API keys, and passwords are automatically masked (`[MASKED_SECRET]`) in exports and saved reports.</li>
                <li><strong>No Telemetry Phone Home</strong>: LoadForge sends zero telemetry or metrics to external servers. All data resides inside your local SQLite database.</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
