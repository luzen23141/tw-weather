// Package model defines shared data structures.
package model

import "time"

// WeatherType 天氣資料類型
type WeatherType string

const (
	WeatherTypeCurrent WeatherType = "current"
	WeatherTypeHourly  WeatherType = "hourly"
	WeatherTypeDaily   WeatherType = "daily"
	WeatherTypeHistory WeatherType = "history"
)

// WeatherQuery 天氣查詢請求
type WeatherQuery struct {
	Provider   string  `form:"provider"    binding:"required" validate:"required"`
	Type       string  `form:"type"        binding:"required" validate:"required,oneof=current hourly daily history"`
	Lat        float64 `form:"lat"`
	Lon        float64 `form:"lon"`
	LocationID string  `form:"locationId"` // CWA 測站 ID 或地區代碼
	Date       string  `form:"date"`       // YYYY-MM-DD（歷史查詢用）
	Days       int     `form:"days"`       // 預報天數（預設 7）
}

// WeatherResponse 統一天氣回應
type WeatherResponse struct {
	Provider  string          `json:"provider"`
	Type      WeatherType     `json:"type"`
	Location  Location        `json:"location"`
	UpdatedAt time.Time       `json:"updatedAt"`
	Current   *CurrentWeather `json:"current,omitempty"`
	Hourly    []HourlyWeather `json:"hourly,omitempty"`
	Daily     []DailyWeather  `json:"daily,omitempty"`
}

// Location 地點資訊
type Location struct {
	ID   string  `json:"id,omitempty"`
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lon  float64 `json:"lon"`
}

// CurrentWeather 當前天氣
type CurrentWeather struct {
	Temperature         float64  `json:"temperature"`                   // °C
	ApparentTemperature *float64 `json:"apparentTemperature,omitempty"` // °C
	Humidity            int      `json:"humidity"`                      // %
	WindSpeed           float64  `json:"windSpeed"`                     // km/h
	WindDirection       *int     `json:"windDirection,omitempty"`       // 度 0-360
	Pressure            *float64 `json:"pressure,omitempty"`            // hPa
	Visibility          *float64 `json:"visibility,omitempty"`          // km
	UV                  *float64 `json:"uv,omitempty"`
	Precipitation       *float64 `json:"precipitation,omitempty"` // mm
	WeatherCode         int      `json:"weatherCode"`             // WMO code
	Description         string   `json:"description"`
	IsDay               *bool    `json:"isDay,omitempty"`
}

// HourlyWeather 逐時天氣
type HourlyWeather struct {
	Time                time.Time `json:"time"`
	Temperature         float64   `json:"temperature"`
	ApparentTemperature *float64  `json:"apparentTemperature,omitempty"`
	Humidity            int       `json:"humidity"`
	WindSpeed           float64   `json:"windSpeed"`
	WindDirection       *int      `json:"windDirection,omitempty"`
	Precipitation       *float64  `json:"precipitation,omitempty"`
	PrecipProb          *int      `json:"precipProb,omitempty"` // %
	WeatherCode         int       `json:"weatherCode"`
	Description         string    `json:"description"`
}

// DailyWeather 每日天氣
type DailyWeather struct {
	Date          time.Time `json:"date"`
	TempMax       float64   `json:"tempMax"`
	TempMin       float64   `json:"tempMin"`
	Humidity      *int      `json:"humidity,omitempty"`
	WindSpeed     *float64  `json:"windSpeed,omitempty"`
	Precipitation *float64  `json:"precipitation,omitempty"`
	PrecipProb    *int      `json:"precipProb,omitempty"`
	UV            *float64  `json:"uv,omitempty"`
	WeatherCode   int       `json:"weatherCode"`
	Description   string    `json:"description"`
}
