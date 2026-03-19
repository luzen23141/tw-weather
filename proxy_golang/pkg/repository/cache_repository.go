// Package repository provides repository-related functionality.
package repository

import (
	"sync"
	"time"

	"proxy_golang/pkg/model"
)

const defaultTTL = 5 * time.Minute

type cacheItem struct {
	entry     *model.CacheEntry
	expiresAt time.Time
}

// Cache in-memory TTL cache.
type Cache struct {
	mu    sync.RWMutex
	ttl   time.Duration
	store map[string]cacheItem
}

// NewCache 建立記憶體 TTL 快取。
func NewCache() *Cache {
	return &Cache{
		ttl:   defaultTTL,
		store: make(map[string]cacheItem),
	}
}

// Get returns a cached entry if it exists and has not expired.
func (c *Cache) Get(key string) (*model.CacheEntry, bool) {
	c.mu.RLock()
	item, ok := c.store[key]
	c.mu.RUnlock()
	if !ok {
		return nil, false
	}
	if time.Now().After(item.expiresAt) {
		c.mu.Lock()
		delete(c.store, key)
		c.mu.Unlock()
		return nil, false
	}
	return item.entry, true
}

// Set stores a cache entry with the repository TTL.
func (c *Cache) Set(key string, entry *model.CacheEntry) {
	c.mu.Lock()
	c.store[key] = cacheItem{entry: entry, expiresAt: time.Now().Add(c.ttl)}
	c.mu.Unlock()
}
