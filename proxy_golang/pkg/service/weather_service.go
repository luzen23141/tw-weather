package service

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
	"proxy_golang/pkg/repository"
)

// WeatherService 天氣資料服務介面
type WeatherService interface {
	GetCurrentWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
	GetHourlyWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
	GetDailyWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
	GetHistoryWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
}

// weatherServiceImpl 天氣服務實作
type weatherServiceImpl struct {
	cfg      *config.Config
	registry *adapter.Registry
	upstream model.UpstreamClient
	cache    repository.CacheRepository
}

// NewWeatherService 建立 WeatherService（依賴注入）
func NewWeatherService(
	cfg *config.Config,
	registry *adapter.Registry,
	upstream model.UpstreamClient,
	cache repository.CacheRepository,
) WeatherService {
	return &weatherServiceImpl{
		cfg:      cfg,
		registry: registry,
		upstream: upstream,
		cache:    cache,
	}
}

// GetCurrentWeather 取得當前天氣
func (s *weatherServiceImpl) GetCurrentWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	return s.fetchWeather(ctx, query, model.WeatherTypeCurrent)
}

// GetHourlyWeather 取得逐時預報
func (s *weatherServiceImpl) GetHourlyWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	return s.fetchWeather(ctx, query, model.WeatherTypeHourly)
}

// GetDailyWeather 取得每日預報
func (s *weatherServiceImpl) GetDailyWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	return s.fetchWeather(ctx, query, model.WeatherTypeDaily)
}

// GetHistoryWeather 取得歷史天氣
func (s *weatherServiceImpl) GetHistoryWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	if query.Date == "" {
		return nil, &ProxyError{
			Code: http.StatusBadRequest,
			Err:  fmt.Errorf("date is required for history query (YYYY-MM-DD)"),
		}
	}
	return s.fetchWeather(ctx, query, model.WeatherTypeHistory)
}

// fetchWeather 共用的 adapter 呼叫邏輯
func (s *weatherServiceImpl) fetchWeather(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType) (*model.WeatherResponse, error) {
	a, ok := s.registry.Get(query.Provider)
	if !ok {
		return nil, &ProxyError{
			Code: http.StatusBadRequest,
			Err:  fmt.Errorf("unsupported provider: %s", query.Provider),
		}
	}

	apiKey := s.cfg.APIKeys.GetByEnvVar(a.APIKeyEnvVar())
	if apiKey == "" && s.registry.RequiresKey(query.Provider) {
		return nil, &ProxyError{
			Code: http.StatusInternalServerError,
			Err:  fmt.Errorf("API key not configured for provider: %s", query.Provider),
		}
	}

	cacheKey := fmt.Sprintf("%s:%s:%.4f:%.4f:%s:%d",
		query.Provider, string(weatherType),
		query.Lat, query.Lon,
		query.Date, query.Days,
	)

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
	resp, err := a.Fetch(timeoutCtx, query, weatherType, apiKey, s.upstream)
	upstreamLatency := time.Since(upstreamStart)
	if err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, &ProxyError{Code: http.StatusGatewayTimeout, Err: fmt.Errorf("upstream timeout: %w", err)}
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
