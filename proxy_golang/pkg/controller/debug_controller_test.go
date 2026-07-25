package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/model"
)

func TestDebugController_HandleHealth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	ctrl := NewDebugController()
	r.GET("/api/health", ctrl.HandleHealth)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)
	var resp model.HealthResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "ok", resp.Status)
	assert.Equal(t, "tw-weather-proxy-go", resp.Service)
	assert.Equal(t, "1.1.0", resp.Version)
}

type fakeDeps struct {
	pingErr error
	raw     map[string][]byte
}

func (f *fakeDeps) Ping() error { return f.pingErr }
func (f *fakeDeps) GetRaw(key string) ([]byte, bool) {
	v, ok := f.raw[key]
	return v, ok
}

func TestHandleDebug_AllHealthy(t *testing.T) {
	gin.SetMode(gin.TestMode)

	registry := adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", RequiresKey: true, APIKey: "configured"},
		adapter.ProviderSpec{ID: "openmeteo", RequiresKey: false},
		adapter.ProviderSpec{ID: "weatherapi", RequiresKey: true, APIKey: ""},
	)
	warmup, _ := json.Marshal(model.WarmupStatus{Fetched: 44, Skipped: 0, Failed: 0})
	ctrl := NewDebugController(
		WithRegistry(registry),
		WithDependencyChecker(&fakeDeps{raw: map[string][]byte{model.WarmupStatusKey: warmup}}),
	)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	ctrl.HandleDebug(c)

	require.Equal(t, http.StatusOK, w.Code)

	var resp model.DebugResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "ok", resp.Status)
	require.NotNil(t, resp.Redis)
	assert.True(t, resp.Redis.Connected)
	require.NotNil(t, resp.Warmup)
	assert.Equal(t, 44, resp.Warmup.Fetched)

	// 金鑰只回報有無 —— 回應內文絕不能出現金鑰內容
	assert.NotContains(t, w.Body.String(), "configured")
	byID := map[string]bool{}
	for _, p := range resp.Providers {
		byID[p.ID] = p.KeyConfigured
	}
	assert.True(t, byID["cwa"])
	assert.True(t, byID["openmeteo"]) // 不需金鑰即視為已配置
	assert.False(t, byID["weatherapi"])
}

// Redis 掛掉時要轉 degraded 並回 503 —— 監控直接拿這個端點當依賴健康檢查
func TestHandleDebug_RedisDown(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ctrl := NewDebugController(
		WithDependencyChecker(&fakeDeps{pingErr: assert.AnError}),
	)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	ctrl.HandleDebug(c)

	require.Equal(t, http.StatusServiceUnavailable, w.Code)

	var resp model.DebugResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "degraded", resp.Status)
	require.NotNil(t, resp.Redis)
	assert.False(t, resp.Redis.Connected)
}

// 無任何依賴注入時（最小配置）仍能回應，不 panic
func TestHandleDebug_NoDeps(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	NewDebugController().HandleDebug(c)

	require.Equal(t, http.StatusOK, w.Code)
}
