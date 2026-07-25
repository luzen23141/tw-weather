package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/model"
)

// ProviderController 資料源控制器
type ProviderController struct {
	registry *adapter.Registry
}

// NewProviderController 建立 ProviderController（依賴注入）
func NewProviderController(registry *adapter.Registry) *ProviderController {
	return &ProviderController{registry: registry}
}

// HandleListProviders 處理 GET /api/provider/list
func (ctrl *ProviderController) HandleListProviders(c *gin.Context) {
	specs := ctrl.registry.All()
	providers := make([]model.ProviderInfo, 0, len(specs))
	for _, spec := range specs {
		// 狀態只暴露「可不可用」，不暴露金鑰本身 —— 與 /api/debug 同一原則
		status := model.ProviderStatusAvailable
		if spec.RequiresKey && spec.APIKey == "" {
			status = model.ProviderStatusUnconfigured
		}
		providers = append(providers, model.ProviderInfo{
			ID:          spec.ID,
			Name:        spec.Name,
			Description: spec.Description,
			Status:      status,
		})
	}
	c.JSON(http.StatusOK, providers)
}
