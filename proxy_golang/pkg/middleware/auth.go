// Package middleware provides Gin middleware components.
package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"proxy_golang/pkg/model"
)

const authTimeWindow = 30 * time.Second

// HMACAuth 驗證請求的 HMAC-SHA256 簽名。
//
// 客戶端需提供：
//   - X-Timestamp: Unix 秒數（字串）
//   - X-Signature: hex(HMAC-SHA256(secret, "{timestamp}\n{METHOD}\n{path}"))
//
// 若 secret 為空則跳過驗證（開發模式）。
func HMACAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if secret == "" {
			c.Next()
			return
		}

		tsStr := c.GetHeader("X-Timestamp")
		sig := c.GetHeader("X-Signature")

		if tsStr == "" || sig == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.ErrorResponse{
				Error: "missing auth headers",
			})
			return
		}

		ts, err := strconv.ParseInt(tsStr, 10, 64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.ErrorResponse{
				Error: "invalid timestamp",
			})
			return
		}

		diff := time.Since(time.Unix(ts, 0))
		if diff > authTimeWindow || diff < -authTimeWindow {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.ErrorResponse{
				Error: "timestamp expired",
			})
			return
		}

		expected := computeHMAC(secret, tsStr, c.Request.Method, c.Request.URL.Path, c.Request.URL.RawQuery)
		sigBytes, err := hex.DecodeString(sig)
		if err != nil || !hmac.Equal(sigBytes, expected) {
			sorted := sortedQuery(c.Request.URL.RawQuery)
			var debugMsg string
			if sorted != "" {
				debugMsg = fmt.Sprintf("%s\n%s\n%s?%s", tsStr, c.Request.Method, c.Request.URL.Path, sorted)
			} else {
				debugMsg = fmt.Sprintf("%s\n%s\n%s", tsStr, c.Request.Method, c.Request.URL.Path)
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":       "invalid signature",
				"debug_msg":   debugMsg,
				"debug_path":  c.Request.URL.Path,
				"debug_query": c.Request.URL.RawQuery,
			})
			return
		}

		c.Next()
	}
}

func computeHMAC(secret, timestamp, method, path, rawQuery string) []byte {
	var msg string
	if rawQuery != "" {
		msg = fmt.Sprintf("%s\n%s\n%s?%s", timestamp, method, path, sortedQuery(rawQuery))
	} else {
		msg = fmt.Sprintf("%s\n%s\n%s", timestamp, method, path)
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(msg))
	return mac.Sum(nil)
}

func sortedQuery(rawQuery string) string {
	values, err := url.ParseQuery(rawQuery)
	if err != nil {
		return rawQuery
	}
	keys := make([]string, 0, len(values))
	for k := range values {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(values))
	for _, k := range keys {
		for _, v := range values[k] {
			parts = append(parts, url.QueryEscape(k)+"="+url.QueryEscape(v))
		}
	}
	return strings.Join(parts, "&")
}
