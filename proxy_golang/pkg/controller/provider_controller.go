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
		providers = append(providers, model.ProviderInfo{
			ID:          spec.ID,
			Name:        spec.Name,
			Description: spec.Description,
		})
	}
	c.JSON(http.StatusOK, providers)
}
