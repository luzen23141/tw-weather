// Package controller handles HTTP request routing and response.
package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/model"
)

// DebugController 健康檢查控制器
type DebugController struct{}

// NewDebugController 建立 DebugController
func NewDebugController() *DebugController {
	return &DebugController{}
}

// HandleHealth 處理 /api/health 健康檢查請求（公開，不受 HMAC 保護）
func (ctrl *DebugController) HandleHealth(c *gin.Context) {
	c.JSON(http.StatusOK, model.HealthResponse{
		Status:  "ok",
		Service: "tw-weather-proxy-go",
		Version: "1.1.0",
	})
}
