package service

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/internal/mockfixtures"
	"proxy_golang/pkg/model"
)

type passthroughClient struct {
	called bool
	err    error
}

func (p *passthroughClient) Do(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	p.called = true
	if p.err != nil {
		return nil, p.err
	}
	return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"ok":true}`)}, nil
}

func TestNewMockableUpstreamClient_Passthrough(t *testing.T) {
	real := &passthroughClient{}
	client := NewMockableUpstreamClient(real)

	resp, err := client.Do(context.Background(), &model.UpstreamRequest{URL: "https://example.com", Method: "GET"})

	require.NoError(t, err)
	assert.True(t, real.called)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestNewMockableUpstreamClient_MockMode(t *testing.T) {
	real := &passthroughClient{err: errors.New("should not call")}
	client := NewMockableUpstreamClient(real)
	ctx := context.WithValue(context.Background(), model.MockModeKey, true)

	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: "https://api.weatherapi.com/v1/history.json", Method: "GET"})

	require.NoError(t, err)
	assert.False(t, real.called)
	assert.Equal(t, 200, resp.StatusCode)
	assert.Contains(t, string(resp.Body), "forecastday")
}

func TestMockResponse_Routing(t *testing.T) {
	tests := []struct {
		url      string
		contains string
	}{
		{"https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001", "Station"},
		{"https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-089", "WeatherElement"},
		{"https://archive-api.open-meteo.com/v1/archive", "temperature_2m_max"},
		{"https://api.open-meteo.com/v1/forecast", "hourly"},
		{"https://api.weatherapi.com/v1/history.json", "forecastday"},
		{"https://api.openweathermap.org/data/2.5/weather", "coord"},
		{"https://unknown.example.com", "{}"},
	}

	for _, tc := range tests {
		t.Run(tc.url, func(t *testing.T) {
			resp, err := mockResponse(tc.url)
			require.NoError(t, err)
			assert.Equal(t, 200, resp.StatusCode)
			assert.Contains(t, string(resp.Body), tc.contains)
		})
	}
}

func TestMockEndpointHelpers_Fallbacks(t *testing.T) {
	assert.Equal(
		t,
		mockfixtures.Load("cwa_current.json"),
		mockCWAByEndpoint("https://opendata.cwa.gov.tw/unknown"),
	)
	assert.Equal(
		t,
		mockfixtures.Load("weatherapi_forecast.json"),
		mockWeatherAPIByEndpoint("https://api.weatherapi.com/v1/forecast.json"),
	)
	assert.Equal(
		t,
		mockfixtures.Load("openweathermap_forecast.json"),
		mockOWMByEndpoint("https://api.openweathermap.org/data/2.5/forecast"),
	)
}
