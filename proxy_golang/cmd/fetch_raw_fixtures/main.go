// Command fetch_raw_fixtures captures raw upstream provider responses for fixture generation.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"proxy_golang/internal/fixtures"
	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
)

type captureClient struct {
	http      *http.Client
	lastURL   string
	lastResp  *model.UpstreamResponse
	lastError error
}

func (c *captureClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	c.lastURL = req.URL
	httpReq, err := http.NewRequestWithContext(ctx, req.Method, req.URL, nil)
	if err != nil {
		c.lastError = err
		return nil, err
	}
	resp, err := c.http.Do(httpReq)
	if err != nil {
		c.lastError = err
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()
	body, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		c.lastError = readErr
		return nil, readErr
	}
	c.lastResp = &model.UpstreamResponse{StatusCode: resp.StatusCode, Body: body}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		c.lastError = fmt.Errorf("upstream returned status %d", resp.StatusCode)
		return c.lastResp, c.lastError
	}
	c.lastError = nil
	return c.lastResp, nil
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "fetch raw fixtures completed with warnings: %v\n", err)
	}
}

func run() error {
	cfg := config.Load()
	registry := adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", Name: "中央氣象署（CWA）", Description: "台灣最精準，含即時觀測與預報", APIKey: cfg.APIKeys.CWA, RequiresKey: true, Adapter: adapter.CWA{}},
		adapter.ProviderSpec{ID: "openmeteo", Name: "Open-Meteo", Description: "免費無限制，歷史資料豐富", RequiresKey: false, Adapter: adapter.OpenMeteo{}},
		adapter.ProviderSpec{ID: "weatherapi", Name: "WeatherAPI", Description: "備用來源，支援預報與 7 天歷史", APIKey: cfg.APIKeys.WeatherAPI, RequiresKey: true, Adapter: adapter.WeatherAPI{}},
		adapter.ProviderSpec{ID: "openweathermap", Name: "OpenWeatherMap", Description: "全球覆蓋，備用資料源", APIKey: cfg.APIKeys.OpenWeatherMap, RequiresKey: true, Adapter: adapter.OpenWeatherMap{}},
	)

	root := filepath.Join(fixtures.RawFixturesDir, time.Now().UTC().Format("20060102T150405Z"))
	if err := os.MkdirAll(root, 0o755); err != nil {
		return fmt.Errorf("create raw fixtures dir: %w", err)
	}

	client := &captureClient{http: &http.Client{Timeout: 20 * time.Second}}
	manifest := fixtures.Manifest{
		Version:   1,
		CreatedAt: time.Now().UTC(),
		Scenarios: make([]fixtures.Scenario, 0, len(fixtures.DefaultScenarios())),
	}

	var failed int
	for _, scenario := range fixtures.DefaultScenarios() {
		if err := fetchScenario(root, cfg, registry, client, &scenario); err != nil {
			failed++
			scenario.Success = false
			scenario.Error = err.Error()
		} else {
			scenario.Success = true
		}
		manifest.Scenarios = append(manifest.Scenarios, scenario)
	}

	sort.Slice(manifest.Scenarios, func(i, j int) bool {
		return manifest.Scenarios[i].ID < manifest.Scenarios[j].ID
	})

	manifestBytes, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal manifest: %w", err)
	}
	if err := os.WriteFile(filepath.Join(root, fixtures.ManifestName), manifestBytes, 0o644); err != nil {
		return fmt.Errorf("write manifest: %w", err)
	}

	fmt.Printf("raw fixtures saved to %s (failed: %d/%d)\n", root, failed, len(manifest.Scenarios))
	if failed > 0 {
		return fmt.Errorf("%d scenarios failed", failed)
	}
	return nil
}

func fetchScenario(root string, _ *config.Config, registry *adapter.Registry, client *captureClient, scenario *fixtures.Scenario) error {
	client.lastURL = ""
	client.lastResp = nil
	client.lastError = nil

	provider, ok := registry.Get(scenario.Provider)
	if !ok {
		return fmt.Errorf("provider not registered: %s", scenario.Provider)
	}

	apiKey := provider.APIKey
	if provider.RequiresKey && apiKey == "" {
		return fmt.Errorf("missing API key for provider %s", scenario.Provider)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	_, err := provider.Adapter.Fetch(ctx, &scenario.Query, scenario.WeatherType, apiKey, client)
	if client.lastResp == nil {
		if err != nil {
			return fmt.Errorf("fetch scenario %s: %w", scenario.ID, err)
		}
		return errors.New("capture client did not receive upstream response")
	}

	bodyPath := fixtures.BodyFilePath(root, scenario.ID)
	if err := os.WriteFile(bodyPath, client.lastResp.Body, 0o644); err != nil {
		return fmt.Errorf("write raw body for %s: %w", scenario.ID, err)
	}

	scenario.RawURL = client.lastURL
	scenario.RawURL = redactURL(scenario.RawURL)
	scenario.StatusCode = client.lastResp.StatusCode
	scenario.BodyFile = fixtures.BodyFileName(scenario.ID)
	scenario.FetchedAt = time.Now().UTC()
	if err != nil {
		return fmt.Errorf("fetch scenario %s: %w", scenario.ID, err)
	}
	return nil
}

func redactURL(raw string) string {
	replacements := []string{"Authorization=", "key=", "appid="}
	redacted := raw
	for _, marker := range replacements {
		idx := strings.Index(redacted, marker)
		for idx >= 0 {
			start := idx + len(marker)
			end := strings.Index(redacted[start:], "&")
			if end < 0 {
				redacted = redacted[:start] + "REDACTED"
				break
			}
			end += start
			redacted = redacted[:start] + "REDACTED" + redacted[end:]
			idx = strings.Index(redacted[start+8:], marker)
			if idx >= 0 {
				idx += start + 8
			}
		}
	}
	return redacted
}
