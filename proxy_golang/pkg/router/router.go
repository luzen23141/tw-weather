// Package router configures Gin routes and middleware.
package router

import (
	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/middleware"
)

// Setup 設定路由
func Setup(
	debugCtrl *controller.DebugController,
	weatherCtrl *controller.WeatherController,
	providerCtrl *controller.ProviderController,
	proxySecret string,
) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.MockMode())

	api := r.Group("/api")
	{
		api.GET("/health", debugCtrl.HandleHealth)

		provider := api.Group("/provider")
		{
			provider.GET("/list", providerCtrl.HandleListProviders)
		}

		weather := api.Group("/weather", middleware.HMACAuth(proxySecret))
		{
			weather.GET("/current", weatherCtrl.HandleCurrentWeather)
			weather.GET("/hourly", weatherCtrl.HandleHourlyWeather)
			weather.GET("/daily", weatherCtrl.HandleDailyWeather)
			weather.GET("/history", weatherCtrl.HandleHistoryWeather)
		}
	}

	return r
}
