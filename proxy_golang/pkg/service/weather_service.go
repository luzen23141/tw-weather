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
	// TryLock 取得更新鎖。取不到代表別人正在更新。
	TryLock(key string, ttl time.Duration) bool
	Unlock(key string)
}

// weatherServiceImpl 天氣服務實作
type weatherServiceImpl struct {
	cfg      *config.Config
	registry *adapter.Registry
	upstream model.UpstreamClient
	cache    cacheStore
	// refreshInterval 超過此時長即視為過期，觸發背景更新。
	// 必須明顯短於快取的 TTL —— 否則資料會在有機會被更新前就消失，
	// stale-while-revalidate 也就退化成「每次都同步抓」。
	refreshInterval time.Duration
}

/** 未設定時的預設更新間隔 */
const defaultRefreshInterval = 5 * time.Minute

/** 背景更新的鎖持有時間。需長於一次上游呼叫，但短到持有者當掉時能自動釋放。 */
const revalidateLockTTL = 60 * time.Second

/*
revalidateAsync 在背景更新快取。

取不到鎖就直接返回 —— 代表已有人在更新，重複打上游沒有意義。
這是「不阻塞使用者」與「不打爆上游」之間的關鍵：使用者拿舊資料立刻走，
而上游在同一時間只會被打一次。
*/
func (s *weatherServiceImpl) revalidateAsync(
	cacheKey string,
	query *model.WeatherQuery,
	weatherType model.WeatherType,
	provider adapter.ProviderSpec,
	apiKey string,
) {
	if !s.cache.TryLock(cacheKey, revalidateLockTTL) {
		return
	}

	// 複製 query：背景工作的生命週期與原請求無關，共用指標會有資料競爭
	queryCopy := *query

	go func() {
		defer s.cache.Unlock(cacheKey)

		// 刻意不沿用請求的 context —— 使用者已經拿到回應離開了，
		// 若綁在請求 context 上，更新會在回應送出的瞬間被取消
		ctx, cancel := context.WithTimeout(context.Background(), upstreamTimeout)
		defer cancel()

		resp, err := provider.Adapter.Fetch(ctx, &queryCopy, weatherType, apiKey, s.upstream)
		if err != nil {
			log.Warn().Err(err).Str("cacheKey", cacheKey).Msg("background revalidate failed, keeping stale data")
			return
		}

		s.cache.Set(cacheKey, &model.CacheEntry{Response: resp, CachedAt: time.Now()})
		log.Debug().Str("cacheKey", cacheKey).Msg("background revalidate complete")
	}()
}

// NewWeatherService 建立 WeatherService（依賴注入）
func NewWeatherService(
	cfg *config.Config,
	registry *adapter.Registry,
	upstream model.UpstreamClient,
	cache cacheStore,
) WeatherService {
	refreshInterval := cfg.Redis.RefreshInterval
	if refreshInterval <= 0 {
		refreshInterval = defaultRefreshInterval
	}

	return &weatherServiceImpl{
		cfg:             cfg,
		registry:        registry,
		upstream:        upstream,
		cache:           cache,
		refreshInterval: refreshInterval,
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

	/*
		Stale-while-revalidate。

		快取新鮮 → 直接回。
		快取過期但仍有資料 → **立刻回舊資料**，同時在背景更新。使用者不必為了
		「資料剛好過期」而等上游一趟；天氣資料晚幾秒無妨，但多等一秒很有感。
		完全沒有資料 → 只能同步抓。

		背景更新受分散式鎖保護：快取過期的瞬間可能有大量並行請求，沒有鎖的話
		它們會同時打上游（cache stampede），配額會在幾秒內燒光。
	*/
	if entry, ok := s.cache.Get(cacheKey); ok && entry != nil && entry.Response != nil {
		age := time.Since(entry.CachedAt)
		if age < s.refreshInterval {
			log.Debug().Str("cacheKey", cacheKey).Msg("cache hit")
			resp := *entry.Response
			resp.CacheHit = true
			return &resp, nil
		}

		log.Debug().Str("cacheKey", cacheKey).Dur("age", age).Msg("cache stale, serving while revalidating")
		s.revalidateAsync(cacheKey, query, weatherType, provider, apiKey)

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

	s.cache.Set(cacheKey, &model.CacheEntry{Response: resp, CachedAt: time.Now()})
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
	// township 必須進快取鍵：同一縣市的所有鄉鎮共用同一個 locationId，
	// 少了它，信義區會拿到大安區的預報。
	if query.Township != "" {
		parts = append(parts, "township="+query.Township)
	}
	parts = append(parts, fmt.Sprintf("date=%s", query.Date), fmt.Sprintf("days=%d", query.Days))
	return strings.Join(parts, ":")
}
