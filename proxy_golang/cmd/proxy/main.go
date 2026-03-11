// Package main is the entry point for the proxy server.
package main

import (
	"proxy_golang/pkg/app"

	"github.com/rs/zerolog/log"
)

func main() {
	a := app.New()
	if err := a.Run(); err != nil {
		log.Fatal().Err(err).Msg("failed to start server")
	}
}
