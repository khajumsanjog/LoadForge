package importers

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"

	"loadforge/pkg/models"
)

// ParseCURL converts a cURL command string into a TestConfig & ScenarioStep
func ParseCURL(curlCmd string) (*models.TestConfig, error) {
	cmd := strings.TrimSpace(curlCmd)
	if !strings.HasPrefix(cmd, "curl") {
		return nil, fmt.Errorf("invalid curl command string")
	}

	method := "GET"
	targetURL := ""
	headers := make(map[string]string)
	body := ""

	tokens := strings.Fields(cmd)
	for i := 0; i < len(tokens); i++ {
		t := tokens[i]
		if (t == "-X" || t == "--request") && i+1 < len(tokens) {
			method = strings.ToUpper(tokens[i+1])
			i++
		} else if (t == "-H" || t == "--header") && i+1 < len(tokens) {
			headerVal := strings.Trim(tokens[i+1], `"'`)
			parts := strings.SplitN(headerVal, ":", 2)
			if len(parts) == 2 {
				headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
			}
			i++
		} else if (t == "-d" || t == "--data" || t == "--data-raw") && i+1 < len(tokens) {
			body = strings.Trim(tokens[i+1], `"'`)
			if method == "GET" {
				method = "POST"
			}
			i++
		} else if strings.HasPrefix(t, "http://") || strings.HasPrefix(t, "https://") {
			targetURL = strings.Trim(t, `"'`)
		}
	}

	if targetURL == "" {
		targetURL = "http://localhost:8080/api"
	}

	parsed, _ := url.Parse(targetURL)
	baseURL := targetURL
	path := ""
	if parsed != nil {
		baseURL = fmt.Sprintf("%s://%s", parsed.Scheme, parsed.Host)
		path = parsed.Path
	}

	step := models.ScenarioStep{
		ID:       "step_1",
		Name:     fmt.Sprintf("%s %s", method, path),
		Method:   method,
		URL:      targetURL,
		Headers:  headers,
		BodyType: "json",
		Body:     body,
	}

	return &models.TestConfig{
		ID:          "imported_curl",
		Name:        fmt.Sprintf("Imported cURL: %s %s", method, path),
		BaseURL:     baseURL,
		Method:      method,
		Path:        path,
		Headers:     headers,
		Body:        body,
		BodyType:    "json",
		Steps:       []models.ScenarioStep{step},
		LoadProfile: models.LoadProfile{Pattern: models.PatternConstant, DurationSeconds: 30, TargetUsers: 10},
	}, nil
}

// ParsePostman converts Postman Collection JSON into scenario steps
func ParsePostman(jsonData string) (*models.TestConfig, error) {
	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &raw); err != nil {
		return nil, err
	}

	info, _ := raw["info"].(map[string]interface{})
	name, _ := info["name"].(string)
	if name == "" {
		name = "Postman Import Test"
	}

	var steps []models.ScenarioStep
	items, _ := raw["item"].([]interface{})

	for idx, itemObj := range items {
		itemMap, ok := itemObj.(map[string]interface{})
		if !ok {
			continue
		}
		stepName, _ := itemMap["name"].(string)
		reqMap, _ := itemMap["request"].(map[string]interface{})
		if reqMap == nil {
			continue
		}

		method, _ := reqMap["method"].(string)
		if method == "" {
			method = "GET"
		}

		urlStr := ""
		if urlObj, ok := reqMap["url"].(map[string]interface{}); ok {
			urlStr, _ = urlObj["raw"].(string)
		} else if rawUrl, ok := reqMap["url"].(string); ok {
			urlStr = rawUrl
		}

		steps = append(steps, models.ScenarioStep{
			ID:       fmt.Sprintf("step_%d", idx+1),
			Name:     stepName,
			Method:   method,
			URL:      urlStr,
			BodyType: "json",
		})
	}

	baseURL := "http://localhost:8080"
	if len(steps) > 0 && steps[0].URL != "" {
		baseURL = steps[0].URL
	}

	return &models.TestConfig{
		ID:          "imported_postman",
		Name:        name,
		BaseURL:     baseURL,
		Method:      "GET",
		Path:        "/",
		Steps:       steps,
		LoadProfile: models.LoadProfile{Pattern: models.PatternConstant, DurationSeconds: 30, TargetUsers: 10},
	}, nil
}

// ParseOpenAPI converts OpenAPI JSON/YAML into scenario steps
func ParseOpenAPI(jsonData string) (*models.TestConfig, error) {
	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &raw); err != nil {
		return nil, err
	}

	info, _ := raw["info"].(map[string]interface{})
	title, _ := info["title"].(string)
	if title == "" {
		title = "OpenAPI Import Test"
	}

	paths, _ := raw["paths"].(map[string]interface{})
	var steps []models.ScenarioStep
	idx := 1

	for pathStr, pathObj := range paths {
		pathMap, ok := pathObj.(map[string]interface{})
		if !ok {
			continue
		}

		for method, opObj := range pathMap {
			m := strings.ToUpper(method)
			if m != "GET" && m != "POST" && m != "PUT" && m != "DELETE" && m != "PATCH" {
				continue
			}
			opMap, _ := opObj.(map[string]interface{})
			summary, _ := opMap["summary"].(string)
			if summary == "" {
				summary = fmt.Sprintf("%s %s", m, pathStr)
			}

			steps = append(steps, models.ScenarioStep{
				ID:       fmt.Sprintf("step_%d", idx),
				Name:     summary,
				Method:   m,
				URL:      "{{base_url}}" + pathStr,
				BodyType: "json",
			})
			idx++
		}
	}

	return &models.TestConfig{
		ID:          "imported_openapi",
		Name:        title,
		BaseURL:     "http://localhost:8080",
		Method:      "GET",
		Path:        "/",
		Steps:       steps,
		LoadProfile: models.LoadProfile{Pattern: models.PatternConstant, DurationSeconds: 30, TargetUsers: 10},
	}, nil
}
