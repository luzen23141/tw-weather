package service

import (
	"fmt"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

func TestValidateRequest_ValidCWA(t *testing.T) {
	svc := NewValidatorService()
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "O-A0001-001"}

	route, err := svc.ValidateRequest(query)
	require.NoError(t, err)
	assert.Equal(t, "https://opendata.cwa.gov.tw/api/v1/rest/datastore", route.BaseURL)
}

func TestValidateRequest_ValidWeatherAPI(t *testing.T) {
	svc := NewValidatorService()
	query := &model.ProxyQuery{Service: "weatherapi", Endpoint: "current.json"}

	route, err := svc.ValidateRequest(query)
	require.NoError(t, err)
	assert.Equal(t, "WEATHERAPI_KEY", route.APIKeyEnvVar)
}

func TestValidateRequest_InvalidService(t *testing.T) {
	svc := NewValidatorService()
	query := &model.ProxyQuery{Service: "unknown", Endpoint: "test"}

	_, err := svc.ValidateRequest(query)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid service")
}

func TestValidateRequest_MissingService(t *testing.T) {
	svc := NewValidatorService()
	query := &model.ProxyQuery{Service: "", Endpoint: "test"}

	_, err := svc.ValidateRequest(query)
	assert.Error(t, err)
}

func TestValidateRequest_InvalidEndpoint(t *testing.T) {
	svc := NewValidatorService()
	query := &model.ProxyQuery{Service: "cwa", Endpoint: "not-allowed"}

	_, err := svc.ValidateRequest(query)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "endpoint not allowed")
}

func TestValidateRequest_PathTraversal(t *testing.T) {
	svc := NewValidatorService()

	tests := []struct {
		name     string
		endpoint string
	}{
		{"double dot", "../etc/passwd"},
		{"leading slash", "/etc/passwd"},
		{"url scheme", "http://evil.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			query := &model.ProxyQuery{Service: "cwa", Endpoint: tt.endpoint}
			_, err := svc.ValidateRequest(query)
			assert.Error(t, err)
			assert.Contains(t, err.Error(), "invalid endpoint path")
		})
	}
}

func TestValidateQuery_Valid(t *testing.T) {
	svc := NewValidatorService()
	params := url.Values{
		"service":  {"cwa"},
		"endpoint": {"O-A0001-001"},
		"format":   {"JSON"},
	}

	err := svc.ValidateQuery(params)
	assert.NoError(t, err)
}

func TestValidateQuery_TooManyKeys(t *testing.T) {
	svc := NewValidatorService()
	params := url.Values{}
	for i := 0; i < 25; i++ {
		params.Set(fmt.Sprintf("key%d", i), "value")
	}

	err := svc.ValidateQuery(params)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "too many query parameters")
}

func TestValidateQuery_ValueTooLong(t *testing.T) {
	svc := NewValidatorService()
	longValue := make([]byte, 201)
	for i := range longValue {
		longValue[i] = 'a'
	}
	params := url.Values{"key": {string(longValue)}}

	err := svc.ValidateQuery(params)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "query value too long")
}

func TestValidateQuery_TotalTooLong(t *testing.T) {
	svc := NewValidatorService()
	params := url.Values{}
	value := make([]byte, 199)
	for i := range value {
		value[i] = 'a'
	}
	for i := 0; i < 15; i++ {
		params.Set(fmt.Sprintf("k%d", i), string(value))
	}

	err := svc.ValidateQuery(params)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "total query length too long")
}

func TestBuildCacheKey_Deterministic(t *testing.T) {
	svc := NewValidatorService()

	params1 := url.Values{"b": {"2"}, "a": {"1"}, "service": {"cwa"}, "endpoint": {"test"}}
	params2 := url.Values{"a": {"1"}, "b": {"2"}, "service": {"cwa"}, "endpoint": {"test"}}

	key1 := svc.BuildCacheKey("cwa", "test", params1)
	key2 := svc.BuildCacheKey("cwa", "test", params2)

	assert.Equal(t, key1, key2)
	assert.Equal(t, "cwa|test|a=1&b=2", key1)
}

func TestBuildCacheKey_ExcludesServiceEndpoint(t *testing.T) {
	svc := NewValidatorService()
	params := url.Values{"service": {"cwa"}, "endpoint": {"test"}, "format": {"JSON"}}

	key := svc.BuildCacheKey("cwa", "test", params)
	assert.Equal(t, "cwa|test|format=JSON", key)
}
