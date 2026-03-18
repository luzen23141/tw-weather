// Package main is the entry point for the proxy server.
package main

import (
	"proxy_golang/pkg/app"

	"github.com/rs/zerolog/log"
)

var (
	newApp   = app.New
	logFatal = func(err error) {
		log.Fatal().Err(err).Msg("failed to start server")
	}
)

func main() {
	a := newApp()
	if err := a.Run(); err != nil {
		logFatal(err)
	}
}
