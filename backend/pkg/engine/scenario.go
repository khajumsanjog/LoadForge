package engine

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptrace"
	"regexp"
	"strings"
	"time"

	"loadforge/pkg/models"
)

type ScenarioRunner struct {
	client *http.Client
}

func NewScenarioRunner(connCfg models.ConnectionConfig) *ScenarioRunner {
	transport := &http.Transport{
		MaxIdleConnsPerHost: connCfg.MaxConnsPerHost,
		DisableKeepAlives:   !connCfg.KeepAlive,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: connCfg.InsecureTLS,
		},
	}
	if connCfg.MaxConnsPerHost == 0 {
		transport.MaxIdleConnsPerHost = 500
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   time.Duration(connCfg.TimeoutMs) * time.Millisecond,
	}
	if connCfg.TimeoutMs == 0 {
		client.Timeout = 30 * time.Second
	}

	return &ScenarioRunner{client: client}
}

func (sr *ScenarioRunner) ExecuteStep(step models.ScenarioStep, vars map[string]string, defaultBaseURL string) (RequestResult, map[string]string) {
	url := interpolateVars(step.URL, vars, defaultBaseURL)
	method := step.Method
	if method == "" {
		method = "GET"
	}

	bodyStr := interpolateVars(step.Body, vars, defaultBaseURL)
	var bodyReader io.Reader
	if bodyStr != "" {
		bodyReader = bytes.NewBufferString(bodyStr)
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return RequestResult{
			Timestamp:  time.Now(),
			Method:     method,
			URL:        url,
			StatusCode: 0,
			LatencyMs:  0,
			Err:        err,
		}, vars
	}

	// Set headers
	reqHeaders := make(map[string]string)
	for k, v := range step.Headers {
		interpolatedVal := interpolateVars(v, vars, defaultBaseURL)
		req.Header.Set(k, interpolatedVal)
		reqHeaders[k] = interpolatedVal
	}

	if step.BodyType == "json" && req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
		reqHeaders["Content-Type"] = "application/json"
	}

	// Request timing tracer
	var dnsStart, tcpStart, tlsStart, ttfbStart time.Time
	var timing models.RequestTiming

	trace := &httptrace.ClientTrace{
		DNSStart: func(_ httptrace.DNSStartInfo) { dnsStart = time.Now() },
		DNSDone:  func(_ httptrace.DNSDoneInfo) { timing.DNSMs = float64(time.Since(dnsStart).Milliseconds()) },
		ConnectStart: func(_, _ string) { tcpStart = time.Now() },
		ConnectDone:  func(_, _ string, _ error) { timing.TCPMs = float64(time.Since(tcpStart).Milliseconds()) },
		TLSHandshakeStart: func() { tlsStart = time.Now() },
		TLSHandshakeDone:  func(_ tls.ConnectionState, _ error) { timing.TLSMs = float64(time.Since(tlsStart).Milliseconds()) },
		GotFirstResponseByte: func() {
			timing.TTFBMs = float64(time.Since(ttfbStart).Milliseconds())
		},
	}
	req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))

	start := time.Now()
	ttfbStart = start

	resp, err := sr.client.Do(req)
	totalMs := float64(time.Since(start).Milliseconds())
	timing.TotalMs = totalMs

	if err != nil {
		return RequestResult{
			Timestamp:  start,
			Method:     method,
			URL:        url,
			StatusCode: 0,
			LatencyMs:  totalMs,
			Timing:     timing,
			Err:        err,
			ReqHeaders: reqHeaders,
			ReqBody:    bodyStr,
		}, vars
	}
	defer resp.Body.Close()

	downStart := time.Now()
	respBodyBytes, _ := io.ReadAll(resp.Body)
	timing.DownloadMs = float64(time.Since(downStart).Milliseconds())
	respBodyStr := string(respBodyBytes)

	// Extract variables from step extractions
	for _, rule := range step.Extractions {
		val := extractValue(rule, respBodyStr, resp.Header)
		if val != "" {
			vars[rule.VarName] = val
		}
	}

	return RequestResult{
		Timestamp:  start,
		Method:     method,
		URL:        url,
		StatusCode: resp.StatusCode,
		LatencyMs:  totalMs,
		Timing:     timing,
		Err:        nil,
		ReqHeaders: reqHeaders,
		ReqBody:    bodyStr,
		RespBody:   respBodyStr,
	}, vars
}

func interpolateVars(text string, vars map[string]string, defaultBaseURL string) string {
	if text == "" {
		return text
	}
	res := text
	if strings.Contains(res, "{{base_url}}") {
		res = strings.ReplaceAll(res, "{{base_url}}", defaultBaseURL)
	}
	for k, v := range vars {
		placeholder := fmt.Sprintf("{{%s}}", k)
		res = strings.ReplaceAll(res, placeholder, v)
	}

	// If relative URL provided without {{base_url}}, prepend defaultBaseURL
	if strings.HasPrefix(res, "/") && defaultBaseURL != "" {
		res = strings.TrimRight(defaultBaseURL, "/") + res
	}
	return res
}

func extractValue(rule models.ExtractionRule, body string, headers http.Header) string {
	switch rule.Source {
	case "header":
		return headers.Get(rule.Expression)
	case "regex":
		re, err := regexp.Compile(rule.Expression)
		if err != nil {
			return ""
		}
		matches := re.FindStringSubmatch(body)
		if len(matches) > 1 {
			return matches[1]
		} else if len(matches) == 1 {
			return matches[0]
		}
	case "body_json":
		// Lightweight JSON key extractor
		var obj map[string]interface{}
		if err := json.Unmarshal([]byte(body), &obj); err == nil {
			key := strings.TrimPrefix(rule.Expression, "$.")
			key = strings.TrimPrefix(key, ".")
			if val, ok := obj[key]; ok {
				return fmt.Sprintf("%v", val)
			}
		}
	}
	return ""
}
