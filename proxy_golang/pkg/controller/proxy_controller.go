package controller

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/model"
	"proxy_golang/pkg/service"
)

// ProxyController 代理控制器
type ProxyController struct {
	proxyService service.ProxyService
}

// NewProxyController 建立 ProxyController（依賴注入）
func NewProxyController(ps service.ProxyService) *ProxyController {
	return &ProxyController{proxyService: ps}
}

// Handle 處理 /api/proxy 請求
func (ctrl *ProxyController) Handle(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		c.JSON(http.StatusMethodNotAllowed, model.ErrorResponse{Error: "Method Not Allowed"})
		return
	}

	var query model.ProxyQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "service and endpoint are required"})
		return
	}

	log.Info().Str("service", query.Service).Str("endpoint", query.Endpoint).Msg("proxy request")

	result, err := ctrl.proxyService.Forward(c.Request.Context(), &query, c.Request.URL.Query())
	if err != nil {
		var proxyErr *service.ProxyError
		if errors.As(err, &proxyErr) {
			log.Warn().Err(proxyErr).Int("code", proxyErr.Code).Msg("proxy error")
			c.JSON(proxyErr.Code, model.ErrorResponse{Error: proxyErr.Error()})
			return
		}
		log.Error().Err(err).Msg("unexpected error")
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "Internal proxy error"})
		return
	}

	if result.CacheHit {
		c.Header("X-Cache", "HIT")
	} else {
		c.Header("X-Cache", "MISS")
	}

	c.Data(result.StatusCode, "application/json; charset=utf-8", result.Data)
}
