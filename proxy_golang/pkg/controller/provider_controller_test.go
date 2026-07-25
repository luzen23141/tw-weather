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

func TestHandleListProviders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	ctrl := NewProviderController(adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", Name: "中央氣象署（CWA）", Description: "台灣最精準，含即時觀測與預報", APIKey: "cwa-key", RequiresKey: true, Adapter: adapter.CWA{}},
		adapter.ProviderSpec{ID: "openmeteo", Name: "Open-Meteo", Description: "免費無限制，歷史資料豐富", RequiresKey: false, Adapter: adapter.OpenMeteo{}},
	))
	r.GET("/api/provider/list", ctrl.HandleListProviders)

	req := httptest.NewRequest(http.MethodGet, "/api/provider/list", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)
	var providers []model.ProviderInfo
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &providers))
	assert.Len(t, providers, 2)
}

// 需要金鑰但未配置的來源要標成 unconfigured —— 前端據此停用開關，
// 而不是讓使用者選了之後收到一串 500
func TestHandleListProviders_Status(t *testing.T) {
	gin.SetMode(gin.TestMode)
	registry := adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", Name: "CWA", RequiresKey: true, APIKey: "key"},
		adapter.ProviderSpec{ID: "openmeteo", Name: "OM", RequiresKey: false},
		adapter.ProviderSpec{ID: "weatherapi", Name: "WA", RequiresKey: true, APIKey: ""},
	)
	ctrl := NewProviderController(registry)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	ctrl.HandleListProviders(c)

	var resp []model.ProviderInfo
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))

	byID := map[string]model.ProviderStatus{}
	for _, p := range resp {
		byID[p.ID] = p.Status
	}
	assert.Equal(t, model.ProviderStatusAvailable, byID["cwa"])
	assert.Equal(t, model.ProviderStatusAvailable, byID["openmeteo"])
	assert.Equal(t, model.ProviderStatusUnconfigured, byID["weatherapi"])
	// 金鑰內容絕不能出現在回應裡
	assert.NotContains(t, w.Body.String(), "key\"")
}
