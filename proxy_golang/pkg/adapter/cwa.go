package adapter

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/rotisserie/eris"

	"proxy_golang/pkg/model"
	"proxy_golang/pkg/service"
)

const cwaBaseURL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"

// CWA adapter
type CWA struct{}

func (CWA) ProviderID() string { return "cwa" }

func (CWA) SupportedTypes() []model.WeatherType {
	return []model.WeatherType{model.WeatherTypeCurrent, model.WeatherTypeHourly, model.WeatherTypeDaily}
}

func (CWA) Fetch(ctx context.Context, query *model.WeatherQuery, apiKey string, client service.UpstreamClient) (*model.WeatherResponse, error) {
	switch model.WeatherType(query.Type) {
	case model.WeatherTypeCurrent:
		return fetchCWACurrent(ctx, query, apiKey, client)
	case model.WeatherTypeHourly:
		return fetchCWAHourly(ctx, query, apiKey, client)
	case model.WeatherTypeDaily:
		return fetchCWADaily(ctx, query, apiKey, client)
	default:
		return nil, eris.Errorf("CWA does not support type: %s", query.Type)
	}
}

// --- Raw response structs ---

type cwaObsResponse struct {
	Records struct {
		Station []struct {
			StationId   string `json:"StationId"`
			StationName string `json:"StationName"`
			GeoInfo     struct {
				Coordinates []struct {
					Lat float64 `json:"StationLatitude"`
					Lon float64 `json:"StationLongitude"`
				} `json:"Coordinates"`
			} `json:"GeoInfo"`
			ObsTime struct {
				DateTime string `json:"DateTime"`
			} `json:"ObsTime"`
			WeatherElement struct {
				AirTemperature        string `json:"AirTemperature"`
				RelativeHumidity      string `json:"RelativeHumidity"`
				WindSpeed             string `json:"WindSpeed"`
				WindDirection         string `json:"WindDirection"`
				AirPressure           string `json:"AirPressure"`
				VisibilityDescription string `json:"VisibilityDescription"`
				Weather               string `json:"Weather"`
				Now                   struct {
					Precipitation string `json:"Precipitation"`
				} `json:"Now"`
			} `json:"WeatherElement"`
		} `json:"Station"`
	} `json:"records"`
}

type cwaForecastResponse struct {
	Records struct {
		Locations []struct {
			Location []struct {
				LocationName   string `json:"LocationName"`
				Lat            string `json:"Lat"`
				Lon            string `json:"Lon"`
				WeatherElement []struct {
					ElementName string `json:"ElementName"`
					Time        []struct {
						StartTime    string `json:"StartTime"`
						EndTime      string `json:"EndTime"`
						ElementValue []struct {
							Value    string `json:"Value"`
							Measures string `json:"Measures"`
						} `json:"ElementValue"`
					} `json:"Time"`
				} `json:"WeatherElement"`
			} `json:"Location"`
		} `json:"Locations"`
	} `json:"records"`
}

// --- Fetch functions ---

func fetchCWACurrent(ctx context.Context, query *model.WeatherQuery, apiKey string, client service.UpstreamClient) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	if query.LocationID != "" {
		q.Set("StationId", query.LocationID)
	}

	rawURL := fmt.Sprintf("%s/O-A0001-001?%s", cwaBaseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, eris.Wrap(err, "CWA current fetch failed")
	}

	var raw cwaObsResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, eris.Wrap(err, "CWA current parse failed")
	}

	stations := raw.Records.Station
	if len(stations) == 0 {
		return nil, eris.New("CWA: no station data")
	}
	st := stations[0]
	we := st.WeatherElement

	temp := parseFloat(we.AirTemperature)
	humidity := parseInt(we.RelativeHumidity)
	windSpeed := parseFloat(we.WindSpeed)
	windDir := parseInt(we.WindDirection)
	pressure := parseFloat(we.AirPressure)
	visibility := parseVisibility(we.VisibilityDescription)
	precip := parseFloat(we.Now.Precipitation)
	weatherCode := CWAWeatherToWMO(we.Weather)

	updatedAt, _ := time.Parse("2006-01-02T15:04:05-07:00", st.ObsTime.DateTime)

	lat, lon := 0.0, 0.0
	if len(st.GeoInfo.Coordinates) > 0 {
		lat = st.GeoInfo.Coordinates[0].Lat
		lon = st.GeoInfo.Coordinates[0].Lon
	}

	return &model.WeatherResponse{
		Provider:  "cwa",
		Type:      model.WeatherTypeCurrent,
		UpdatedAt: updatedAt,
		Location: model.Location{
			ID:   st.StationId,
			Name: st.StationName,
			Lat:  lat,
			Lon:  lon,
		},
		Current: &model.CurrentWeather{
			Temperature:   temp,
			Humidity:      humidity,
			WindSpeed:     windSpeed,
			WindDirection: &windDir,
			Pressure:      &pressure,
			Visibility:    &visibility,
			Precipitation: &precip,
			WeatherCode:   weatherCode,
			Description:   we.Weather,
		},
	}, nil
}

func fetchCWAHourly(ctx context.Context, query *model.WeatherQuery, apiKey string, client service.UpstreamClient) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	if query.LocationID != "" {
		q.Set("locationId", query.LocationID)
	}

	rawURL := fmt.Sprintf("%s/F-D0047-089?%s", cwaBaseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, eris.Wrap(err, "CWA hourly fetch failed")
	}

	var raw cwaForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, eris.Wrap(err, "CWA hourly parse failed")
	}

	loc, elements := extractCWALocation(raw)
	if loc == nil {
		return nil, eris.New("CWA: no location data")
	}

	// 建立 element 索引
	elemMap := buildCWAElementMap(elements)

	timeSlots := extractCWATimeSlots(elemMap)
	hourly := make([]model.HourlyWeather, 0, len(timeSlots))
	for _, slot := range timeSlots {
		t, err := parseCWATime(slot)
		if err != nil {
			continue
		}
		temp := getCWAValue(elemMap, "溫度", slot)
		humidity := getCWAValue(elemMap, "相對濕度", slot)
		windSpeed := getCWAValue(elemMap, "風速", slot)
		windDir := getCWAValue(elemMap, "風向", slot)
		precipProb := getCWAValue(elemMap, "3小時降雨機率", slot)
		weather := getCWAStringValue(elemMap, "天氣現象", slot)

		windDirInt := int(windDir)
		precipProbInt := int(precipProb)
		weatherCode := CWAWeatherToWMO(weather)

		hourly = append(hourly, model.HourlyWeather{
			Time:          t,
			Temperature:   temp,
			Humidity:      int(humidity),
			WindSpeed:     windSpeed,
			WindDirection: &windDirInt,
			PrecipProb:    &precipProbInt,
			WeatherCode:   weatherCode,
			Description:   weather,
		})
	}

	lat, _ := strconv.ParseFloat(loc.Lat, 64)
	lon, _ := strconv.ParseFloat(loc.Lon, 64)

	return &model.WeatherResponse{
		Provider:  "cwa",
		Type:      model.WeatherTypeHourly,
		UpdatedAt: time.Now(),
		Location:  model.Location{Name: loc.LocationName, Lat: lat, Lon: lon},
		Hourly:    hourly,
	}, nil
}

func fetchCWADaily(ctx context.Context, query *model.WeatherQuery, apiKey string, client service.UpstreamClient) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	if query.LocationID != "" {
		q.Set("locationId", query.LocationID)
	}

	rawURL := fmt.Sprintf("%s/F-D0047-091?%s", cwaBaseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, eris.Wrap(err, "CWA daily fetch failed")
	}

	var raw cwaForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, eris.Wrap(err, "CWA daily parse failed")
	}

	loc, elements := extractCWALocation(raw)
	if loc == nil {
		return nil, eris.New("CWA: no location data")
	}

	elemMap := buildCWAElementMap(elements)
	timeSlots := extractCWATimeSlots(elemMap)

	daily := make([]model.DailyWeather, 0, len(timeSlots))
	for _, slot := range timeSlots {
		t, err := parseCWATime(slot)
		if err != nil {
			continue
		}
		maxTemp := getCWAValue(elemMap, "最高溫度", slot)
		minTemp := getCWAValue(elemMap, "最低溫度", slot)
		precipProb := getCWAValue(elemMap, "12小時降雨機率", slot)
		weather := getCWAStringValue(elemMap, "天氣現象", slot)

		precipProbInt := int(precipProb)
		weatherCode := CWAWeatherToWMO(weather)

		daily = append(daily, model.DailyWeather{
			Date:        t,
			TempMax:     maxTemp,
			TempMin:     minTemp,
			PrecipProb:  &precipProbInt,
			WeatherCode: weatherCode,
			Description: weather,
		})
	}

	lat, _ := strconv.ParseFloat(loc.Lat, 64)
	lon, _ := strconv.ParseFloat(loc.Lon, 64)

	return &model.WeatherResponse{
		Provider:  "cwa",
		Type:      model.WeatherTypeDaily,
		UpdatedAt: time.Now(),
		Location:  model.Location{Name: loc.LocationName, Lat: lat, Lon: lon},
		Daily:     daily,
	}, nil
}

// --- helpers ---

type cwaLocation struct {
	LocationName string
	Lat          string
	Lon          string
}

type cwaWeatherElement struct {
	ElementName string
	Times       map[string]struct {
		Value  string
		StrVal string
	}
}

func extractCWALocation(raw cwaForecastResponse) (*cwaLocation, []struct {
	ElementName string `json:"ElementName"`
	Time        []struct {
		StartTime    string `json:"StartTime"`
		EndTime      string `json:"EndTime"`
		ElementValue []struct {
			Value    string `json:"Value"`
			Measures string `json:"Measures"`
		} `json:"ElementValue"`
	} `json:"Time"`
}) {
	if len(raw.Records.Locations) == 0 {
		return nil, nil
	}
	locations := raw.Records.Locations[0].Location
	if len(locations) == 0 {
		return nil, nil
	}
	l := locations[0]
	return &cwaLocation{
		LocationName: l.LocationName,
		Lat:          l.Lat,
		Lon:          l.Lon,
	}, l.WeatherElement
}

func buildCWAElementMap(elements []struct {
	ElementName string `json:"ElementName"`
	Time        []struct {
		StartTime    string `json:"StartTime"`
		EndTime      string `json:"EndTime"`
		ElementValue []struct {
			Value    string `json:"Value"`
			Measures string `json:"Measures"`
		} `json:"ElementValue"`
	} `json:"Time"`
}) map[string]map[string]string {
	result := make(map[string]map[string]string)
	for _, el := range elements {
		timeMap := make(map[string]string)
		for _, t := range el.Time {
			if len(t.ElementValue) > 0 {
				timeMap[t.StartTime] = t.ElementValue[0].Value
			}
		}
		result[el.ElementName] = timeMap
	}
	return result
}

func extractCWATimeSlots(elemMap map[string]map[string]string) []string {
	seen := make(map[string]bool)
	var slots []string
	for _, timeMap := range elemMap {
		for t := range timeMap {
			if !seen[t] {
				seen[t] = true
				slots = append(slots, t)
			}
		}
		break // 只需第一個 element 的時間軸
	}
	return slots
}

func getCWAValue(elemMap map[string]map[string]string, name, timeSlot string) float64 {
	if timeMap, ok := elemMap[name]; ok {
		if val, ok := timeMap[timeSlot]; ok {
			return parseFloat(val)
		}
	}
	return 0
}

func getCWAStringValue(elemMap map[string]map[string]string, name, timeSlot string) string {
	if timeMap, ok := elemMap[name]; ok {
		if val, ok := timeMap[timeSlot]; ok {
			return val
		}
	}
	return ""
}

func parseCWATime(s string) (time.Time, error) {
	layouts := []string{
		"2006-01-02T15:04:05+08:00",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, eris.Errorf("cannot parse CWA time: %s", s)
}

var visibilityRe = regexp.MustCompile(`(\d+(?:\.\d+)?)`)

func parseVisibility(desc string) float64 {
	matches := visibilityRe.FindStringSubmatch(desc)
	if len(matches) >= 2 {
		v, _ := strconv.ParseFloat(matches[1], 64)
		return v
	}
	return 10.0 // 預設 10 km
}

func parseFloat(s string) float64 {
	s = strings.TrimSpace(s)
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func parseInt(s string) int {
	s = strings.TrimSpace(s)
	v, _ := strconv.Atoi(s)
	return v
}
