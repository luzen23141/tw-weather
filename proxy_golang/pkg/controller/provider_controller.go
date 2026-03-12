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
	adapters := ctrl.registry.All()
	providers := make([]model.ProviderInfo, 0, len(adapters))
	for _, a := range adapters {
		providers = append(providers, model.ProviderInfo{
			ID:          a.ProviderID(),
			Name:        a.Name(),
			Description: a.Description(),
		})
	}
	c.JSON(http.StatusOK, providers)
}
