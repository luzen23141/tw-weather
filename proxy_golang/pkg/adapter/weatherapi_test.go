package adapter

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

var weatherAPIQuery = &model.WeatherQuery{
	Provider: "weatherapi",
	Lat:      25.048,
	Lon:      121.517,
}

func TestWeatherAPI_ProviderID(t *testing.T) {
	assert.Equal(t, "weatherapi", WeatherAPI{}.ProviderID())
}

// --- Current ---

func TestWeatherAPI_FetchCurrent_RealFixture(t *testing.T) {
	// 使用真實 WeatherAPI forecast.json 回傳結構的 fixture
	client := fixtureClient("weatherapi_forecast.json")
	q := *weatherAPIQuery

	resp, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "weatherapi", resp.Provider)
	assert.Equal(t, model.WeatherTypeCurrent, resp.Type)

	// 驗證 location
	assert.Equal(t, "Taipei", resp.Location.Name)
	assert.InDelta(t, 25.05, resp.Location.Lat, 0.01)
	assert.InDelta(t, 121.517, resp.Location.Lon, 0.01)

	require.NotNil(t, resp.Current)
	assert.InDelta(t, 18.1, resp.Current.Temperature, 0.01)
	assert.Equal(t, 56, resp.Current.Humidity)
	assert.InDelta(t, 15.5, resp.Current.WindSpeed, 0.01)

	require.NotNil(t, resp.Current.WindDirection)
	assert.Equal(t, 77, *resp.Current.WindDirection)

	require.NotNil(t, resp.Current.Pressure)
	assert.InDelta(t, 1019.0, *resp.Current.Pressure, 0.01)

	require.NotNil(t, resp.Current.Visibility)
	assert.InDelta(t, 10.0, *resp.Current.Visibility, 0.01)

	// condition code 1003 → WMO 2
	assert.Equal(t, 2, resp.Current.WeatherCode)
	assert.Equal(t, "Partly Cloudy", resp.Current.Description)
}

func TestWeatherAPI_FetchCurrent_RequestURL(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("weatherapi_forecast.json")}, nil
		},
	}

	q := *weatherAPIQuery

	_, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "my-key", client)
	require.NoError(t, err)

	assert.Contains(t, capturedURL, "weatherapi.com")
	assert.Contains(t, capturedURL, "forecast.json")
	assert.Contains(t, capturedURL, "key=my-key")
	assert.Contains(t, capturedURL, "q=25")
}

func TestWeatherAPI_FetchCurrent_NetworkError(t *testing.T) {
	q := *weatherAPIQuery

	_, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "key", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "WeatherAPI fetch failed")
}

func TestWeatherAPI_FetchCurrent_BadJSON(t *testing.T) {
	q := *weatherAPIQuery

	_, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "key", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "WeatherAPI parse failed")
}

// --- Hourly ---

func TestWeatherAPI_FetchHourly_RealFixture(t *testing.T) {
	client := fixtureClient("weatherapi_forecast.json")
	q := *weatherAPIQuery

	resp, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHourly, resp.Type)

	// fixture 有 2+1=3 筆逐時資料（day1: 2 hours, day2: 1 hour）
	require.Len(t, resp.Hourly, 3)

	first := resp.Hourly[0]
	assert.InDelta(t, 13.1, first.Temperature, 0.01)
	assert.Equal(t, 81, first.Humidity)
	assert.InDelta(t, 10.1, first.WindSpeed, 0.01)
	assert.Equal(t, "Cloudy", first.Description)

	require.NotNil(t, first.ApparentTemperature)
	assert.InDelta(t, 12.3, *first.ApparentTemperature, 0.01)

	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 0, *first.PrecipProb)

	// 第二筆：chance_of_rain = 85
	second := resp.Hourly[1]
	require.NotNil(t, second.PrecipProb)
	assert.Equal(t, 85, *second.PrecipProb)
}

func TestWeatherAPI_FetchHourly_DefaultDays(t *testing.T) {
	// Days = 0 → 預設 7 天
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("weatherapi_forecast.json")}, nil
		},
	}

	q := *weatherAPIQuery

	q.Days = 0

	_, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.NoError(t, err)
	assert.Contains(t, capturedURL, "days=7")
}

// --- Daily ---

func TestWeatherAPI_FetchDaily_RealFixture(t *testing.T) {
	client := fixtureClient("weatherapi_forecast.json")
	q := *weatherAPIQuery

	resp, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeDaily, resp.Type)

	// fixture 有 2 天預報
	require.Len(t, resp.Daily, 2)

	first := resp.Daily[0]
	assert.InDelta(t, 19.1, first.TempMax, 0.01)
	assert.InDelta(t, 13.1, first.TempMin, 0.01)
	assert.Equal(t, "Cloudy", first.Description)

	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 0, *first.PrecipProb)

	require.NotNil(t, first.Precipitation)
	assert.InDelta(t, 0.07, *first.Precipitation, 0.001)

	require.NotNil(t, first.UV)
	assert.InDelta(t, 1.6, *first.UV, 0.01)

	// 第二天 chance_of_rain = 88
	second := resp.Daily[1]
	require.NotNil(t, second.PrecipProb)
	assert.Equal(t, 88, *second.PrecipProb)
}

// --- History ---

func TestWeatherAPI_FetchHistory_RealFixture(t *testing.T) {
	// 使用真實 WeatherAPI history.json 回傳結構的 fixture
	client := fixtureClient("weatherapi_history.json")
	q := *weatherAPIQuery

	q.Date = "2026-03-10"

	resp, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHistory, resp.Type)
	assert.Equal(t, "weatherapi", resp.Provider)

	require.Len(t, resp.Daily, 1)
	day := resp.Daily[0]
	assert.InDelta(t, 13.4, day.TempMax, 0.01)
	assert.InDelta(t, 12.4, day.TempMin, 0.01)

	require.NotNil(t, day.PrecipProb)
	assert.Equal(t, 100, *day.PrecipProb)

	require.NotNil(t, day.Precipitation)
	assert.InDelta(t, 10.6, *day.Precipitation, 0.01)
}

func TestWeatherAPI_FetchHistory_RequestURL(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("weatherapi_history.json")}, nil
		},
	}

	q := *weatherAPIQuery

	q.Date = "2026-03-10"

	_, err := WeatherAPI{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "key", client)
	require.NoError(t, err)

	assert.Contains(t, capturedURL, "history.json")
	assert.Contains(t, capturedURL, "dt=2026-03-10")
}

// --- weatherAPIConditionToWMO ---

func TestWeatherAPIConditionToWMO(t *testing.T) {
	cases := []struct {
		code     int
		expected int
	}{
		{1000, 0},  // Sunny → Clear sky
		{1003, 2},  // Partly cloudy
		{1006, 3},  // Cloudy
		{1063, 80}, // Patchy rain nearby → Light rain showers
		{1087, 95}, // Thundery outbreaks
		{9999, 3},  // 未知 → 預設 3
	}
	for _, c := range cases {
		t.Run("", func(t *testing.T) {
			assert.Equal(t, c.expected, weatherAPIConditionToWMO(c.code))
		})
	}
}
