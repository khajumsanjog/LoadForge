package engine

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"loadforge/pkg/models"
)

type ExecutionEngine struct {
	mu           sync.Mutex
	activeRun    *models.TestRun
	cancelFunc   context.CancelFunc
	collector    *TelemetryCollector
	isBroadcasting bool
	broadcastCb  func(snap models.MetricSnapshot)
}

func NewExecutionEngine() *ExecutionEngine {
	return &ExecutionEngine{}
}

func (ee *ExecutionEngine) GetActiveRun() *models.TestRun {
	ee.mu.Lock()
	defer ee.mu.Unlock()
	return ee.activeRun
}

func (ee *ExecutionEngine) SetBroadcastCallback(cb func(snap models.MetricSnapshot)) {
	ee.mu.Lock()
	defer ee.mu.Unlock()
	ee.broadcastCb = cb
}

func (ee *ExecutionEngine) StopRun() error {
	ee.mu.Lock()
	defer ee.mu.Unlock()
	if ee.cancelFunc != nil {
		ee.cancelFunc()
		if ee.activeRun != nil {
			ee.activeRun.Status = "stopped"
			now := time.Now()
			ee.activeRun.EndTime = &now
		}
		return nil
	}
	return fmt.Errorf("no active test run to stop")
}

func (ee *ExecutionEngine) StartRun(ctx context.Context, config models.TestConfig, onComplete func(run *models.TestRun)) (*models.TestRun, error) {
	ee.mu.Lock()
	if ee.activeRun != nil && ee.activeRun.Status == "running" {
		ee.mu.Unlock()
		return nil, fmt.Errorf("a test run is already currently executing")
	}

	runID := fmt.Sprintf("run_%d", time.Now().UnixNano())
	now := time.Now()

	run := &models.TestRun{
		ID:            runID,
		TestConfigID:  config.ID,
		TestName:      config.Name,
		TargetBaseURL: config.BaseURL,
		Status:        "running",
		StartTime:     now,
		Config:        config,
		MaxVUs:        config.LoadProfile.TargetUsers,
	}

	runCtx, cancel := context.WithCancel(ctx)
	ee.cancelFunc = cancel
	ee.activeRun = run
	collector := NewTelemetryCollector()
	ee.collector = collector
	ee.mu.Unlock()

	go ee.executeLoop(runCtx, run, collector, onComplete)

	return run, nil
}

func (ee *ExecutionEngine) executeLoop(ctx context.Context, run *models.TestRun, collector *TelemetryCollector, onComplete func(run *models.TestRun)) {
	log.Printf("Starting load test execution run ID: %s", run.ID)

	runner := NewScenarioRunner(run.Config.Connection)
	profile := run.Config.LoadProfile
	duration := profile.DurationSeconds
	if duration <= 0 {
		duration = 30
	}

	// Dynamic VU Worker pool channels
	reqChan := make(chan bool, 10000)
	var wg sync.WaitGroup

	// Worker supervisor
	var activeWorkers int32
	var peakVUs int32

	workerTask := func(workerID int) {
		atomic.AddInt32(&activeWorkers, 1)
		defer func() {
			atomic.AddInt32(&activeWorkers, -1)
			wg.Done()
		}()

		vuVars := make(map[string]string)
		vuVars["vu_id"] = fmt.Sprintf("%d", workerID)

		for {
			select {
			case <-ctx.Done():
				return
			case _, ok := <-reqChan:
				if !ok {
					return
				}

				// Execute request/scenario steps
				if len(run.Config.Steps) > 0 {
					for _, step := range run.Config.Steps {
						res, updatedVars := runner.ExecuteStep(step, vuVars, run.Config.BaseURL)
						vuVars = updatedVars
						collector.RecordResult(res)
						if step.ThinkTimeMs > 0 {
							time.Sleep(time.Duration(step.ThinkTimeMs) * time.Millisecond)
						}
					}
				} else {
					// Single target request
					step := models.ScenarioStep{
						Method:      run.Config.Method,
						URL:         run.Config.BaseURL + run.Config.Path,
						Headers:     run.Config.Headers,
						QueryParams: run.Config.QueryParams,
						BodyType:    run.Config.BodyType,
						Body:        run.Config.Body,
					}
					res, _ := runner.ExecuteStep(step, vuVars, run.Config.BaseURL)
					collector.RecordResult(res)
				}

				// Think time & Random delay
				if profile.ThinkTimeMs > 0 {
					time.Sleep(time.Duration(profile.ThinkTimeMs) * time.Millisecond)
				}
				if profile.RandomDelayMs > 0 {
					delay := rand.Intn(profile.RandomDelayMs)
					time.Sleep(time.Duration(delay) * time.Millisecond)
				}
			}
		}
	}

	// Main ticker generator loop
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	broadcastTicker := time.NewTicker(500 * time.Millisecond)
	defer broadcastTicker.Stop()

	startTime := time.Now()

	for {
		select {
		case <-ctx.Done():
			goto FINALIZE
		case <-broadcastTicker.C:
			snap := collector.GetSnapshot()
			ee.mu.Lock()
			if ee.broadcastCb != nil {
				ee.broadcastCb(snap)
			}
			run.LatestSnapshot = &snap
			run.TimeSeries = append(run.TimeSeries, snap)
			ee.mu.Unlock()

			// Breakpoint test condition check
			if profile.Pattern == models.PatternBreakpoint {
				if profile.BreakpointMaxErrors > 0 && snap.ErrorRate >= profile.BreakpointMaxErrors {
					log.Printf("Breakpoint threshold reached: Error rate %.2f%% >= max %.2f%%", snap.ErrorRate, profile.BreakpointMaxErrors)
					run.BreakingVUs = snap.ActiveVUs
					goto FINALIZE
				}
				if profile.BreakpointMaxP95Ms > 0 && snap.P95Ms >= profile.BreakpointMaxP95Ms {
					log.Printf("Breakpoint threshold reached: P95 %.2f ms >= max %.2f ms", snap.P95Ms, profile.BreakpointMaxP95Ms)
					run.BreakingVUs = snap.ActiveVUs
					goto FINALIZE
				}
			}

		case now := <-ticker.C:
			elapsedSec := int(now.Sub(startTime).Seconds())
			if elapsedSec >= duration {
				goto FINALIZE
			}

			targetVUs := CalculateTargetVUs(profile, elapsedSec)
			collector.SetActiveVUs(targetVUs)

			currentWorkers := atomic.LoadInt32(&activeWorkers)
			if int32(targetVUs) > peakVUs {
				peakVUs = int32(targetVUs)
			}

			// Spawn new workers if needed
			if int32(targetVUs) > currentWorkers {
				diff := int(int32(targetVUs) - currentWorkers)
				for i := 0; i < diff; i++ {
					wg.Add(1)
					go workerTask(int(currentWorkers) + i + 1)
				}
			}

			// Feed requests to channel based on target RPS or VU concurrency
			feedCount := targetVUs
			if profile.TargetRPS > 0 {
				feedCount = profile.TargetRPS / 10 // 10 ticks per sec
				if feedCount <= 0 {
					feedCount = 1
				}
			}

			for i := 0; i < feedCount; i++ {
				select {
				case reqChan <- true:
				default:
				}
			}
		}
	}

FINALIZE:
	close(reqChan)
	wg.Wait()

	endTime := time.Now()
	finalSnap := collector.GetSnapshot()

	ee.mu.Lock()
	if run.Status == "running" {
		run.Status = "completed"
	}
	run.EndTime = &endTime
	run.DurationSec = int(endTime.Sub(startTime).Seconds())
	run.TotalRequests = finalSnap.TotalRequests
	run.SuccessCount = finalSnap.SuccessCount
	run.FailedCount = finalSnap.FailedCount
	run.ErrorRate = finalSnap.ErrorRate
	run.PeakRPS = finalSnap.CurrentRPS
	run.AvgRPS = finalSnap.AvgRPS
	run.AvgLatencyMs = finalSnap.AvgLatencyMs
	run.P95LatencyMs = finalSnap.P95Ms
	run.P99LatencyMs = finalSnap.P99Ms
	run.MaxVUs = int(peakVUs)
	run.Endpoints = finalSnap.Endpoints
	run.Errors = collector.GetErrors()
	run.LatestSnapshot = &finalSnap
	run.TimeSeries = append(run.TimeSeries, finalSnap)
	ee.mu.Unlock()

	log.Printf("Load test completed. Total requests: %d, Error rate: %.2f%%", run.TotalRequests, run.ErrorRate)

	if onComplete != nil {
		onComplete(run)
	}
}
