// Package router configures Gin routes and middleware.
package router

import (
	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/middleware"
)

// Setup 設定路由
func Setup(
	proxyCtrl *controller.ProxyController,
	debugCtrl *controller.DebugController,
	weatherCtrl *controller.WeatherController,
	proxySecret string,
) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(middleware.RequestLogger())

	api := r.Group("/api")
	{
		api.GET("/health", debugCtrl.HandleHealth)
		api.GET("/proxy", middleware.HMACAuth(proxySecret), proxyCtrl.Handle)
		api.GET("/debug", middleware.HMACAuth(proxySecret), debugCtrl.Handle)

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
