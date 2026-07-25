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

// ─── mock cache repository ───────────────────────────────────────────────────

type mockCacheRepository struct {
	entries map[string]*model.CacheEntry
	lastKey string
	// lockDenied 為 true 時 TryLock 一律失敗，用於測試「別人正在更新」的分支
	lockDenied bool
	locksHeld  map[string]bool
}

func (m *mockCacheRepository) Get(key string) (*model.CacheEntry, bool) {
	if m.entries == nil {
		return nil, false
	}
	entry, ok := m.entries[key]
	return entry, ok
}

func (m *mockCacheRepository) Set(key string, entry *model.CacheEntry) {
	m.lastKey = key
	if m.entries == nil {
		m.entries = map[string]*model.CacheEntry{}
	}
	m.entries[key] = entry
}

func (m *mockCacheRepository) TryLock(key string, _ time.Duration) bool {
	if m.lockDenied {
		return false
	}
	if m.locksHeld == nil {
		m.locksHeld = map[string]bool{}
	}
	if m.locksHeld[key] {
		return false
	}
	m.locksHeld[key] = true
	return true
}

func (m *mockCacheRepository) Unlock(key string) {
	delete(m.locksHeld, key)
}

// ─── mock adapter ───────────────────────────────────────────────────────────

type mockAdapter struct {
	providerID  string
	requiresKey bool
	apiKey      string
	fetchFn     func(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error)
}

func (m *mockAdapter) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	if m.fetchFn != nil {
		return m.fetchFn(ctx, query, weatherType, apiKey, client)
	}
	return &model.WeatherResponse{
		Provider:  m.providerID,
		UpdatedAt: time.Now(),
	}, nil
}

func providerSpecFromMock(m *mockAdapter) adapter.ProviderSpec {
	return adapter.ProviderSpec{
		ID:          m.providerID,
		Name:        m.providerID,
		Description: "mock",
		APIKey:      m.apiKey,
		RequiresKey: m.requiresKey,
		Adapter:     m,
	}
}

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

func newWeatherService(adapters ...*mockAdapter) WeatherService {
	registryProviders := make([]adapter.ProviderSpec, 0, len(adapters))
	for _, a := range adapters {
		if a.requiresKey && a.apiKey == "" {
			a.apiKey = "test-key"
		}
		registryProviders = append(registryProviders, providerSpecFromMock(a))
	}
	cfg := &config.Config{}
	registry := adapter.NewRegistry(registryProviders...)
	upstream := &mockUpstreamClient{}
	cache := &mockCacheRepository{}
	return NewWeatherService(cfg, registry, upstream, cache)
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
		providerID:  providerID,
		requiresKey: providerID != "openmeteo",
		apiKey:      "test-key",
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

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

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

	_, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

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

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeHourly)

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

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeDaily)

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

	resp, err := svc.GetWeather(context.Background(), query, model.WeatherTypeHistory)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "2024-01-15", capturedDate)
}

func TestGetHistoryWeather_EmptyDate_Returns400(t *testing.T) {
	svc := newWeatherService(successAdapter("weatherapi"))

	query := baseQuery("weatherapi")
	// Date 故意留空

	resp, err := svc.GetWeather(context.Background(), query, model.WeatherTypeHistory)

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

	resp, err := svc.GetWeather(context.Background(), baseQuery("unknown_provider"), model.WeatherTypeCurrent)

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
	registry := adapter.NewRegistry(adapter.ProviderSpec{ID: "cwa", Name: "cwa", Description: "mock", RequiresKey: true, Adapter: successAdapter("cwa")})
	upstream := &mockUpstreamClient{}
	svc := NewWeatherService(cfg, registry, upstream, &mockCacheRepository{})

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

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

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

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
		providerID:  "openmeteo",
		requiresKey: false,
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
	registry := adapter.NewRegistry(providerSpecFromMock(a))
	upstream := &mockUpstreamClient{}
	svc := NewWeatherService(cfg, registry, upstream, &mockCacheRepository{})

	resp, err := svc.GetWeather(context.Background(), baseQuery("openmeteo"), model.WeatherTypeCurrent)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "openmeteo", resp.Provider)
	assert.Equal(t, "", capturedKey, "openmeteo 不應傳入 API key")
	assert.Equal(t, 22.0, resp.Current.Temperature)
}

func TestBuildCacheKey_IncludesLocationID(t *testing.T) {
	query := &model.WeatherQuery{
		Provider:   "cwa",
		LocationID: "F-D0047-061",
		Date:       "2024-01-15",
		Days:       3,
	}

	key := buildCacheKey(query, model.WeatherTypeHourly)

	assert.Contains(t, key, "locationId=F-D0047-061")
	assert.NotContains(t, key, "lat=")
}

func TestGetCurrentWeather_UpstreamStatusError_Returns502(t *testing.T) {
	a := &mockAdapter{
		providerID: "cwa",
		fetchFn: func(_ context.Context, _ *model.WeatherQuery, _ model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			return nil, &UpstreamStatusError{StatusCode: http.StatusTooManyRequests, Body: "rate limited"}
		},
	}
	svc := newWeatherService(a)

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

	assert.Nil(t, resp)
	require.Error(t, err)
	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusBadGateway, proxyErr.Code)
	assert.Contains(t, proxyErr.Error(), "status 429")
}

func TestGetCurrentWeather_CacheHit(t *testing.T) {
	cache := &mockCacheRepository{entries: map[string]*model.CacheEntry{
		buildCacheKey(baseQuery("cwa"), model.WeatherTypeCurrent): {
			Response: &model.WeatherResponse{Provider: "cwa", Current: &model.CurrentWeather{Temperature: 30}},
		},
	}}
	registry := adapter.NewRegistry(adapter.ProviderSpec{ID: "cwa", Name: "cwa", Description: "mock", APIKey: "key", RequiresKey: true, Adapter: successAdapter("cwa")})
	svc := NewWeatherService(&config.Config{APIKeys: config.APIKeysConfig{CWA: "key"}}, registry, &mockUpstreamClient{}, cache)

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

	require.NoError(t, err)
	assert.True(t, resp.CacheHit)
	assert.Equal(t, 30.0, resp.Current.Temperature)
}

func TestGetCurrentWeather_CacheMissStoresValue(t *testing.T) {
	cache := &mockCacheRepository{}
	registry := adapter.NewRegistry(adapter.ProviderSpec{ID: "cwa", Name: "cwa", Description: "mock", APIKey: "key", RequiresKey: true, Adapter: successAdapter("cwa")})
	svc := NewWeatherService(&config.Config{APIKeys: config.APIKeysConfig{CWA: "key"}}, registry, &mockUpstreamClient{}, cache)

	_, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

	require.NoError(t, err)
	assert.NotEmpty(t, cache.lastKey)
	_, ok := cache.entries[cache.lastKey]
	assert.True(t, ok)
}

func TestFetchWeather_AdapterTimeout_Returns504(t *testing.T) {
	a := &mockAdapter{
		providerID: "cwa",
		fetchFn: func(ctx context.Context, _ *model.WeatherQuery, _ model.WeatherType, _ string, _ model.UpstreamClient) (*model.WeatherResponse, error) {
			<-ctx.Done()
			return nil, ctx.Err()
		},
	}
	svc := newWeatherService(a)

	resp, err := svc.GetWeather(context.Background(), baseQuery("cwa"), model.WeatherTypeCurrent)

	assert.Nil(t, resp)
	require.Error(t, err)
	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusGatewayTimeout, proxyErr.Code)
}
