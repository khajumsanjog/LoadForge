# ⚡ LoadForge

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go Version" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/SQLite-Local_Storage-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

<h3 align="center">
  Advanced Local Load Testing & Performance Observability Platform
</h3>

<p align="center">
  A local-first, self-hosted performance testing platform designed as a serious, developer-friendly alternative to Apache JMeter, Locust, and k6 — with zero external database dependencies, sub-millisecond quantile metrics, real-time WebSockets telemetry, and automated bottleneck detection.
</p>

<p align="center">
  <a href="https://github.com/khajumsanjog/LoadForge/releases">
    <img src="https://img.shields.io/badge/⚡_Download_Latest_Release-GitHub_Releases-0ea5e9?style=for-the-badge&logo=github&logoColor=white" alt="Download Release" />
  </a>
</p>

---

## 🚀 Download & Quick Start

### Option 1: Download Pre-Compiled Executable Binary
Download the pre-compiled standalone binary for macOS, Linux, or Windows:
👉 **[Download LoadForge Release Binaries](https://github.com/khajumsanjog/LoadForge/releases)**

Execute the binary in your terminal:
```bash
./loadforge -port 8080 -browser
```

---

### Option 2: Run / Build from Source

```bash
# Clone repository
git clone https://github.com/khajumsanjog/LoadForge.git
cd LoadForge/backend

# Option A: Run directly with Go
go run main.go -browser

# Option B: Compile standalone binary
go build -o loadforge main.go
./loadforge -port 8080 -browser
```

Open your browser at **[http://localhost:8080](http://localhost:8080)** to access the dashboard.

---

## ✨ Features at a Glance

- **🚀 High-Concurrency Go Engine**: Goroutine-driven worker pool architecture supporting tens of thousands of HTTP/1.1 and HTTP/2 requests per second.
- **📊 Locust-Style Live Telemetry**: Real-time WebSockets streaming charts for **Total RPS vs Failures/sec**, **P50 Median**, **P95/P99 Tail Latency**, **Active Virtual Users (VUs)**, and **HTTP Status Distribution**.
- **⚡ Automated Bottleneck Detection Engine**: Algorithmic problem diagnosis using a 4-step framework: `Observation → Evidence → Likely Root Cause → Recommended Action`.
- **🔄 Multi-Step API User Journeys**: Construct realistic multi-step user scenarios (e.g. Login → Extract JWT Token → Catalog Search → Order Checkout) with dynamic variable interpolation (`{{token}}`).
- **📥 OpenAPI, Postman & cURL Importer**: One-click parsers for OpenAPI 3.0 / Swagger specs, Postman Collections v2.1, cURL command strings, and HAR files.
- **🔍 Error Inspector & Secret Masking**: Grouped error viewer with full request/response payload drawer and automatic sanitization of Bearer tokens and passwords.
- **📈 Side-by-Side Test Comparison**: Compare any 2 test runs to detect performance regressions and percent deltas.
- **📑 Multi-Format Report Exporter**: Download interactive HTML reports, crisp PDFs, raw JSON, and CSV spreadsheets.
- **🛡️ Local-First & Zero Phone-Home**: Embedded SQLite storage at `~/.loadforge/loadforge.db`. No data leaves your machine.

---

## 📊 Locust-Style Graphs & Beginner Guidance

LoadForge includes intuitive, beginner-friendly graphs inspired by Locust:

| Metric Chart | Description | What It Tells You |
| :--- | :--- | :--- |
| **Total RPS vs Failures/sec** | Green line (Total RPS), Red line (Failures/sec), Purple line (Active Users) | Shows if your server handles traffic scaling without dropping requests. |
| **Response Times Spectrum (ms)** | P50 (Median), P95 (95th Percentile), P99 (99th Percentile), Max Latency | Identifies backend thread queueing, database locks, and tail latency. |
| **Active Virtual Users (VUs)** | Concurrency ramp-up curve over time | Displays active worker goroutines hitting your target application. |
| **HTTP Status Code Breakdown** | Bar chart counting 2xx, 3xx, 4xx, and 5xx responses | Instant visual count of successful vs error status codes. |

---

## 📂 Project Structure

```text
LoadForge/
├── backend/                  # Go Load Engine, REST API & SQLite Database
│   ├── main.go               # Main application entrypoint & static SPA embed
│   ├── pkg/
│   │   ├── analysis/         # Automated Bottleneck & Comparison Engine
│   │   ├── api/              # REST API Handlers & WebSocket Hub
│   │   ├── db/               # SQLite Migration & Query Persistence
│   │   ├── engine/           # High-Concurrency Worker Pool, Scenarios & Telemetry
│   │   ├── importers/        # OpenAPI, Postman, cURL & HAR Parsers
│   │   ├── models/           # Go Data Structures & Quantiles Math
│   │   └── reports/          # HTML, PDF, JSON & CSV Report Generators
│   └── dist/                 # Compiled Vite React Frontend Bundle (Embedded)
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Navigation Sidebar & UI Widgets
│   │   ├── pages/            # Dashboard, Create, Live Test, Endpoint, Bottleneck, Docs, Reports
│   │   ├── services/         # REST Client & WebSocket Hook
│   │   └── types/            # TypeScript Interface Definitions
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── loadforge-website.html    # Standalone Product Landing Page
├── loadforge-docs.html       # Standalone Single-File GitHub Documentation Portal
└── README.md                 # Project Documentation
```

---

## 🛠️ Building from Source

### Prerequisites
- **Go**: 1.22 or higher
- **Node.js**: 18+ and `npm`

### Step 1: Build Frontend Static Bundle
```bash
cd frontend
npm install
npm run build
```
*This compiles TypeScript and outputs the production bundle to `../backend/dist`.*

### Step 2: Build & Package Go Executable
```bash
cd ../backend
go mod tidy
go build -o loadforge main.go
```

### Step 3: Launch LoadForge
```bash
./loadforge -port 8080 -browser
```

---

## 📖 REST API & WebSockets Reference

LoadForge exposes a REST API for automation scripts and CI/CD pipelines:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/configs` | Fetch all saved test configurations |
| `POST` | `/api/configs` | Save or update a test configuration |
| `POST` | `/api/tests/start` | Launch a load test asynchronously |
| `POST` | `/api/tests/stop` | Stop the currently running load test |
| `GET` | `/api/runs` | Fetch test run history |
| `POST` | `/api/compare` | Compare two test runs side-by-side |
| `GET` | `/api/reports/{id}/html` | Generate interactive standalone HTML report |
| `GET` | `/api/reports/{id}/csv` | Download CSV metrics spreadsheet |
| `WS` | `/ws` | WebSockets live telemetry stream |

---

## 📄 License

Licensed under the **MIT License**.
