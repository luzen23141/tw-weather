package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
)

// WeatherService 天氣資料服務介面
type WeatherService interface {
	GetWeather(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType) (*model.WeatherResponse, error)
}

type cacheStore interface {
	Get(key string) (*model.CacheEntry, bool)
	Set(key string, entry *model.CacheEntry)
}

// weatherServiceImpl 天氣服務實作
type weatherServiceImpl struct {
	cfg      *config.Config
	registry *adapter.Registry
	upstream model.UpstreamClient
	cache    cacheStore
}

// NewWeatherService 建立 WeatherService（依賴注入）
func NewWeatherService(
	cfg *config.Config,
	registry *adapter.Registry,
	upstream model.UpstreamClient,
	cache cacheStore,
) WeatherService {
	return &weatherServiceImpl{
		cfg:      cfg,
		registry: registry,
		upstream: upstream,
		cache:    cache,
	}
}

// GetWeather 取得指定類型天氣資料
func (s *weatherServiceImpl) GetWeather(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType) (*model.WeatherResponse, error) {
	if weatherType == model.WeatherTypeHistory && query.Date == "" {
		return nil, &ProxyError{
			Code: http.StatusBadRequest,
			Err:  fmt.Errorf("date is required for history query (YYYY-MM-DD)"),
		}
	}
	return s.fetchWeather(ctx, query, weatherType)
}

// fetchWeather 共用的 adapter 呼叫邏輯
func (s *weatherServiceImpl) fetchWeather(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType) (*model.WeatherResponse, error) {
	provider, ok := s.registry.Get(query.Provider)
	if !ok {
		return nil, &ProxyError{
			Code: http.StatusBadRequest,
			Err:  fmt.Errorf("unsupported provider: %s", query.Provider),
		}
	}

	apiKey := provider.APIKey
	if apiKey == "" && provider.RequiresKey {
		return nil, &ProxyError{
			Code: http.StatusInternalServerError,
			Err:  fmt.Errorf("API key not configured for provider: %s", query.Provider),
		}
	}

	cacheKey := buildCacheKey(query, weatherType)

	if entry, ok := s.cache.Get(cacheKey); ok && entry != nil && entry.Response != nil {
		log.Debug().Str("cacheKey", cacheKey).Msg("cache hit")
		resp := *entry.Response
		resp.CacheHit = true
		return &resp, nil
	}

	log.Info().
		Str("provider", query.Provider).
		Str("type", string(weatherType)).
		Float64("lat", query.Lat).
		Float64("lon", query.Lon).
		Str("locationId", query.LocationID).
		Str("date", query.Date).
		Int("days", query.Days).
		Msg("weather request")

	timeoutCtx, cancel := context.WithTimeout(ctx, upstreamTimeout)
	defer cancel()

	upstreamStart := time.Now()
	resp, err := provider.Adapter.Fetch(timeoutCtx, query, weatherType, apiKey, s.upstream)
	upstreamLatency := time.Since(upstreamStart)
	if err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, &ProxyError{Code: http.StatusGatewayTimeout, Err: fmt.Errorf("upstream timeout: %w", err)}
		}
		var upstreamStatusErr *UpstreamStatusError
		if errors.As(err, &upstreamStatusErr) {
			return nil, &ProxyError{Code: http.StatusBadGateway, Err: err}
		}
		return nil, &ProxyError{Code: http.StatusBadGateway, Err: fmt.Errorf("adapter fetch failed: %w", err)}
	}

	s.cache.Set(cacheKey, &model.CacheEntry{Response: resp})
	log.Debug().Str("cacheKey", cacheKey).Msg("cache set")

	log.Info().
		Str("provider", query.Provider).
		Str("type", string(weatherType)).
		Dur("upstreamLatency", upstreamLatency).
		Msg("upstream fetch complete")

	return resp, nil
}

func buildCacheKey(query *model.WeatherQuery, weatherType model.WeatherType) string {
	parts := []string{query.Provider, string(weatherType)}
	if query.LocationID != "" {
		parts = append(parts, "locationId="+query.LocationID)
	} else {
		parts = append(parts,
			fmt.Sprintf("lat=%.4f", query.Lat),
			fmt.Sprintf("lon=%.4f", query.Lon),
		)
	}
	parts = append(parts, fmt.Sprintf("date=%s", query.Date), fmt.Sprintf("days=%d", query.Days))
	return strings.Join(parts, ":")
}
