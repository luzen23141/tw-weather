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

// Handle 處理 /api/debug 請求
func (ctrl *DebugController) Handle(c *gin.Context) {
	c.JSON(http.StatusOK, model.DebugResponse{
		Status:  "ok",
		Service: "tw-weather-proxy-go",
	})
}
