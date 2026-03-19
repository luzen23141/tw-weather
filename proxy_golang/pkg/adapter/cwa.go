package adapter

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"proxy_golang/pkg/model"
)

const cwaBaseURL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"

type cwaForecastDataset struct {
	County  string
	Dataset string
}

var cwaThreeDayForecastDatasets = map[string]cwaForecastDataset{
	"F-D0047-001": {County: "宜蘭縣", Dataset: "F-D0047-001"},
	"F-D0047-005": {County: "桃園市", Dataset: "F-D0047-005"},
	"F-D0047-009": {County: "新竹縣", Dataset: "F-D0047-009"},
	"F-D0047-013": {County: "苗栗縣", Dataset: "F-D0047-013"},
	"F-D0047-017": {County: "彰化縣", Dataset: "F-D0047-017"},
	"F-D0047-021": {County: "南投縣", Dataset: "F-D0047-021"},
	"F-D0047-025": {County: "雲林縣", Dataset: "F-D0047-025"},
	"F-D0047-029": {County: "嘉義縣", Dataset: "F-D0047-029"},
	"F-D0047-033": {County: "屏東縣", Dataset: "F-D0047-033"},
	"F-D0047-037": {County: "臺東縣", Dataset: "F-D0047-037"},
	"F-D0047-041": {County: "花蓮縣", Dataset: "F-D0047-041"},
	"F-D0047-045": {County: "澎湖縣", Dataset: "F-D0047-045"},
	"F-D0047-049": {County: "基隆市", Dataset: "F-D0047-049"},
	"F-D0047-053": {County: "新竹市", Dataset: "F-D0047-053"},
	"F-D0047-057": {County: "嘉義市", Dataset: "F-D0047-057"},
	"F-D0047-061": {County: "臺北市", Dataset: "F-D0047-061"},
	"F-D0047-065": {County: "高雄市", Dataset: "F-D0047-065"},
	"F-D0047-069": {County: "新北市", Dataset: "F-D0047-069"},
	"F-D0047-073": {County: "臺中市", Dataset: "F-D0047-073"},
	"F-D0047-077": {County: "臺南市", Dataset: "F-D0047-077"},
	"F-D0047-081": {County: "連江縣", Dataset: "F-D0047-081"},
	"F-D0047-085": {County: "金門縣", Dataset: "F-D0047-085"},
}

var cwaWeeklyForecastDatasets = map[string]cwaForecastDataset{
	"F-D0047-003": {County: "宜蘭縣", Dataset: "F-D0047-003"},
	"F-D0047-007": {County: "桃園市", Dataset: "F-D0047-007"},
	"F-D0047-011": {County: "新竹縣", Dataset: "F-D0047-011"},
	"F-D0047-015": {County: "苗栗縣", Dataset: "F-D0047-015"},
	"F-D0047-019": {County: "彰化縣", Dataset: "F-D0047-019"},
	"F-D0047-023": {County: "南投縣", Dataset: "F-D0047-023"},
	"F-D0047-027": {County: "雲林縣", Dataset: "F-D0047-027"},
	"F-D0047-031": {County: "嘉義縣", Dataset: "F-D0047-031"},
	"F-D0047-035": {County: "屏東縣", Dataset: "F-D0047-035"},
	"F-D0047-039": {County: "臺東縣", Dataset: "F-D0047-039"},
	"F-D0047-043": {County: "花蓮縣", Dataset: "F-D0047-043"},
	"F-D0047-047": {County: "澎湖縣", Dataset: "F-D0047-047"},
	"F-D0047-051": {County: "基隆市", Dataset: "F-D0047-051"},
	"F-D0047-055": {County: "新竹市", Dataset: "F-D0047-055"},
	"F-D0047-059": {County: "嘉義市", Dataset: "F-D0047-059"},
	"F-D0047-063": {County: "臺北市", Dataset: "F-D0047-063"},
	"F-D0047-067": {County: "高雄市", Dataset: "F-D0047-067"},
	"F-D0047-071": {County: "新北市", Dataset: "F-D0047-071"},
	"F-D0047-075": {County: "臺中市", Dataset: "F-D0047-075"},
	"F-D0047-079": {County: "臺南市", Dataset: "F-D0047-079"},
	"F-D0047-083": {County: "連江縣", Dataset: "F-D0047-083"},
	"F-D0047-087": {County: "金門縣", Dataset: "F-D0047-087"},
}

// CWA adapter
type CWA struct{}

// Fetch retrieves weather data from CWA based on the weather type.
func (CWA) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	switch weatherType {
	case model.WeatherTypeCurrent:
		return fetchCWACurrent(ctx, query, apiKey, client)
	case model.WeatherTypeHourly:
		return fetchCWAHourly(ctx, query, apiKey, client)
	case model.WeatherTypeDaily:
		return fetchCWADaily(ctx, query, apiKey, client)
	default:
		return nil, fmt.Errorf("CWA does not support type: %s", weatherType)
	}
}

// --- Raw response structs ---

// cwaCoordinate CWA 測站座標
type cwaCoordinate struct {
	Lat float64 `json:"StationLatitude,string"`
	Lon float64 `json:"StationLongitude,string"`
}

// cwaGeoInfo CWA 測站地理資訊
type cwaGeoInfo struct {
	Coordinates []cwaCoordinate `json:"Coordinates"`
}

// cwaObsTime CWA 觀測時間
type cwaObsTime struct {
	DateTime string `json:"DateTime"`
}

// cwaPrecipitationNow CWA 即時降水
type cwaPrecipitationNow struct {
	Precipitation string `json:"Precipitation"`
}

// cwaWeatherElement CWA 測站觀測氣象要素
type cwaWeatherElement struct {
	AirTemperature        string              `json:"AirTemperature"`
	RelativeHumidity      string              `json:"RelativeHumidity"`
	WindSpeed             string              `json:"WindSpeed"`
	WindDirection         string              `json:"WindDirection"`
	AirPressure           string              `json:"AirPressure"`
	VisibilityDescription string              `json:"VisibilityDescription"`
	Weather               string              `json:"Weather"`
	Now                   cwaPrecipitationNow `json:"Now"`
}

// cwaStation CWA 測站觀測資料
type cwaStation struct {
	StationID      string            `json:"StationId"`
	StationName    string            `json:"StationName"`
	GeoInfo        cwaGeoInfo        `json:"GeoInfo"`
	ObsTime        cwaObsTime        `json:"ObsTime"`
	WeatherElement cwaWeatherElement `json:"WeatherElement"`
}

// cwaObsRecords CWA 觀測紀錄
type cwaObsRecords struct {
	Station []cwaStation `json:"Station"`
}

type cwaObsResponse struct {
	Records cwaObsRecords `json:"records"`
}

// cwaElementValue CWA 預報要素值
type cwaElementValue struct {
	Value    string `json:"Value"`
	Measures string `json:"Measures"`
}

// cwaForecastTime CWA 預報時間區間
type cwaForecastTime struct {
	StartTime    string            `json:"StartTime"`
	EndTime      string            `json:"EndTime"`
	ElementValue []cwaElementValue `json:"ElementValue"`
}

// cwaForecastElement CWA 預報氣象要素
type cwaForecastElement struct {
	ElementName string            `json:"ElementName"`
	Time        []cwaForecastTime `json:"Time"`
}

// cwaForecastLocation CWA 預報地點
type cwaForecastLocation struct {
	LocationName   string               `json:"LocationName"`
	Lat            string               `json:"Lat"`
	Lon            string               `json:"Lon"`
	WeatherElement []cwaForecastElement `json:"WeatherElement"`
}

// cwaLocationsGroup CWA 預報地點群組
type cwaLocationsGroup struct {
	Location []cwaForecastLocation `json:"Location"`
}

// cwaForecastRecords CWA 預報紀錄
type cwaForecastRecords struct {
	Locations []cwaLocationsGroup `json:"Locations"`
}

type cwaForecastResponse struct {
	Records cwaForecastRecords `json:"records"`
}

// --- Fetch functions ---

func fetchCWACurrent(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")

	// 有明確 LocationID 時直接帶入 StationId；lat/lon 模式則抓所有測站
	if query.LocationID != "" {
		q.Set("StationId", query.LocationID)
	}

	rawURL := fmt.Sprintf("%s/O-A0001-001?%s", cwaBaseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("CWA current fetch failed: %w", err)
	}

	var raw cwaObsResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("CWA current parse failed: %w", err)
	}

	stations := raw.Records.Station
	if len(stations) == 0 {
		return nil, fmt.Errorf("CWA: no station data")
	}

	// 當有 lat/lon 且沒有指定 LocationID 時，找最近的測站
	stIdx := 0
	if query.LocationID == "" && (query.Lat != 0 || query.Lon != 0) {
		if found := findNearestStation(stations, query.Lat, query.Lon); found >= 0 {
			stIdx = found
		}
		// found == -1 代表所有測站皆無座標資料，fallback 到第一筆
	}
	st := stations[stIdx]
	we := st.WeatherElement

	temp := parseFloat(we.AirTemperature)
	humidity := parseInt(we.RelativeHumidity)
	windSpeed := parseFloat(we.WindSpeed) * 3.6 // m/s → km/h
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
			ID:   st.StationID,
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

func fetchCWAHourly(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	target, err := resolveCWAForecastDataset(query.LocationID, cwaThreeDayForecastDatasets)
	if err != nil {
		return nil, err
	}

	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	q.Set("LocationName", target.County)

	rawURL := fmt.Sprintf("%s/F-D0047-089?%s", cwaBaseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("CWA hourly fetch failed: %w", err)
	}

	var raw cwaForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("CWA hourly parse failed: %w", err)
	}

	loc, elements := extractCWALocation(raw, target.County)
	if loc == nil {
		return nil, fmt.Errorf("CWA: no location data for county %s", target.County)
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
		windSpeed := getCWAValue(elemMap, "風速", slot) * 3.6 // m/s → km/h
		windDir := getCWAValue(elemMap, "風向", slot)
		precipProb := getCWAValue(elemMap, "3小時降雨機率", slot)
		weather := getCWAStringValue(elemMap, slot)

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
		Location:  model.Location{ID: target.Dataset, Name: loc.LocationName, Lat: lat, Lon: lon},
		Hourly:    hourly,
	}, nil
}

func fetchCWADaily(ctx context.Context, query *model.WeatherQuery, apiKey string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	target, err := resolveCWAForecastDataset(query.LocationID, cwaWeeklyForecastDatasets)
	if err != nil {
		return nil, err
	}

	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	q.Set("LocationName", target.County)

	rawURL := fmt.Sprintf("%s/F-D0047-091?%s", cwaBaseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("CWA daily fetch failed: %w", err)
	}

	var raw cwaForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("CWA daily parse failed: %w", err)
	}

	loc, elements := extractCWALocation(raw, target.County)
	if loc == nil {
		return nil, fmt.Errorf("CWA: no location data for county %s", target.County)
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
		weather := getCWAStringValue(elemMap, slot)

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
		Location:  model.Location{ID: target.Dataset, Name: loc.LocationName, Lat: lat, Lon: lon},
		Daily:     daily,
	}, nil
}

// --- helpers ---

type cwaLocation struct {
	LocationName string
	Lat          string
	Lon          string
}

func extractCWALocation(raw cwaForecastResponse, locationName string) (*cwaLocation, []cwaForecastElement) {
	if len(raw.Records.Locations) == 0 {
		return nil, nil
	}
	locations := raw.Records.Locations[0].Location
	if len(locations) == 0 {
		return nil, nil
	}
	l := locations[0]
	if locationName != "" {
		matched := false
		for _, candidate := range locations {
			if candidate.LocationName == locationName {
				l = candidate
				matched = true
				break
			}
		}
		if !matched {
			return nil, nil
		}
	}
	return &cwaLocation{
		LocationName: l.LocationName,
		Lat:          l.Lat,
		Lon:          l.Lon,
	}, l.WeatherElement
}

func resolveCWAForecastDataset(locationID string, datasets map[string]cwaForecastDataset) (*cwaForecastDataset, error) {
	target, ok := datasets[locationID]
	if ok {
		return &target, nil
	}
	return nil, fmt.Errorf("CWA: unsupported forecast locationId %s", locationID)
}

func buildCWAElementMap(elements []cwaForecastElement) map[string]map[string]string {
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
	sort.Strings(slots)
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

func getCWAStringValue(elemMap map[string]map[string]string, timeSlot string) string {
	if timeMap, ok := elemMap["天氣現象"]; ok {
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
	return time.Time{}, fmt.Errorf("cannot parse CWA time: %s", s)
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

// findNearestStation 從測站列表中找出距離 lat/lon 最近的測站（Haversine）。
// 回傳最近測站的 index；若所有測站均無座標資料，回傳 -1。
func findNearestStation(stations []cwaStation, lat, lon float64) int {
	nearest := -1
	minDist := math.MaxFloat64

	for i, st := range stations {
		if len(st.GeoInfo.Coordinates) == 0 {
			continue
		}
		sLat := st.GeoInfo.Coordinates[0].Lat
		sLon := st.GeoInfo.Coordinates[0].Lon
		d := haversine(lat, lon, sLat, sLon)
		if d < minDist {
			minDist = d
			nearest = i
		}
	}
	return nearest
}

// haversine 計算兩點間的球面距離（公里）
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusKm * c
}
