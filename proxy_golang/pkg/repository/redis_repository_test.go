package repository

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

// 這些測試需要本機 Redis（docker-compose up -d）。沒有 Redis 時跳過，
// 而不是讓整個測試套件失敗 —— 快取是選用的基礎設施，不該成為建置的硬依賴。
func newTestRedis(t *testing.T) *RedisCache {
	t.Helper()
	c, err := NewRedisCache("redis://localhost:6379/15", time.Minute)
	if err != nil {
		t.Skipf("Redis 不可用，跳過：%v", err)
	}
	t.Cleanup(func() { _ = c.Close() })
	return c
}

func TestRedisCache_SetGet(t *testing.T) {
	c := newTestRedis(t)

	entry := &model.CacheEntry{
		Response: &model.WeatherResponse{Provider: "cwa", Type: model.WeatherTypeCurrent},
	}
	c.Set("test:setget", entry)

	got, ok := c.Get("test:setget")
	require.True(t, ok)
	require.NotNil(t, got.Response)
	assert.Equal(t, "cwa", got.Response.Provider)
}

func TestRedisCache_MissReturnsFalse(t *testing.T) {
	c := newTestRedis(t)
	_, ok := c.Get("test:definitely-missing-key")
	assert.False(t, ok)
}

func TestNewRedisCache_InvalidURL(t *testing.T) {
	_, err := NewRedisCache("not-a-redis-url", time.Minute)
	assert.Error(t, err)
}

// 連不上時必須回錯誤讓呼叫端降級，而不是回一個會在每次操作時才失敗的實例
func TestNewRedisCache_UnreachableHost(t *testing.T) {
	_, err := NewRedisCache("redis://127.0.0.1:6399/0", time.Minute)
	assert.Error(t, err)
}
