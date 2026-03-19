package adapter

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/url"
	"sort"
	"time"

	"proxy_golang/pkg/model"
)

const owmBaseURL = "https://api.openweathermap.org"

// OpenWeatherMap adapter
type OpenWeatherMap struct{}

// Fetch retrieves weather data from OpenWeatherMap based on the weather type.
func (OpenWeatherMap) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	switch weatherType {
	case model.WeatherTypeCurrent:
		return fetchOWMCurrent(ctx, query, apiKey, client)
	case model.WeatherTypeHourly:
		return fetchOWMHourly(ctx, query, apiKey, client)
	case model.WeatherTypeDaily:
		return fetchOWMDaily(ctx, query, apiKey, client)
	default:
		return nil, fmt.Errorf("OpenWeatherMap does not support type: %s", weatherType)
	}
}

// --- Raw response structs ---

type owmWeatherCondition struct {
	ID   int    `json:"id"`
	Main string `json:"main"`
	Desc string `json:"description"`
}

type owmCurrentResponse struct {
	Dt   int64 `json:"dt"`
	Main struct {
		Temp      float64 `json:"temp"`
		FeelsLike float64 `json:"feels_like"`
		TempMin   float64 `json:"temp_min"`
		TempMax   float64 `json:"temp_max"`
		Pressure  float64 `json:"pressure"`
		Humidity  int     `json:"humidity"`
	} `json:"main"`
	Wind struct {
		Speed float64 `json:"speed"`
		Deg   int     `json:"deg"`
	} `json:"wind"`
	Weather []owmWeatherCondition `json:"weather"`
	Clouds  *struct{ All int }    `json:"clouds,omitempty"`
	Rain    *struct {
		OneH float64 `json:"1h"`
	} `json:"rain,omitempty"`
	Snow *struct {
		OneH float64 `json:"1h"`
	} `json:"snow,omitempty"`
	Visibility *int   `json:"visibility,omitempty"`
	Name       string `json:"name"`
	Coord      struct {
		Lat float64 `json:"lat"`
		Lon float64 `json:"lon"`
	} `json:"coord"`
}

type owmForecastItem struct {
	Dt   int64 `json:"dt"`
	Main struct {
		Temp      float64 `json:"temp"`
		FeelsLike float64 `json:"feels_like"`
		TempMin   float64 `json:"temp_min"`
		TempMax   float64 `json:"temp_max"`
		Pressure  float64 `json:"pressure"`
		Humidity  int     `json:"humidity"`
	} `json:"main"`
	Weather []owmWeatherCondition `json:"weather"`
	Wind    struct {
		Speed float64 `json:"speed"`
		Deg   int     `json:"deg"`
	} `json:"wind"`
	Visibility *int    `json:"visibility,omitempty"`
	Pop        float64 `json:"pop"`
	Rain       *struct {
		ThreeH float64 `json:"3h"`
	} `json:"rain,omitempty"`
	Snow *struct {
		ThreeH float64 `json:"3h"`
	} `json:"snow,omitempty"`
	DtTxt string `json:"dt_txt"`
}

type owmForecastResponse struct {
	List []owmForecastItem `json:"list"`
	City struct {
		Sunrise int64 `json:"sunrise"`
		Sunset  int64 `json:"sunset"`
		Coord   struct {
			Lat float64 `json:"lat"`
			Lon float64 `json:"lon"`
		} `json:"coord"`
		Name string `json:"name"`
	} `json:"city"`
}

// --- Fetch functions ---

func fetchOWMCurrent(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	q := owmBaseQuery(query, apiKey)
	rawURL := fmt.Sprintf("%s/data/2.5/weather?%s", owmBaseURL, q.Encode())

	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("OpenWeatherMap current fetch failed: %w", err)
	}

	var raw owmCurrentResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("OpenWeatherMap current parse failed: %w", err)
	}

	wmoCode := owmConditionToWMO(raw.Weather)
	apparent := raw.Main.FeelsLike
	pressure := raw.Main.Pressure
	windDir := raw.Wind.Deg

	var precip float64
	if raw.Rain != nil {
		precip += raw.Rain.OneH
	}
	if raw.Snow != nil {
		precip += raw.Snow.OneH
	}

	var visibility *float64
	if raw.Visibility != nil {
		v := float64(*raw.Visibility) / 1000 // m → km
		visibility = &v
	}

	return &model.WeatherResponse{
		Provider:  "openweathermap",
		Type:      model.WeatherTypeCurrent,
		UpdatedAt: time.Unix(raw.Dt, 0),
		Location: model.Location{
			Name: raw.Name,
			Lat:  raw.Coord.Lat,
			Lon:  raw.Coord.Lon,
		},
		Current: &model.CurrentWeather{
			Temperature:         raw.Main.Temp,
			ApparentTemperature: &apparent,
			Humidity:            raw.Main.Humidity,
			WindSpeed:           raw.Wind.Speed * 3.6, // m/s → km/h
			WindDirection:       &windDir,
			Pressure:            &pressure,
			Visibility:          visibility,
			Precipitation:       &precip,
			WeatherCode:         wmoCode,
			Description:         WMODescription(wmoCode),
		},
	}, nil
}

func fetchOWMHourly(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	forecast, err := fetchOWMForecast(ctx, query, apiKey, client)
	if err != nil {
		return nil, err
	}

	hourly := make([]model.HourlyWeather, 0, len(forecast.List))
	for _, item := range forecast.List {
		t := time.Unix(item.Dt, 0)
		wmoCode := owmConditionToWMO(item.Weather)
		apparent := item.Main.FeelsLike
		windDir := item.Wind.Deg
		precipProb := int(math.Round(item.Pop * 100))

		var precip float64
		if item.Rain != nil {
			precip += item.Rain.ThreeH
		}
		if item.Snow != nil {
			precip += item.Snow.ThreeH
		}

		hourly = append(hourly, model.HourlyWeather{
			Time:                t,
			Temperature:         item.Main.Temp,
			ApparentTemperature: &apparent,
			Humidity:            item.Main.Humidity,
			WindSpeed:           item.Wind.Speed * 3.6,
			WindDirection:       &windDir,
			Precipitation:       &precip,
			PrecipProb:          &precipProb,
			WeatherCode:         wmoCode,
			Description:         WMODescription(wmoCode),
		})
	}

	return &model.WeatherResponse{
		Provider:  "openweathermap",
		Type:      model.WeatherTypeHourly,
		UpdatedAt: time.Now(),
		Location: model.Location{
			Name: forecast.City.Name,
			Lat:  forecast.City.Coord.Lat,
			Lon:  forecast.City.Coord.Lon,
		},
		Hourly: hourly,
	}, nil
}

func fetchOWMDaily(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	forecast, err := fetchOWMForecast(ctx, query, apiKey, client)
	if err != nil {
		return nil, err
	}

	// 以日期分組聚合 3h forecast → daily
	type dayAgg struct {
		temps      []float64
		codes      []int
		pops       []float64
		precipSum  float64
		windSpeeds []float64
	}
	dailyMap := make(map[string]*dayAgg)
	var dateOrder []string

	for _, item := range forecast.List {
		dateStr := time.Unix(item.Dt, 0).Format("2006-01-02")
		if _, ok := dailyMap[dateStr]; !ok {
			dailyMap[dateStr] = &dayAgg{}
			dateOrder = append(dateOrder, dateStr)
		}
		agg := dailyMap[dateStr]
		agg.temps = append(agg.temps, item.Main.TempMax, item.Main.TempMin)
		if len(item.Weather) > 0 {
			agg.codes = append(agg.codes, item.Weather[0].ID)
		}
		agg.pops = append(agg.pops, item.Pop)
		if item.Rain != nil {
			agg.precipSum += item.Rain.ThreeH
		}
		if item.Snow != nil {
			agg.precipSum += item.Snow.ThreeH
		}
		agg.windSpeeds = append(agg.windSpeeds, item.Wind.Speed)
	}

	sort.Strings(dateOrder)
	daily := make([]model.DailyWeather, 0, len(dateOrder))

	sunrise := time.Unix(forecast.City.Sunrise, 0).Format(time.RFC3339)
	sunset := time.Unix(forecast.City.Sunset, 0).Format(time.RFC3339)

	for _, dateStr := range dateOrder {
		agg := dailyMap[dateStr]
		t, _ := time.Parse("2006-01-02", dateStr)

		tMax, tMin := agg.temps[0], agg.temps[0]
		for _, v := range agg.temps {
			if v > tMax {
				tMax = v
			}
			if v < tMin {
				tMin = v
			}
		}

		pMax := 0.0
		for _, v := range agg.pops {
			if v > pMax {
				pMax = v
			}
		}
		precipProb := int(math.Round(pMax * 100))

		wMax := 0.0
		for _, v := range agg.windSpeeds {
			if v > wMax {
				wMax = v
			}
		}
		windSpeed := wMax * 3.6

		dominantCode := 0
		if len(agg.codes) > 0 {
			dominantCode = agg.codes[len(agg.codes)/2]
		}
		wmoCode := owmConditionCodeToWMO(dominantCode)
		precipSum := math.Round(agg.precipSum*10) / 10

		daily = append(daily, model.DailyWeather{
			Date:          t,
			TempMax:       math.Round(tMax*10) / 10,
			TempMin:       math.Round(tMin*10) / 10,
			Precipitation: &precipSum,
			PrecipProb:    &precipProb,
			WindSpeed:     &windSpeed,
			WeatherCode:   wmoCode,
			Description:   WMODescription(wmoCode),
			Sunrise:       &sunrise,
			Sunset:        &sunset,
		})
	}

	return &model.WeatherResponse{
		Provider:  "openweathermap",
		Type:      model.WeatherTypeDaily,
		UpdatedAt: time.Now(),
		Location: model.Location{
			Name: forecast.City.Name,
			Lat:  forecast.City.Coord.Lat,
			Lon:  forecast.City.Coord.Lon,
		},
		Daily: daily,
	}, nil
}

// --- helpers ---

func owmBaseQuery(query *model.WeatherQuery, apiKey string) url.Values {
	q := url.Values{}
	q.Set("appid", apiKey)
	q.Set("lat", fmt.Sprintf("%f", query.Lat))
	q.Set("lon", fmt.Sprintf("%f", query.Lon))
	q.Set("units", "metric")
	return q
}

func fetchOWMForecast(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*owmForecastResponse, error) {
	q := owmBaseQuery(query, apiKey)
	rawURL := fmt.Sprintf("%s/data/2.5/forecast?%s", owmBaseURL, q.Encode())

	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("OpenWeatherMap forecast fetch failed: %w", err)
	}

	var raw owmForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("OpenWeatherMap forecast parse failed: %w", err)
	}
	return &raw, nil
}

func owmConditionToWMO(conditions []owmWeatherCondition) int {
	if len(conditions) == 0 {
		return 3
	}
	return owmConditionCodeToWMO(conditions[0].ID)
}

// owmConditionCodeToWMO maps OpenWeatherMap condition codes to WMO codes.
// Reference: https://openweathermap.org/weather-conditions
func owmConditionCodeToWMO(code int) int {
	switch {
	case code == 800:
		return 0 // Clear sky
	case code == 801:
		return 1 // Few clouds
	case code == 802:
		return 2 // Scattered clouds
	case code == 803 || code == 804:
		return 3 // Overcast
	case code >= 300 && code < 400:
		return 51 // Drizzle
	case code == 500:
		return 61 // Light rain
	case code == 501:
		return 63 // Moderate rain
	case code >= 502 && code < 510:
		return 65 // Heavy rain
	case code == 511:
		return 66 // Freezing rain
	case code >= 520 && code < 600:
		return 80 // Rain shower
	case code >= 600 && code < 610:
		return 71 // Snow
	case code >= 610 && code < 620:
		return 77 // Sleet
	case code >= 620 && code < 700:
		return 85 // Snow shower
	case code >= 700 && code < 800:
		return 45 // Fog / mist / haze
	case code >= 200 && code < 300:
		return 95 // Thunderstorm
	default:
		return 3
	}
}
