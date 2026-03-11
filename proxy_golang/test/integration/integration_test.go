//go:build integration

package integration

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
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

// ─── mock UpstreamClient ─────────────────────────────────────────────────────

type mockUpstreamClient struct {
	doFn func(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error)
}

func (m *mockUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	if m.doFn != nil {
		return m.doFn(ctx, req)
	}
	return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{}`)}, nil
}

// ─── fixture 讀取 ────────────────────────────────────────────────────────────

func mustReadFixture(name string) []byte {
	_, file, _, _ := runtime.Caller(0)
	dir := filepath.Dir(file)
	// 整合測試在 test/integration/，fixture 在 pkg/adapter/testdata/
	fixturePath := filepath.Join(dir, "..", "..", "pkg", "adapter", "testdata", name)
	b, err := os.ReadFile(fixturePath)
	if err != nil {
		panic("cannot read fixture: " + fixturePath + ": " + err.Error())
	}
	return b
}

// ─── 伺服器組裝 ──────────────────────────────────────────────────────────────

type serverOptions struct {
	proxySecret    string
	upstreamClient model.UpstreamClient
}

func setupServer(t *testing.T, upstreamURL string, opts serverOptions) *httptest.Server {
	t.Helper()

	// 替換 ProxyService 的路由 BaseURL 指向 mock upstream
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

	cfg := &config.Config{
		Port:        "0",
		GinMode:     "test",
		ProxySecret: opts.proxySecret,
		APIKeys: config.APIKeysConfig{
			CWA:        "test-cwa-key",
			WeatherAPI: "test-weather-key",
		},
	}

	// 選擇 upstream client：整合測試可傳入 mock，若無則用真實 HTTP client
	upstreamClient := opts.upstreamClient
	if upstreamClient == nil {
		upstreamClient = service.NewUpstreamClient()
	}

	// 組裝 DI
	cacheRepo := repository.NewCacheRepository()
	validatorSvc := service.NewValidatorService()
	proxySvc := service.NewProxyService(cfg, validatorSvc, cacheRepo, upstreamClient)
	proxyCtrl := controller.NewProxyController(proxySvc)
	debugCtrl := controller.NewDebugController()

	adapterRegistry := adapter.NewRegistry(
		adapter.CWA{},
		adapter.WeatherAPI{},
		adapter.OpenMeteo{},
	)
	weatherSvc := service.NewWeatherService(cfg, adapterRegistry, upstreamClient)
	weatherCtrl := controller.NewWeatherController(weatherSvc)

	r := router.Setup(proxyCtrl, debugCtrl, weatherCtrl, opts.proxySecret)
	return httptest.NewServer(r)
}

// ─── /api/debug ──────────────────────────────────────────────────────────────

func TestIntegration_DebugEndpoint(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/debug")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

// ─── /api/proxy ──────────────────────────────────────────────────────────────

func TestIntegration_ProxySuccess(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "test-cwa-key", r.URL.Query().Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"records":{"Station":[]}}`))
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/proxy?service=cwa&endpoint=O-A0001-001")
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
		_, _ = w.Write([]byte(`{"data": "cached"}`))
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	target := srv.URL + "/api/proxy?service=cwa&endpoint=O-A0001-001"

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

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/proxy?service=invalid&endpoint=test")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_InvalidEndpoint(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/proxy?service=cwa&endpoint=not-allowed")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_MissingParams(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/proxy")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_PathTraversal(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/proxy?service=cwa&endpoint=../etc/passwd")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_CORS_Options(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodOptions, srv.URL+"/api/proxy", nil)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 204, resp.StatusCode)
}

func TestIntegration_CORS_AllowedOrigin(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/debug", nil)
	req.Header.Set("Origin", "http://localhost:8081")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, "http://localhost:8081", resp.Header.Get("Access-Control-Allow-Origin"))
}

func TestIntegration_CORS_UnknownOrigin(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	srv := setupServer(t, upstream.URL, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/debug", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	// 不在允許清單：不應回傳 ACAO header
	assert.Empty(t, resp.Header.Get("Access-Control-Allow-Origin"))
}

// ─── /api/weather/* (使用 mock upstream client) ───────────────────────────────

func TestIntegration_WeatherCurrent_OpenMeteo(t *testing.T) {
	fixture := mustReadFixture("openmeteo_forecast.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=openmeteo&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
	assert.Contains(t, resp.Header.Get("Content-Type"), "application/json")
}

func TestIntegration_WeatherCurrent_WeatherAPI(t *testing.T) {
	fixture := mustReadFixture("weatherapi_forecast.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=weatherapi&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_WeatherCurrent_CWA(t *testing.T) {
	fixture := mustReadFixture("cwa_current.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=cwa&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_WeatherHourly_OpenMeteo(t *testing.T) {
	fixture := mustReadFixture("openmeteo_forecast.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/hourly?provider=openmeteo&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_WeatherDaily_OpenMeteo(t *testing.T) {
	fixture := mustReadFixture("openmeteo_forecast.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/daily?provider=openmeteo&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_WeatherHistory_OpenMeteo(t *testing.T) {
	fixture := mustReadFixture("openmeteo_archive.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/history?provider=openmeteo&lat=25.04&lon=121.51&date=2024-01-15")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_WeatherHistory_MissingDate(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/history?provider=openmeteo&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	// date 缺少 → controller 應回 400
	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_MissingProvider(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_InvalidProvider(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=invalid&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_MissingLocation(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=openmeteo")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_WithLocationID(t *testing.T) {
	fixture := mustReadFixture("cwa_current.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, "http://unused", serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=cwa&locationId=C0TB40")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}
