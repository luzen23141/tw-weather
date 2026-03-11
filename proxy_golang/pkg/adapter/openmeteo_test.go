package adapter

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

var openMeteoQuery = &model.WeatherQuery{
	Provider: "openmeteo",
	Lat:      25.048,
	Lon:      121.517,
}

func TestOpenMeteo_ProviderID(t *testing.T) {
	assert.Equal(t, "openmeteo", OpenMeteo{}.ProviderID())
}

func TestOpenMeteo_SupportedTypes(t *testing.T) {
	types := OpenMeteo{}.SupportedTypes()
	assert.Contains(t, types, model.WeatherTypeCurrent)
	assert.Contains(t, types, model.WeatherTypeHourly)
	assert.Contains(t, types, model.WeatherTypeDaily)
	assert.Contains(t, types, model.WeatherTypeHistory)
}

// --- Current ---

func TestOpenMeteo_FetchCurrent_RealFixture(t *testing.T) {
	// 使用真實 Open-Meteo API 回傳結構的 fixture
	client := fixtureClient("openmeteo_forecast.json")
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeCurrent)

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "openmeteo", resp.Provider)
	assert.Equal(t, model.WeatherTypeCurrent, resp.Type)

	// 驗證 fixture 中的 lat/lon
	assert.InDelta(t, 25.0, resp.Location.Lat, 0.1)
	assert.InDelta(t, 121.5, resp.Location.Lon, 0.1)

	require.NotNil(t, resp.Current)
	assert.InDelta(t, 15.7, resp.Current.Temperature, 0.01)
	assert.Equal(t, 64, resp.Current.Humidity)
	assert.InDelta(t, 13.0, resp.Current.WindSpeed, 0.01)
	assert.Equal(t, 2, resp.Current.WeatherCode)

	require.NotNil(t, resp.Current.WindDirection)
	assert.Equal(t, 66, *resp.Current.WindDirection)

	require.NotNil(t, resp.Current.Pressure)
	assert.InDelta(t, 1019.1, *resp.Current.Pressure, 0.01)

	// visibility 24140m → 24.14 km
	require.NotNil(t, resp.Current.Visibility)
	assert.InDelta(t, 24.14, *resp.Current.Visibility, 0.01)

	require.NotNil(t, resp.Current.IsDay)
	assert.True(t, *resp.Current.IsDay)
}

func TestOpenMeteo_FetchCurrent_RequestURL(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("openmeteo_forecast.json")}, nil
		},
	}

	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeCurrent)

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)
	require.NoError(t, err)

	assert.Contains(t, capturedURL, "api.open-meteo.com")
	assert.Contains(t, capturedURL, "latitude=25")
	assert.Contains(t, capturedURL, "current=")
}

func TestOpenMeteo_FetchCurrent_NetworkError(t *testing.T) {
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeCurrent)

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo fetch failed")
}

func TestOpenMeteo_FetchCurrent_BadJSON(t *testing.T) {
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeCurrent)

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo parse failed")
}

// --- Hourly ---

func TestOpenMeteo_FetchHourly_RealFixture(t *testing.T) {
	client := fixtureClient("openmeteo_forecast.json")
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeHourly)
	q.Days = 3

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHourly, resp.Type)

	// fixture 中有 3 筆逐時資料
	require.Len(t, resp.Hourly, 3)

	first := resp.Hourly[0]
	assert.InDelta(t, 13.4, first.Temperature, 0.01)
	assert.Equal(t, 79, first.Humidity)
	assert.InDelta(t, 9.0, first.WindSpeed, 0.01)
	assert.Equal(t, 3, first.WeatherCode)

	require.NotNil(t, first.ApparentTemperature)
	assert.InDelta(t, 12.0, *first.ApparentTemperature, 0.01)

	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 0, *first.PrecipProb)
}

func TestOpenMeteo_FetchHourly_DefaultDays(t *testing.T) {
	// Days = 0 → 預設 7 天，URL 要帶 forecast_days=7
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("openmeteo_forecast.json")}, nil
		},
	}

	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeHourly)
	q.Days = 0

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)
	require.NoError(t, err)
	assert.Contains(t, capturedURL, "forecast_days=7")
}

// --- Daily ---

func TestOpenMeteo_FetchDaily_RealFixture(t *testing.T) {
	client := fixtureClient("openmeteo_forecast.json")
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeDaily)

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeDaily, resp.Type)

	// fixture 有 3 天
	require.Len(t, resp.Daily, 3)

	first := resp.Daily[0]
	assert.InDelta(t, 18.3, first.TempMax, 0.01)
	assert.InDelta(t, 13.2, first.TempMin, 0.01)
	assert.Equal(t, 3, first.WeatherCode)

	require.NotNil(t, first.Precipitation)
	assert.InDelta(t, 0.0, *first.Precipitation, 0.01)

	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 3, *first.PrecipProb)

	require.NotNil(t, first.UV)
	assert.InDelta(t, 6.85, *first.UV, 0.01)
}

// --- History ---

func TestOpenMeteo_FetchHistory_RealFixture(t *testing.T) {
	// 使用真實 Open-Meteo archive API 回傳結構
	client := fixtureClient("openmeteo_archive.json")
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeHistory)
	q.Date = "2026-03-06"

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHistory, resp.Type)
	assert.Equal(t, "openmeteo", resp.Provider)

	// fixture 有 5 天歷史資料
	require.Len(t, resp.Daily, 5)

	first := resp.Daily[0]
	assert.InDelta(t, 18.0, first.TempMax, 0.01)
	assert.InDelta(t, 14.6, first.TempMin, 0.01)
	assert.Equal(t, 51, first.WeatherCode) // 毛毛雨

	require.NotNil(t, first.Precipitation)
	assert.InDelta(t, 2.7, *first.Precipitation, 0.01)
}

func TestOpenMeteo_FetchHistory_RequestURL(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("openmeteo_archive.json")}, nil
		},
	}

	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeHistory)
	q.Date = "2026-03-06"

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", client)
	require.NoError(t, err)

	assert.Contains(t, capturedURL, "archive-api.open-meteo.com")
	assert.Contains(t, capturedURL, "start_date=2026-03-06")
	assert.Contains(t, capturedURL, "end_date=2026-03-06")
}

func TestOpenMeteo_FetchHistory_NetworkError(t *testing.T) {
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeHistory)

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo history fetch failed")
}

func TestOpenMeteo_FetchHistory_BadJSON(t *testing.T) {
	q := *openMeteoQuery
	q.Type = string(model.WeatherTypeHistory)

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, "", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo history parse failed")
}

// --- WMODescription ---

func TestWMODescription(t *testing.T) {
	cases := []struct {
		code     int
		expected string
	}{
		{0, "晴天"},
		{3, "陰天"},
		{61, "小雨"},
		{95, "雷雨"},
		{999, "未知天氣"},
	}
	for _, c := range cases {
		t.Run(c.expected, func(t *testing.T) {
			assert.Equal(t, c.expected, WMODescription(c.code))
		})
	}
}
