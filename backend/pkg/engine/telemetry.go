package engine

import (
	"math"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"loadforge/pkg/models"
)

type RequestResult struct {
	Timestamp    time.Time
	Method       string
	URL          string
	StatusCode   int
	LatencyMs    float64
	Timing       models.RequestTiming
	Err          error
	ReqHeaders   map[string]string
	ReqBody      string
	RespBody     string
}

type TelemetryCollector struct {
	mu             sync.RWMutex
	startTime      time.Time
	totalRequests  int64
	successCount   int64
	failedCount    int64
	statusCounts   map[string]*int64
	latencies      []float64
	activeVUs      int32
	endpointStats  map[string]*EndpointCollector
	errors         []models.ErrorDetail
	maxErrors      int
	timeSeries     []models.MetricSnapshot
}

type EndpointCollector struct {
	mu            sync.RWMutex
	method        string
	endpoint      string
	totalRequests int64
	successCount  int64
	failedCount   int64
	latencies     []float64
	status2xx     int64
	status3xx     int64
	status4xx     int64
	status5xx     int64
	timingDNS     float64
	timingTCP     float64
	timingTLS     float64
	timingTTFB    float64
	timingDown    float64
}

func NewTelemetryCollector() *TelemetryCollector {
	return &TelemetryCollector{
		startTime:     time.Now(),
		statusCounts:  make(map[string]*int64),
		endpointStats: make(map[string]*EndpointCollector),
		maxErrors:     100,
	}
}

func (tc *TelemetryCollector) SetActiveVUs(vus int) {
	atomic.StoreInt32(&tc.activeVUs, int32(vus))
}

func (tc *TelemetryCollector) RecordResult(res RequestResult) {
	atomic.AddInt64(&tc.totalRequests, 1)

	isError := res.Err != nil || res.StatusCode >= 400 || res.StatusCode == 0

	if isError {
		atomic.AddInt64(&tc.failedCount, 1)
	} else {
		atomic.AddInt64(&tc.successCount, 1)
	}

	statusKey := "5xx"
	if res.StatusCode >= 200 && res.StatusCode < 300 {
		statusKey = "2xx"
	} else if res.StatusCode >= 300 && res.StatusCode < 400 {
		statusKey = "3xx"
	} else if res.StatusCode >= 400 && res.StatusCode < 500 {
		statusKey = "4xx"
	} else if res.StatusCode >= 500 {
		statusKey = "5xx"
	} else if res.StatusCode == 0 {
		statusKey = "net_error"
	}

	tc.incrementStatus(statusKey)

	tc.mu.Lock()
	tc.latencies = append(tc.latencies, res.LatencyMs)

	if isError && len(tc.errors) < tc.maxErrors {
		errMsg := ""
		if res.Err != nil {
			errMsg = res.Err.Error()
		} else {
			errMsg = "HTTP Error Status"
		}
		errType := statusKey
		if strings.Contains(strings.ToLower(errMsg), "timeout") {
			errType = "Timeout"
		} else if strings.Contains(strings.ToLower(errMsg), "refused") {
			errType = "Connection Refused"
		}

		tc.errors = append(tc.errors, models.ErrorDetail{
			ID:           res.Timestamp.Format("150405.000"),
			Timestamp:    res.Timestamp,
			Endpoint:     res.URL,
			Method:       res.Method,
			StatusCode:   res.StatusCode,
			LatencyMs:    res.LatencyMs,
			ErrorType:    errType,
			ErrorMessage: errMsg,
			ReqHeaders:   res.ReqHeaders,
			ReqBody:      res.ReqBody,
			RespBody:     tc.maskSecrets(res.RespBody),
		})
	}
	tc.mu.Unlock()

	// Endpoint stats
	endpointKey := res.Method + " " + res.URL
	tc.mu.RLock()
	ep, ok := tc.endpointStats[endpointKey]
	tc.mu.RUnlock()

	if !ok {
		tc.mu.Lock()
		ep, ok = tc.endpointStats[endpointKey]
		if !ok {
			ep = &EndpointCollector{
				method:   res.Method,
				endpoint: res.URL,
			}
			tc.endpointStats[endpointKey] = ep
		}
		tc.mu.Unlock()
	}

	ep.Record(res, isError, statusKey)
}

func (ep *EndpointCollector) Record(res RequestResult, isError bool, statusKey string) {
	ep.mu.Lock()
	defer ep.mu.Unlock()

	ep.totalRequests++
	if isError {
		ep.failedCount++
	} else {
		ep.successCount++
	}

	switch statusKey {
	case "2xx":
		ep.status2xx++
	case "3xx":
		ep.status3xx++
	case "4xx":
		ep.status4xx++
	case "5xx":
		ep.status5xx++
	}

	ep.latencies = append(ep.latencies, res.LatencyMs)
	ep.timingDNS += res.Timing.DNSMs
	ep.timingTCP += res.Timing.TCPMs
	ep.timingTLS += res.Timing.TLSMs
	ep.timingTTFB += res.Timing.TTFBMs
	ep.timingDown += res.Timing.DownloadMs
}

func (tc *TelemetryCollector) incrementStatus(key string) {
	tc.mu.RLock()
	counter, ok := tc.statusCounts[key]
	tc.mu.RUnlock()

	if !ok {
		tc.mu.Lock()
		counter, ok = tc.statusCounts[key]
		if !ok {
			var val int64
			counter = &val
			tc.statusCounts[key] = counter
		}
		tc.mu.Unlock()
	}
	atomic.AddInt64(counter, 1)
}

func (tc *TelemetryCollector) maskSecrets(body string) string {
	if len(body) > 2000 {
		body = body[:2000] + "... [truncated]"
	}
	return body
}

func calculatePercentiles(latencies []float64) (p50, p90, p95, p99, p999, min, max, avg float64) {
	if len(latencies) == 0 {
		return 0, 0, 0, 0, 0, 0, 0, 0
	}

	cp := make([]float64, len(latencies))
	copy(cp, latencies)
	sort.Float64s(cp)

	min = cp[0]
	max = cp[len(cp)-1]

	var sum float64
	for _, l := range cp {
		sum += l
	}
	avg = sum / float64(len(cp))

	getPercentile := func(p float64) float64 {
		idx := int(math.Ceil(p/100.0*float64(len(cp)))) - 1
		if idx < 0 {
			idx = 0
		}
		if idx >= len(cp) {
			idx = len(cp) - 1
		}
		return cp[idx]
	}

	return getPercentile(50), getPercentile(90), getPercentile(95), getPercentile(99), getPercentile(99.9), min, max, avg
}

func (tc *TelemetryCollector) GetSnapshot() models.MetricSnapshot {
	tc.mu.RLock()
	defer tc.mu.RUnlock()

	now := time.Now()
	elapsedSec := int(now.Sub(tc.startTime).Seconds())
	if elapsedSec == 0 {
		elapsedSec = 1
	}

	total := atomic.LoadInt64(&tc.totalRequests)
	failed := atomic.LoadInt64(&tc.failedCount)
	success := atomic.LoadInt64(&tc.successCount)
	activeVUs := int(atomic.LoadInt32(&tc.activeVUs))

	currentRPS := float64(total) / float64(elapsedSec)
	var errorRate float64
	if total > 0 {
		errorRate = (float64(failed) / float64(total)) * 100.0
	}

	p50, p90, p95, p99, p999, minL, maxL, avgL := calculatePercentiles(tc.latencies)

	statusMap := make(map[string]int64)
	for k, v := range tc.statusCounts {
		statusMap[k] = atomic.LoadInt64(v)
	}

	var endpoints []models.EndpointStat
	for _, ep := range tc.endpointStats {
		ep.mu.RLock()
		epTotal := ep.totalRequests
		epFailed := ep.failedCount
		_ = ep.successCount
		epErrRate := 0.0
		if epTotal > 0 {
			epErrRate = (float64(epFailed) / float64(epTotal)) * 100.0
		}

		epP50, epP90, epP95, epP99, epP999, epMin, epMax, epAvg := calculatePercentiles(ep.latencies)

		dnsAvg, tcpAvg, tlsAvg, ttfbAvg, downAvg := 0.0, 0.0, 0.0, 0.0, 0.0
		if epTotal > 0 {
			dnsAvg = ep.timingDNS / float64(epTotal)
			tcpAvg = ep.timingTCP / float64(epTotal)
			tlsAvg = ep.timingTLS / float64(epTotal)
			ttfbAvg = ep.timingTTFB / float64(epTotal)
			downAvg = ep.timingDown / float64(epTotal)
		}

		endpoints = append(endpoints, models.EndpointStat{
			Method:        ep.method,
			Endpoint:      ep.endpoint,
			TotalRequests: epTotal,
			RPS:           float64(epTotal) / float64(elapsedSec),
			SuccessRate:   100.0 - epErrRate,
			ErrorRate:     epErrRate,
			AvgLatencyMs:  epAvg,
			MinLatencyMs:  epMin,
			MaxLatencyMs:  epMax,
			P50Ms:         epP50,
			P90Ms:         epP90,
			P95Ms:         epP95,
			P99Ms:         epP99,
			P999Ms:        epP999,
			Status2xx:     ep.status2xx,
			Status3xx:     ep.status3xx,
			Status4xx:     ep.status4xx,
			Status5xx:     ep.status5xx,
			Timing: models.RequestTiming{
				DNSMs:      dnsAvg,
				TCPMs:      tcpAvg,
				TLSMs:      tlsAvg,
				TTFBMs:     ttfbAvg,
				DownloadMs: downAvg,
				TotalMs:    epAvg,
			},
			IsBottleneck: epErrRate > 5.0 || epP95 > 2000.0,
		})
		ep.mu.RUnlock()
	}

	snap := models.MetricSnapshot{
		Timestamp:     now.UnixNano() / int64(time.Millisecond),
		ElapsedSec:    elapsedSec,
		CurrentRPS:    currentRPS,
		AvgRPS:        currentRPS,
		TotalRequests: total,
		SuccessCount:  success,
		FailedCount:   failed,
		ErrorRate:     errorRate,
		ActiveVUs:     activeVUs,
		AvgLatencyMs:  avgL,
		MinLatencyMs:  minL,
		MaxLatencyMs:  maxL,
		P50Ms:         p50,
		P90Ms:         p90,
		P95Ms:         p95,
		P99Ms:         p99,
		P999Ms:        p999,
		StatusCounts:  statusMap,
		Endpoints:     endpoints,
	}

	return snap
}

func (tc *TelemetryCollector) GetErrors() []models.ErrorDetail {
	tc.mu.RLock()
	defer tc.mu.RUnlock()

	cp := make([]models.ErrorDetail, len(tc.errors))
	copy(cp, tc.errors)
	return cp
}
