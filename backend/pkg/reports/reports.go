package reports

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"html/template"
	"loadforge/pkg/models"
	"strconv"
)

const htmlReportTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LoadForge Performance Report - {{.TestName}}</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; --danger: #ef4444; --success: #22c55e; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: bold; color: var(--accent); }
        .badge { padding: 4px 12px; borderRadius: 9999px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
        .badge-passed { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .badge-failed { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .card { background: var(--card); border: 1px solid #334155; border-radius: 12px; padding: 20px; }
        .card-val { font-size: 28px; font-weight: bold; margin-top: 8px; color: var(--text); }
        .card-lbl { font-size: 14px; color: var(--muted); }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #0f172a; color: var(--muted); }
        tr:hover { background: #334155; }
        .section-title { font-size: 20px; font-weight: bold; margin-top: 32px; margin-bottom: 16px; color: var(--accent); }
        .alert { background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        @media print {
            body { background: #fff; color: #000; }
            .card { border: 1px solid #ccc; background: #f9f9f9; }
            th { background: #eee; color: #000; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">⚡ LoadForge Test Report</div>
                <h2 style="margin: 8px 0 0 0;">{{.TestName}}</h2>
                <div style="color: var(--muted); font-size: 14px; margin-top: 4px;">Target: {{.TargetBaseURL}} | Run ID: {{.ID}}</div>
            </div>
            <div>
                {{if gt .ErrorRate 5.0}}
                <span class="badge badge-failed">FAILED (Error Rate > 5%)</span>
                {{else}}
                <span class="badge badge-passed">PASSED</span>
                {{/if}}
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-lbl">Total Requests</div>
                <div class="card-val">{{.TotalRequests}}</div>
            </div>
            <div class="card">
                <div class="card-lbl">Peak RPS</div>
                <div class="card-val">{{printf "%.1f" .PeakRPS}}</div>
            </div>
            <div class="card">
                <div class="card-lbl">P95 Latency</div>
                <div class="card-val">{{printf "%.0f" .P95LatencyMs}} ms</div>
            </div>
            <div class="card">
                <div class="card-lbl">P99 Latency</div>
                <div class="card-val">{{printf "%.0f" .P99LatencyMs}} ms</div>
            </div>
            <div class="card">
                <div class="card-lbl">Error Rate</div>
                <div class="card-val" style="color: {{if gt .ErrorRate 5.0}}var(--danger){{else}}var(--success){{end}};">
                    {{printf "%.2f" .ErrorRate}}%
                </div>
            </div>
            <div class="card">
                <div class="card-lbl">Max Virtual Users</div>
                <div class="card-val">{{.MaxVUs}}</div>
            </div>
        </div>

        {{if .Bottlenecks}}
        <div class="section-title">🚨 Bottleneck & Problem Analysis</div>
        {{range .Bottlenecks}}
        <div class="alert">
            <strong>[{{.Severity}}] {{.Method}} {{.Endpoint}}</strong>
            <p><strong>Observation:</strong> {{.Observation}}</p>
            <p><strong>Likely Cause:</strong> {{.LikelyCause}}</p>
            <p><strong>Evidence:</strong> {{.Evidence}}</p>
            <p><strong>Recommendation:</strong> {{.Recommendation}}</p>
        </div>
        {{end}}
        {{end}}

        <div class="section-title">📊 Endpoint Performance Summary</div>
        <div class="card" style="padding: 0; overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Endpoint</th>
                        <th>Requests</th>
                        <th>RPS</th>
                        <th>Success</th>
                        <th>P50</th>
                        <th>P95</th>
                        <th>P99</th>
                        <th>5xx</th>
                    </tr>
                </thead>
                <tbody>
                    {{range .Endpoints}}
                    <tr>
                        <td><strong>{{.Method}}</strong></td>
                        <td>{{.Endpoint}}</td>
                        <td>{{.TotalRequests}}</td>
                        <td>{{printf "%.1f" .RPS}}</td>
                        <td>{{printf "%.1f" .SuccessRate}}%</td>
                        <td>{{printf "%.0f" .P50Ms}} ms</td>
                        <td>{{printf "%.0f" .P95Ms}} ms</td>
                        <td>{{printf "%.0f" .P99Ms}} ms</td>
                        <td>{{.Status5xx}}</td>
                    </tr>
                    {{end}}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
`

// GenerateHTMLReport renders interactive HTML report
func GenerateHTMLReport(run *models.TestRun) (string, error) {
	tmpl, err := template.New("report").Parse(htmlReportTemplate)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, run); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// GenerateJSONReport converts run to pretty printed JSON string
func GenerateJSONReport(run *models.TestRun) (string, error) {
	bytes, err := json.MarshalIndent(run, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// GenerateCSVReport converts run endpoint stats to CSV string
func GenerateCSVReport(run *models.TestRun) (string, error) {
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// Write header
	_ = writer.Write([]string{
		"Method", "Endpoint", "TotalRequests", "RPS", "SuccessRatePct",
		"ErrorRatePct", "AvgLatencyMs", "P50Ms", "P95Ms", "P99Ms", "Status2xx", "Status5xx",
	})

	for _, ep := range run.Endpoints {
		_ = writer.Write([]string{
			ep.Method,
			ep.Endpoint,
			strconv.FormatInt(ep.TotalRequests, 10),
			fmt.Sprintf("%.2f", ep.RPS),
			fmt.Sprintf("%.2f", ep.SuccessRate),
			fmt.Sprintf("%.2f", ep.ErrorRate),
			fmt.Sprintf("%.2f", ep.AvgLatencyMs),
			fmt.Sprintf("%.2f", ep.P50Ms),
			fmt.Sprintf("%.2f", ep.P95Ms),
			fmt.Sprintf("%.2f", ep.P99Ms),
			strconv.FormatInt(ep.Status2xx, 10),
			strconv.FormatInt(ep.Status5xx, 10),
		})
	}

	writer.Flush()
	return buf.String(), nil
}
