// Package model provides model-related functionality.
package model

import "net/url"

// ProxyQuery 前端傳入的 proxy 請求參數
type ProxyQuery struct {
	Service  string `form:"service" binding:"required" validate:"required"`
	Endpoint string `form:"endpoint" binding:"required" validate:"required"`
}

// UpstreamRequest 呼叫上游 API 的請求封裝
type UpstreamRequest struct {
	URL    string
	Method string
	Query  url.Values
}
