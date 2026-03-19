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
}

// NewRegistry 建立 Registry
func NewRegistry(providers ...ProviderSpec) *Registry {
	r := &Registry{providers: make(map[string]ProviderSpec)}
	for _, p := range providers {
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
	result := make([]ProviderSpec, 0, len(r.providers))
	for _, p := range r.providers {
		result = append(result, p)
	}
	return result
}
