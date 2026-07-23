package engine

import (
	"testing"
	"time"

	"loadforge/pkg/models"
)

func TestTelemetryCollector(t *testing.T) {
	tc := NewTelemetryCollector()

	// Record 100 sample results
	for i := 1; i <= 100; i++ {
		errVal := error(nil)
		statusCode := 200
		if i > 90 {
			statusCode = 500
		}
		tc.RecordResult(RequestResult{
			Timestamp:  time.Now(),
			Method:     "GET",
			URL:        "http://localhost:8080/api/test",
			StatusCode: statusCode,
			LatencyMs:  float64(i * 10), // 10ms to 1000ms
			Timing:     models.RequestTiming{TotalMs: float64(i * 10)},
			Err:        errVal,
		})
	}

	snap := tc.GetSnapshot()

	if snap.TotalRequests != 100 {
		t.Fatalf("Expected 100 total requests, got %d", snap.TotalRequests)
	}

	if snap.FailedCount != 10 {
		t.Fatalf("Expected 10 failed requests, got %d", snap.FailedCount)
	}

	if snap.ErrorRate != 10.0 {
		t.Fatalf("Expected 10%% error rate, got %.2f%%", snap.ErrorRate)
	}

	if snap.P50Ms < 450 || snap.P50Ms > 550 {
		t.Errorf("Unexpected P50: %.2f", snap.P50Ms)
	}

	if snap.P95Ms < 900 {
		t.Errorf("Unexpected P95: %.2f", snap.P95Ms)
	}
}
