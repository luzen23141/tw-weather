package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/model"
)

/*
快取暖身。

## 為什麼需要

冷啟動時 Redis 是空的，第一批使用者會全部落到「同步打上游」的路徑上 ——
最慢的一次體驗給了最早來的人。而部署又剛好是流量還在的時候。

暖身把這件事移到啟動階段：伺服器起來時先把資料填好，之後的請求一律讀 Redis。

## 為什麼要鎖

多實例部署時，每台都會執行暖身。沒有鎖的話 N 台同時打上游，配額瞬間翻 N 倍。
鎖讓同一時間只有一台真的去抓，其餘直接跳過（它們稍後讀到的就是那台填好的資料）。

## 為什麼不阻塞啟動

暖身在背景跑。伺服器要能立刻接受請求 —— 上游慢或掛掉時，服務仍應該起得來，
只是前幾個請求會走同步路徑。把暖身放在啟動的關鍵路徑上，等於讓第三方 API
的可用性決定你的服務能不能啟動。
*/

/** 暖身鎖的持有時間。需涵蓋抓完所有縣市的時間。 */
const warmupLockTTL = 10 * time.Minute

/** 暖身鎖的鍵。與資料鍵分開，避免與 revalidate 的鎖互相干擾。 */
const warmupLockKey = "warmup:cwa-forecast"

// WarmupTarget 一個要預抓的查詢。
type WarmupTarget struct {
	Provider    string
	WeatherType model.WeatherType
	Query       model.WeatherQuery
}

// Warmer 負責預抓並填充快取。
type Warmer struct {
	svc      *weatherServiceImpl
	interval time.Duration
}

// NewWarmer 建立暖身器。interval 為兩次暖身之間的間隔。
func NewWarmer(svc WeatherService, interval time.Duration) *Warmer {
	impl, ok := svc.(*weatherServiceImpl)
	if !ok {
		return nil
	}
	if interval <= 0 {
		interval = defaultRefreshInterval
	}
	return &Warmer{svc: impl, interval: interval}
}

/*
Start 啟動暖身：先立刻執行一次，之後依 interval 週期執行。

回傳的 stop 函式會停止週期執行（正在進行中的那一輪不受影響）。
*/
func (w *Warmer) Start(targets []WarmupTarget) (stop func()) {
	if w == nil || len(targets) == 0 {
		return func() {}
	}

	done := make(chan struct{})

	go func() {
		w.runOnce(targets)

		ticker := time.NewTicker(w.interval)
		defer ticker.Stop()

		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				w.runOnce(targets)
			}
		}
	}()

	return func() { close(done) }
}

// runOnce 執行一輪暖身。取不到鎖代表別的實例正在做，直接跳過。
func (w *Warmer) runOnce(targets []WarmupTarget) {
	if !w.svc.cache.TryLock(warmupLockKey, warmupLockTTL) {
		log.Debug().Msg("warmup skipped: another instance holds the lock")
		return
	}
	defer w.svc.cache.Unlock(warmupLockKey)

	start := time.Now()
	fetched, skipped, failed := 0, 0, 0

	for _, target := range targets {
		switch w.warmOne(target) {
		case warmFetched:
			fetched++
		case warmSkipped:
			skipped++
		default:
			failed++
		}
	}

	elapsed := time.Since(start)
	log.Info().
		Int("fetched", fetched).
		Int("skipped", skipped).
		Int("failed", failed).
		Dur("elapsed", elapsed).
		Msg("warmup complete")

	// 把結果寫進 Redis 供 /api/debug 回報 —— 存在 Redis 而非行程內，
	// 多實例部署時任一台都能回答「最後一輪何時、結果如何」。
	// 不設過期（ttl 用快取預設即可）：陳舊的狀態本身就是有用的診斷訊號。
	if status, err := json.Marshal(model.WarmupStatus{
		LastRunAt: time.Now(),
		Fetched:   fetched,
		Skipped:   skipped,
		Failed:    failed,
		ElapsedMS: elapsed.Milliseconds(),
	}); err == nil {
		if raw, ok := w.svc.cache.(interface {
			SetRaw(key string, value []byte, ttl time.Duration)
		}); ok {
			raw.SetRaw(model.WarmupStatusKey, status, 24*time.Hour)
		}
	}
}

type warmResult int

const (
	warmFetched warmResult = iota
	warmSkipped
	warmFailed
)

// warmOne 檢查單一目標的快取新鮮度，過舊或缺少時才抓。
func (w *Warmer) warmOne(target WarmupTarget) warmResult {
	provider, ok := w.svc.registry.Get(target.Provider)
	if !ok {
		return warmFailed
	}

	query := target.Query
	query.Provider = target.Provider
	cacheKey := buildCacheKey(&query, target.WeatherType)

	// 還新鮮就不重抓 —— 暖身的目的是補齊缺口，不是無條件刷新
	if entry, ok := w.svc.cache.Get(cacheKey); ok && entry != nil && entry.Response != nil {
		if time.Since(entry.CachedAt) < w.svc.refreshInterval {
			return warmSkipped
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), upstreamTimeout)
	defer cancel()

	resp, err := provider.Adapter.Fetch(ctx, &query, target.WeatherType, provider.APIKey, w.svc.upstream)
	if err != nil {
		log.Warn().Err(err).Str("cacheKey", cacheKey).Msg("warmup fetch failed")
		return warmFailed
	}

	w.svc.cache.Set(cacheKey, &model.CacheEntry{Response: resp, CachedAt: time.Now()})
	return warmFetched
}

/*
CWAForecastTargets 產生涵蓋全臺所有縣市的暖身目標。

CWA 的預報 dataset 是「一個縣市一支 API」，因此完整涵蓋需要逐縣市抓。
這些呼叫發生在背景排程而非使用者請求上，成本因此是有界的 —— 每個
interval 固定 N 次，與流量無關。
*/
func CWAForecastTargets() []WarmupTarget {
	hourly := adapter.CWAWarmupTargets(model.WeatherTypeHourly)
	daily := adapter.CWAWarmupTargets(model.WeatherTypeDaily)
	targets := make([]WarmupTarget, 0, len(hourly)+len(daily))

	for datasetID, township := range hourly {
		targets = append(targets, WarmupTarget{
			Provider:    "cwa",
			WeatherType: model.WeatherTypeHourly,
			Query:       model.WeatherQuery{LocationID: datasetID, Township: township},
		})
	}
	for datasetID, township := range daily {
		targets = append(targets, WarmupTarget{
			Provider:    "cwa",
			WeatherType: model.WeatherTypeDaily,
			Query:       model.WeatherQuery{LocationID: datasetID, Township: township},
		})
	}

	return targets
}
