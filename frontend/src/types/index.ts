export type LoadPatternType =
  | 'constant'
  | 'ramp_up'
  | 'ramp_down'
  | 'spike'
  | 'stress'
  | 'soak'
  | 'breakpoint'
  | 'custom';

export interface ProfileStage {
  durationSeconds: number;
  targetUsers: number;
  targetRPS: number;
}

export interface LoadProfile {
  pattern: LoadPatternType;
  durationSeconds: number;
  initialUsers: number;
  targetUsers: number;
  rampUpSeconds: number;
  spikeUsers: number;
  spikeDurationSec: number;
  targetRPS: number;
  thinkTimeMs: number;
  randomDelayMs: number;
  stages?: ProfileStage[];
  breakpointMaxErrors: number;
  breakpointMaxP95Ms: number;
}

export interface ExtractionRule {
  varName: string;
  source: 'body_json' | 'regex' | 'header';
  expression: string;
}

export interface ScenarioStep {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyType: string;
  body: string;
  extractions?: ExtractionRule[];
  thinkTimeMs: number;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'apikey';
  token?: string;
  username?: string;
  password?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
}

export interface ConnectionConfig {
  enableHttp2: boolean;
  keepAlive: boolean;
  maxConnsPerHost: number;
  timeoutMs: number;
  followRedirects: boolean;
  insecureTLS: boolean;
}

export interface TestConfig {
  id: string;
  name: string;
  envName: string;
  baseUrl: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyType: string;
  body: string;
  auth: AuthConfig;
  loadProfile: LoadProfile;
  connection: ConnectionConfig;
  steps?: ScenarioStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestTiming {
  dnsMs: number;
  tcpMs: number;
  tlsMs: number;
  ttfbMs: number;
  downloadMs: number;
  totalMs: number;
}

export interface EndpointStat {
  method: string;
  endpoint: string;
  totalRequests: number;
  rps: number;
  successRate: number;
  errorRate: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  p999Ms: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  timing: RequestTiming;
  isBottleneck: boolean;
}

export interface ErrorDetail {
  id: string;
  testRunId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  errorType: string;
  errorMessage: string;
  reqHeaders?: Record<string, string>;
  reqBody?: string;
  respBody?: string;
}

export interface BottleneckReport {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  endpoint: string;
  method: string;
  errorRate: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  breakingVuCount: number;
  observation: string;
  likelyCause: string;
  evidence: string;
  confidence: number;
  recommendation: string;
}

export interface MetricSnapshot {
  timestamp: number;
  elapsedSec: number;
  currentRPS: number;
  avgRPS: number;
  totalRequests: number;
  successCount: number;
  failedCount: number;
  errorRate: number;
  activeVUs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  p999Ms: number;
  statusCounts: Record<string, number>;
  endpoints: EndpointStat[];
}

export interface SystemMetric {
  timestamp: number;
  cpuUsagePct: number;
  memUsagePct: number;
  dbActiveConn: number;
  networkKbps: number;
}

export interface TestRun {
  id: string;
  testConfigId: string;
  testName: string;
  targetBaseUrl: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: string;
  endTime?: string;
  durationSec: number;
  totalRequests: number;
  successCount: number;
  failedCount: number;
  errorRate: number;
  peakRPS: number;
  avgRPS: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxVUs: number;
  breakingVUs: number;
  config: TestConfig;
  latestSnapshot?: MetricSnapshot;
  timeSeries?: MetricSnapshot[];
  endpoints?: EndpointStat[];
  errors?: ErrorDetail[];
  bottlenecks?: BottleneckReport[];
  systemMetrics?: SystemMetric[];
}

export interface EndpointDiff {
  method: string;
  endpoint: string;
  baseP95Ms: number;
  targetP95Ms: number;
  pctChangeP95: number;
  baseErrorPct: number;
  targetErrorPct: number;
  hasRegression: boolean;
}

export interface ComparisonResult {
  baselineRunId: string;
  baselineName: string;
  targetRunId: string;
  targetName: string;
  deltaRPS: number;
  deltaP95Ms: number;
  deltaErrorRate: number;
  regressionAlert: 'REGRESSION DETECTED' | 'IMPROVED' | 'STABLE';
  culpritEndpoint?: string;
  summaryText: string;
  endpointDiffs: EndpointDiff[];
}
