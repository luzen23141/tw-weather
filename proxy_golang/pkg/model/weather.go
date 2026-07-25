// Package model defines shared data structures.
package model

import "time"

// WeatherType 天氣資料類型
type WeatherType string

// WeatherType 天氣資料類型常數
const (
	WeatherTypeCurrent WeatherType = "current"
	WeatherTypeHourly  WeatherType = "hourly"
	WeatherTypeDaily   WeatherType = "daily"
	WeatherTypeHistory WeatherType = "history"
)

// WeatherQuery 天氣查詢請求
type WeatherQuery struct {
	Provider   string  `form:"provider"   binding:"required"`
	Lat        float64 `form:"lat"`
	Lon        float64 `form:"lon"`
	LocationID string  `form:"locationId"` // CWA 測站 ID 或地區代碼
	Date       string  `form:"date"`       // YYYY-MM-DD（歷史查詢用）
	// Township 鄉鎮市區名稱（CWA 預報用）。
	//
	// CWA 的逐時／每日預報 dataset 是「一個縣市一支 API」，而該 API 以鄉鎮名過濾。
	// 因此 LocationID 決定打哪一支、Township 決定取哪一個鄉鎮 —— 兩者缺一不可。
	// 留空時取該縣市的第一個鄉鎮，讓縣市層級的查詢仍有結果而非直接失敗。
	Township string `form:"township"`
	Days     int    `form:"days"` // 預報天數（預設 7）
}

// Weather request validation boundaries.
const (
	// MaxForecastDays 預報天數上限（current / hourly / daily）。
	// Open-Meteo 上游支援到 16 天，但越遠的預報準確度衰減得很快，7 天是實用上限。
	MaxForecastDays = 7

	// MaxHistoryDays 歷史查詢天數上限。
	//
	// 刻意與 MaxForecastDays 分開：兩者是本質不同的限制。預報受限於「預測多遠還可信」，
	// 歷史受限於「上游 archive 有多長」。先前共用同一個常數 7，導致歷史查詢被靜默截斷到
	// 一週 —— 而快取層本來就是照長期歷史設計的（永不過期、30 天 lazy cleanup）。
	MaxHistoryDays = 92

	MinLat = -90.0
	MaxLat = 90.0
	MinLon = -180.0
	MaxLon = 180.0
)

// MaxDaysFor 回傳該查詢類型的天數上限。
func MaxDaysFor(kind WeatherType) int {
	if kind == WeatherTypeHistory {
		return MaxHistoryDays
	}
	return MaxForecastDays
}

// WeatherResponse 統一天氣回應
type WeatherResponse struct {
	Provider  string          `json:"provider"`
	Type      WeatherType     `json:"type"`
	CacheHit  bool            `json:"-"`
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
	TempMean      *float64  `json:"tempMean,omitempty"` // 僅 archive 提供
	Humidity      *int      `json:"humidity,omitempty"`
	WindSpeed     *float64  `json:"windSpeed,omitempty"`
	Precipitation *float64  `json:"precipitation,omitempty"`
	PrecipProb    *int      `json:"precipProb,omitempty"`
	UV            *float64  `json:"uv,omitempty"`
	Sunrise       *string   `json:"sunrise,omitempty"` // ISO 8601，部分 adapter 不提供
	Sunset        *string   `json:"sunset,omitempty"`  // ISO 8601，部分 adapter 不提供
	WeatherCode   int       `json:"weatherCode"`
	Description   string    `json:"description"`
}
