package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/fixtures"
)

func TestLatestRawFixtureDir(t *testing.T) {
	root := t.TempDir()
	require.NoError(t, os.Mkdir(filepath.Join(root, "20240101T000000Z"), 0o755))
	require.NoError(t, os.Mkdir(filepath.Join(root, "20250101T000000Z"), 0o755))

	dir, err := latestRawFixtureDir(root)
	require.NoError(t, err)
	assert.Equal(t, filepath.Join(root, "20250101T000000Z"), dir)
}

func TestLatestRawFixtureDir_NoDirs(t *testing.T) {
	_, err := latestRawFixtureDir(t.TempDir())
	require.Error(t, err)
}

func TestLoadManifest(t *testing.T) {
	path := filepath.Join(t.TempDir(), fixtures.ManifestName)
	manifest := fixtures.Manifest{Version: 1, Scenarios: []fixtures.Scenario{{ID: "abc", Success: true}}}
	b, err := json.Marshal(manifest)
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(path, b, 0o644))

	got, err := loadManifest(path)
	require.NoError(t, err)
	assert.Equal(t, 1, got.Version)
	require.Len(t, got.Scenarios, 1)
	assert.Equal(t, "abc", got.Scenarios[0].ID)
}

func TestCopyScenario(t *testing.T) {
	root := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(root, "a.json"), []byte(`{"ok":true}`), 0o644))
	idx := scenarioIndex{
		"ok": {ID: "ok", Success: true, BodyFile: "a.json"},
	}
	dest := filepath.Join(t.TempDir(), "out.json")

	err := copyScenario(idx, root, "ok", dest, true)
	require.NoError(t, err)
	b, err := os.ReadFile(dest)
	require.NoError(t, err)
	assert.JSONEq(t, `{"ok":true}`, string(b))
}

func TestCopyScenario_FailureHandling(t *testing.T) {
	idx := scenarioIndex{
		"bad": {ID: "bad", Success: false, BodyFile: "missing.json"},
	}
	err := copyScenario(idx, t.TempDir(), "bad", filepath.Join(t.TempDir(), "out.json"), false)
	require.NoError(t, err)

	err = copyScenario(idx, t.TempDir(), "bad", filepath.Join(t.TempDir(), "out.json"), true)
	require.Error(t, err)

	err = copyScenario(idx, t.TempDir(), "missing", filepath.Join(t.TempDir(), "out.json"), true)
	require.Error(t, err)
}

func TestMergeOpenMeteoForecast(t *testing.T) {
	root := t.TempDir()
	write := func(name, body string) {
		require.NoError(t, os.WriteFile(filepath.Join(root, name), []byte(body), 0o644))
	}
	write("current.json", `{"latitude":25.03,"longitude":121.56,"current":{"temperature_2m":28.1}}`)
	write("hourly.json", `{"hourly":{"time":["2024-01-01T00:00"],"temperature_2m":[27.0]}}`)
	write("daily.json", `{"daily":{"time":["2024-01-01"],"temperature_2m_max":[31.0]}}`)
	idx := scenarioIndex{
		"openmeteo_current_taipei": {Success: true, BodyFile: "current.json"},
		"openmeteo_hourly_taipei":  {Success: true, BodyFile: "hourly.json"},
		"openmeteo_daily_taipei":   {Success: true, BodyFile: "daily.json"},
	}
	dest := filepath.Join(t.TempDir(), "merged.json")

	err := mergeOpenMeteoForecast(idx, root, dest)
	require.NoError(t, err)
	b, err := os.ReadFile(dest)
	require.NoError(t, err)
	assert.Contains(t, string(b), `"current"`)
	assert.Contains(t, string(b), `"hourly"`)
	assert.Contains(t, string(b), `"daily"`)
	assert.Contains(t, string(b), `"latitude"`)
}
