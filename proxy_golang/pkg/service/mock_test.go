// Package service provides proxy service functionality.
package service

import (
	"context"

	"proxy_golang/pkg/model"
)

// mockUpstreamClient mock 上游客戶端
type mockUpstreamClient struct {
	doFn func(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error)
}

func (m *mockUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	if m.doFn != nil {
		return m.doFn(ctx, req)
	}
	return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"ok": true}`)}, nil
}
