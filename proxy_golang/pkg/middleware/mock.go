package middleware

import (
	"context"

	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/model"
)

// MockHeader 觸發 mock 模式的 HTTP header key
const MockHeader = "X-Mock-Data"

// MockMode 檢測 header，啟用 mock 模式
func MockMode() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetHeader(MockHeader) != "" {
			ctx := context.WithValue(c.Request.Context(), model.MockModeKey, true)
			c.Request = c.Request.WithContext(ctx)
		}
		c.Next()
	}
}
