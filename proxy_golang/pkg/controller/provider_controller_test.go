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
