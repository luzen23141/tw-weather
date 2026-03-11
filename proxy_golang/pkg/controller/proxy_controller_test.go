package controller

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"proxy_golang/pkg/model"
	"proxy_golang/pkg/service"
)

// mockProxyService mock ProxyService
type mockProxyService struct {
	forwardFn func(ctx context.Context, query *model.ProxyQuery, rawQuery url.Values) (*service.ProxyResult, error)
}

func (m *mockProxyService) Forward(ctx context.Context, query *model.ProxyQuery, rawQuery url.Values) (*service.ProxyResult, error) {
	if m.forwardFn != nil {
		return m.forwardFn(ctx, query, rawQuery)
	}
	return &service.ProxyResult{Data: []byte(`{}`), StatusCode: 200}, nil
}

func setupRouter(ctrl *ProxyController) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/api/proxy", ctrl.Handle)
	return r
}

func TestHandle_Success(t *testing.T) {
	mock := &mockProxyService{
		forwardFn: func(_ context.Context, _ *model.ProxyQuery, _ url.Values) (*service.ProxyResult, error) {
			return &service.ProxyResult{
				Data:       []byte(`{"temp": 25}`),
				StatusCode: 200,
				CacheHit:   false,
			}, nil
		},
	}

	ctrl := NewProxyController(mock)
	r := setupRouter(ctrl)

	req := httptest.NewRequest(http.MethodGet, "/api/proxy?service=cwa&endpoint=O-A0001-001", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, `{"temp": 25}`, w.Body.String())
	assert.Equal(t, "MISS", w.Header().Get("X-Cache"))
}

func TestHandle_CacheHit(t *testing.T) {
	mock := &mockProxyService{
		forwardFn: func(_ context.Context, _ *model.ProxyQuery, _ url.Values) (*service.ProxyResult, error) {
			return &service.ProxyResult{
				Data:       []byte(`{"cached": true}`),
				StatusCode: 200,
				CacheHit:   true,
			}, nil
		},
	}

	ctrl := NewProxyController(mock)
	r := setupRouter(ctrl)

	req := httptest.NewRequest(http.MethodGet, "/api/proxy?service=cwa&endpoint=O-A0001-001", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "HIT", w.Header().Get("X-Cache"))
}

func TestHandle_MissingParams(t *testing.T) {
	ctrl := NewProxyController(&mockProxyService{})
	r := setupRouter(ctrl)

	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
	assert.Contains(t, w.Body.String(), "service and endpoint are required")
}

func TestHandle_ProxyError(t *testing.T) {
	mock := &mockProxyService{
		forwardFn: func(_ context.Context, _ *model.ProxyQuery, _ url.Values) (*service.ProxyResult, error) {
			return nil, &service.ProxyError{Code: 502, Err: fmt.Errorf("upstream failed")}
		},
	}

	ctrl := NewProxyController(mock)
	r := setupRouter(ctrl)

	req := httptest.NewRequest(http.MethodGet, "/api/proxy?service=cwa&endpoint=O-A0001-001", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, 502, w.Code)
	assert.Contains(t, w.Body.String(), "upstream failed")
}

func TestHandle_MethodNotAllowed(t *testing.T) {
	ctrl := NewProxyController(&mockProxyService{})

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/proxy", ctrl.Handle)

	req := httptest.NewRequest(http.MethodPost, "/api/proxy?service=cwa&endpoint=test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, 405, w.Code)
}
