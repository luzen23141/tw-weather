// Package adapter implements weather data source adapters.
package adapter

import (
	"context"

	"proxy_golang/pkg/model"
)

// Adapter 天氣資料來源介面
type Adapter interface {
	Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error)
}

// ProviderSpec describes a registered provider.
type ProviderSpec struct {
	ID          string
	Name        string
	Description string
	APIKey      string
	RequiresKey bool
	Adapter     Adapter
}

// Registry adapter 登錄表
type Registry struct {
	providers map[string]ProviderSpec
	// order 保留註冊順序 —— map 迭代是隨機的，而 /api/provider/list 的順序
	// 直接呈現在設定頁上：每次刷新排序都不同會讓使用者以為清單變了。
	// 註冊順序本身也有語意（主要來源在前）。
	order []string
}

// NewRegistry 建立 Registry
func NewRegistry(providers ...ProviderSpec) *Registry {
	r := &Registry{providers: make(map[string]ProviderSpec)}
	for _, p := range providers {
		if _, exists := r.providers[p.ID]; !exists {
			r.order = append(r.order, p.ID)
		}
		r.providers[p.ID] = p
	}
	return r
}

// Get 取得指定 provider 的 adapter
func (r *Registry) Get(providerID string) (ProviderSpec, bool) {
	p, ok := r.providers[providerID]
	return p, ok
}

// All 回傳所有已註冊的 adapter
func (r *Registry) All() []ProviderSpec {
	result := make([]ProviderSpec, 0, len(r.order))
	for _, id := range r.order {
		result = append(result, r.providers[id])
	}
	return result
}
