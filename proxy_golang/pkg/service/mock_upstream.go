package service

import (
	"context"
	"strings"

	"github.com/rs/zerolog/log"

	"proxy_golang/internal/mockfixtures"
	"proxy_golang/pkg/model"
)

// mockableUpstreamClient 包裝真實 client，mock 模式時回傳寫死的三方原始回應
type mockableUpstreamClient struct {
	real model.UpstreamClient
}

// NewMockableUpstreamClient 建立可 mock 的 upstream client
func NewMockableUpstreamClient(actual model.UpstreamClient) model.UpstreamClient {
	return &mockableUpstreamClient{real: actual}
}

func (c *mockableUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	if ctx.Value(model.MockModeKey) == true {
		log.Info().Str("url", req.URL).Msg("mock mode: returning hardcoded upstream response")
		return mockResponse(req.URL)
	}
	return c.real.Do(ctx, req)
}

func mockResponse(rawURL string) (*model.UpstreamResponse, error) {
	var body string

	switch {
	case strings.Contains(rawURL, "opendata.cwa.gov.tw"):
		body = mockCWAByEndpoint(rawURL)
	case strings.Contains(rawURL, "archive-api.open-meteo.com"):
		body = mockfixtures.Load("openmeteo_history.json")
	case strings.Contains(rawURL, "api.open-meteo.com"):
		body = mockfixtures.Load("openmeteo_forecast.json")
	case strings.Contains(rawURL, "api.weatherapi.com"):
		body = mockWeatherAPIByEndpoint(rawURL)
	case strings.Contains(rawURL, "api.openweathermap.org"):
		body = mockOWMByEndpoint(rawURL)
	default:
		body = `{}`
	}

	return &model.UpstreamResponse{
		StatusCode: 200,
		Body:       []byte(body),
	}, nil
}

func mockCWAByEndpoint(rawURL string) string {
	switch {
	case strings.Contains(rawURL, "O-A0001-001"):
		return mockfixtures.Load("cwa_current.json")
	case strings.Contains(rawURL, "F-D0047-089"):
		return mockfixtures.Load("cwa_hourly.json")
	case strings.Contains(rawURL, "F-D0047-091"):
		return mockfixtures.Load("cwa_daily.json")
	default:
		return mockfixtures.Load("cwa_current.json")
	}
}

func mockWeatherAPIByEndpoint(rawURL string) string {
	if strings.Contains(rawURL, "history.json") {
		return mockfixtures.Load("weatherapi_history.json")
	}
	return mockfixtures.Load("weatherapi_forecast.json")
}

func mockOWMByEndpoint(rawURL string) string {
	if strings.Contains(rawURL, "/data/2.5/weather") {
		return mockfixtures.Load("openweathermap_current.json")
	}
	return mockfixtures.Load("openweathermap_forecast.json")
}
