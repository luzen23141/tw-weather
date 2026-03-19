//go:build integration

package integration

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/model"
	"proxy_golang/pkg/repository"
	"proxy_golang/pkg/router"
	"proxy_golang/pkg/service"
)

type mockUpstreamClient struct {
	doFn func(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error)
}

func (m *mockUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	if m.doFn != nil {
		return m.doFn(ctx, req)
	}
	return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{}`)}, nil
}

type serverOptions struct {
	proxySecret    string
	upstreamClient model.UpstreamClient
}

func setupServer(t *testing.T, opts serverOptions) *httptest.Server {
	t.Helper()

	cfg := &config.Config{
		Port:        "0",
		GinMode:     "test",
		ProxySecret: opts.proxySecret,
		APIKeys: config.APIKeysConfig{
			CWA:        "test-cwa-key",
			WeatherAPI: "test-weather-key",
		},
	}

	upstreamClient := opts.upstreamClient
	if upstreamClient == nil {
		upstreamClient = service.NewUpstreamClient()
	}

	adapterRegistry := adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", Name: "中央氣象署（CWA）", Description: "台灣最精準，含即時觀測與預報", APIKey: cfg.APIKeys.CWA, RequiresKey: true, Adapter: adapter.CWA{}},
		adapter.ProviderSpec{ID: "weatherapi", Name: "WeatherAPI", Description: "備用來源，支援預報與 7 天歷史", APIKey: cfg.APIKeys.WeatherAPI, RequiresKey: true, Adapter: adapter.WeatherAPI{}},
		adapter.ProviderSpec{ID: "openmeteo", Name: "Open-Meteo", Description: "免費無限制，歷史資料豐富", RequiresKey: false, Adapter: adapter.OpenMeteo{}},
	)

	weatherSvc := service.NewWeatherService(cfg, adapterRegistry, upstreamClient, repository.NewCache())
	debugCtrl := controller.NewDebugController()
	weatherCtrl := controller.NewWeatherController(weatherSvc)
	providerCtrl := controller.NewProviderController(adapterRegistry)

	r := router.Setup(debugCtrl, weatherCtrl, providerCtrl, opts.proxySecret)
	return httptest.NewServer(r)
}

func TestIntegration_HealthEndpoint(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/health")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestIntegration_ProviderList(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/provider/list")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, resp.Header.Get("Content-Type"), "application/json")
}

func TestIntegration_CORS_Options(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodOptions, srv.URL+"/api/health", nil)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusNoContent, resp.StatusCode)
}

func TestIntegration_CORS_AllowedOrigin(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/health", nil)
	req.Header.Set("Origin", "http://localhost:8081")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, "http://localhost:8081", resp.Header.Get("Access-Control-Allow-Origin"))
}

func TestIntegration_CORS_UnknownOrigin(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/health", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Empty(t, resp.Header.Get("Access-Control-Allow-Origin"))
}

func TestIntegration_WeatherEndpoint_WithoutAuth_Returns401(t *testing.T) {
	srv := setupServer(t, serverOptions{proxySecret: "secret"})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=openmeteo&lat=25.03&lon=121.56")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}
