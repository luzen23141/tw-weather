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
	registry := adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", Name: "中央氣象署（CWA）", Description: "台灣最精準，含即時觀測與預報", APIKey: "key", RequiresKey: true, Adapter: adapter.CWA{}},
		adapter.ProviderSpec{ID: "openmeteo", Name: "Open-Meteo", Description: "免費無限制，歷史資料豐富", RequiresKey: false, Adapter: adapter.OpenMeteo{}},
	)
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

func (*mockWeatherServiceRouter) GetWeather(_ context.Context, _ *model.WeatherQuery, kind model.WeatherType) (*model.WeatherResponse, error) {
	return &model.WeatherResponse{Provider: "openmeteo", Type: kind}, nil
}

func ginMode() string {
	return serviceGinModeAccessor()
}
