//go:build integration

package integration

import (
	"context"
	"encoding/json"
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

	// 選擇 upstream client：整合測試可傳入 mock，若無則用真實 HTTP client
	upstreamClient := opts.upstreamClient
	if upstreamClient == nil {
		upstreamClient = service.NewUpstreamClient()
	}

	// Adapter Registry
	adapterRegistry := adapter.NewRegistry(
		adapter.CWA{},
		adapter.WeatherAPI{},
		adapter.OpenMeteo{},
	)

	// Service 層
	weatherSvc := service.NewWeatherService(cfg, adapterRegistry, upstreamClient)

	// Controller 層
	debugCtrl := controller.NewDebugController()
	weatherCtrl := controller.NewWeatherController(weatherSvc)
	providerCtrl := controller.NewProviderController(adapterRegistry)

	r := router.Setup(debugCtrl, weatherCtrl, providerCtrl, opts.proxySecret)
	return httptest.NewServer(r)
}

// ─── /api/health ─────────────────────────────────────────────────────────────

func TestIntegration_HealthEndpoint(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/health")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

// ─── /api/provider/list ──────────────────────────────────────────────────────

func TestIntegration_ProviderList(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/provider/list")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
	assert.Contains(t, resp.Header.Get("Content-Type"), "application/json")
}

// ─── CORS ────────────────────────────────────────────────────────────────────

func TestIntegration_CORS_Options(t *testing.T) {
	srv := setupServer(t, serverOptions{})
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodOptions, srv.URL+"/api/health", nil)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 204, resp.StatusCode)
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

	// 不在允許清單：不應回傳 ACAO header
	assert.Empty(t, resp.Header.Get("Access-Control-Allow-Origin"))
}

// ─── X-Mock-Data header 整合測試 ─────────────────────────────────────────────
// 驗證帶 X-Mock-Data header 時，不呼叫三方 API，回傳寫死的原始三方資料經 adapter 解析後的結果

// failingUpstreamClient 若被呼叫代表 mock 沒生效
type failingUpstreamClient struct{}

func (failingUpstreamClient) Do(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	return nil, assert.AnError // mock 應攔截，不應走到這裡
}

func setupMockServer(t *testing.T) *httptest.Server {
	t.Helper()

	cfg := &config.Config{
		Port:        "0",
		GinMode:     "test",
		ProxySecret: "",
		APIKeys: config.APIKeysConfig{
			CWA:            "test-cwa-key",
			WeatherAPI:     "test-weather-key",
			OpenWeatherMap: "test-owm-key",
		},
	}

	// 用 MockableUpstreamClient 包裝一個會失敗的 client
	// 若 mock 沒攔截到，會直接報錯
	upstreamClient := service.NewMockableUpstreamClient(&failingUpstreamClient{})

	adapterRegistry := adapter.NewRegistry(
		adapter.CWA{},
		adapter.WeatherAPI{},
		adapter.OpenMeteo{},
		adapter.OpenWeatherMap{},
	)

	weatherSvc := service.NewWeatherService(cfg, adapterRegistry, upstreamClient)

	debugCtrl := controller.NewDebugController()
	weatherCtrl := controller.NewWeatherController(weatherSvc)
	providerCtrl := controller.NewProviderController(adapterRegistry)

	r := router.Setup(debugCtrl, weatherCtrl, providerCtrl, "")
	return httptest.NewServer(r)
}

// mockGet 發送帶 X-Mock-Data header 的 GET 請求
func mockGet(t *testing.T, url string) *http.Response {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	require.NoError(t, err)
	req.Header.Set("X-Mock-Data", "true")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

// --- CWA ---

func TestMock_CWA_Current(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/current?provider=cwa&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
	assert.Contains(t, resp.Header.Get("Content-Type"), "application/json")
}

func TestMock_CWA_Hourly(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/hourly?provider=cwa&locationId=F-D0047-061")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_CWA_Daily(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/daily?provider=cwa&locationId=F-D0047-061")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

// --- Open-Meteo ---

func TestMock_OpenMeteo_Current(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/current?provider=openmeteo&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_OpenMeteo_Hourly(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/hourly?provider=openmeteo&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_OpenMeteo_Daily(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/daily?provider=openmeteo&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_OpenMeteo_History(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/history?provider=openmeteo&lat=25.03&lon=121.56&date=2024-06-01")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

// --- WeatherAPI ---

func TestMock_WeatherAPI_Current(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/current?provider=weatherapi&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_WeatherAPI_Hourly(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/hourly?provider=weatherapi&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_WeatherAPI_Daily(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/daily?provider=weatherapi&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_WeatherAPI_History(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/history?provider=weatherapi&lat=25.03&lon=121.56&date=2024-06-01")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

// --- OpenWeatherMap ---

func TestMock_OWM_Current(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/current?provider=openweathermap&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_OWM_Hourly(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/hourly?provider=openweathermap&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestMock_OWM_Daily(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/daily?provider=openweathermap&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

// --- 驗證無 header 時 mock 不生效 ---

func TestMock_WithoutHeader_ShouldNotMock(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	// 不帶 X-Mock-Data header → failingUpstreamClient 會被呼叫 → 應回 502
	resp, err := http.Get(srv.URL + "/api/weather/current?provider=openmeteo&lat=25.03&lon=121.56")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 502, resp.StatusCode)
}

// --- 驗證回應內容結構 ---

func TestMock_ResponseBody_OpenMeteo_Current(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/current?provider=openmeteo&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	var result model.WeatherResponse
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&result))

	assert.Equal(t, "openmeteo", result.Provider)
	assert.Equal(t, model.WeatherTypeCurrent, result.Type)
	assert.NotNil(t, result.Current)
	assert.InDelta(t, 29.5, result.Current.Temperature, 0.1)
	assert.Equal(t, 70, result.Current.Humidity)
}

func TestMock_ResponseBody_CWA_Current(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/current?provider=cwa&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	var result model.WeatherResponse
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&result))

	assert.Equal(t, "cwa", result.Provider)
	assert.NotNil(t, result.Current)
	assert.InDelta(t, 28.5, result.Current.Temperature, 0.1)
	assert.Equal(t, "臺北", result.Location.Name)
}

func TestMock_ResponseBody_WeatherAPI_Daily(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/daily?provider=weatherapi&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	var result model.WeatherResponse
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&result))

	assert.Equal(t, "weatherapi", result.Provider)
	assert.GreaterOrEqual(t, len(result.Daily), 1)
	assert.InDelta(t, 33.0, result.Daily[0].TempMax, 0.1)
}

func TestMock_ResponseBody_OWM_Hourly(t *testing.T) {
	srv := setupMockServer(t)
	defer srv.Close()

	resp := mockGet(t, srv.URL+"/api/weather/hourly?provider=openweathermap&lat=25.03&lon=121.56")
	defer resp.Body.Close()

	var result model.WeatherResponse
	require.Equal(t, 200, resp.StatusCode)
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&result))

	assert.Equal(t, "openweathermap", result.Provider)
	assert.GreaterOrEqual(t, len(result.Hourly), 1)
	assert.Equal(t, "Taipei", result.Location.Name)
}

// ─── /api/weather/* (使用 mock upstream client) ───────────────────────────────

func TestIntegration_WeatherCurrent_OpenMeteo(t *testing.T) {
	fixture := mustReadFixture("openmeteo_forecast.json")
	mock := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: fixture}, nil
		},
	}

	srv := setupServer(t, serverOptions{upstreamClient: mock})
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

	srv := setupServer(t, serverOptions{upstreamClient: mock})
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

	srv := setupServer(t, serverOptions{upstreamClient: mock})
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

	srv := setupServer(t, serverOptions{upstreamClient: mock})
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

	srv := setupServer(t, serverOptions{upstreamClient: mock})
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

	srv := setupServer(t, serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/history?provider=openmeteo&lat=25.04&lon=121.51&date=2024-01-15")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}

func TestIntegration_WeatherHistory_MissingDate(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/history?provider=openmeteo&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	// date 缺少 → controller 應回 400
	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_MissingProvider(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_InvalidProvider(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=invalid&lat=25.04&lon=121.51")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 400, resp.StatusCode)
}

func TestIntegration_Weather_MissingLocation(t *testing.T) {
	mock := &mockUpstreamClient{}

	srv := setupServer(t, serverOptions{upstreamClient: mock})
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

	srv := setupServer(t, serverOptions{upstreamClient: mock})
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/weather/current?provider=cwa&locationId=C0TB40")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, 200, resp.StatusCode)
}
