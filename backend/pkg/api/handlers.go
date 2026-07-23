package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"loadforge/pkg/analysis"
	"loadforge/pkg/db"
	"loadforge/pkg/engine"
	"loadforge/pkg/importers"
	"loadforge/pkg/models"
	"loadforge/pkg/reports"
)

type Server struct {
	db     *db.DB
	engine *engine.ExecutionEngine
	wsHub  *WSHub
}

func NewServer(database *db.DB, execEngine *engine.ExecutionEngine, hub *WSHub) *Server {
	srv := &Server{
		db:     database,
		engine: execEngine,
		wsHub:  hub,
	}

	execEngine.SetBroadcastCallback(func(snap models.MetricSnapshot) {
		hub.BroadcastSnapshot(snap)
	})

	return srv
}

func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /ws", s.wsHub.HandleWebSocket)

	mux.HandleFunc("GET /api/configs", s.handleGetConfigs)
	mux.HandleFunc("POST /api/configs", s.handleSaveConfig)

	mux.HandleFunc("POST /api/tests/start", s.handleStartTest)
	mux.HandleFunc("POST /api/tests/stop", s.handleStopTest)
	mux.HandleFunc("GET /api/tests/active", s.handleGetActiveTest)

	mux.HandleFunc("GET /api/runs", s.handleGetRuns)
	mux.HandleFunc("GET /api/runs/{id}", s.handleGetRunByID)
	mux.HandleFunc("DELETE /api/runs/{id}", s.handleDeleteRun)

	mux.HandleFunc("POST /api/compare", s.handleCompare)

	mux.HandleFunc("POST /api/import/curl", s.handleImportCURL)
	mux.HandleFunc("POST /api/import/postman", s.handleImportPostman)
	mux.HandleFunc("POST /api/import/openapi", s.handleImportOpenAPI)

	mux.HandleFunc("GET /api/reports/{id}/html", s.handleReportHTML)
	mux.HandleFunc("GET /api/reports/{id}/json", s.handleReportJSON)
	mux.HandleFunc("GET /api/reports/{id}/csv", s.handleReportCSV)

	// Built-in mock echo target for instant test verification
	mux.HandleFunc("/api/mock/echo", s.handleMockEcho)
	mux.HandleFunc("/api/mock/slow", s.handleMockSlow)
	mux.HandleFunc("/api/mock/error", s.handleMockError)
}

func (s *Server) handleGetConfigs(w http.ResponseWriter, r *http.Request) {
	configs, err := s.db.GetTestConfigs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, configs)
}

func (s *Server) handleSaveConfig(w http.ResponseWriter, r *http.Request) {
	var cfg models.TestConfig
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if cfg.ID == "" {
		cfg.ID = fmtID("cfg")
	}
	cfg.UpdatedAt = time.Now()
	if cfg.CreatedAt.IsZero() {
		cfg.CreatedAt = time.Now()
	}

	if err := s.db.SaveTestConfig(&cfg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, cfg)
}

func (s *Server) handleStartTest(w http.ResponseWriter, r *http.Request) {
	var cfg models.TestConfig
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if cfg.ID == "" {
		cfg.ID = fmtID("cfg")
	}
	_ = s.db.SaveTestConfig(&cfg)

	run, err := s.engine.StartRun(context.Background(), cfg, func(completedRun *models.TestRun) {
		completedRun.Bottlenecks = analysis.AnalyzeRun(completedRun)
		_ = s.db.SaveTestRun(completedRun)
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	_ = s.db.SaveTestRun(run)
	writeJSON(w, run)
}

func (s *Server) handleStopTest(w http.ResponseWriter, r *http.Request) {
	if err := s.engine.StopRun(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, map[string]string{"status": "stopped"})
}

func (s *Server) handleGetActiveTest(w http.ResponseWriter, r *http.Request) {
	run := s.engine.GetActiveRun()
	if run == nil {
		writeJSON(w, map[string]interface{}{"active": false})
		return
	}
	writeJSON(w, map[string]interface{}{"active": true, "run": run})
}

func (s *Server) handleGetRuns(w http.ResponseWriter, r *http.Request) {
	runs, err := s.db.GetTestRuns()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, runs)
}

func (s *Server) handleGetRunByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	run, err := s.db.GetTestRunByID(id)
	if err != nil {
		http.Error(w, "Run not found", http.StatusNotFound)
		return
	}
	writeJSON(w, run)
}

func (s *Server) handleDeleteRun(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := s.db.DeleteTestRun(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]bool{"deleted": true})
}

func (s *Server) handleCompare(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BaselineID string `json:"baselineId"`
		TargetID   string `json:"targetId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	base, err1 := s.db.GetTestRunByID(req.BaselineID)
	target, err2 := s.db.GetTestRunByID(req.TargetID)

	if err1 != nil || err2 != nil {
		http.Error(w, "One or both test runs not found", http.StatusNotFound)
		return
	}

	cmp := analysis.CompareRuns(base, target)
	writeJSON(w, cmp)
}

func (s *Server) handleImportCURL(w http.ResponseWriter, r *http.Request) {
	bodyBytes, _ := io.ReadAll(r.Body)
	cfg, err := importers.ParseCURL(string(bodyBytes))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, cfg)
}

func (s *Server) handleImportPostman(w http.ResponseWriter, r *http.Request) {
	bodyBytes, _ := io.ReadAll(r.Body)
	cfg, err := importers.ParsePostman(string(bodyBytes))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, cfg)
}

func (s *Server) handleImportOpenAPI(w http.ResponseWriter, r *http.Request) {
	bodyBytes, _ := io.ReadAll(r.Body)
	cfg, err := importers.ParseOpenAPI(string(bodyBytes))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, cfg)
}

func (s *Server) handleReportHTML(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	run, err := s.db.GetTestRunByID(id)
	if err != nil {
		http.Error(w, "Run not found", http.StatusNotFound)
		return
	}
	html, err := reports.GenerateHTMLReport(run)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}

func (s *Server) handleReportJSON(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	run, err := s.db.GetTestRunByID(id)
	if err != nil {
		http.Error(w, "Run not found", http.StatusNotFound)
		return
	}
	jsonStr, _ := reports.GenerateJSONReport(run)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=LoadForge-"+id+".json")
	w.Write([]byte(jsonStr))
}

func (s *Server) handleReportCSV(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	run, err := s.db.GetTestRunByID(id)
	if err != nil {
		http.Error(w, "Run not found", http.StatusNotFound)
		return
	}
	csvStr, _ := reports.GenerateCSVReport(run)
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=LoadForge-"+id+".csv")
	w.Write([]byte(csvStr))
}

// Built-in Mock targets
func (s *Server) handleMockEcho(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().UnixNano(),
		"echo":      "Hello from LoadForge mock endpoint",
	})
}

func (s *Server) handleMockSlow(w http.ResponseWriter, r *http.Request) {
	time.Sleep(300 * time.Millisecond)
	writeJSON(w, map[string]interface{}{
		"status": "slow_ok",
		"delay":  "300ms",
	})
}

func (s *Server) handleMockError(w http.ResponseWriter, r *http.Request) {
	http.Error(w, `{"error":"Simulated 500 Internal Server Error"}`, http.StatusInternalServerError)
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(data)
}

func fmtID(prefix string) string {
	return prefix + "_" + strings.ReplaceAll(time.Now().Format("150405.000"), ".", "")
}
