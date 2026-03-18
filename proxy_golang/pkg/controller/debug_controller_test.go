package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

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
