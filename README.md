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
  <a href="https://github.com/khajumsanjog/LoadForge/raw/main/releases/LoadForge-SourceCode.zip">
    <img src="https://img.shields.io/badge/📦_Download_LoadForge_SourceCode.zip-backend_&_frontend-22c55e?style=for-the-badge&logo=github&logoColor=white" alt="Download ZIP" />
  </a>
</p>

---

## ⚡ 1-Click Download (macOS, Linux, & Windows)

Download the complete source code containing both `backend/` and `frontend/` directories in a single archive:

👉 **[Download LoadForge-SourceCode.zip](https://github.com/khajumsanjog/LoadForge/raw/main/releases/LoadForge-SourceCode.zip)**

---

## 🚀 1-Line Quick Install & Launch

Auto-detects your Operating System (macOS, Linux, Windows), downloads LoadForge, and launches on `http://localhost:8080`:

```bash
curl -fsSL https://raw.githubusercontent.com/khajumsanjog/LoadForge/main/install.sh | sh
```

---

## 🛠️ Run / Build from Source

```bash
# Unzip LoadForge-SourceCode.zip or clone repository
git clone https://github.com/khajumsanjog/LoadForge.git
cd LoadForge/backend

# Option A: Run directly with Go
go run main.go -browser

# Option B: Compile standalone binary executable
go build -o loadforge main.go
./loadforge -port 8080 -browser
```

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

## 📄 Creator

Build with ❤️ by <a href="khajumsanjog.com">KhajumSanjog</a>
