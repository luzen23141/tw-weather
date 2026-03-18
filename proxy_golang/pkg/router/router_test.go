package router

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/model"
)

func TestSetup_RoutesAndAuth(t *testing.T) {
	registry := adapter.NewRegistry(adapter.CWA{}, adapter.OpenMeteo{})
	debugCtrl := controller.NewDebugController()
	providerCtrl := controller.NewProviderController(registry)
	weatherCtrl := controller.NewWeatherController(&mockWeatherServiceRouter{})

	r := Setup(debugCtrl, weatherCtrl, providerCtrl, "secret")

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	req = httptest.NewRequest(http.MethodGet, "/api/provider/list", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	req = httptest.NewRequest(http.MethodGet, "/api/weather/current?provider=openmeteo&lat=25.04&lon=121.51", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	req = httptest.NewRequest(http.MethodOptions, "/api/health", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNoContent, w.Code)

	req = httptest.NewRequest(http.MethodGet, "/missing", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	require.Equal(t, "release", ginMode())
}

type mockWeatherServiceRouter struct{}

func (*mockWeatherServiceRouter) GetCurrentWeather(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
	return &model.WeatherResponse{Provider: "openmeteo", Type: model.WeatherTypeCurrent}, nil
}
func (*mockWeatherServiceRouter) GetHourlyWeather(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
	return &model.WeatherResponse{Provider: "openmeteo", Type: model.WeatherTypeHourly}, nil
}
func (*mockWeatherServiceRouter) GetDailyWeather(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
	return &model.WeatherResponse{Provider: "openmeteo", Type: model.WeatherTypeDaily}, nil
}
func (*mockWeatherServiceRouter) GetHistoryWeather(_ context.Context, _ *model.WeatherQuery) (*model.WeatherResponse, error) {
	return &model.WeatherResponse{Provider: "openmeteo", Type: model.WeatherTypeHistory}, nil
}

func ginMode() string {
	return serviceGinModeAccessor()
}
