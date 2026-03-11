// Package config provides config-related functionality.
package config

import (
	"os"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

// Config 應用程式設定
type Config struct {
	Port        string
	GinMode     string
	ProxySecret string
	APIKeys     APIKeysConfig
}

// APIKeysConfig API 金鑰設定
type APIKeysConfig struct {
	CWA            string
	WeatherAPI     string
	OpenWeatherMap string
}

// GetByEnvVar 透過環境變數名稱取得對應的 API Key
func (k *APIKeysConfig) GetByEnvVar(envVar string) string {
	switch envVar {
	case "CWA_API_KEY":
		return k.CWA
	case "WEATHERAPI_KEY":
		return k.WeatherAPI
	case "OPENWEATHERMAP_KEY":
		return k.OpenWeatherMap
	default:
		return ""
	}
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
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
