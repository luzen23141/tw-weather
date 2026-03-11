// Package service provides proxy service functionality.
package service

import (
	"context"

	"proxy_golang/pkg/model"
)

// mockCacheRepository mock 快取
type mockCacheRepository struct {
	store map[string]*model.CacheEntry
}

func newMockCacheRepository() *mockCacheRepository {
	return &mockCacheRepository{store: make(map[string]*model.CacheEntry)}
}

func (m *mockCacheRepository) Get(key string) (*model.CacheEntry, bool) {
	entry, ok := m.store[key]
	return entry, ok
}

func (m *mockCacheRepository) Set(key string, entry *model.CacheEntry) {
	m.store[key] = entry
}

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
