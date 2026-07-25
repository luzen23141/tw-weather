// Package config provides config-related functionality.
package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

// Config 應用程式設定
type Config struct {
	Port        string
	GinMode     string
	ProxySecret string
	APIKeys     APIKeysConfig
	Upstreams   UpstreamsConfig
	Redis       RedisConfig
}

// RedisConfig Redis 快取設定。
//
// URL 留空時退回行程內的記憶體快取 —— 本地開發不強制依賴 Redis。
type RedisConfig struct {
	URL string
	// TTL 快取資料在 Redis 的存活時間。
	//
	// 必須明顯長於 RefreshInterval —— 過期資料要能撐到背景更新完成，
	// stale-while-revalidate 才有東西可以「先回舊的」。
	TTL time.Duration
	// RefreshInterval 超過此時長即視為過期，觸發背景更新。
	RefreshInterval time.Duration
}

// UpstreamsConfig 上游端點覆寫。
//
// 留空時各 adapter 使用官方託管端點。Open-Meteo 的免費託管服務禁止商業用途，
// 但軟體為 AGPLv3、資料為 CC BY 4.0，自架後暴露同一組 API —— 因此正式環境
// 只需在這裡指向自架實例，不必改任何程式碼。
type UpstreamsConfig struct {
	OpenMeteoForecastURL string
	OpenMeteoArchiveURL  string
	// OpenMeteoModel 自架時必填，見 adapter.OpenMeteo.Model
	OpenMeteoModel string
}

// APIKeysConfig API 金鑰設定
type APIKeysConfig struct {
	CWA            string
	WeatherAPI     string
	OpenWeatherMap string
}

// Load 載入環境變數並回傳 Config
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Warn().Msg("No .env file found, using system environment variables")
	}

	return &Config{
		Port:        getEnv("PORT", "8080"),
		GinMode:     getEnv("GIN_MODE", "release"),
		ProxySecret: getEnv("PROXY_SECRET", ""),
		APIKeys: APIKeysConfig{
			CWA:            getEnv("CWA_API_KEY", ""),
			WeatherAPI:     getEnv("WEATHERAPI_KEY", ""),
			OpenWeatherMap: getEnv("OPENWEATHERMAP_KEY", ""),
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", ""),
			// TTL 預設 1 小時、更新間隔 5 分鐘 —— 中間這段差距就是「可以先回舊資料」的緩衝
			TTL:             time.Duration(getEnvInt("REDIS_TTL_SECONDS", 3600)) * time.Second,
			RefreshInterval: time.Duration(getEnvInt("REFRESH_INTERVAL_SECONDS", 300)) * time.Second,
		},
		Upstreams: UpstreamsConfig{
			OpenMeteoForecastURL: getEnv("OPENMETEO_FORECAST_URL", ""),
			OpenMeteoArchiveURL:  getEnv("OPENMETEO_ARCHIVE_URL", ""),
			OpenMeteoModel:       getEnv("OPENMETEO_MODEL", ""),
		},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// getEnvInt 讀取整數環境變數，缺值或無法解析時回傳 fallback。
func getEnvInt(key string, fallback int) int {
	value, ok := os.LookupEnv(key)
	if !ok || value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
