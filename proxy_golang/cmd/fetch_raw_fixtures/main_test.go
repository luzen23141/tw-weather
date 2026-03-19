package main

import (
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/internal/fixtures"
	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }

func TestCaptureClientDo_SuccessAndErrorStatus(t *testing.T) {
	client := &captureClient{http: &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		body := `{"ok":true}`
		status := http.StatusOK
		if strings.Contains(req.URL.String(), "bad") {
			body = `{"error":true}`
			status = http.StatusTooManyRequests
		}
		return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}}

	resp, err := client.Do(context.Background(), &model.UpstreamRequest{Method: http.MethodGet, URL: "https://example.com/good"})
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	resp, err = client.Do(context.Background(), &model.UpstreamRequest{Method: http.MethodGet, URL: "https://example.com/bad"})
	require.Error(t, err)
	assert.Equal(t, http.StatusTooManyRequests, resp.StatusCode)
	assert.Equal(t, "https://example.com/bad", client.lastURL)
}

func TestRedactURL(t *testing.T) {
	raw := "https://x.test?a=1&Authorization=secret&key=abc&appid=xyz"
	redacted := redactURL(raw)
	assert.NotContains(t, redacted, "secret")
	assert.NotContains(t, redacted, "abc")
	assert.NotContains(t, redacted, "xyz")
	assert.Contains(t, redacted, "REDACTED")
}

func TestFetchScenario_Success(t *testing.T) {
	root := t.TempDir()
	registry := adapter.NewRegistry(adapter.OpenMeteo{})
	client := &captureClient{http: &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"current":{"temperature_2m":25},"latitude":25.03,"longitude":121.56}`)), Header: make(http.Header)}, nil
	})}}
	scenario := &fixtures.Scenario{ID: "openmeteo_current_taipei", Provider: "openmeteo", WeatherType: model.WeatherTypeCurrent, Query: model.WeatherQuery{Provider: "openmeteo", Lat: 25.03, Lon: 121.56}}

	err := fetchScenario(root, &config.Config{}, registry, client, scenario)
	require.NoError(t, err)
	assert.Equal(t, 200, scenario.StatusCode)
	assert.Equal(t, fixtures.BodyFileName("openmeteo_current_taipei"), scenario.BodyFile)
	b, err := os.ReadFile(filepath.Join(root, scenario.BodyFile))
	require.NoError(t, err)
	assert.Contains(t, string(b), "temperature_2m")
}

func TestFetchScenario_MissingKeyAndProvider(t *testing.T) {
	root := t.TempDir()
	client := &captureClient{http: &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		return nil, errors.New("should not be called")
	})}}

	err := fetchScenario(root, &config.Config{}, adapter.NewRegistry(adapter.CWA{}), client, &fixtures.Scenario{ID: "cwa", Provider: "cwa", WeatherType: model.WeatherTypeCurrent, Query: model.WeatherQuery{Provider: "cwa"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "missing API key")

	err = fetchScenario(root, &config.Config{}, adapter.NewRegistry(), client, &fixtures.Scenario{ID: "x", Provider: "missing", WeatherType: model.WeatherTypeCurrent})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "provider not registered")
}
