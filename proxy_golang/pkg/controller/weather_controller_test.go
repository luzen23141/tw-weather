package controller

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
	"proxy_golang/pkg/service"
)

// ─── mock WeatherService ─────────────────────────────────────────────────────

type mockWeatherService struct {
	getCurrentFn func(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
	getHourlyFn  func(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
	getDailyFn   func(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
	getHistoryFn func(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error)
}

func (m *mockWeatherService) GetCurrentWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	if m.getCurrentFn != nil {
		return m.getCurrentFn(ctx, query)
	}
	return defaultWeatherResponse("cwa", model.WeatherTypeCurrent), nil
}

func (m *mockWeatherService) GetHourlyWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	if m.getHourlyFn != nil {
		return m.getHourlyFn(ctx, query)
	}
	return defaultWeatherResponse("cwa", model.WeatherTypeHourly), nil
}

func (m *mockWeatherService) GetDailyWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	if m.getDailyFn != nil {
		return m.getDailyFn(ctx, query)
	}
	return defaultWeatherResponse("cwa", model.WeatherTypeDaily), nil
}

func (m *mockWeatherService) GetHistoryWeather(ctx context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
	if m.getHistoryFn != nil {
		return m.getHistoryFn(ctx, query)
	}
	return defaultWeatherResponse("weatherapi", model.WeatherTypeHistory), nil
}

// ─── 測試輔助 ────────────────────────────────────────────────────────────────

func defaultWeatherResponse(provider string, wType model.WeatherType) *model.WeatherResponse {
	return &model.WeatherResponse{
		Provider:  provider,
		Type:      wType,
		UpdatedAt: time.Now(),
		Current:   &model.CurrentWeather{Temperature: 25.0},
	}
}

func setupWeatherRouter(svc service.WeatherService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	ctrl := NewWeatherController(svc)
	r.GET("/api/weather/current", ctrl.HandleCurrentWeather)
	r.GET("/api/weather/hourly", ctrl.HandleHourlyWeather)
	r.GET("/api/weather/daily", ctrl.HandleDailyWeather)
	r.GET("/api/weather/history", ctrl.HandleHistoryWeather)
	return r
}

// 有效 query string（provider + lat/lon）
const validQuery = "?provider=cwa&lat=25.04&lon=121.51"
const validCWAForecastQuery = "?provider=cwa&locationId=F-D0047-061"

// ─── HandleCurrentWeather ────────────────────────────────────────────────────

func TestHandleCurrentWeather_Success(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current"+validQuery, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"provider":"cwa"`)
}

func TestHandleCurrentWeather_MissingProvider_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	// 沒有 provider 參數
	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?lat=25.04&lon=121.51", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Provider")
}

func TestHandleCurrentWeather_MissingLocation_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	// 有 provider 但 lat/lon/locationId 全缺
	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=cwa", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "lat/lon or locationId is required")
}

// ─── HandleHourlyWeather ─────────────────────────────────────────────────────

func TestHandleHourlyWeather_Success(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/hourly"+validCWAForecastQuery, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"provider":"cwa"`)
}

// ─── HandleDailyWeather ──────────────────────────────────────────────────────

func TestHandleDailyWeather_Success(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/daily"+validCWAForecastQuery, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"provider":"cwa"`)
}

// ─── HandleHistoryWeather ────────────────────────────────────────────────────

func TestHandleHistoryWeather_Success_WithDate(t *testing.T) {
	svc := &mockWeatherService{
		getHistoryFn: func(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
			return &model.WeatherResponse{
				Provider: "weatherapi",
				Type:     model.WeatherTypeHistory,
			}, nil
		},
	}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet,
		"/api/weather/history?provider=weatherapi&lat=25.04&lon=121.51&date=2024-01-15", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"provider":"weatherapi"`)
}

// ─── service 回傳 ProxyError → 對應 HTTP code ────────────────────────────────

func TestHandleCurrentWeather_ProxyError_ReturnsCorrectCode(t *testing.T) {
	tests := []struct {
		name    string
		code    int
		message string
	}{
		{"bad request", http.StatusBadRequest, "invalid provider"},
		{"bad gateway", http.StatusBadGateway, "upstream failed"},
		{"gateway timeout", http.StatusGatewayTimeout, "upstream timeout"},
		{"internal server error", http.StatusInternalServerError, "key not configured"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			svc := &mockWeatherService{
				getCurrentFn: func(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
					return nil, &service.ProxyError{
						Code: tc.code,
						Err:  errors.New(tc.message),
					}
				},
			}
			r := setupWeatherRouter(svc)

			req := httptest.NewRequest(http.MethodGet, "/api/weather/current"+validQuery, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tc.code, w.Code)
			assert.Contains(t, w.Body.String(), tc.message)
		})
	}
}

// ─── service 回傳非 ProxyError → 500 ─────────────────────────────────────────

func TestHandleCurrentWeather_UnexpectedError_Returns500(t *testing.T) {
	svc := &mockWeatherService{
		getCurrentFn: func(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
			// 回傳一個普通 error，不是 *ProxyError
			return nil, errors.New("some unexpected panic-like error")
		},
	}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current"+validQuery, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "internal server error")
}

// ─── locationId 替代 lat/lon ─────────────────────────────────────────────────

func TestHandleCurrentWeather_WithLocationID_Success(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	// 以 locationId 代替 lat/lon
	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=cwa&locationId=63", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandleCurrentWeather_OnlyLat_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&lat=25.04", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "lat and lon must be provided together")
}

func TestHandleCurrentWeather_LocationIDForNonCWA_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&locationId=foo", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "locationId is only supported")
}

func TestHandleHourlyWeather_CWARequiresLocationID(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/hourly?provider=cwa&lat=25.04&lon=121.51", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "locationId is required for CWA hourly/daily requests")
}

func TestHandleCurrentWeather_InvalidLatRange_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&lat=100&lon=121.51", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "lat must be between")
}

func TestHandleCurrentWeather_InvalidLonRange_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&lat=25.04&lon=200", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "lon must be between")
}

func TestHandleCurrentWeather_NegativeDays_Returns400(t *testing.T) {
	svc := &mockWeatherService{}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&lat=25.04&lon=121.51&days=-1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "days must be \\u003e= 0")
}

func TestHandleCurrentWeather_DaysExceedsMax_Clamps(t *testing.T) {
	svc := &mockWeatherService{
		getCurrentFn: func(_ context.Context, query *model.WeatherQuery) (*model.WeatherResponse, error) {
			assert.Equal(t, model.MaxDays, query.Days)
			return defaultWeatherResponse("openmeteo", model.WeatherTypeCurrent), nil
		},
	}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&lat=25.04&lon=121.51&days=99", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandleDailyWeather_ProxyError(t *testing.T) {
	svc := &mockWeatherService{
		getDailyFn: func(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
			return nil, &service.ProxyError{Code: http.StatusBadGateway, Err: errors.New("daily failed")}
		},
	}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/daily"+validCWAForecastQuery, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadGateway, w.Code)
}

func TestHandleHistoryWeather_UnexpectedError(t *testing.T) {
	svc := &mockWeatherService{
		getHistoryFn: func(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
			return nil, errors.New("history failed")
		},
	}
	r := setupWeatherRouter(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/weather/history?provider=weatherapi&lat=25.04&lon=121.51&date=2024-01-15", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
