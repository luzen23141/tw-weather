package main

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"

	"proxy_golang/pkg/app"
	"proxy_golang/pkg/config"
)

type fakeRunner struct {
	err error
}

func (f *fakeRunner) Run(_ ...string) error { return f.err }

func TestMain_Success(t *testing.T) {
	oldNewApp := newApp
	oldLogFatal := logFatal
	t.Cleanup(func() {
		newApp = oldNewApp
		logFatal = oldLogFatal
	})

	fatalCalled := false
	newApp = func() (*app.App, error) {
		return &app.App{Config: &config.Config{Port: "8080"}, Router: &fakeRunner{}}, nil
	}
	logFatal = func(_ error) {
		fatalCalled = true
	}

	main()

	assert.False(t, fatalCalled)
}

func TestMain_RunError(t *testing.T) {
	oldNewApp := newApp
	oldLogFatal := logFatal
	t.Cleanup(func() {
		newApp = oldNewApp
		logFatal = oldLogFatal
	})

	fatalCalled := false
	var fatalErr error
	boom := errors.New("boom")
	newApp = func() (*app.App, error) {
		return &app.App{Config: &config.Config{Port: "8080"}, Router: &fakeRunner{err: boom}}, nil
	}
	logFatal = func(err error) {
		fatalCalled = true
		fatalErr = err
	}

	main()

	assert.True(t, fatalCalled)
	assert.ErrorIs(t, fatalErr, boom)
}

// 建構失敗（例如 Redis 連不上）時必須終止並回報，而不是帶著半成品繼續跑
func TestMain_NewAppError(t *testing.T) {
	oldNewApp := newApp
	oldLogFatal := logFatal
	t.Cleanup(func() {
		newApp = oldNewApp
		logFatal = oldLogFatal
	})

	boom := errors.New("redis unavailable")
	newApp = func() (*app.App, error) { return nil, boom }

	var fatalErr error
	logFatal = func(err error) { fatalErr = err }

	main()

	assert.Equal(t, boom, fatalErr)
}
