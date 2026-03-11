package adapter

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"proxy_golang/pkg/model"
)

const (
	openMeteoForecastURL = "https://api.open-meteo.com/v1/forecast"
	openMeteoArchiveURL  = "https://archive-api.open-meteo.com/v1/archive"
)

// OpenMeteo adapter（無需 API Key）
type OpenMeteo struct{}

// ProviderID returns the unique identifier for the Open-Meteo provider.
func (OpenMeteo) ProviderID() string { return "openmeteo" }

// APIKeyEnvVar returns empty string because Open-Meteo does not require a key.
func (OpenMeteo) APIKeyEnvVar() string { return "" }

// RequiresKey returns false because Open-Meteo is a free API with no key needed.
func (OpenMeteo) RequiresKey() bool { return false }

// Fetch retrieves weather data from Open-Meteo based on the weather type.
func (OpenMeteo) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, _ string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	if weatherType == model.WeatherTypeHistory {
		return fetchOpenMeteoHistory(ctx, query, client)
	}
	return fetchOpenMeteoForecast(ctx, query, weatherType, client)
}

// --- Raw response structs ---

type openMeteoCurrent struct {
	Time                string  `json:"time"`
	Temperature2m       float64 `json:"temperature_2m"`
	ApparentTemperature float64 `json:"apparent_temperature"`
	RelativeHumidity2m  int     `json:"relative_humidity_2m"`
	WeatherCode         int     `json:"weather_code"`
	WindSpeed10m        float64 `json:"wind_speed_10m"`
	WindDirection10m    int     `json:"wind_direction_10m"`
	Precipitation       float64 `json:"precipitation"`
	PressureMsl         float64 `json:"pressure_msl"`
	Visibility          float64 `json:"visibility"`
	IsDay               int     `json:"is_day"`
}

type openMeteoHourly struct {
	Time                []string  `json:"time"`
	Temperature2m       []float64 `json:"temperature_2m"`
	ApparentTemperature []float64 `json:"apparent_temperature"`
	RelativeHumidity2m  []int     `json:"relative_humidity_2m"`
	WeatherCode         []int     `json:"weather_code"`
	Precipitation       []float64 `json:"precipitation"`
	PrecipitationProb   []int     `json:"precipitation_probability"`
	WindSpeed10m        []float64 `json:"wind_speed_10m"`
	WindDirection10m    []int     `json:"wind_direction_10m"`
}

type openMeteoDaily struct {
	Time                 []string  `json:"time"`
	WeatherCode          []int     `json:"weather_code"`
	Temperature2mMax     []float64 `json:"temperature_2m_max"`
	Temperature2mMin     []float64 `json:"temperature_2m_min"`
	PrecipitationSum     []float64 `json:"precipitation_sum"`
	PrecipitationProbMax []int     `json:"precipitation_probability_max"`
	WindSpeed10mMax      []float64 `json:"wind_speed_10m_max"`
	UvIndexMax           []float64 `json:"uv_index_max"`
}

type openMeteoForecastResponse struct {
	Latitude  float64          `json:"latitude"`
	Longitude float64          `json:"longitude"`
	Current   openMeteoCurrent `json:"current"`
	Hourly    openMeteoHourly  `json:"hourly"`
	Daily     openMeteoDaily   `json:"daily"`
}

// --- Fetch functions ---

func fetchOpenMeteoForecast(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, client model.UpstreamClient) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("latitude", fmt.Sprintf("%f", query.Lat))
	q.Set("longitude", fmt.Sprintf("%f", query.Lon))
	q.Set("timezone", "Asia/Taipei")

	switch weatherType {
	case model.WeatherTypeCurrent:
		q.Set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl,visibility,is_day")
	case model.WeatherTypeHourly:
		q.Set("hourly", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m")
		days := query.Days
		if days <= 0 {
			days = 7
		}
		q.Set("forecast_days", fmt.Sprintf("%d", days))
	case model.WeatherTypeDaily:
		q.Set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max")
		days := query.Days
		if days <= 0 {
			days = 7
		}
		q.Set("forecast_days", fmt.Sprintf("%d", days))
	}

	rawURL := fmt.Sprintf("%s?%s", openMeteoForecastURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("Open-Meteo fetch failed: %w", err)
	}

	var raw openMeteoForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("Open-Meteo parse failed: %w", err)
	}

	loc := model.Location{
		Name: fmt.Sprintf("%.4f,%.4f", raw.Latitude, raw.Longitude),
		Lat:  raw.Latitude,
		Lon:  raw.Longitude,
	}

	result := &model.WeatherResponse{
		Provider:  "openmeteo",
		Type:      weatherType,
		Location:  loc,
		UpdatedAt: time.Now(),
	}

	switch weatherType {
	case model.WeatherTypeCurrent:
		result.Current = parseOpenMeteoCurrent(raw)
	case model.WeatherTypeHourly:
		result.Hourly = parseOpenMeteoHourly(raw)
	case model.WeatherTypeDaily:
		result.Daily = parseOpenMeteoDaily(raw)
	}

	return result, nil
}

func fetchOpenMeteoHistory(ctx context.Context, query *model.WeatherQuery, client model.UpstreamClient) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("latitude", fmt.Sprintf("%f", query.Lat))
	q.Set("longitude", fmt.Sprintf("%f", query.Lon))
	q.Set("timezone", "Asia/Taipei")
	q.Set("start_date", query.Date)
	q.Set("end_date", query.Date)
	q.Set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max")

	rawURL := fmt.Sprintf("%s?%s", openMeteoArchiveURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("Open-Meteo history fetch failed: %w", err)
	}

	var raw openMeteoForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("Open-Meteo history parse failed: %w", err)
	}

	return &model.WeatherResponse{
		Provider:  "openmeteo",
		Type:      model.WeatherTypeHistory,
		Location:  model.Location{Lat: raw.Latitude, Lon: raw.Longitude},
		UpdatedAt: time.Now(),
		Daily:     parseOpenMeteoDaily(raw),
	}, nil
}

func parseOpenMeteoCurrent(raw openMeteoForecastResponse) *model.CurrentWeather {
	c := raw.Current
	apparent := c.ApparentTemperature
	pressure := c.PressureMsl
	visibility := c.Visibility / 1000 // m → km
	precip := c.Precipitation
	isDay := c.IsDay == 1

	return &model.CurrentWeather{
		Temperature:         c.Temperature2m,
		ApparentTemperature: &apparent,
		Humidity:            c.RelativeHumidity2m,
		WindSpeed:           c.WindSpeed10m,
		WindDirection:       &c.WindDirection10m,
		Pressure:            &pressure,
		Visibility:          &visibility,
		Precipitation:       &precip,
		WeatherCode:         c.WeatherCode,
		Description:         WMODescription(c.WeatherCode),
		IsDay:               &isDay,
	}
}

func parseOpenMeteoHourly(raw openMeteoForecastResponse) []model.HourlyWeather {
	h := raw.Hourly
	hourly := make([]model.HourlyWeather, 0, len(h.Time))

	loc := time.FixedZone("CST", 8*3600)
	for i, timeStr := range h.Time {
		t, err := time.ParseInLocation("2006-01-02T15:04", timeStr, loc)
		if err != nil {
			continue
		}

		var apparent *float64
		if i < len(h.ApparentTemperature) {
			v := h.ApparentTemperature[i]
			apparent = &v
		}
		var precip *float64
		if i < len(h.Precipitation) {
			v := h.Precipitation[i]
			precip = &v
		}
		var precipProb *int
		if i < len(h.PrecipitationProb) {
			v := h.PrecipitationProb[i]
			precipProb = &v
		}
		var windDir *int
		if i < len(h.WindDirection10m) {
			v := h.WindDirection10m[i]
			windDir = &v
		}

		code := 0
		if i < len(h.WeatherCode) {
			code = h.WeatherCode[i]
		}
		temp := 0.0
		if i < len(h.Temperature2m) {
			temp = h.Temperature2m[i]
		}
		humidity := 0
		if i < len(h.RelativeHumidity2m) {
			humidity = h.RelativeHumidity2m[i]
		}
		windSpeed := 0.0
		if i < len(h.WindSpeed10m) {
			windSpeed = h.WindSpeed10m[i]
		}

		hourly = append(hourly, model.HourlyWeather{
			Time:                t,
			Temperature:         temp,
			ApparentTemperature: apparent,
			Humidity:            humidity,
			WindSpeed:           windSpeed,
			WindDirection:       windDir,
			Precipitation:       precip,
			PrecipProb:          precipProb,
			WeatherCode:         code,
			Description:         WMODescription(code),
		})
	}
	return hourly
}

func parseOpenMeteoDaily(raw openMeteoForecastResponse) []model.DailyWeather {
	d := raw.Daily
	daily := make([]model.DailyWeather, 0, len(d.Time))

	for i, dateStr := range d.Time {
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}

		code := 0
		if i < len(d.WeatherCode) {
			code = d.WeatherCode[i]
		}
		maxTemp := 0.0
		if i < len(d.Temperature2mMax) {
			maxTemp = d.Temperature2mMax[i]
		}
		minTemp := 0.0
		if i < len(d.Temperature2mMin) {
			minTemp = d.Temperature2mMin[i]
		}

		var precip *float64
		if i < len(d.PrecipitationSum) {
			v := d.PrecipitationSum[i]
			precip = &v
		}
		var precipProb *int
		if i < len(d.PrecipitationProbMax) {
			v := d.PrecipitationProbMax[i]
			precipProb = &v
		}
		var windSpeed *float64
		if i < len(d.WindSpeed10mMax) {
			v := d.WindSpeed10mMax[i]
			windSpeed = &v
		}
		var uv *float64
		if i < len(d.UvIndexMax) {
			v := d.UvIndexMax[i]
			uv = &v
		}

		daily = append(daily, model.DailyWeather{
			Date:          t,
			TempMax:       maxTemp,
			TempMin:       minTemp,
			Precipitation: precip,
			PrecipProb:    precipProb,
			WindSpeed:     windSpeed,
			UV:            uv,
			WeatherCode:   code,
			Description:   WMODescription(code),
		})
	}
	return daily
}
