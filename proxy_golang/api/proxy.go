// Package handler provides the Vercel serverless function entry point.
package handler

import (
	"net/http"

	"proxy_golang/pkg/app"
)

var (
	server    *app.App
	initError error
)

func init() {
	server, initError = app.New()
}

// Handler is the Vercel serverless function entry point for /api/proxy.
//
// 初始化失敗時回傳 503 而非 panic —— serverless 環境下 panic 只會得到一個
// 沒有脈絡的 500，把原因寫進回應才查得出是什麼掛了（通常是 Redis 連不上）。
func Handler(w http.ResponseWriter, r *http.Request) {
	if initError != nil {
		http.Error(w, "service unavailable: "+initError.Error(), http.StatusServiceUnavailable)
		return
	}
	server.ServeHTTP(w, r)
}
