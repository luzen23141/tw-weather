package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

func TestCacheRepository_SetAndGet(t *testing.T) {
	repo := NewCache()

	entry := &model.CacheEntry{
		Response: &model.WeatherResponse{
			Provider: "cwa",
			Type:     model.WeatherTypeCurrent,
		},
	}

	repo.Set("test-key", entry)

	got, hit := repo.Get("test-key")
	require.True(t, hit)
	assert.NotNil(t, got.Response)
	assert.Equal(t, "cwa", got.Response.Provider)
	assert.Equal(t, model.WeatherTypeCurrent, got.Response.Type)
}

func TestCacheRepository_Miss(t *testing.T) {
	repo := NewCache()

	got, hit := repo.Get("nonexistent")
	assert.False(t, hit)
	assert.Nil(t, got)
}

func TestCacheRepository_Overwrite(t *testing.T) {
	repo := NewCache()

	entry1 := &model.CacheEntry{Response: &model.WeatherResponse{Provider: "a"}}
	entry2 := &model.CacheEntry{Response: &model.WeatherResponse{Provider: "b"}}

	repo.Set("key", entry1)
	repo.Set("key", entry2)

	got, hit := repo.Get("key")
	require.True(t, hit)
	assert.NotNil(t, got.Response)
	assert.Equal(t, "b", got.Response.Provider)
}

func TestCacheRepository_MultipleDifferentKeys(t *testing.T) {
	repo := NewCache()

	repo.Set("key1", &model.CacheEntry{Response: &model.WeatherResponse{Provider: "first"}})
	repo.Set("key2", &model.CacheEntry{Response: &model.WeatherResponse{Provider: "second"}})

	got1, hit1 := repo.Get("key1")
	got2, hit2 := repo.Get("key2")

	require.True(t, hit1)
	require.True(t, hit2)
	assert.Equal(t, "first", got1.Response.Provider)
	assert.Equal(t, "second", got2.Response.Provider)
}
