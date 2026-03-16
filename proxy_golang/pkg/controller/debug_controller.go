// Package controller handles HTTP request routing and response.
package controller

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// DebugController 健康檢查控制器
type DebugController struct{}

// NewDebugController 建立 DebugController
func NewDebugController() *DebugController {
	return &DebugController{}
}

// HandleHealth 處理 /api/health 健康檢查請求（公開，不受 HMAC 保護）
func (ctrl *DebugController) HandleHealth(c *gin.Context) {
	cwaKey := os.Getenv("CWA_API_KEY")
	proxySecret := os.Getenv("PROXY_SECRET")

	c.JSON(http.StatusOK, gin.H{
		"status":           "ok",
		"service":          "tw-weather-proxy-go",
		"version":          "1.1.0",
		"has_cwa_key":      cwaKey != "",
		"cwa_key_len":      len(cwaKey),
		"has_proxy_secret": proxySecret != "",
		"proxy_secret_len": len(proxySecret),
	})
}
