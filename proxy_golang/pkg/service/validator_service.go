package service

import (
	"net/url"
	"slices"
	"sort"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/rotisserie/eris"

	"proxy_golang/pkg/model"
)

const (
	maxQueryKeys   = 20
	maxValueLength = 200
	maxTotalLength = 2000
	// MaxURLLength 上游 URL 最大長度限制。
	MaxURLLength = 2048
)

// ValidatorService 驗證服務介面
type ValidatorService interface {
	ValidateRequest(query *model.ProxyQuery) (*model.ServiceRoute, error)
	ValidateQuery(params url.Values) error
	BuildCacheKey(service, endpoint string, params url.Values) string
}

// validatorServiceImpl 驗證服務實作
type validatorServiceImpl struct {
	validate *validator.Validate
}

// NewValidatorService 建立 ValidatorService
func NewValidatorService() ValidatorService {
	return &validatorServiceImpl{
		validate: validator.New(),
	}
}

// ValidateRequest 驗證請求結構（struct 驗證 + service/endpoint 白名單）
func (s *validatorServiceImpl) ValidateRequest(query *model.ProxyQuery) (*model.ServiceRoute, error) {
	// struct 驗證（required 等 tag）
	if err := s.validate.Struct(query); err != nil {
		return nil, eris.Wrap(err, "request validation failed")
	}

	// 驗證 service 白名單
	route, ok := model.ServiceRoutes[query.Service]
	if !ok {
		return nil, eris.Errorf("invalid service: %s", query.Service)
	}

	// 安全性檢查：禁止路徑遍歷
	if strings.Contains(query.Endpoint, "..") || strings.HasPrefix(query.Endpoint, "/") || strings.Contains(query.Endpoint, "://") {
		return nil, eris.New("invalid endpoint path")
	}

	// 驗證 endpoint 白名單
	if !slices.Contains(route.AllowedEndpoints, query.Endpoint) {
		return nil, eris.Errorf("endpoint not allowed: %s", query.Endpoint)
	}

	return &route, nil
}

// ValidateQuery 驗證 query 參數限制
func (s *validatorServiceImpl) ValidateQuery(params url.Values) error {
	filtered := filterProxyParams(params)

	if len(filtered) > maxQueryKeys {
		return eris.Errorf("too many query parameters (max %d)", maxQueryKeys)
	}

	totalLen := 0
	for _, values := range filtered {
		for _, v := range values {
			if len(v) > maxValueLength {
				return eris.Errorf("query value too long (max %d chars)", maxValueLength)
			}
			totalLen += len(v)
		}
	}

	if totalLen > maxTotalLength {
		return eris.Errorf("total query length too long (max %d chars)", maxTotalLength)
	}

	return nil
}

// BuildCacheKey 建立快取 key（參數排序確保一致性）
func (s *validatorServiceImpl) BuildCacheKey(service, endpoint string, params url.Values) string {
	filtered := filterProxyParams(params)

	keys := make([]string, 0, len(filtered))
	for k := range filtered {
		keys = append(keys, k)
	}
	sort.Strings(keys)

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
