package fixtures

import (
	"fmt"
	"path/filepath"
	"time"

	"proxy_golang/pkg/model"
)

const (
	RawFixturesDir = "test/raw_fixtures"
	ManifestName   = "manifest.json"
)

type Scenario struct {
	ID          string             `json:"id"`
	Provider    string             `json:"provider"`
	WeatherType model.WeatherType  `json:"weatherType"`
	Description string             `json:"description"`
	Query       model.WeatherQuery `json:"query"`
	Success     bool               `json:"success"`
	Error       string             `json:"error,omitempty"`
	RawURL      string             `json:"rawUrl,omitempty"`
	StatusCode  int                `json:"statusCode"`
	BodyFile    string             `json:"bodyFile"`
	FetchedAt   time.Time          `json:"fetchedAt"`
}

type Manifest struct {
	Version   int        `json:"version"`
	CreatedAt time.Time  `json:"createdAt"`
	Scenarios []Scenario `json:"scenarios"`
}

func BodyFileName(id string) string {
	return fmt.Sprintf("%s.json", id)
}

func BodyFilePath(root, id string) string {
	return filepath.Join(root, BodyFileName(id))
}

func DefaultScenarios() []Scenario {
	return []Scenario{
		{
			ID:          "cwa_current_station_C0TB40",
			Provider:    "cwa",
			WeatherType: model.WeatherTypeCurrent,
			Description: "CWA current by station id",
			Query: model.WeatherQuery{
				Provider:   "cwa",
				LocationID: "C0TB40",
			},
		},
		{
			ID:          "cwa_hourly_location_F-D0047-061",
			Provider:    "cwa",
			WeatherType: model.WeatherTypeHourly,
			Description: "CWA hourly by 3-day dataset id",
			Query: model.WeatherQuery{
				Provider:   "cwa",
				LocationID: "F-D0047-061",
			},
		},
		{
			ID:          "cwa_daily_location_F-D0047-063",
			Provider:    "cwa",
			WeatherType: model.WeatherTypeDaily,
			Description: "CWA daily by weekly dataset id",
			Query: model.WeatherQuery{
				Provider:   "cwa",
				LocationID: "F-D0047-063",
			},
		},
		{
			ID:          "openmeteo_current_taipei",
			Provider:    "openmeteo",
			WeatherType: model.WeatherTypeCurrent,
			Description: "Open-Meteo current Taipei",
			Query: model.WeatherQuery{
				Provider: "openmeteo",
				Lat:      25.0330,
				Lon:      121.5654,
			},
		},
		{
			ID:          "openmeteo_hourly_taipei",
			Provider:    "openmeteo",
			WeatherType: model.WeatherTypeHourly,
			Description: "Open-Meteo hourly Taipei",
			Query: model.WeatherQuery{
				Provider: "openmeteo",
				Lat:      25.0330,
				Lon:      121.5654,
				Days:     3,
			},
		},
		{
			ID:          "openmeteo_daily_taipei",
			Provider:    "openmeteo",
			WeatherType: model.WeatherTypeDaily,
			Description: "Open-Meteo daily Taipei",
			Query: model.WeatherQuery{
				Provider: "openmeteo",
				Lat:      25.0330,
				Lon:      121.5654,
				Days:     7,
			},
		},
		{
			ID:          "openmeteo_history_taipei_2024-06-01",
			Provider:    "openmeteo",
			WeatherType: model.WeatherTypeHistory,
			Description: "Open-Meteo history Taipei",
			Query: model.WeatherQuery{
				Provider: "openmeteo",
				Lat:      25.0330,
				Lon:      121.5654,
				Date:     "2024-06-01",
			},
		},
		{
			ID:          "weatherapi_forecast_taipei",
			Provider:    "weatherapi",
			WeatherType: model.WeatherTypeCurrent,
			Description: "WeatherAPI forecast payload for current/hourly/daily",
			Query: model.WeatherQuery{
				Provider: "weatherapi",
				Lat:      25.0330,
				Lon:      121.5654,
				Days:     3,
			},
		},
		{
			ID:          "weatherapi_history_taipei_2024-06-01",
			Provider:    "weatherapi",
			WeatherType: model.WeatherTypeHistory,
			Description: "WeatherAPI history Taipei",
			Query: model.WeatherQuery{
				Provider: "weatherapi",
				Lat:      25.0330,
				Lon:      121.5654,
				Date:     "2024-06-01",
				Days:     1,
			},
		},
		{
			ID:          "openweathermap_current_taipei",
			Provider:    "openweathermap",
			WeatherType: model.WeatherTypeCurrent,
			Description: "OpenWeatherMap current Taipei",
			Query: model.WeatherQuery{
				Provider: "openweathermap",
				Lat:      25.0330,
				Lon:      121.5654,
			},
		},
		{
			ID:          "openweathermap_hourly_taipei",
			Provider:    "openweathermap",
			WeatherType: model.WeatherTypeHourly,
			Description: "OpenWeatherMap hourly Taipei",
			Query: model.WeatherQuery{
				Provider: "openweathermap",
				Lat:      25.0330,
				Lon:      121.5654,
			},
		},
		{
			ID:          "openweathermap_daily_taipei",
			Provider:    "openweathermap",
			WeatherType: model.WeatherTypeDaily,
			Description: "OpenWeatherMap daily Taipei",
			Query: model.WeatherQuery{
				Provider: "openweathermap",
				Lat:      25.0330,
				Lon:      121.5654,
			},
		},
	}
}
