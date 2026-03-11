// Package model provides model-related functionality.
package model

import "context"

// ProxyQuery 前端傳入的 proxy 請求參數
type ProxyQuery struct {
	Service  string `form:"service" binding:"required"`
	Endpoint string `form:"endpoint" binding:"required"`
}

// UpstreamRequest 呼叫上游 API 的請求封裝
type UpstreamRequest struct {
	URL    string
	Method string
}

// UpstreamClient 上游 HTTP 客戶端介面（定義於 model 避免循環依賴）
type UpstreamClient interface {
	Do(ctx context.Context, req *UpstreamRequest) (*UpstreamResponse, error)
}
