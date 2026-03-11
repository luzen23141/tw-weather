package service

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
)

// ─── mock adapter ───────────────────────────────────────────────────────────

type mockAdapter struct {
	providerID string
	fetchFn    func(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error)
}

func (m *mockAdapter) ProviderID() string { return m.providerID }
func (m *mockAdapter) APIKeyEnvVar() string {
	switch m.providerID {
	case "cwa":
		return "CWA_API_KEY"
	case "weatherapi":
		return "WEATHERAPI_KEY"
	default:
		return ""
	}
}
func (m *mockAdapter) RequiresKey() bool { return m.providerID != "openmeteo" }

func (m *mockAdapter) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	if m.fetchFn != nil {
		return m.fetchFn(ctx, query, weatherType, apiKey, client)
	}
	return &model.WeatherResponse{
		Provider:  m.providerID,
		UpdatedAt: time.Now(),
	}, nil
}

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

func newWeatherService(adapters ...adapter.Adapter) WeatherService {
	cfg := &config.Config{
		APIKeys: config.APIKeysConfig{
			CWA:        "test-cwa-key",
			WeatherAPI: "test-weatherapi-key",
		},
	}
	registry := adapter.NewRegistry(adapters...)
	upstream := &mockUpstreamClient{}
	return NewWeatherService(cfg, registry, upstream)
}

func baseQuery(provider string) *model.WeatherQuery {
	return &model.WeatherQuery{
		Provider: provider,
		Lat:      25.04,
		Lon:      121.51,
	}
}

func successAdapter(providerID string) *mockAdapter {
	return &mockAdapter{
		providerID: providerID,
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, _ model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			return &model.WeatherResponse{
				Provider:  providerID,
				UpdatedAt: time.Now(),
				Current:   &model.CurrentWeather{Temperature: 28.5},
			}, nil
		},
	}
}

// ─── GetCurrentWeather ───────────────────────────────────────────────────────

func TestGetCurrentWeather_Success(t *testing.T) {
	svc := newWeatherService(successAdapter("cwa"))

	resp, err := svc.GetCurrentWeather(context.Background(), baseQuery("cwa"))

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "cwa", resp.Provider)
	assert.Equal(t, 28.5, resp.Current.Temperature)
}

// weatherType 應由 fetchWeather 設為 "current"
func TestGetCurrentWeather_SetsQueryType(t *testing.T) {
	var capturedType model.WeatherType
	a := &mockAdapter{
		providerID: "cwa",
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, wt model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			capturedType = wt
			return &model.WeatherResponse{Provider: "cwa"}, nil
		},
	}
	svc := newWeatherService(a)

	_, err := svc.GetCurrentWeather(context.Background(), baseQuery("cwa"))

	require.NoError(t, err)
	assert.Equal(t, model.WeatherTypeCurrent, capturedType)
}

// ─── GetHourlyWeather ────────────────────────────────────────────────────────

func TestGetHourlyWeather_Success_TypeIsHourly(t *testing.T) {
	var capturedType model.WeatherType
	a := &mockAdapter{
		providerID: "cwa",
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, wt model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			capturedType = wt
			return &model.WeatherResponse{Provider: "cwa"}, nil
		},
	}
	svc := newWeatherService(a)

	resp, err := svc.GetHourlyWeather(context.Background(), baseQuery("cwa"))

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHourly, capturedType)
}

// ─── GetDailyWeather ─────────────────────────────────────────────────────────

func TestGetDailyWeather_Success_TypeIsDaily(t *testing.T) {
	var capturedType model.WeatherType
	a := &mockAdapter{
		providerID: "cwa",
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, wt model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			capturedType = wt
			return &model.WeatherResponse{Provider: "cwa"}, nil
		},
	}
	svc := newWeatherService(a)

	resp, err := svc.GetDailyWeather(context.Background(), baseQuery("cwa"))

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeDaily, capturedType)
}

// ─── GetHistoryWeather ───────────────────────────────────────────────────────

func TestGetHistoryWeather_Success_WithDate(t *testing.T) {
	var capturedDate string
	a := &mockAdapter{
		providerID: "weatherapi",
		fetchFn: func(_ context.Context, q *model.WeatherQuery, _ model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			capturedDate = q.Date
			return &model.WeatherResponse{Provider: "weatherapi"}, nil
		},
	}
	svc := newWeatherService(a)

	query := baseQuery("weatherapi")
	query.Date = "2024-01-15"

	resp, err := svc.GetHistoryWeather(context.Background(), query)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "2024-01-15", capturedDate)
}

func TestGetHistoryWeather_EmptyDate_Returns400(t *testing.T) {
	svc := newWeatherService(successAdapter("weatherapi"))

	query := baseQuery("weatherapi")
	// Date 故意留空

	resp, err := svc.GetHistoryWeather(context.Background(), query)

	assert.Nil(t, resp)
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusBadRequest, proxyErr.Code)
	assert.Contains(t, proxyErr.Error(), "date is required")
}

// ─── fetchWeather — provider 不存在 ─────────────────────────────────────────

func TestFetchWeather_UnknownProvider_Returns400(t *testing.T) {
	// 不注冊任何 adapter
	svc := newWeatherService()

	resp, err := svc.GetCurrentWeather(context.Background(), baseQuery("unknown_provider"))

	assert.Nil(t, resp)
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusBadRequest, proxyErr.Code)
	assert.Contains(t, proxyErr.Error(), "unsupported provider")
}

// ─── fetchWeather — API key 未設定（requiresKey=true）────────────────────────

func TestFetchWeather_MissingAPIKey_Returns500(t *testing.T) {
	// 使用空 APIKeys 設定
	cfg := &config.Config{
		APIKeys: config.APIKeysConfig{}, // CWA key 為空
	}
	registry := adapter.NewRegistry(successAdapter("cwa"))
	upstream := &mockUpstreamClient{}
	svc := NewWeatherService(cfg, registry, upstream)

	resp, err := svc.GetCurrentWeather(context.Background(), baseQuery("cwa"))

	assert.Nil(t, resp)
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusInternalServerError, proxyErr.Code)
	assert.Contains(t, proxyErr.Error(), "API key not configured")
}

// ─── fetchWeather — adapter 回傳 error ───────────────────────────────────────

func TestFetchWeather_AdapterError_Returns502(t *testing.T) {
	a := &mockAdapter{
		providerID: "cwa",
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, _ model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			return nil, errors.New("upstream connection refused")
		},
	}
	svc := newWeatherService(a)

	resp, err := svc.GetCurrentWeather(context.Background(), baseQuery("cwa"))

	assert.Nil(t, resp)
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusBadGateway, proxyErr.Code)
}

// ─── openmeteo — 無需 key 也能成功呼叫 ──────────────────────────────────────

func TestGetCurrentWeather_OpenMeteo_NoKeyRequired(t *testing.T) {
	var capturedKey string
	a := &mockAdapter{
		providerID: "openmeteo",
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, _ model.WeatherType, apiKey string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			capturedKey = apiKey
			return &model.WeatherResponse{
				Provider: "openmeteo",
				Current:  &model.CurrentWeather{Temperature: 22.0},
			}, nil
		},
	}
	// 完全沒設定任何 APIKeys
	cfg := &config.Config{APIKeys: config.APIKeysConfig{}}
	registry := adapter.NewRegistry(a)
	upstream := &mockUpstreamClient{}
	svc := NewWeatherService(cfg, registry, upstream)

	resp, err := svc.GetCurrentWeather(context.Background(), baseQuery("openmeteo"))

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "openmeteo", resp.Provider)
	assert.Equal(t, "", capturedKey, "openmeteo 不應傳入 API key")
	assert.Equal(t, 22.0, resp.Current.Temperature)
}
