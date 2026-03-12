package adapter

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"proxy_golang/pkg/model"
)

const weatherAPIBaseURL = "https://api.weatherapi.com/v1"

// WeatherAPI adapter
type WeatherAPI struct{}

// ProviderID returns the unique identifier for the WeatherAPI provider.
func (WeatherAPI) ProviderID() string { return "weatherapi" }

// Name returns the display name for the WeatherAPI provider.
func (WeatherAPI) Name() string { return "WeatherAPI" }

// Description returns a brief description of the WeatherAPI provider.
func (WeatherAPI) Description() string { return "備用來源，支援預報與 7 天歷史" }

// APIKeyEnvVar returns the environment variable name for the WeatherAPI key.
func (WeatherAPI) APIKeyEnvVar() string { return "WEATHERAPI_KEY" }

// RequiresKey returns true because WeatherAPI requires an API key.
func (WeatherAPI) RequiresKey() bool { return true }

// Fetch retrieves weather data from WeatherAPI based on the weather type.
func (WeatherAPI) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	days := query.Days
	if days <= 0 {
		days = 7
	}

	q := url.Values{}
	q.Set("key", apiKey)
	q.Set("q", fmt.Sprintf("%f,%f", query.Lat, query.Lon))
	q.Set("days", fmt.Sprintf("%d", days))
	q.Set("aqi", "no")
	q.Set("alerts", "no")

	endpoint := "forecast.json"
	if weatherType == model.WeatherTypeHistory {
		endpoint = "history.json"
		q.Set("dt", query.Date)
	}

	rawURL := fmt.Sprintf("%s/%s?%s", weatherAPIBaseURL, endpoint, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("WeatherAPI fetch failed: %w", err)
	}

	var raw weatherAPIForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("WeatherAPI parse failed: %w", err)
	}

	loc := model.Location{
		Name: raw.Location.Name,
		Lat:  raw.Location.Lat,
		Lon:  raw.Location.Lon,
	}

	result := &model.WeatherResponse{
		Provider:  "weatherapi",
		Type:      weatherType,
		Location:  loc,
		UpdatedAt: time.Now(),
	}

	switch weatherType {
	case model.WeatherTypeCurrent:
		result.Current = parseWeatherAPICurrent(raw)
	case model.WeatherTypeHourly:
		result.Hourly = parseWeatherAPIHourly(raw)
	case model.WeatherTypeDaily, model.WeatherTypeHistory:
		result.Daily = parseWeatherAPIDaily(raw)
	}

	return result, nil
}

// --- Raw response structs ---

type weatherAPIConditionFull struct {
	Text string `json:"text"`
	Code int    `json:"code"`
}

type weatherAPILocation struct {
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lon  float64 `json:"lon"`
}

type weatherAPICurrent struct {
	LastUpdated string                  `json:"last_updated"`
	TempC       float64                 `json:"temp_c"`
	FeelslikeC  float64                 `json:"feelslike_c"`
	Humidity    int                     `json:"humidity"`
	WindKph     float64                 `json:"wind_kph"`
	WindDegree  int                     `json:"wind_degree"`
	PressureMb  float64                 `json:"pressure_mb"`
	VisKm       float64                 `json:"vis_km"`
	PrecipMm    float64                 `json:"precip_mm"`
	Condition   weatherAPIConditionFull `json:"condition"`
}

type weatherAPIDayInfo struct {
	MaxtempC          float64                 `json:"maxtemp_c"`
	MintempC          float64                 `json:"mintemp_c"`
	DailyChanceOfRain int                     `json:"daily_chance_of_rain"`
	TotalprecipMm     float64                 `json:"totalprecip_mm"`
	MaxwindKph        float64                 `json:"maxwind_kph"`
	AvghumidityInt    int                     `json:"avghumidity"`
	Uv                float64                 `json:"uv"`
	Condition         weatherAPIConditionFull `json:"condition"`
}

type weatherAPIHourInfo struct {
	Time         string                  `json:"time"`
	TempC        float64                 `json:"temp_c"`
	FeelslikeC   float64                 `json:"feelslike_c"`
	Humidity     int                     `json:"humidity"`
	WindKph      float64                 `json:"wind_kph"`
	WindDegree   int                     `json:"wind_degree"`
	ChanceOfRain int                     `json:"chance_of_rain"`
	PrecipMm     float64                 `json:"precip_mm"`
	Condition    weatherAPIConditionFull `json:"condition"`
}

type weatherAPIForecastDay struct {
	Date string               `json:"date"`
	Day  weatherAPIDayInfo    `json:"day"`
	Hour []weatherAPIHourInfo `json:"hour"`
}

type weatherAPIForecast struct {
	Forecastday []weatherAPIForecastDay `json:"forecastday"`
}

type weatherAPIForecastResponse struct {
	Location weatherAPILocation `json:"location"`
	Current  weatherAPICurrent  `json:"current"`
	Forecast weatherAPIForecast `json:"forecast"`
}

func parseWeatherAPICurrent(raw weatherAPIForecastResponse) *model.CurrentWeather {
	c := raw.Current
	apparent := c.FeelslikeC
	return &model.CurrentWeather{
		Temperature:         c.TempC,
		ApparentTemperature: &apparent,
		Humidity:            c.Humidity,
		WindSpeed:           c.WindKph,
		WindDirection:       &c.WindDegree,
		Pressure:            &c.PressureMb,
		Visibility:          &c.VisKm,
		Precipitation:       &c.PrecipMm,
		WeatherCode:         weatherAPIConditionToWMO(c.Condition.Code),
		Description:         c.Condition.Text,
	}
}

func parseWeatherAPIHourly(raw weatherAPIForecastResponse) []model.HourlyWeather {
	var hourly []model.HourlyWeather
	for _, day := range raw.Forecast.Forecastday {
		for _, h := range day.Hour {
			t, err := time.ParseInLocation("2006-01-02 15:04", h.Time, time.FixedZone("CST", 8*3600))
			if err != nil {
				continue
			}
			apparent := h.FeelslikeC
			precip := h.PrecipMm
			precipProb := h.ChanceOfRain
			hourly = append(hourly, model.HourlyWeather{
				Time:                t,
				Temperature:         h.TempC,
				ApparentTemperature: &apparent,
				Humidity:            h.Humidity,
				WindSpeed:           h.WindKph,
				WindDirection:       &h.WindDegree,
				Precipitation:       &precip,
				PrecipProb:          &precipProb,
				WeatherCode:         weatherAPIConditionToWMO(h.Condition.Code),
				Description:         h.Condition.Text,
			})
		}
	}
	return hourly
}

func parseWeatherAPIDaily(raw weatherAPIForecastResponse) []model.DailyWeather {
	var daily []model.DailyWeather
	for _, day := range raw.Forecast.Forecastday {
		t, err := time.Parse("2006-01-02", day.Date)
		if err != nil {
			continue
		}
		d := day.Day
		humidity := d.AvghumidityInt
		windSpeed := d.MaxwindKph
		precip := d.TotalprecipMm
		precipProb := d.DailyChanceOfRain
		uv := d.Uv
		daily = append(daily, model.DailyWeather{
			Date:          t,
			TempMax:       d.MaxtempC,
			TempMin:       d.MintempC,
			Humidity:      &humidity,
			WindSpeed:     &windSpeed,
			Precipitation: &precip,
			PrecipProb:    &precipProb,
			UV:            &uv,
			WeatherCode:   weatherAPIConditionToWMO(d.Condition.Code),
			Description:   d.Condition.Text,
		})
	}
	return daily
}

// weatherAPIConditionToWMO 近似映射 WeatherAPI condition code 到 WMO code
func weatherAPIConditionToWMO(code int) int {
	mapping := map[int]int{
		1000: 0, 1003: 2, 1006: 3, 1009: 3,
		1030: 45, 1063: 80, 1066: 85, 1069: 80,
		1072: 56, 1087: 95, 1114: 75, 1117: 75,
		1135: 45, 1147: 48, 1150: 51, 1153: 51,
		1168: 56, 1171: 57, 1180: 61, 1183: 61,
		1186: 63, 1189: 63, 1192: 65, 1195: 65,
		1198: 66, 1201: 67, 1204: 77, 1207: 77,
		1210: 71, 1213: 71, 1216: 73, 1219: 73,
		1222: 75, 1225: 75, 1237: 77, 1240: 80,
		1243: 81, 1246: 82, 1249: 77, 1252: 77,
		1255: 85, 1258: 86, 1261: 77, 1264: 77,
		1273: 95, 1276: 95, 1279: 96, 1282: 99,
	}
	if wmo, ok := mapping[code]; ok {
		return wmo
	}
	return 3
}
