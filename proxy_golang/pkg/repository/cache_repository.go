// Package repository provides repository-related functionality.
package repository

import (
	"time"

	"github.com/jellydator/ttlcache/v3"

	"proxy_golang/pkg/model"
)

const defaultTTL = 5 * time.Minute

// CacheRepository 快取存取介面
type CacheRepository interface {
	Get(key string) (*model.CacheEntry, bool)
	Set(key string, entry *model.CacheEntry)
}

// ttlCacheRepository ttlcache v3 實作（泛型、自動清理）
type ttlCacheRepository struct {
	store *ttlcache.Cache[string, *model.CacheEntry]
}

// NewCacheRepository 建立 CacheRepository（ttlcache 實作）
func NewCacheRepository() CacheRepository {
	cache := ttlcache.New[string, *model.CacheEntry](
		ttlcache.WithTTL[string, *model.CacheEntry](defaultTTL),
	)
	go cache.Start()

	return &ttlCacheRepository{store: cache}
}

func (r *ttlCacheRepository) Get(key string) (*model.CacheEntry, bool) {
	item := r.store.Get(key)
	if item == nil {
		return nil, false
	}
	return item.Value(), true
}

func (r *ttlCacheRepository) Set(key string, entry *model.CacheEntry) {
	r.store.Set(key, entry, ttlcache.DefaultTTL)
}
