package adapter

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

const owmForecastFixture = `{
  "list": [
    {
      "dt": 1718434800,
      "main": {"temp": 29.5, "feels_like": 33.0, "temp_min": 28.0, "temp_max": 30.0, "pressure": 1008, "humidity": 70},
      "weather": [{"id": 801, "main": "Clouds", "description": "few clouds"}],
      "wind": {"speed": 3.5, "deg": 180},
      "visibility": 10000,
      "pop": 0.2,
      "rain": {"3h": 0.4},
      "dt_txt": "2024-06-15 09:00:00"
    },
    {
      "dt": 1718467200,
      "main": {"temp": 31.0, "feels_like": 35.0, "temp_min": 29.0, "temp_max": 32.0, "pressure": 1006, "humidity": 65},
      "weather": [{"id": 500, "main": "Rain", "description": "light rain"}],
      "wind": {"speed": 4.2, "deg": 200},
      "visibility": 9000,
      "pop": 0.6,
      "rain": {"3h": 1.2},
      "dt_txt": "2024-06-15 18:00:00"
    }
  ],
  "city": {
    "sunrise": 1718400000,
    "sunset": 1718450400,
    "coord": {"lat": 25.03, "lon": 121.56},
    "name": "Taipei"
  }
}`

func TestOpenWeatherMap_ProviderMetadata(t *testing.T) {
	a := OpenWeatherMap{}
	assert.Equal(t, "openweathermap", a.ProviderID())
	assert.NotEmpty(t, a.Name())
	assert.NotEmpty(t, a.Description())
	assert.Equal(t, "OPENWEATHERMAP_KEY", a.APIKeyEnvVar())
	assert.True(t, a.RequiresKey())
}

func TestOpenWeatherMap_FetchCurrent(t *testing.T) {
	client := &mockUpstreamClient{doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
		return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{
			"dt":1718434800,
			"main":{"temp":29.5,"feels_like":33.0,"temp_min":28.0,"temp_max":30.0,"pressure":1008,"humidity":70},
			"wind":{"speed":3.5,"deg":180},
			"weather":[{"id":801,"main":"Clouds","description":"few clouds"}],
			"visibility":10000,
			"name":"Taipei",
			"coord":{"lat":25.03,"lon":121.56}
		}`)}, nil
	}}
	resp, err := OpenWeatherMap{}.Fetch(context.Background(), &model.WeatherQuery{Provider: "openweathermap", Lat: 25.03, Lon: 121.56}, model.WeatherTypeCurrent, "key", client)
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeCurrent, resp.Type)
}

func TestOpenWeatherMap_FetchHourlyAndDaily(t *testing.T) {
	client := &mockUpstreamClient{doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
		return &model.UpstreamResponse{StatusCode: 200, Body: []byte(owmForecastFixture)}, nil
	}}
	query := &model.WeatherQuery{Provider: "openweathermap", Lat: 25.03, Lon: 121.56}

	hourly, err := OpenWeatherMap{}.Fetch(context.Background(), query, model.WeatherTypeHourly, "key", client)
	require.NoError(t, err)
	require.NotEmpty(t, hourly.Hourly)

	daily, err := OpenWeatherMap{}.Fetch(context.Background(), query, model.WeatherTypeDaily, "key", client)
	require.NoError(t, err)
	require.NotEmpty(t, daily.Daily)
	assert.Equal(t, "Taipei", daily.Location.Name)
}

func TestOpenWeatherMap_HelperFunctions(t *testing.T) {
	q := owmBaseQuery(&model.WeatherQuery{Lat: 25.03, Lon: 121.56}, "key")
	assert.Equal(t, "key", q.Get("appid"))
	assert.Equal(t, "metric", q.Get("units"))
	assert.Equal(t, 3, owmConditionToWMO(nil))
}

func TestOWMConditionCodeToWMO(t *testing.T) {
	tests := []struct {
		code int
		want int
	}{
		{800, 0}, {801, 1}, {802, 2}, {803, 3}, {804, 3},
		{301, 51}, {500, 61}, {501, 63}, {503, 65}, {511, 66},
		{521, 80}, {601, 71}, {611, 77}, {621, 85}, {701, 45},
		{211, 95}, {9999, 3},
	}
	for _, tc := range tests {
		assert.Equal(t, tc.want, owmConditionCodeToWMO(tc.code))
	}
}

func TestOpenWeatherMap_FetchUnsupportedAndErrors(t *testing.T) {
	query := &model.WeatherQuery{Provider: "openweathermap", Lat: 25.03, Lon: 121.56}
	_, err := OpenWeatherMap{}.Fetch(context.Background(), query, model.WeatherTypeHistory, "key", &mockUpstreamClient{})
	require.Error(t, err)

	erroringClient := &mockUpstreamClient{doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
		return nil, assert.AnError
	}}
	_, err = fetchOWMForecast(context.Background(), query, "key", erroringClient)
	require.Error(t, err)

	badJSONClient := &mockUpstreamClient{doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
		return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{bad json}`)}, nil
	}}
	_, err = fetchOWMForecast(context.Background(), query, "key", badJSONClient)
	require.Error(t, err)
}
