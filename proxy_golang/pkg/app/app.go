// Package app assembles and wires all dependencies.
package app

import (
	"net/http"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/router"
	"proxy_golang/pkg/service"
)

// App 應用程式
type App struct {
	Config  *config.Config
	Router  interface{ Run(addr ...string) error }
	handler http.Handler
}

// New 組裝所有依賴並回傳 App
func New() *App {
	// 載入設定
	cfg := config.Load()

	// 初始化日誌
	initLogger(cfg)

	// 共用 upstream client（包裝 mock 層，header 觸發時回傳寫死的三方原始回應）
	upstreamClient := service.NewMockableUpstreamClient(service.NewUpstreamClient())

	// Adapter Registry
	adapterRegistry := adapter.NewRegistry(
		adapter.CWA{},
		adapter.WeatherAPI{},
		adapter.OpenMeteo{},
		adapter.OpenWeatherMap{},
	)

	// Service 層 - Weather
	weatherSvc := service.NewWeatherService(cfg, adapterRegistry, upstreamClient)

	// Controller 層
	debugCtrl := controller.NewDebugController()
	weatherCtrl := controller.NewWeatherController(weatherSvc)
	providerCtrl := controller.NewProviderController(adapterRegistry)

	// 路由設定
	r := router.Setup(debugCtrl, weatherCtrl, providerCtrl, cfg.ProxySecret)

	return &App{
		Config:  cfg,
		Router:  r,
		handler: r,
	}
}

// ServeHTTP 實作 http.Handler，供 Vercel Serverless 等無須 Run() 的場景使用
func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.handler.ServeHTTP(w, r)
}

// Run 啟動伺服器
func (a *App) Run() error {
	log.Info().Str("port", a.Config.Port).Msg("proxy server starting")
	return a.Router.Run(":" + a.Config.Port)
}

func initLogger(cfg *config.Config) {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if cfg.GinMode != "release" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}
}
