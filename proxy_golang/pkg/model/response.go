package model

import "time"

// ErrorResponse 統一錯誤回應
type ErrorResponse struct {
	Error string `json:"error"`
}

// ProviderStatus 資料源的可用狀態。
type ProviderStatus string

// Provider 狀態常數。
const (
	// ProviderStatusAvailable 可用 —— 不需金鑰，或金鑰已配置
	ProviderStatusAvailable ProviderStatus = "available"
	// ProviderStatusUnconfigured 未配置 —— 需要金鑰但伺服器端沒有設定。
	// 前端應據此停用該來源的開關，而不是讓使用者選了之後才收到一串 500。
	ProviderStatusUnconfigured ProviderStatus = "unconfigured"
)

// ProviderInfo 資料源資訊（/api/provider/list 的回應項目）。
type ProviderInfo struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Status      ProviderStatus `json:"status"`
}

// HealthResponse 健康檢查回應
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

// CacheEntry 快取項目
type CacheEntry struct {
	Response *WeatherResponse
	// CachedAt 寫入快取的時間。
	//
	// 用途是區分「新鮮」與「過期但可用」—— 過期資料仍會先回給使用者以避免阻塞，
	// 同時在背景觸發更新（stale-while-revalidate）。少了這個欄位就只能二分為
	// 有／無，過期即代表阻塞等待上游。
	CachedAt time.Time
}

// UpstreamResponse 上游 API 回應
type UpstreamResponse struct {
	StatusCode int
	Body       []byte
}

// ===== /api/debug 診斷 =====

// WarmupStatusKey 暖身狀態在 Redis 的鍵。由 Warmer 寫入、debug 端點讀取。
const WarmupStatusKey = "warmup:status"

// WarmupStatus 最近一輪暖身的結果。
type WarmupStatus struct {
	LastRunAt time.Time `json:"lastRunAt"`
	Fetched   int       `json:"fetched"`
	Skipped   int       `json:"skipped"`
	Failed    int       `json:"failed"`
	ElapsedMS int64     `json:"elapsedMs"`
}

// DebugRedis Redis 連線狀態。
type DebugRedis struct {
	Connected bool   `json:"connected"`
	Error     string `json:"error,omitempty"`
}

// DebugProvider 單一資料源的配置狀態。只回報金鑰有無，絕不回報內容。
type DebugProvider struct {
	ID            string `json:"id"`
	KeyConfigured bool   `json:"keyConfigured"`
}

// DebugResponse /api/debug 回應。
type DebugResponse struct {
	Status    string          `json:"status"` // ok | degraded
	Service   string          `json:"service"`
	Version   string          `json:"version"`
	Uptime    string          `json:"uptime"`
	Redis     *DebugRedis     `json:"redis,omitempty"`
	Providers []DebugProvider `json:"providers,omitempty"`
	Warmup    *WarmupStatus   `json:"warmup,omitempty"`
}
