package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
	"loadforge/pkg/models"
)

type DB struct {
	conn *sql.DB
}

func InitDB(dbPath string) (*DB, error) {
	if dbPath == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			dbPath = "loadforge.db"
		} else {
			dir := filepath.Join(homeDir, ".loadforge")
			_ = os.MkdirAll(dir, 0755)
			dbPath = filepath.Join(dir, "loadforge.db")
		}
	}

	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	database := &DB{conn: conn}
	if err := database.createTables(); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Printf("SQLite Database initialized at %s", dbPath)
	return database, nil
}

func (d *DB) createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS test_configs (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		env_name TEXT,
		base_url TEXT NOT NULL,
		method TEXT NOT NULL,
		path TEXT NOT NULL,
		data_json TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS test_runs (
		id TEXT PRIMARY KEY,
		test_config_id TEXT NOT NULL,
		test_name TEXT NOT NULL,
		target_base_url TEXT NOT NULL,
		status TEXT NOT NULL,
		start_time TIMESTAMP NOT NULL,
		end_time TIMESTAMP,
		duration_sec INTEGER NOT NULL,
		total_requests INTEGER NOT NULL,
		success_count INTEGER NOT NULL,
		failed_count INTEGER NOT NULL,
		error_rate REAL NOT NULL,
		peak_rps REAL NOT NULL,
		avg_rps REAL NOT NULL,
		avg_latency_ms REAL NOT NULL,
		p95_latency_ms REAL NOT NULL,
		p99_latency_ms REAL NOT NULL,
		max_vus INTEGER NOT NULL,
		breaking_vus INTEGER NOT NULL,
		run_data_json TEXT NOT NULL
	);
	`
	_, err := d.conn.Exec(schema)
	return err
}

func (d *DB) SaveTestConfig(cfg *models.TestConfig) error {
	data, err := json.Marshal(cfg)
	if err != nil {
		return err
	}

	query := `
	INSERT INTO test_configs (id, name, env_name, base_url, method, path, data_json, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		name=excluded.name,
		env_name=excluded.env_name,
		base_url=excluded.base_url,
		method=excluded.method,
		path=excluded.path,
		data_json=excluded.data_json,
		updated_at=excluded.updated_at;
	`
	_, err = d.conn.Exec(query, cfg.ID, cfg.Name, cfg.EnvName, cfg.BaseURL, cfg.Method, cfg.Path, string(data), cfg.CreatedAt, cfg.UpdatedAt)
	return err
}

func (d *DB) GetTestConfigs() ([]models.TestConfig, error) {
	rows, err := d.conn.Query("SELECT data_json FROM test_configs ORDER BY updated_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []models.TestConfig
	for rows.Next() {
		var rawJson string
		if err := rows.Scan(&rawJson); err != nil {
			continue
		}
		var cfg models.TestConfig
		if err := json.Unmarshal([]byte(rawJson), &cfg); err == nil {
			configs = append(configs, cfg)
		}
	}
	return configs, nil
}

func (d *DB) SaveTestRun(run *models.TestRun) error {
	data, err := json.Marshal(run)
	if err != nil {
		return err
	}

	query := `
	INSERT INTO test_runs (
		id, test_config_id, test_name, target_base_url, status, start_time, end_time,
		duration_sec, total_requests, success_count, failed_count, error_rate,
		peak_rps, avg_rps, avg_latency_ms, p95_latency_ms, p99_latency_ms,
		max_vus, breaking_vus, run_data_json
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		status=excluded.status,
		end_time=excluded.end_time,
		total_requests=excluded.total_requests,
		success_count=excluded.success_count,
		failed_count=excluded.failed_count,
		error_rate=excluded.error_rate,
		peak_rps=excluded.peak_rps,
		avg_rps=excluded.avg_rps,
		avg_latency_ms=excluded.avg_latency_ms,
		p95_latency_ms=excluded.p95_latency_ms,
		p99_latency_ms=excluded.p99_latency_ms,
		run_data_json=excluded.run_data_json;
	`
	_, err = d.conn.Exec(
		query,
		run.ID, run.TestConfigID, run.TestName, run.TargetBaseURL, run.Status, run.StartTime, run.EndTime,
		run.DurationSec, run.TotalRequests, run.SuccessCount, run.FailedCount, run.ErrorRate,
		run.PeakRPS, run.AvgRPS, run.AvgLatencyMs, run.P95LatencyMs, run.P99LatencyMs,
		run.MaxVUs, run.BreakingVUs, string(data),
	)
	return err
}

func (d *DB) GetTestRuns() ([]models.TestRun, error) {
	rows, err := d.conn.Query("SELECT run_data_json FROM test_runs ORDER BY start_time DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var runs []models.TestRun
	for rows.Next() {
		var rawJson string
		if err := rows.Scan(&rawJson); err != nil {
			continue
		}
		var run models.TestRun
		if err := json.Unmarshal([]byte(rawJson), &run); err == nil {
			runs = append(runs, run)
		}
	}
	return runs, nil
}

func (d *DB) GetTestRunByID(id string) (*models.TestRun, error) {
	row := d.conn.QueryRow("SELECT run_data_json FROM test_runs WHERE id = ?", id)
	var rawJson string
	if err := row.Scan(&rawJson); err != nil {
		return nil, err
	}
	var run models.TestRun
	if err := json.Unmarshal([]byte(rawJson), &run); err != nil {
		return nil, err
	}
	return &run, nil
}

func (d *DB) DeleteTestRun(id string) error {
	_, err := d.conn.Exec("DELETE FROM test_runs WHERE id = ?", id)
	return err
}
