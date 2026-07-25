// Package controller handles HTTP request routing and response.
package controller

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/adapter"
	"proxy_golang/pkg/model"
)

/*
DebugController 健康檢查與診斷控制器。

/api/health 與 /api/debug 的分工：

  - health 是 liveness —— 行程活著就回 ok，給 load balancer 用，必須零依賴。
  - debug 是診斷 —— 回報各依賴的實際狀態（Redis、provider 配置、暖身進度），
    給人查問題用。「服務起來了但行為不對」的時候，需要的是這一層。
*/
type DebugController struct {
	registry  *adapter.Registry
	deps      DependencyChecker
	startedAt time.Time
}

// DependencyChecker 診斷所需的最小依賴介面。nil 時 debug 端點僅回報基本資訊。
type DependencyChecker interface {
	// Ping 檢查 Redis 連線
	Ping() error
	// GetRaw 讀取暖身狀態（由 Warmer 寫入）
	GetRaw(key string) ([]byte, bool)
}

// DebugOption 設定 DebugController 的可選依賴。
type DebugOption func(*DebugController)

// WithRegistry 注入 provider registry，debug 端點據此回報各來源的配置狀態。
func WithRegistry(r *adapter.Registry) DebugOption {
	return func(c *DebugController) { c.registry = r }
}

// WithDependencyChecker 注入依賴檢查器（實務上是 Redis 快取）。
func WithDependencyChecker(d DependencyChecker) DebugOption {
	return func(c *DebugController) { c.deps = d }
}

// NewDebugController 建立 DebugController。
// 依賴皆為可選 —— 測試或最小配置下 health 仍可運作。
func NewDebugController(opts ...DebugOption) *DebugController {
	ctrl := &DebugController{startedAt: time.Now()}
	for _, opt := range opts {
		opt(ctrl)
	}
	return ctrl
}

// HandleHealth 處理 /api/health 健康檢查請求（公開，不受 HMAC 保護）
func (ctrl *DebugController) HandleHealth(c *gin.Context) {
	c.JSON(http.StatusOK, model.HealthResponse{
		Status:  "ok",
		Service: "tw-weather-proxy-go",
		Version: "1.1.0",
	})
}

/*
HandleDebug 處理 /api/debug 診斷請求（公開，不受 HMAC 保護）。

公開的理由：它是查「為什麼行為不對」用的，而 HMAC 失效本身就是常見的
「行為不對」—— 診斷端點若躲在待診斷的機制後面就失去意義。因此這裡
**絕不能放任何秘密**：provider 只回報金鑰有無（bool），不回報內容。

Redis 掛掉時整體狀態轉 degraded 並回 503 —— 監控可以直接拿這個端點
當依賴健康檢查，不必另外去 ping Redis。
*/
func (ctrl *DebugController) HandleDebug(c *gin.Context) {
	resp := model.DebugResponse{
		Status:  "ok",
		Service: "tw-weather-proxy-go",
		Version: "1.1.0",
		Uptime:  time.Since(ctrl.startedAt).Round(time.Second).String(),
	}

	if ctrl.registry != nil {
		for _, spec := range ctrl.registry.All() {
			resp.Providers = append(resp.Providers, model.DebugProvider{
				ID:            spec.ID,
				KeyConfigured: !spec.RequiresKey || spec.APIKey != "",
			})
		}
	}

	if ctrl.deps != nil {
		if err := ctrl.deps.Ping(); err != nil {
			resp.Status = "degraded"
			resp.Redis = &model.DebugRedis{Connected: false, Error: err.Error()}
		} else {
			resp.Redis = &model.DebugRedis{Connected: true}
		}

		// 暖身狀態由 Warmer 在每輪結束時寫入 Redis —— 存在 Redis 而非行程內，
		// 多實例部署時任一台都能回報「最後一次何時執行、結果如何」
		if raw, ok := ctrl.deps.GetRaw(model.WarmupStatusKey); ok {
			var status model.WarmupStatus
			if json.Unmarshal(raw, &status) == nil {
				resp.Warmup = &status
			}
		}
	}

	code := http.StatusOK
	if resp.Status != "ok" {
		code = http.StatusServiceUnavailable
	}
	c.JSON(code, resp)
}
