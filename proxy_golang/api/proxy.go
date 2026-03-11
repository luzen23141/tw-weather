// Package handler provides the Vercel serverless function entry point.
package handler

import (
	"net/http"

	"proxy_golang/pkg/app"
)

var server *app.App

func init() {
	server = app.New()
}

// Handler is the Vercel serverless function entry point for /api/proxy.
func Handler(w http.ResponseWriter, r *http.Request) {
	server.ServeHTTP(w, r)
}
