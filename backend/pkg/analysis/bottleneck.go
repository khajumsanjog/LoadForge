package analysis

import (
	"fmt"
	"loadforge/pkg/models"
)

// AnalyzeRun performs automated performance bottleneck diagnosis on a completed or active TestRun
func AnalyzeRun(run *models.TestRun) []models.BottleneckReport {
	var reports []models.BottleneckReport

	if run == nil || len(run.Endpoints) == 0 {
		return reports
	}

	for idx, ep := range run.Endpoints {
		if ep.ErrorRate == 0 && ep.P95Ms < 1000 {
			continue
		}

		severity := "HEALTHY"
		confidence := 75.0
		var obs, cause, evidence, rec string

		if ep.ErrorRate > 15.0 || ep.P95Ms > 4000.0 {
			severity = "CRITICAL"
			confidence = 92.0
		} else if ep.ErrorRate > 2.0 || ep.P95Ms > 1500.0 {
			severity = "WARNING"
			confidence = 84.0
		} else {
			continue
		}

		// Problem pattern matching
		if ep.Status5xx > 0 {
			obs = fmt.Sprintf("High 5xx Internal Server Error rate (%.1f%%) on endpoint %s %s.", ep.ErrorRate, ep.Method, ep.Endpoint)
			cause = "Application crash, unhandled exception, or downstream database connection saturation."
			evidence = fmt.Sprintf("%d out of %d requests returned 5xx responses. P95 latency degraded to %.0f ms.", ep.Status5xx, ep.TotalRequests, ep.P95Ms)
			rec = "Inspect target application logs, increase database connection pool capacity, and check CPU/memory usage."
		} else if ep.Status4xx > 0 && ep.ErrorRate > 10 {
			obs = fmt.Sprintf("High 4xx client error / rate limiting rate (%.1f%%) on endpoint %s %s.", ep.ErrorRate, ep.Method, ep.Endpoint)
			cause = "API Rate limiting (429 Too Many Requests), invalid payload schema, or authentication failure."
			evidence = fmt.Sprintf("%d 4xx status code responses recorded under concurrency load.", ep.Status4xx)
			rec = "Adjust rate limiting parameters or inspect request authentication credentials and body parameters."
		} else if ep.P95Ms > 2000.0 {
			obs = fmt.Sprintf("Extreme latency degradation on endpoint %s %s (P95: %.0f ms, P99: %.0f ms).", ep.Method, ep.Endpoint, ep.P95Ms, ep.P99Ms)
			cause = "Unindexed database query lock contention, synchronous I/O blocking, or thread pool exhaustion."
			evidence = fmt.Sprintf("P95 response time reached %.2f seconds while average RPS was %.1f.", ep.P95Ms/1000.0, ep.RPS)
			rec = "Add database query indexes, introduce Redis caching, or refactor synchronous external service calls to asynchronous queues."
		} else {
			obs = fmt.Sprintf("Performance degradation observed on %s %s.", ep.Method, ep.Endpoint)
			cause = "High traffic concurrency load exceeding worker capacity."
			evidence = fmt.Sprintf("Error rate %.1f%% with P95 latency %.0f ms.", ep.ErrorRate, ep.P95Ms)
			rec = "Scale out target application instances and optimize connection reuse."
		}

		reports = append(reports, models.BottleneckReport{
			ID:             fmt.Sprintf("bn_%d", idx+1),
			Severity:       severity,
			Endpoint:       ep.Endpoint,
			Method:         ep.Method,
			ErrorRate:      ep.ErrorRate,
			P95LatencyMs:   ep.P95Ms,
			P99LatencyMs:   ep.P99Ms,
			BreakingVUCount: run.BreakingVUs,
			Observation:    obs,
			LikelyCause:    cause,
			Evidence:       evidence,
			Confidence:     confidence,
			Recommendation: rec,
		})
	}

	return reports
}

// CompareRuns computes performance differences & regressions between two test runs
func CompareRuns(base *models.TestRun, target *models.TestRun) *models.ComparisonResult {
	if base == nil || target == nil {
		return nil
	}

	deltaRPS := 0.0
	if base.AvgRPS > 0 {
		deltaRPS = ((target.AvgRPS - base.AvgRPS) / base.AvgRPS) * 100.0
	}

	deltaP95 := 0.0
	if base.P95LatencyMs > 0 {
		deltaP95 = ((target.P95LatencyMs - base.P95LatencyMs) / base.P95LatencyMs) * 100.0
	}

	deltaErr := target.ErrorRate - base.ErrorRate

	alert := "STABLE"
	culprit := ""
	summaryText := "No significant performance regression detected between test runs."

	if deltaP95 > 20.0 || deltaErr > 2.0 {
		alert = "REGRESSION DETECTED"
		summaryText = fmt.Sprintf("Performance regression detected in run %s vs baseline %s. P95 latency changed by %+.1f%% and error rate changed by %+.1f%%.", target.TestName, base.TestName, deltaP95, deltaErr)
	} else if deltaP95 < -10.0 {
		alert = "IMPROVED"
		summaryText = fmt.Sprintf("Performance improved! P95 latency decreased by %.1f%%.", -deltaP95)
	}

	// Per endpoint diffs
	baseEPMap := make(map[string]models.EndpointStat)
	for _, ep := range base.Endpoints {
		baseEPMap[ep.Method+" "+ep.Endpoint] = ep
	}

	var diffs []models.EndpointDiff
	for _, targetEP := range target.Endpoints {
		key := targetEP.Method + " " + targetEP.Endpoint
		baseEP, found := baseEPMap[key]

		baseP95 := 0.0
		baseErr := 0.0
		pctP95 := 0.0
		if found {
			baseP95 = baseEP.P95Ms
			baseErr = baseEP.ErrorRate
			if baseP95 > 0 {
				pctP95 = ((targetEP.P95Ms - baseP95) / baseP95) * 100.0
			}
		}

		hasReg := pctP95 > 25.0 || (targetEP.ErrorRate-baseErr) > 3.0
		if hasReg && culprit == "" {
			culprit = key
		}

		diffs = append(diffs, models.EndpointDiff{
			Method:        targetEP.Method,
			Endpoint:      targetEP.Endpoint,
			BaseP95Ms:     baseP95,
			TargetP95Ms:   targetEP.P95Ms,
			PctChangeP95:  pctP95,
			BaseErrorPct:  baseErr,
			TargetErrorPct: targetEP.ErrorRate,
			HasRegression: hasReg,
		})
	}

	return &models.ComparisonResult{
		BaselineRunID:   base.ID,
		BaselineName:    base.TestName,
		TargetRunID:     target.ID,
		TargetName:      target.TestName,
		DeltaRPS:        deltaRPS,
		DeltaP95Ms:      deltaP95,
		DeltaErrorRate:  deltaErr,
		RegressionAlert: alert,
		CulpritEndpoint: culprit,
		SummaryText:     summaryText,
		EndpointDiffs:   diffs,
	}
}
