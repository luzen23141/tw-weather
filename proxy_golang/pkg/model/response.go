package model

// ErrorResponse 統一錯誤回應
type ErrorResponse struct {
	Error string `json:"error"`
}

// ProviderInfo 資料源資訊
type ProviderInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// HealthResponse 健康檢查回應
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

// CacheEntry 快取項目
type CacheEntry struct {
	Data       []byte
	StatusCode int
}

// UpstreamResponse 上游 API 回應
type UpstreamResponse struct {
	StatusCode int
	Body       []byte
}
