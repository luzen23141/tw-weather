package service

import "time"

const (
	// upstreamTimeout 是所有上游請求的統一 context 超時時間
	upstreamTimeout = 8 * time.Second
)

// ProxyError 業務錯誤（含 HTTP 狀態碼 + 調用鏈）
type ProxyError struct {
	Code int
	Err  error
}

func (e *ProxyError) Error() string {
	return e.Err.Error()
}

func (e *ProxyError) Unwrap() error {
	return e.Err
}
