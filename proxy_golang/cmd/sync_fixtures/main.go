package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"proxy_golang/pkg/fixtures"
)

type scenarioIndex map[string]fixtures.Scenario

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "sync fixtures failed: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	rawDir, err := latestRawFixtureDir(fixtures.RawFixturesDir)
	if err != nil {
		return err
	}
	manifest, err := loadManifest(filepath.Join(rawDir, fixtures.ManifestName))
	if err != nil {
		return err
	}
	idx := make(scenarioIndex, len(manifest.Scenarios))
	for _, sc := range manifest.Scenarios {
		idx[sc.ID] = sc
	}

	if err := os.MkdirAll("test/generated_fixtures/adapter", 0o755); err != nil {
		return err
	}
	if err := os.MkdirAll("pkg/service/mock_fixtures", 0o755); err != nil {
		return err
	}

	if err := copyScenario(idx, rawDir, "cwa_current_station_C0TB40", "test/generated_fixtures/adapter/cwa_current.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "cwa_hourly_location_F-D0047-061", "test/generated_fixtures/adapter/cwa_hourly.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "cwa_daily_location_F-D0047-061", "test/generated_fixtures/adapter/cwa_daily.json", true); err != nil {
		return err
	}
	if err := mergeOpenMeteoForecast(idx, rawDir, "test/generated_fixtures/adapter/openmeteo_forecast.json"); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "openmeteo_history_taipei_2024-06-01", "test/generated_fixtures/adapter/openmeteo_archive.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "weatherapi_forecast_taipei", "test/generated_fixtures/adapter/weatherapi_forecast.json", true); err != nil {
		return err
	}
	_ = copyScenario(idx, rawDir, "weatherapi_history_taipei_2024-06-01", "test/generated_fixtures/adapter/weatherapi_history.json", false)

	if err := copyScenario(idx, rawDir, "cwa_current_station_C0TB40", "pkg/service/mock_fixtures/cwa_current.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "cwa_hourly_location_F-D0047-061", "pkg/service/mock_fixtures/cwa_hourly.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "cwa_daily_location_F-D0047-061", "pkg/service/mock_fixtures/cwa_daily.json", true); err != nil {
		return err
	}
	if err := mergeOpenMeteoForecast(idx, rawDir, "pkg/service/mock_fixtures/openmeteo_forecast.json"); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "openmeteo_history_taipei_2024-06-01", "pkg/service/mock_fixtures/openmeteo_history.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "weatherapi_forecast_taipei", "pkg/service/mock_fixtures/weatherapi_forecast.json", true); err != nil {
		return err
	}
	_ = copyScenario(idx, rawDir, "weatherapi_history_taipei_2024-06-01", "pkg/service/mock_fixtures/weatherapi_history.json", false)
	if err := copyScenario(idx, rawDir, "openweathermap_current_taipei", "pkg/service/mock_fixtures/openweathermap_current.json", true); err != nil {
		return err
	}
	if err := copyScenario(idx, rawDir, "openweathermap_hourly_taipei", "pkg/service/mock_fixtures/openweathermap_forecast.json", true); err != nil {
		return err
	}

	fmt.Printf("synced fixtures from %s\n", rawDir)
	return nil
}

func latestRawFixtureDir(root string) (string, error) {
	entries, err := os.ReadDir(root)
	if err != nil {
		return "", fmt.Errorf("read raw fixtures dir: %w", err)
	}
	var dirs []string
	for _, entry := range entries {
		if entry.IsDir() {
			dirs = append(dirs, entry.Name())
		}
	}
	if len(dirs) == 0 {
		return "", fmt.Errorf("no raw fixture batches found under %s", root)
	}
	sort.Strings(dirs)
	return filepath.Join(root, dirs[len(dirs)-1]), nil
}

func loadManifest(path string) (*fixtures.Manifest, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read manifest: %w", err)
	}
	var manifest fixtures.Manifest
	if err := json.Unmarshal(b, &manifest); err != nil {
		return nil, fmt.Errorf("parse manifest: %w", err)
	}
	return &manifest, nil
}

func copyScenario(idx scenarioIndex, rawDir, scenarioID, dest string, requireSuccess bool) error {
	sc, ok := idx[scenarioID]
	if !ok {
		return fmt.Errorf("scenario not found: %s", scenarioID)
	}
	if requireSuccess && !sc.Success {
		return fmt.Errorf("scenario not successful: %s", scenarioID)
	}
	if !sc.Success {
		return nil
	}
	b, err := os.ReadFile(filepath.Join(rawDir, sc.BodyFile))
	if err != nil {
		return fmt.Errorf("read scenario body %s: %w", scenarioID, err)
	}
	return os.WriteFile(dest, b, 0o644)
}

func mergeOpenMeteoForecast(idx scenarioIndex, rawDir, dest string) error {
	read := func(id string) (map[string]any, error) {
		sc, ok := idx[id]
		if !ok || !sc.Success {
			return nil, fmt.Errorf("openmeteo scenario unavailable: %s", id)
		}
		b, err := os.ReadFile(filepath.Join(rawDir, sc.BodyFile))
		if err != nil {
			return nil, err
		}
		var v map[string]any
		if err := json.Unmarshal(b, &v); err != nil {
			return nil, err
		}
		return v, nil
	}

	current, err := read("openmeteo_current_taipei")
	if err != nil {
		return err
	}
	hourly, err := read("openmeteo_hourly_taipei")
	if err != nil {
		return err
	}
	daily, err := read("openmeteo_daily_taipei")
	if err != nil {
		return err
	}

	merged := map[string]any{}
	for _, src := range []map[string]any{daily, hourly, current} {
		for k, v := range src {
			merged[k] = v
		}
	}
	merged["latitude"] = current["latitude"]
	merged["longitude"] = current["longitude"]
	merged["current"] = current["current"]
	merged["hourly"] = hourly["hourly"]
	merged["daily"] = daily["daily"]
	pretty, err := json.MarshalIndent(merged, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(dest, append(pretty, '\n'), 0o644)
}

func init() {
	_ = time.UTC
}
