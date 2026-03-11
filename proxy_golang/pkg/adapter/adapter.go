// Package adapter implements weather data source adapters.
package adapter

import (
	"context"

	"proxy_golang/pkg/model"
	"proxy_golang/pkg/service"
)

// Adapter 天氣資料來源介面
type Adapter interface {
	ProviderID() string
	SupportedTypes() []model.WeatherType
	Fetch(ctx context.Context, query *model.WeatherQuery, apiKey string, client service.UpstreamClient) (*model.WeatherResponse, error)
}

// Registry adapter 登錄表
type Registry struct {
	adapters map[string]Adapter
}

// NewRegistry 建立 Registry
func NewRegistry(adapters ...Adapter) *Registry {
	r := &Registry{adapters: make(map[string]Adapter)}
	for _, a := range adapters {
		r.adapters[a.ProviderID()] = a
	}
	return r
}

// Get 取得指定 provider 的 adapter
func (r *Registry) Get(providerID string) (Adapter, bool) {
	a, ok := r.adapters[providerID]
	return a, ok
}
