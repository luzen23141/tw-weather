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

	api := r.Group("/api")
	{
		api.GET("/health", debugCtrl.HandleHealth)
		// debug 公開不受 HMAC 保護 —— 它是查「為什麼行為不對」用的，
		// 而 HMAC 失效正是常見的待診斷情境。端點內不含任何秘密。
		api.GET("/debug", debugCtrl.HandleDebug)

		provider := api.Group("/provider")
		{
			provider.GET("/list", providerCtrl.HandleListProviders)
		}

		weather := api.Group("/weather", middleware.HMACAuth(proxySecret))
		{
			weather.GET("/current", weatherCtrl.Handle(controller.Current))
			weather.GET("/hourly", weatherCtrl.Handle(controller.Hourly))
			weather.GET("/daily", weatherCtrl.Handle(controller.Daily))
			weather.GET("/history", weatherCtrl.Handle(controller.History))
		}
	}

	return r
}
