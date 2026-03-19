package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetEnv(t *testing.T) {
	t.Setenv("TEST_PROXY_GOLANG_ENV", "value")
	assert.Equal(t, "value", getEnv("TEST_PROXY_GOLANG_ENV", "fallback"))
	assert.Equal(t, "fallback", getEnv("TEST_PROXY_GOLANG_ENV_MISSING", "fallback"))
}

func TestLoad(t *testing.T) {
	wd, err := os.Getwd()
	assert.NoError(t, err)
	t.Cleanup(func() {
		_ = os.Chdir(wd)
	})
	assert.NoError(t, os.Chdir(t.TempDir()))

	t.Setenv("PORT", "9090")
	t.Setenv("GIN_MODE", "debug")
	t.Setenv("PROXY_SECRET", "secret")
	t.Setenv("CWA_API_KEY", "cwa-key")
	t.Setenv("WEATHERAPI_KEY", "weather-key")
	t.Setenv("OPENWEATHERMAP_KEY", "owm-key")

	cfg := Load()

	assert.Equal(t, "9090", cfg.Port)
	assert.Equal(t, "debug", cfg.GinMode)
	assert.Equal(t, "secret", cfg.ProxySecret)
	assert.Equal(t, "cwa-key", cfg.APIKeys.CWA)
	assert.Equal(t, "weather-key", cfg.APIKeys.WeatherAPI)
	assert.Equal(t, "owm-key", cfg.APIKeys.OpenWeatherMap)
}
