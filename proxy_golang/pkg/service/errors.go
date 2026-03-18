package service

import (
	"fmt"
	"strings"
	"time"
)

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

// UpstreamStatusError 表示上游 API 回傳非 2xx 狀態碼。
type UpstreamStatusError struct {
	StatusCode int
	Body       string
}

func (e *UpstreamStatusError) Error() string {
	body := strings.TrimSpace(e.Body)
	if body == "" {
		return fmt.Sprintf("upstream returned status %d", e.StatusCode)
	}
	return fmt.Sprintf("upstream returned status %d: %s", e.StatusCode, body)
}
