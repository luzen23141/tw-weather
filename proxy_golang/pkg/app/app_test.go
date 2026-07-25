package app

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/config"
)

type fakeRunner struct {
	addr string
	err  error
}

func (f *fakeRunner) Run(addr ...string) error {
	if len(addr) > 0 {
		f.addr = addr[0]
	}
	return f.err
}

func TestNew(t *testing.T) {
	wd, err := os.Getwd()
	require.NoError(t, err)
	t.Cleanup(func() { _ = os.Chdir(wd) })
	require.NoError(t, os.Chdir(t.TempDir()))

	t.Setenv("PORT", "18080")
	t.Setenv("GIN_MODE", "test")
	t.Setenv("PROXY_SECRET", "secret")
	t.Setenv("CWA_API_KEY", "cwa-key")
	// Redis 現在是硬性依賴 —— 測試需指向本機 Redis（docker-compose up -d）
	t.Setenv("REDIS_URL", "redis://localhost:6379/14")

	a, err := New()
	if err != nil {
		t.Skipf("Redis 不可用，跳過：%v", err)
	}

	require.NotNil(t, a)
	assert.Equal(t, "18080", a.Config.Port)
	assert.NotNil(t, a.Router)
	assert.NotNil(t, a.handler)
}

func TestServeHTTP(t *testing.T) {
	a := &App{handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusAccepted)
	})}

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()
	a.ServeHTTP(w, req)

	assert.Equal(t, http.StatusAccepted, w.Code)
}

func TestRun(t *testing.T) {
	runner := &fakeRunner{}
	a := &App{Config: &config.Config{Port: "9090"}, Router: runner}

	err := a.Run()

	require.NoError(t, err)
	assert.Equal(t, ":9090", runner.addr)
}

func TestRun_Error(t *testing.T) {
	runner := &fakeRunner{err: errors.New("boom")}
	a := &App{Config: &config.Config{Port: "9090"}, Router: runner}

	err := a.Run()

	require.Error(t, err)
	assert.Contains(t, err.Error(), "boom")
}

func TestInitLogger(t *testing.T) {
	original := log.Logger
	t.Cleanup(func() { log.Logger = original })

	initLogger(&config.Config{GinMode: "debug"})
	assert.Equal(t, zerolog.TimeFormatUnix, zerolog.TimeFieldFormat)

	loggerAfterDebug := log.Logger
	initLogger(&config.Config{GinMode: "release"})
	assert.Equal(t, loggerAfterDebug, log.Logger)
}
