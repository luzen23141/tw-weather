//go:build integration

package integration

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/config"
	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/model"
	"proxy_golang/pkg/repository"
	"proxy_golang/pkg/router"
	"proxy_golang/pkg/service"
)

func setupIntegrationServer(t *testing.T, upstreamURL string) *httptest.Server {
	t.Helper()

	// 替換路由指向 mock upstream
	originalRoutes := make(map[string]model.ServiceRoute)
	for k, v := range model.ServiceRoutes {
		originalRoutes[k] = v
	}

	model.ServiceRoutes["cwa"] = model.ServiceRoute{
		BaseURL:          upstreamURL,
		AllowedEndpoints: []string{"O-A0001-001", "F-D0047-089", "F-D0047-091"},
		APIKeyEnvVar:     "CWA_API_KEY",
		APIKeyParam:      "Authorization",
	}
	model.ServiceRoutes["weatherapi"] = model.ServiceRoute{
		BaseURL:          upstreamURL,
		AllowedEndpoints: []string{"current.json", "forecast.json", "history.json"},
		APIKeyEnvVar:     "WEATHERAPI_KEY",
		APIKeyParam:      "key",
	}

	t.Cleanup(func() {
		for k, v := range originalRoutes {
			model.ServiceRoutes[k] = v
		}
	})

	// 使用 Config struct
	cfg := &config.Config{
		Port:    "0",
		GinMode: "test",
		APIKeys: config.APIKeysConfig{
			CWA:            "test-cwa-key",
			WeatherAPI:     "test-weather-key",
			OpenWeatherMap: "test-owm-key",
		},
	}

	// 組裝 DI
	cacheRepo := repository.NewCacheRepository()
	validatorSvc := service.NewValidatorService()
	upstreamClient := service.NewUpstreamClient()
	proxySvc := service.NewProxyService(cfg, validatorSvc, cacheRepo, upstreamClient)
	proxyCtrl := controller.NewProxyController(proxySvc)
	debugCtrl := controller.NewDebugController()
	r := router.Setup(proxyCtrl, debugCtrl)

	return httptest.NewServer(r)
}

func TestIntegration_DebugEndpoint(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/debug")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_ProxySuccess(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "test-cwa-key", r.URL.Query().Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"records":{"Station":[]}}`))
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/proxy?service=cwa&endpoint=O-A0001-001")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
	assert.Equal(t, "MISS", resp.Header.Get("X-Cache"))
}

func TestIntegration_ProxyCacheHit(t *testing.T) {
	callCount := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		callCount++
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data": "cached"}`))
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	target := server.URL + "/api/proxy?service=cwa&endpoint=O-A0001-001"

	resp1, err := http.Get(target)
	require.NoError(t, err)
	resp1.Body.Close()
	assert.Equal(t, "MISS", resp1.Header.Get("X-Cache"))

	resp2, err := http.Get(target)
	require.NoError(t, err)
	resp2.Body.Close()
	assert.Equal(t, "HIT", resp2.Header.Get("X-Cache"))

	assert.Equal(t, 1, callCount)
}

func TestIntegration_InvalidService(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/proxy?service=invalid&endpoint=test")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_InvalidEndpoint(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/proxy?service=cwa&endpoint=not-allowed")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_MissingParams(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/proxy")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_PathTraversal(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/proxy?service=cwa&endpoint=../etc/passwd")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_CORS(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	server := setupIntegrationServer(t, upstream.URL)
	defer server.Close()

	req, _ := http.NewRequest(http.MethodOptions, server.URL+"/api/proxy", nil)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 204, resp.StatusCode)
	assert.Equal(t, "*", resp.Header.Get("Access-Control-Allow-Origin"))
}
