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

const (
	// Current maps to the current weather endpoint kind.
	Current = model.WeatherTypeCurrent
	// Hourly maps to the hourly forecast endpoint kind.
	Hourly = model.WeatherTypeHourly
	// Daily maps to the daily forecast endpoint kind.
	Daily = model.WeatherTypeDaily
	// History maps to the history weather endpoint kind.
	History = model.WeatherTypeHistory
)

// WeatherController 天氣資料控制器
type WeatherController struct {
	weatherService service.WeatherService
}

// NewWeatherController 建立 WeatherController（依賴注入）
func NewWeatherController(ws service.WeatherService) *WeatherController {
	return &WeatherController{weatherService: ws}
}

// Handle 處理 GET /api/weather/*
func (ctrl *WeatherController) Handle(kind model.WeatherType) gin.HandlerFunc {
	return func(c *gin.Context) {
		query, ok := bindWeatherQuery(c, kind)
		if !ok {
			return
		}
		resp, err := ctrl.weatherService.GetWeather(c.Request.Context(), query, kind)
		ctrl.respond(c, resp, err)
	}
}

// bindWeatherQuery 解析並驗證共用入參
func bindWeatherQuery(c *gin.Context, kind model.WeatherType) (*model.WeatherQuery, bool) {
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

	hasLat := query.Lat != 0
	hasLon := query.Lon != 0
	if hasLat != hasLon {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "lat and lon must be provided together"})
		return nil, false
	}

	if query.LocationID != "" && query.Provider != "cwa" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "locationId is only supported for provider=cwa"})
		return nil, false
	}

	if query.Provider == "cwa" && query.LocationID == "" && (kind == model.WeatherTypeHourly || kind == model.WeatherTypeDaily) {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Error: "locationId is required for CWA hourly/daily requests"})
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

	// 限制 days 上限 —— 預報與歷史的上限不同，見 model.MaxDaysFor
	if maxDays := model.MaxDaysFor(kind); query.Days > maxDays {
		query.Days = maxDays
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
