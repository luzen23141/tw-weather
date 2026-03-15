package controller

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/model"
	"proxy_golang/pkg/service"
)

// WeatherController 天氣資料控制器
type WeatherController struct {
	weatherService service.WeatherService
}

// NewWeatherController 建立 WeatherController（依賴注入）
func NewWeatherController(ws service.WeatherService) *WeatherController {
	return &WeatherController{weatherService: ws}
}

// HandleCurrentWeather 處理 GET /api/weather/current
func (ctrl *WeatherController) HandleCurrentWeather(c *gin.Context) {
	query, ok := bindWeatherQuery(c)
	if !ok {
		return
	}
	resp, err := ctrl.weatherService.GetCurrentWeather(c.Request.Context(), query)
	ctrl.respond(c, resp, err)
}

// HandleHourlyWeather 處理 GET /api/weather/hourly
func (ctrl *WeatherController) HandleHourlyWeather(c *gin.Context) {
	query, ok := bindWeatherQuery(c)
	if !ok {
		return
	}
	resp, err := ctrl.weatherService.GetHourlyWeather(c.Request.Context(), query)
	ctrl.respond(c, resp, err)
}

// HandleDailyWeather 處理 GET /api/weather/daily
func (ctrl *WeatherController) HandleDailyWeather(c *gin.Context) {
	query, ok := bindWeatherQuery(c)
	if !ok {
		return
	}
	resp, err := ctrl.weatherService.GetDailyWeather(c.Request.Context(), query)
	ctrl.respond(c, resp, err)
}

// HandleHistoryWeather 處理 GET /api/weather/history
func (ctrl *WeatherController) HandleHistoryWeather(c *gin.Context) {
	query, ok := bindWeatherQuery(c)
	if !ok {
		return
	}
	resp, err := ctrl.weatherService.GetHistoryWeather(c.Request.Context(), query)
	ctrl.respond(c, resp, err)
}

// bindWeatherQuery 解析並驗證共用入參
func bindWeatherQuery(c *gin.Context) (*model.WeatherQuery, bool) {
	var query model.WeatherQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: err.Error()})
		return nil, false
	}
	if query.Provider == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "provider is required"})
		return nil, false
	}
	if query.Lat == 0 && query.Lon == 0 && query.LocationID == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "lat/lon or locationId is required"})
		return nil, false
	}

	// 驗證 lat/lon 範圍（若有提供座標）
	if query.LocationID == "" {
		if query.Lat < model.MinLat || query.Lat > model.MaxLat {
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Error: fmt.Sprintf("lat must be between %.1f and %.1f", model.MinLat, model.MaxLat),
			})
			return nil, false
		}
		if query.Lon < model.MinLon || query.Lon > model.MaxLon {
			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Error: fmt.Sprintf("lon must be between %.1f and %.1f", model.MinLon, model.MaxLon),
			})
			return nil, false
		}
	}

	// 限制 days 上限
	if query.Days > model.MaxDays {
		query.Days = model.MaxDays
	}
	if query.Days < 0 {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "days must be >= 0"})
		return nil, false
	}
	log.Info().
		Str("provider", query.Provider).
		Float64("lat", query.Lat).
		Float64("lon", query.Lon).
		Str("locationId", query.LocationID).
		Str("date", query.Date).
		Int("days", query.Days).
		Msg("weather query")
	return &query, true
}

// respond 統一回應處理
func (ctrl *WeatherController) respond(c *gin.Context, resp *model.WeatherResponse, err error) {
	if err != nil {
		var proxyErr *service.ProxyError
		if errors.As(err, &proxyErr) {
			log.Warn().Err(proxyErr).Int("code", proxyErr.Code).Msg("weather error")
			c.JSON(proxyErr.Code, model.ErrorResponse{Error: proxyErr.Error()})
			return
		}
		log.Error().Err(err).Msg("unexpected weather error")
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Error: "internal server error"})
		return
	}
	if resp.CacheHit {
		c.Header("X-Cache", "HIT")
	} else {
		c.Header("X-Cache", "MISS")
	}
	c.JSON(http.StatusOK, resp)
}
