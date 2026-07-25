// Package app assembles and wires all dependencies.
package app

import (
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/config"
	"proxy_golang/pkg/controller"
	"proxy_golang/pkg/repository"
	"proxy_golang/pkg/router"
	"proxy_golang/pkg/service"
)

// App 應用程式
type App struct {
	Config  *config.Config
	Router  interface{ Run(addr ...string) error }
	handler http.Handler
}

/*
New 組裝所有依賴並回傳 App。

回傳 error 而非直接終止程式：建構子裡呼叫 log.Fatal 會讓這個函式無法被測試，
也讓任何想嵌入本服務的程式失去對失敗的控制權。是否終止是 main 的決定。
*/
func New() (*App, error) {
	// 載入設定
	cfg := config.Load()

	// 初始化日誌
	initLogger(cfg)

	// 共用 upstream client（實際的快取包裝在 Redis 初始化之後）
	baseUpstreamClient := service.NewUpstreamClient()

	// Adapter Registry
	adapterRegistry := adapter.NewRegistry(
		adapter.ProviderSpec{ID: "cwa", Name: "中央氣象署（CWA）", Description: "台灣最精準，含即時觀測與預報", APIKey: cfg.APIKeys.CWA, RequiresKey: true, Adapter: adapter.CWA{}},
		adapter.ProviderSpec{ID: "weatherapi", Name: "WeatherAPI", Description: "備用來源，支援預報與 7 天歷史", APIKey: cfg.APIKeys.WeatherAPI, RequiresKey: true, Adapter: adapter.WeatherAPI{}},
		adapter.ProviderSpec{ID: "openmeteo", Name: "Open-Meteo", Description: "免費無限制，歷史資料豐富", APIKey: "", RequiresKey: false, Adapter: adapter.OpenMeteo{
			ForecastURL: cfg.Upstreams.OpenMeteoForecastURL,
			ArchiveURL:  cfg.Upstreams.OpenMeteoArchiveURL,
			Model:       cfg.Upstreams.OpenMeteoModel,
		}},
		adapter.ProviderSpec{ID: "openweathermap", Name: "OpenWeatherMap", Description: "全球覆蓋，備用資料源", APIKey: cfg.APIKeys.OpenWeatherMap, RequiresKey: true, Adapter: adapter.OpenWeatherMap{}},
	)

	/*
		Redis 是硬性依賴，沒有記憶體降級。

		快取在這裡不是效能優化，是對上游配額的保護 —— 靜默降級會讓你不知道
		Redis 掛了，而那正是三方 API 正在被狂打的時候。保護機制失效時應該
		大聲失敗，而不是安靜地繼續跑。
	*/
	if cfg.Redis.URL == "" {
		return nil, errors.New("REDIS_URL is required (本地開發：docker-compose up -d)")
	}

	cacheRepo, err := repository.NewRedisCache(cfg.Redis.URL, cfg.Redis.TTL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to redis at %s: %w", cfg.Redis.URL, err)
	}
	log.Info().
		Dur("ttl", cfg.Redis.TTL).
		Dur("refreshInterval", cfg.Redis.RefreshInterval).
		Msg("redis cache enabled")
	/*
		以 URL 為鍵的上游快取。

		CWA 的一支 dataset 回應包含整個縣市的所有鄉鎮 —— 若只快取「解析後的單一
		鄉鎮結果」，同一份 1MB 資料會被該縣市的每個鄉鎮各下載一次。快取在 URL 這層，
		22 個縣市 × 2 種預報 = 44 次上游呼叫即可涵蓋全臺 368 鄉鎮。
	*/
	upstreamClient := service.NewCachingUpstreamClient(baseUpstreamClient, cacheRepo, cfg.Redis.TTL)

	weatherSvc := service.NewWeatherService(cfg, adapterRegistry, upstreamClient, cacheRepo)

	/*
		啟動時暖身：檢查 Redis 的新鮮度，過舊或缺少就補上。

		在背景執行，不阻塞啟動 —— 把第三方 API 的可用性放進啟動的關鍵路徑，
		等於讓上游決定你的服務能不能起來。
	*/
	warmer := service.NewWarmer(weatherSvc, cfg.Redis.RefreshInterval)
	warmer.Start(service.CWAForecastTargets())

	// Controller 層
	debugCtrl := controller.NewDebugController(
		controller.WithRegistry(adapterRegistry),
		controller.WithDependencyChecker(cacheRepo),
	)
	weatherCtrl := controller.NewWeatherController(weatherSvc)
	providerCtrl := controller.NewProviderController(adapterRegistry)

	// 路由設定
	r := router.Setup(debugCtrl, weatherCtrl, providerCtrl, cfg.ProxySecret)

	return &App{
		Config:  cfg,
		Router:  r,
		handler: r,
	}, nil
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
