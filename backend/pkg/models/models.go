package models

import "time"

// LoadPatternType defines traffic generation strategy
type LoadPatternType string

const (
	PatternConstant   LoadPatternType = "constant"
	PatternRampUp     LoadPatternType = "ramp_up"
	PatternRampDown   LoadPatternType = "ramp_down"
	PatternSpike      LoadPatternType = "spike"
	PatternStress     LoadPatternType = "stress"
	PatternSoak       LoadPatternType = "soak"
	PatternBreakpoint LoadPatternType = "breakpoint"
	PatternCustom     LoadPatternType = "custom"
)

// ProfileStage defines a single phase in custom or stepped load profiles
type ProfileStage struct {
	DurationSeconds int `json:"durationSeconds"`
	TargetUsers     int `json:"targetUsers"`
	TargetRPS       int `json:"targetRPS"`
}

// LoadProfile configures how traffic ramps over time
type LoadProfile struct {
	Pattern             LoadPatternType `json:"pattern"`
	DurationSeconds     int             `json:"durationSeconds"`
	InitialUsers        int             `json:"initialUsers"`
	TargetUsers         int             `json:"targetUsers"`
	RampUpSeconds       int             `json:"rampUpSeconds"`
	SpikeUsers          int             `json:"spikeUsers"`
	SpikeDurationSec    int             `json:"spikeDurationSec"`
	TargetRPS           int             `json:"targetRPS"` // 0 = unthrottled
	ThinkTimeMs         int             `json:"thinkTimeMs"`
	RandomDelayMs       int             `json:"randomDelayMs"`
	Stages              []ProfileStage  `json:"stages,omitempty"`
	BreakpointMaxErrors float64         `json:"breakpointMaxErrors"` // Stop if error rate > X%
	BreakpointMaxP95Ms  float64         `json:"breakpointMaxP95Ms"`  // Stop if P95 > X ms
}

// ExtractionRule extracts values from step responses into scenario variables
type ExtractionRule struct {
	VarName    string `json:"varName"`
	Source     string `json:"source"` // "body_json", "regex", "header"
	Expression string `json:"expression"`
}

// ScenarioStep represents a single HTTP request in a multi-step user journey
type ScenarioStep struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Method       string            `json:"method"`
	URL          string            `json:"url"`
	Headers      map[string]string `json:"headers,omitempty"`
	QueryParams  map[string]string `json:"queryParams,omitempty"`
	BodyType     string            `json:"bodyType"` // "json", "form", "raw"
	Body         string            `json:"body"`
	Extractions  []ExtractionRule  `json:"extractions,omitempty"`
	ThinkTimeMs  int               `json:"thinkTimeMs"`
}

// AuthConfig defines authentication details
type AuthConfig struct {
	Type        string `json:"type"` // "none", "bearer", "basic", "apikey"
	Token       string `json:"token"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	APIKeyHeader string `json:"apiKeyHeader"`
	APIKeyValue string `json:"apiKeyValue"`
}

// ConnectionConfig defines network transport tuning
type ConnectionConfig struct {
	EnableHTTP2       bool `json:"enableHttp2"`
	KeepAlive         bool `json:"keepAlive"`
	MaxConnsPerHost   int  `json:"maxConnsPerHost"`
	TimeoutMs         int  `json:"timeoutMs"`
	FollowRedirects   bool `json:"followRedirects"`
	InsecureTLS       bool `json:"insecureTLS"`
}

// TestConfig defines full configuration for a load test
type TestConfig struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	EnvName     string           `json:"envName"`
	BaseURL     string           `json:"baseUrl"`
	Method      string           `json:"method"`
	Path        string           `json:"path"`
	Headers     map[string]string `json:"headers,omitempty"`
	QueryParams map[string]string `json:"queryParams,omitempty"`
	BodyType    string           `json:"bodyType"`
	Body        string           `json:"body"`
	Auth        AuthConfig       `json:"auth"`
	LoadProfile LoadProfile      `json:"loadProfile"`
	Connection  ConnectionConfig `json:"connection"`
	Steps       []ScenarioStep   `json:"steps,omitempty"` // For scenario user journeys
	CreatedAt   time.Time        `json:"createdAt"`
	UpdatedAt   time.Time        `json:"updatedAt"`
}

// RequestTiming Waterfall detailed metrics
type RequestTiming struct {
	DNSMs       float64 `json:"dnsMs"`
	TCPMs       float64 `json:"tcpMs"`
	TLSMs       float64 `json:"tlsMs"`
	TTFBMs      float64 `json:"ttfbMs"`
	DownloadMs  float64 `json:"downloadMs"`
	TotalMs     float64 `json:"totalMs"`
}

// EndpointStat details statistics per HTTP endpoint
type EndpointStat struct {
	Method       string            `json:"method"`
	Endpoint     string            `json:"endpoint"`
	TotalRequests int64            `json:"totalRequests"`
	RPS          float64           `json:"rps"`
	SuccessRate  float64           `json:"successRate"`
	ErrorRate    float64           `json:"errorRate"`
	AvgLatencyMs float64           `json:"avgLatencyMs"`
	MinLatencyMs float64           `json:"minLatencyMs"`
	MaxLatencyMs float64           `json:"maxLatencyMs"`
	P50Ms        float64           `json:"p50Ms"`
	P90Ms        float64           `json:"p90Ms"`
	P95Ms        float64           `json:"p95Ms"`
	P99Ms        float64           `json:"p99Ms"`
	P999Ms       float64           `json:"p999Ms"`
	Status2xx    int64             `json:"status2xx"`
	Status3xx    int64             `json:"status3xx"`
	Status4xx    int64             `json:"status4xx"`
	Status5xx    int64             `json:"status5xx"`
	Timing       RequestTiming     `json:"timing"`
	IsBottleneck bool              `json:"isBottleneck"`
}

// ErrorDetail records sample failed requests with payload details
type ErrorDetail struct {
	ID           string            `json:"id"`
	TestRunID    string            `json:"testRunId"`
	Timestamp    time.Time         `json:"timestamp"`
	Endpoint     string            `json:"endpoint"`
	Method       string            `json:"method"`
	StatusCode   int               `json:"statusCode"`
	LatencyMs    float64           `json:"latencyMs"`
	ErrorType    string            `json:"errorType"` // "500 Internal", "Connection Refused", "Timeout", "DNS Failure"
	ErrorMessage string            `json:"errorMessage"`
	ReqHeaders   map[string]string `json:"reqHeaders,omitempty"`
	ReqBody      string            `json:"reqBody,omitempty"`
	RespBody     string            `json:"respBody,omitempty"`
}

// BottleneckReport details automatic problem detection output
type BottleneckReport struct {
	ID             string   `json:"id"`
	Severity       string   `json:"severity"` // "CRITICAL", "WARNING", "HEALTHY"
	Endpoint       string   `json:"endpoint"`
	Method         string   `json:"method"`
	ErrorRate      float64  `json:"errorRate"`
	P95LatencyMs   float64  `json:"p95LatencyMs"`
	P99LatencyMs   float64  `json:"p99LatencyMs"`
	BreakingVUCount int     `json:"breakingVuCount"`
	Observation    string   `json:"observation"`
	LikelyCause    string   `json:"likelyCause"`
	Evidence       string   `json:"evidence"`
	Confidence     float64  `json:"confidence"` // percentage 0-100
	Recommendation string   `json:"recommendation"`
}

// MetricSnapshot represents point-in-time real-time telemetry frame
type MetricSnapshot struct {
	Timestamp      int64                  `json:"timestamp"` // Unix epoch ms
	ElapsedSec     int                    `json:"elapsedSec"`
	CurrentRPS     float64                `json:"currentRPS"`
	AvgRPS         float64                `json:"avgRPS"`
	TotalRequests  int64                  `json:"totalRequests"`
	SuccessCount   int64                  `json:"successCount"`
	FailedCount    int64                  `json:"failedCount"`
	ErrorRate      float64                `json:"errorRate"`
	ActiveVUs      int                    `json:"activeVUs"`
	AvgLatencyMs   float64                `json:"avgLatencyMs"`
	MinLatencyMs   float64                `json:"minLatencyMs"`
	MaxLatencyMs   float64                `json:"maxLatencyMs"`
	P50Ms          float64                `json:"p50Ms"`
	P90Ms          float64                `json:"p90Ms"`
	P95Ms          float64                `json:"p95Ms"`
	P99Ms          float64                `json:"p99Ms"`
	P999Ms         float64                `json:"p999Ms"`
	StatusCounts   map[string]int64       `json:"statusCounts"`
	Endpoints      []EndpointStat         `json:"endpoints"`
}

// SystemMetric correlates infrastructure metrics (CPU, Memory, DB Conns)
type SystemMetric struct {
	Timestamp   int64   `json:"timestamp"`
	CPUUsagePct float64 `json:"cpuUsagePct"`
	MemUsagePct float64 `json:"memUsagePct"`
	DBActiveConn int    `json:"dbActiveConn"`
	NetworkKBps float64 `json:"networkKbps"`
}

// TestRun Summary of an executed or active load test
type TestRun struct {
	ID             string             `json:"id"`
	TestConfigID   string             `json:"testConfigId"`
	TestName       string             `json:"testName"`
	TargetBaseURL  string             `json:"targetBaseUrl"`
	Status         string             `json:"status"` // "running", "completed", "failed", "stopped"
	StartTime      time.Time          `json:"startTime"`
	EndTime        *time.Time         `json:"endTime,omitempty"`
	DurationSec    int                `json:"durationSec"`
	TotalRequests  int64              `json:"totalRequests"`
	SuccessCount   int64              `json:"successCount"`
	FailedCount    int64              `json:"failedCount"`
	ErrorRate      float64            `json:"errorRate"`
	PeakRPS        float64            `json:"peakRPS"`
	AvgRPS         float64            `json:"avgRPS"`
	AvgLatencyMs   float64            `json:"avgLatencyMs"`
	P95LatencyMs   float64            `json:"p95LatencyMs"`
	P99LatencyMs   float64            `json:"p99LatencyMs"`
	MaxVUs         int                `json:"maxVUs"`
	BreakingVUs    int                `json:"breakingVUs"`
	Config         TestConfig         `json:"config"`
	LatestSnapshot *MetricSnapshot    `json:"latestSnapshot,omitempty"`
	TimeSeries     []MetricSnapshot   `json:"timeSeries,omitempty"`
	Endpoints      []EndpointStat     `json:"endpoints,omitempty"`
	Errors         []ErrorDetail      `json:"errors,omitempty"`
	Bottlenecks    []BottleneckReport `json:"bottlenecks,omitempty"`
	SystemMetrics  []SystemMetric     `json:"systemMetrics,omitempty"`
}

// ComparisonResult compares 2 test runs
type ComparisonResult struct {
	BaselineRunID   string         `json:"baselineRunId"`
	BaselineName    string         `json:"baselineName"`
	TargetRunID     string         `json:"targetRunId"`
	TargetName      string         `json:"targetName"`
	DeltaRPS        float64        `json:"deltaRPS"`        // e.g. +12.5%
	DeltaP95Ms      float64        `json:"deltaP95Ms"`      // e.g. +35.2%
	DeltaErrorRate  float64        `json:"deltaErrorRate"`  // e.g. +2.1%
	RegressionAlert string         `json:"regressionAlert"` // "REGRESSION DETECTED" or "IMPROVED" or "STABLE"
	CulpritEndpoint string         `json:"culpritEndpoint"`
	SummaryText     string         `json:"summaryText"`
	EndpointDiffs   []EndpointDiff `json:"endpointDiffs"`
}

// EndpointDiff details per-endpoint changes between two test runs
type EndpointDiff struct {
	Method        string  `json:"method"`
	Endpoint      string  `json:"endpoint"`
	BaseP95Ms     float64 `json:"baseP95Ms"`
	TargetP95Ms   float64 `json:"targetP95Ms"`
	PctChangeP95  float64 `json:"pctChangeP95"`
	BaseErrorPct  float64 `json:"baseErrorPct"`
	TargetErrorPct float64 `json:"targetErrorPct"`
	HasRegression bool    `json:"hasRegression"`
}
