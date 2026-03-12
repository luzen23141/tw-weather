// Package adapter implements weather data source adapters.
package adapter

import (
	"context"

	"proxy_golang/pkg/model"
)

// Adapter 天氣資料來源介面
type Adapter interface {
	ProviderID() string
	Name() string
	Description() string
	APIKeyEnvVar() string
	RequiresKey() bool
	Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error)
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

// All 回傳所有已註冊的 adapter
func (r *Registry) All() []Adapter {
	result := make([]Adapter, 0, len(r.adapters))
	for _, a := range r.adapters {
		result = append(result, a)
	}
	return result
}

// RequiresKey 回傳指定 provider 是否需要 API Key（找不到時視為需要）
func (r *Registry) RequiresKey(providerID string) bool {
	if a, ok := r.adapters[providerID]; ok {
		return a.RequiresKey()
	}
	return true
}
