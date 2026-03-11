package model

// ErrorResponse 統一錯誤回應
type ErrorResponse struct {
	Error string `json:"error"`
}

// DebugResponse 健康檢查回應
type DebugResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
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
