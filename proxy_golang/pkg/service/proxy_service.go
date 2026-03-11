// Package service implements proxy business logic.
package service

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
	"proxy_golang/pkg/repository"
)

const (
	// upstreamTimeout 是所有上游請求的統一 context 超時時間
	upstreamTimeout = 8 * time.Second

	maxQueryKeys   = 20
	maxValueLength = 200
	maxTotalLength = 2000
	// MaxURLLength 上游 URL 最大長度限制。
	MaxURLLength = 2048
)

// ProxyService 代理服務介面
type ProxyService interface {
	Forward(ctx context.Context, query *model.ProxyQuery, rawQuery url.Values) (*ProxyResult, error)
}

// ProxyResult 代理結果
type ProxyResult struct {
	Data       []byte
	StatusCode int
	CacheHit   bool
}

// proxyServiceImpl 代理服務實作
type proxyServiceImpl struct {
	cfg      *config.Config
	cache    repository.CacheRepository
	upstream model.UpstreamClient
}

// NewProxyService 建立 ProxyService（依賴注入）
func NewProxyService(
	cfg *config.Config,
	cache repository.CacheRepository,
	upstream model.UpstreamClient,
) ProxyService {
	return &proxyServiceImpl{
		cfg:      cfg,
		cache:    cache,
		upstream: upstream,
	}
}

func (s *proxyServiceImpl) Forward(ctx context.Context, query *model.ProxyQuery, rawQuery url.Values) (*ProxyResult, error) {
	// 驗證 request（必填欄位 + 白名單）
	route, err := validateRequest(query)
	if err != nil {
		return nil, &ProxyError{Code: http.StatusBadRequest, Err: fmt.Errorf("validation failed: %w", err)}
	}

	// 驗證 query 參數
	if err := validateQuery(rawQuery); err != nil {
		return nil, &ProxyError{Code: http.StatusBadRequest, Err: fmt.Errorf("query validation failed: %w", err)}
	}

	// 檢查快取
	cacheKey := buildCacheKey(query.Service, query.Endpoint, rawQuery)
	if entry, hit := s.cache.Get(cacheKey); hit {
		log.Debug().Str("cacheKey", cacheKey).Msg("cache hit")
		return &ProxyResult{
			Data:       entry.Data,
			StatusCode: entry.StatusCode,
			CacheHit:   true,
		}, nil
	}

	// 透過 config 取得 API Key
	apiKey := s.cfg.APIKeys.GetByEnvVar(route.APIKeyEnvVar)
	if apiKey == "" {
		return nil, &ProxyError{
			Code: http.StatusInternalServerError,
			Err:  fmt.Errorf("API key not configured for service: %s", query.Service),
		}
	}

	// 建立上游 URL
	upstreamURL := buildUpstreamURL(route.BaseURL, query.Endpoint, rawQuery, route.APIKeyParam, apiKey)
	if len(upstreamURL) > MaxURLLength {
		return nil, &ProxyError{Code: http.StatusBadRequest, Err: fmt.Errorf("URL too long")}
	}

	// 轉發請求
	timeoutCtx, cancel := context.WithTimeout(ctx, upstreamTimeout)
	defer cancel()

	upstreamReq := &model.UpstreamRequest{
		URL:    upstreamURL,
		Method: http.MethodGet,
	}

	resp, err := s.upstream.Do(timeoutCtx, upstreamReq)
	if err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, &ProxyError{Code: http.StatusGatewayTimeout, Err: fmt.Errorf("upstream timeout: %w", err)}
		}
		return nil, &ProxyError{Code: http.StatusBadGateway, Err: fmt.Errorf("upstream request failed: %w", err)}
	}

	// 僅快取 2xx 回應
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		s.cache.Set(cacheKey, &model.CacheEntry{
			Data:       resp.Body,
			StatusCode: resp.StatusCode,
		})
		log.Debug().Str("cacheKey", cacheKey).Msg("response cached")
	}

	return &ProxyResult{
		Data:       resp.Body,
		StatusCode: resp.StatusCode,
		CacheHit:   false,
	}, nil
}

// validateRequest 驗證請求必填欄位與 service/endpoint 白名單
func validateRequest(query *model.ProxyQuery) (*model.ServiceRoute, error) {
	if query.Service == "" {
		return nil, fmt.Errorf("service is required")
	}
	if query.Endpoint == "" {
		return nil, fmt.Errorf("endpoint is required")
	}

	route, ok := model.ServiceRoutes[query.Service]
	if !ok {
		return nil, fmt.Errorf("invalid service: %s", query.Service)
	}

	// 安全性檢查：禁止路徑遍歷
	if strings.Contains(query.Endpoint, "..") || strings.HasPrefix(query.Endpoint, "/") || strings.Contains(query.Endpoint, "://") {
		return nil, fmt.Errorf("invalid endpoint path")
	}

	if !slices.Contains(route.AllowedEndpoints, query.Endpoint) {
		return nil, fmt.Errorf("endpoint not allowed: %s", query.Endpoint)
	}

	return &route, nil
}

// validateQuery 驗證 query 參數數量與長度限制
func validateQuery(params url.Values) error {
	filtered := filterProxyParams(params)

	if len(filtered) > maxQueryKeys {
		return fmt.Errorf("too many query parameters (max %d)", maxQueryKeys)
	}

	totalLen := 0
	for _, values := range filtered {
		for _, v := range values {
			if len(v) > maxValueLength {
				return fmt.Errorf("query value too long (max %d chars)", maxValueLength)
			}
			totalLen += len(v)
		}
	}

	if totalLen > maxTotalLength {
		return fmt.Errorf("total query length too long (max %d chars)", maxTotalLength)
	}

	return nil
}

// buildCacheKey 建立快取 key（參數排序確保一致性）
func buildCacheKey(service, endpoint string, params url.Values) string {
	filtered := filterProxyParams(params)

	keys := make([]string, 0, len(filtered))
	for k := range filtered {
		keys = append(keys, k)
	}
	slices.Sort(keys)

	var parts []string
	for _, k := range keys {
		for _, v := range filtered[k] {
			parts = append(parts, k+"="+v)
		}
	}

	return service + "|" + endpoint + "|" + strings.Join(parts, "&")
}

func filterProxyParams(params url.Values) url.Values {
	filtered := make(url.Values)
	for k, v := range params {
		if k == "service" || k == "endpoint" {
			continue
		}
		filtered[k] = v
	}
	return filtered
}

func buildUpstreamURL(baseURL, endpoint string, params url.Values, apiKeyParam, apiKey string) string {
	u := fmt.Sprintf("%s/%s", baseURL, endpoint)

	q := filterProxyParams(params)
	q.Set(apiKeyParam, apiKey)

	if encoded := q.Encode(); encoded != "" {
		u += "?" + encoded
	}
	return u
}

// ProxyError 業務錯誤（含 HTTP 狀態碼 + 調用鏈）
type ProxyError struct {
	Code int
	Err  error
}

func (e *ProxyError) Error() string {
	return e.Err.Error()
}

func (e *ProxyError) Unwrap() error {
	return e.Err
}
