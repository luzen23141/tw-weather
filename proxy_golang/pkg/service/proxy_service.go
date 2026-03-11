// Package service implements proxy business logic.
package service

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/rotisserie/eris"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/config"
	"proxy_golang/pkg/model"
	"proxy_golang/pkg/repository"
)

const proxyTimeout = 8 * time.Second

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
	cfg       *config.Config
	validator ValidatorService
	cache     repository.CacheRepository
	upstream  UpstreamClient
}

// NewProxyService 建立 ProxyService（依賴注入）
func NewProxyService(
	cfg *config.Config,
	validator ValidatorService,
	cache repository.CacheRepository,
	upstream UpstreamClient,
) ProxyService {
	return &proxyServiceImpl{
		cfg:       cfg,
		validator: validator,
		cache:     cache,
		upstream:  upstream,
	}
}

func (s *proxyServiceImpl) Forward(ctx context.Context, query *model.ProxyQuery, rawQuery url.Values) (*ProxyResult, error) {
	// 驗證 request（struct + 白名單）
	route, err := s.validator.ValidateRequest(query)
	if err != nil {
		return nil, &ProxyError{Code: http.StatusBadRequest, Err: eris.Wrap(err, "validation failed")}
	}

	// 驗證 query 參數
	if err := s.validator.ValidateQuery(rawQuery); err != nil {
		return nil, &ProxyError{Code: http.StatusBadRequest, Err: eris.Wrap(err, "query validation failed")}
	}

	// 檢查快取
	cacheKey := s.validator.BuildCacheKey(query.Service, query.Endpoint, rawQuery)
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
			Err:  eris.Errorf("API key not configured for service: %s", query.Service),
		}
	}

	// 建立上游 URL
	upstreamURL := buildUpstreamURL(route.BaseURL, query.Endpoint, rawQuery, route.APIKeyParam, apiKey)
	if len(upstreamURL) > MaxURLLength {
		return nil, &ProxyError{Code: http.StatusBadRequest, Err: eris.New("URL too long")}
	}

	// 轉發請求
	timeoutCtx, cancel := context.WithTimeout(ctx, proxyTimeout)
	defer cancel()

	upstreamReq := &model.UpstreamRequest{
		URL:    upstreamURL,
		Method: http.MethodGet,
	}

	resp, err := s.upstream.Do(timeoutCtx, upstreamReq)
	if err != nil {
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, &ProxyError{Code: http.StatusGatewayTimeout, Err: eris.Wrap(err, "upstream timeout")}
		}
		return nil, &ProxyError{Code: http.StatusBadGateway, Err: eris.Wrap(err, "upstream request failed")}
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

func buildUpstreamURL(baseURL, endpoint string, params url.Values, apiKeyParam, apiKey string) string {
	u := fmt.Sprintf("%s/%s", baseURL, endpoint)

	q := make(url.Values)
	for k, v := range params {
		if k == "service" || k == "endpoint" {
			continue
		}
		q[k] = v
	}
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
