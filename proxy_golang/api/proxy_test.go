package handler

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/app"
)

func TestHandler(t *testing.T) {
	oldServer := server
	t.Cleanup(func() { server = oldServer })
	wd, err := os.Getwd()
	require.NoError(t, err)
	t.Cleanup(func() { _ = os.Chdir(wd) })
	require.NoError(t, os.Chdir(t.TempDir()))
	t.Setenv("PORT", "18081")
	t.Setenv("GIN_MODE", "test")
	t.Setenv("CWA_API_KEY", "test-key")
	// Redis 現在是硬性依賴
	t.Setenv("REDIS_URL", "redis://localhost:6379/14")

	var err2 error
	server, err2 = app.New()
	if err2 != nil {
		t.Skipf("Redis 不可用，跳過：%v", err2)
	}
	initError = nil

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	Handler(w, req)

	require.Equal(t, http.StatusOK, w.Code)
}
