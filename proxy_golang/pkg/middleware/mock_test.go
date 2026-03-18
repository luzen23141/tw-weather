package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"proxy_golang/pkg/model"
)

func TestMockMode_SetsContextFlag(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(MockMode())
	r.GET("/test", func(c *gin.Context) {
		mockMode, _ := c.Request.Context().Value(model.MockModeKey).(bool)
		if mockMode {
			c.Status(http.StatusAccepted)
			return
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set(MockHeader, "true")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusAccepted, w.Code)
}

func TestMockMode_WithoutHeader_NoContextFlag(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(MockMode())
	r.GET("/test", func(c *gin.Context) {
		mockMode, _ := c.Request.Context().Value(model.MockModeKey).(bool)
		if mockMode {
			c.Status(http.StatusAccepted)
			return
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
