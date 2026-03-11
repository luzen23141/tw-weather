package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

func TestCacheRepository_SetAndGet(t *testing.T) {
	repo := NewCacheRepository()

	entry := &model.CacheEntry{
		Data:       []byte(`{"temp": 25}`),
		StatusCode: 200,
	}

	repo.Set("test-key", entry)

	got, hit := repo.Get("test-key")
	require.True(t, hit)
	assert.Equal(t, 200, got.StatusCode)
	assert.Equal(t, []byte(`{"temp": 25}`), got.Data)
}

func TestCacheRepository_Miss(t *testing.T) {
	repo := NewCacheRepository()

	got, hit := repo.Get("nonexistent")
	assert.False(t, hit)
	assert.Nil(t, got)
}

func TestCacheRepository_Overwrite(t *testing.T) {
	repo := NewCacheRepository()

	entry1 := &model.CacheEntry{Data: []byte(`{"v": 1}`), StatusCode: 200}
	entry2 := &model.CacheEntry{Data: []byte(`{"v": 2}`), StatusCode: 200}

	repo.Set("key", entry1)
	repo.Set("key", entry2)

	got, hit := repo.Get("key")
	require.True(t, hit)
	assert.Equal(t, []byte(`{"v": 2}`), got.Data)
}

func TestCacheRepository_MultipleDifferentKeys(t *testing.T) {
	repo := NewCacheRepository()

	repo.Set("key1", &model.CacheEntry{Data: []byte(`1`), StatusCode: 200})
	repo.Set("key2", &model.CacheEntry{Data: []byte(`2`), StatusCode: 201})

	got1, hit1 := repo.Get("key1")
	got2, hit2 := repo.Get("key2")

	require.True(t, hit1)
	require.True(t, hit2)
	assert.Equal(t, []byte(`1`), got1.Data)
	assert.Equal(t, []byte(`2`), got2.Data)
	assert.Equal(t, 200, got1.StatusCode)
	assert.Equal(t, 201, got2.StatusCode)
}
