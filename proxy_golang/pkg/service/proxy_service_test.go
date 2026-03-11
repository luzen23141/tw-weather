package service

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
)

func testConfig(cwaKey string) *config.Config {
	return &config.Config{
		Port:    "8080",
		GinMode: "test",
		APIKeys: config.APIKeysConfig{
			CWA:            cwaKey,
			WeatherAPI:     "test-weather-key",
			OpenWeatherMap: "test-owm-key",
		},
	}
}

func newTestProxyService(
	cfg *config.Config,
	cache *mockCacheRepository,
	upstream *mockUpstreamClient,
) ProxyService {
	return NewProxyService(cfg, cache, upstream)
}

func TestForward_Success(t *testing.T) {
	cfg := testConfig("test-cwa-key")
	cache := newMockCacheRepository()
	upstream := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			assert.Contains(t, req.URL, "Authorization=test-cwa-key")
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"temp": 25}`)}, nil
		},
	}

	svc := newTestProxyService(cfg, cache, upstream)
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "O-A0001-001"}
	rawQuery := url.Values{"service": {"cwa"}, "endpoint": {"O-A0001-001"}}

	result, err := svc.Forward(context.Background(), query, rawQuery)
	require.NoError(t, err)
	assert.Equal(t, 200, result.StatusCode)
	assert.Equal(t, []byte(`{"temp": 25}`), result.Data)
	assert.False(t, result.CacheHit)
}

func TestForward_CacheHit(t *testing.T) {
	cfg := testConfig("test-key")
	cache := newMockCacheRepository()
	// 預先填入 cache，key 由真實 buildCacheKey 產生
	cacheKey := buildCacheKey("cwa", "O-A0001-001", url.Values{})
	cache.store[cacheKey] = &model.CacheEntry{Data: []byte(`{"cached": true}`), StatusCode: 200}
	upstream := &mockUpstreamClient{}

	svc := newTestProxyService(cfg, cache, upstream)
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "O-A0001-001"}

	result, err := svc.Forward(context.Background(), query, url.Values{})
	require.NoError(t, err)
	assert.True(t, result.CacheHit)
	assert.Equal(t, []byte(`{"cached": true}`), result.Data)
}

func TestForward_ValidationError(t *testing.T) {
	cfg := testConfig("test-key")
	cache := newMockCacheRepository()
	upstream := &mockUpstreamClient{}

	svc := newTestProxyService(cfg, cache, upstream)
	// 使用不存在的 service 觸發驗證錯誤
	query := &model.ProxyQuery{Service: "bad", Endpoint: "test"}

	_, err := svc.Forward(context.Background(), query, url.Values{})
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusBadRequest, proxyErr.Code)
}

func TestForward_MissingAPIKey(t *testing.T) {
	cfg := testConfig("") // 空的 API Key
	cache := newMockCacheRepository()
	upstream := &mockUpstreamClient{}

	svc := newTestProxyService(cfg, cache, upstream)
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "O-A0001-001"}

	_, err := svc.Forward(context.Background(), query, url.Values{})
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusInternalServerError, proxyErr.Code)
}

func TestForward_UpstreamError(t *testing.T) {
	cfg := testConfig("test-key")
	cache := newMockCacheRepository()
	upstream := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return nil, errors.New("connection refused")
		},
	}

	svc := newTestProxyService(cfg, cache, upstream)
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "O-A0001-001"}

	_, err := svc.Forward(context.Background(), query, url.Values{})
	require.Error(t, err)

	var proxyErr *ProxyError
	require.ErrorAs(t, err, &proxyErr)
	assert.Equal(t, http.StatusBadGateway, proxyErr.Code)
}

func TestForward_CachesOnly2xx(t *testing.T) {
	cfg := testConfig("test-key")
	cache := newMockCacheRepository()
	upstream := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 404, Body: []byte(`{"error": "not found"}`)}, nil
		},
	}

	svc := newTestProxyService(cfg, cache, upstream)
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "O-A0001-001"}

	result, err := svc.Forward(context.Background(), query, url.Values{})
	require.NoError(t, err)
	assert.Equal(t, 404, result.StatusCode)
	assert.Empty(t, cache.store)
}
