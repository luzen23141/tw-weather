// Package service provides proxy service functionality.
package service

import (
	"context"
	"net/url"

	"proxy_golang/pkg/model"
)

// mockValidatorService mock 驗證服務
type mockValidatorService struct {
	validateRequestFn func(query *model.ProxyQuery) (*model.ServiceRoute, error)
	validateQueryFn   func(params url.Values) error
	buildCacheKeyFn   func(service, endpoint string, params url.Values) string
}

func (m *mockValidatorService) ValidateRequest(query *model.ProxyQuery) (*model.ServiceRoute, error) {
	if m.validateRequestFn != nil {
		return m.validateRequestFn(query)
	}
	return &model.ServiceRoute{
		BaseURL:      "https://example.com",
		APIKeyEnvVar: "CWA_API_KEY",
		APIKeyParam:  "key",
	}, nil
}

func (m *mockValidatorService) ValidateQuery(params url.Values) error {
	if m.validateQueryFn != nil {
		return m.validateQueryFn(params)
	}
	return nil
}

func (m *mockValidatorService) BuildCacheKey(service, endpoint string, params url.Values) string {
	if m.buildCacheKeyFn != nil {
		return m.buildCacheKeyFn(service, endpoint, params)
	}
	return service + "|" + endpoint
}

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
