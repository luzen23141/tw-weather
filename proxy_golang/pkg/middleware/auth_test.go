package middleware

import (
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

const testSecret = "test-secret-key-32bytes-long!!"

func makeSignature(secret, tsStr, method, path, rawQuery string) string {
	return hex.EncodeToString(computeHMAC(secret, tsStr, method, path, rawQuery))
}

func setupAuthRouter(secret string) *gin.Engine {
	r := gin.New()
	r.GET("/api/proxy", HMACAuth(secret), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	return r
}

func TestHMACAuth_ValidRequest(t *testing.T) {
	r := setupAuthRouter(testSecret)
	tsStr := strconv.FormatInt(time.Now().Unix(), 10)
	sig := makeSignature(testSecret, tsStr, http.MethodGet, "/api/proxy", "")

	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	req.Header.Set("X-Timestamp", tsStr)
	req.Header.Set("X-Signature", sig)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHMACAuth_MissingHeaders(t *testing.T) {
	r := setupAuthRouter(testSecret)
	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestHMACAuth_ExpiredTimestamp(t *testing.T) {
	r := setupAuthRouter(testSecret)
	tsStr := strconv.FormatInt(time.Now().Add(-60*time.Second).Unix(), 10)
	sig := makeSignature(testSecret, tsStr, http.MethodGet, "/api/proxy", "")

	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	req.Header.Set("X-Timestamp", tsStr)
	req.Header.Set("X-Signature", sig)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestHMACAuth_WrongSignature(t *testing.T) {
	r := setupAuthRouter(testSecret)
	tsStr := strconv.FormatInt(time.Now().Unix(), 10)
	sig := makeSignature("wrong-secret", tsStr, http.MethodGet, "/api/proxy", "")

	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	req.Header.Set("X-Timestamp", tsStr)
	req.Header.Set("X-Signature", sig)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestHMACAuth_EmptySecret_Skips(t *testing.T) {
	r := setupAuthRouter("") // 開發模式，不驗證
	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHMACAuth_InvalidTimestampFormat(t *testing.T) {
	r := setupAuthRouter(testSecret)
	req := httptest.NewRequest(http.MethodGet, "/api/proxy", nil)
	req.Header.Set("X-Timestamp", "not-a-number")
	req.Header.Set("X-Signature", "abc123")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
