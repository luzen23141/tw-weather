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
// cwaElementValue CWA 的要素值。
//
// **鍵名依要素而異**（Temperature / RelativeHumidity / ProbabilityOfPrecipitation…），
// 不是通用的 "Value"。先前宣告為 `{Value string}` 的結果是所有數值都讀成空字串，
// 再 ParseFloat 成 0 —— CWA 的預報因此從未被正確解析過，而且失敗方式是靜默的
// （回傳 0 而非錯誤），所以一直沒被發現。
type cwaElementValue map[string]string

// cwaForecastTime CWA 預報時間點或區間。
//
// 逐時要素（溫度、濕度、風速…）用 DataTime 表示時間點；
// 區間要素（降雨機率、天氣現象）用 StartTime/EndTime 表示三小時或十二小時區間。
// 兩者必須都能解析，否則其中一組會整批落空。
type cwaForecastTime struct {
	DataTime     string            `json:"DataTime"`
	StartTime    string            `json:"StartTime"`
	EndTime      string            `json:"EndTime"`
	ElementValue []cwaElementValue `json:"ElementValue"`
}

// at 回傳此筆的代表時間：逐時要素用 DataTime，區間要素用 StartTime。
func (t cwaForecastTime) at() string {
	if t.DataTime != "" {
		return t.DataTime
	}
	return t.StartTime
}

// cwaForecastElement CWA 預報氣象要素
type cwaForecastElement struct {
	ElementName string            `json:"ElementName"`
	Time        []cwaForecastTime `json:"Time"`
}

// cwaForecastLocation CWA 預報地點
type cwaForecastLocation struct {
	LocationName string `json:"LocationName"`
	// CWA 回傳的是 Latitude / Longitude，先前標成 Lat / Lon 導致座標永遠是空字串
	Lat            string               `json:"Latitude"`
	Lon            string               `json:"Longitude"`
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

	// LocationName 必須是**鄉鎮名**而非縣市名 —— F-D0047-089 是鄉鎮層級的 dataset，
	// 傳縣市名會過濾不到任何資料（回傳 0 筆而非錯誤，更難察覺）。
	// 縣市由 LocationID 選擇的 dataset 決定，這裡只負責選鄉鎮。
	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	if query.Township != "" {
		q.Set("LocationName", query.Township)
	}

	// 必須用 target.Dataset（縣市版），不能寫死 F-D0047-089（全臺版）——
	// 全臺版以 LocationName 過濾鄉鎮會回 0 筆，縣市版才支援鄉鎮過濾。
	// 先前 resolveCWAForecastDataset 解析出正確 dataset 後卻沒被使用。
	rawURL := fmt.Sprintf("%s/%s?%s", cwaBaseURL, target.Dataset, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("CWA hourly fetch failed: %w", err)
	}

	var raw cwaForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("CWA hourly parse failed: %w", err)
	}

	loc, elements := extractCWALocation(raw, query.Township)
	if loc == nil {
		return nil, fmt.Errorf("CWA: no forecast data for %s %s", target.County, query.Township)
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
		temp := getCWAValue(elemMap, "溫度", "Temperature", slot)
		humidity := getCWAValue(elemMap, "相對濕度", "RelativeHumidity", slot)
		windSpeed := getCWAValue(elemMap, "風速", "WindSpeed", slot) * 3.6 // m/s → km/h
		// 風向是中文描述而非角度，需另外換算
		windDir := cwaWindDirectionDegrees(getCWAStringValue(elemMap, "風向", "WindDirection", slot))
		precipProb := getCWAValue(elemMap, "3小時降雨機率", "ProbabilityOfPrecipitation", slot)
		weather := getCWAStringValue(elemMap, "天氣現象", "Weather", slot)
		// CWA 有提供體感溫度，先前的 adapter 沒讀取它
		apparent := getCWAValue(elemMap, "體感溫度", "ApparentTemperature", slot)

		precipProbInt := int(precipProb)
		weatherCode := CWAWeatherToWMO(weather)

		item := model.HourlyWeather{
			Time:          t,
			Temperature:   temp,
			Humidity:      int(humidity),
			WindSpeed:     windSpeed,
			WindDirection: windDir, // 無法辨識的風向為 nil，欄位會被省略
			PrecipProb:    &precipProbInt,
			WeatherCode:   weatherCode,
			Description:   weather,
		}
		if apparent != 0 {
			item.ApparentTemperature = &apparent
		}

		hourly = append(hourly, item)
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

	// 同 hourly：F-D0047-091 也是鄉鎮層級 dataset，LocationName 要鄉鎮名
	q := url.Values{}
	q.Set("Authorization", apiKey)
	q.Set("format", "JSON")
	if query.Township != "" {
		q.Set("LocationName", query.Township)
	}

	// 同 hourly：用縣市版 dataset 而非寫死的全臺版
	rawURL := fmt.Sprintf("%s/%s?%s", cwaBaseURL, target.Dataset, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("CWA daily fetch failed: %w", err)
	}

	var raw cwaForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("CWA daily parse failed: %w", err)
	}

	loc, elements := extractCWALocation(raw, query.Township)
	if loc == nil {
		return nil, fmt.Errorf("CWA: no forecast data for %s %s", target.County, query.Township)
	}

	elemMap := buildCWAElementMap(elements)
	timeSlots := extractCWATimeSlots(elemMap)

	daily := make([]model.DailyWeather, 0, len(timeSlots))
	for _, slot := range timeSlots {
		t, err := parseCWATime(slot)
		if err != nil {
			continue
		}
		maxTemp := getCWAValue(elemMap, "最高溫度", "MaxTemperature", slot)
		minTemp := getCWAValue(elemMap, "最低溫度", "MinTemperature", slot)
		precipProb := getCWAValue(elemMap, "12小時降雨機率", "ProbabilityOfPrecipitation", slot)
		weather := getCWAStringValue(elemMap, "天氣現象", "Weather", slot)

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

	daily = mergeCWADailySegments(daily)

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

/*
mergeCWADailySegments 把同一天的白天／晚上兩段合併成一筆。

CWA 的週預報以 12 小時為單位，一天拆成白天與晚上兩段 —— 直接輸出會讓「明天」
在畫面上出現兩列。合併規則：最高溫取兩段較高者、最低溫取較低者、降雨機率取
較高者（保守），天氣描述取當日第一段（白天），因為那是使用者對「明天天氣」的
預設理解。

假設輸入已依時間排序（extractCWATimeSlots 保證）。
*/
func mergeCWADailySegments(segments []model.DailyWeather) []model.DailyWeather {
	if len(segments) == 0 {
		return segments
	}

	merged := make([]model.DailyWeather, 0, len(segments))
	indexByDate := make(map[string]int, len(segments))

	for _, seg := range segments {
		key := seg.Date.Format("2006-01-02")
		idx, seen := indexByDate[key]
		if !seen {
			indexByDate[key] = len(merged)
			merged = append(merged, seg)
			continue
		}

		target := &merged[idx]
		if seg.TempMax > target.TempMax {
			target.TempMax = seg.TempMax
		}
		if seg.TempMin < target.TempMin {
			target.TempMin = seg.TempMin
		}
		if seg.PrecipProb != nil && (target.PrecipProb == nil || *seg.PrecipProb > *target.PrecipProb) {
			target.PrecipProb = seg.PrecipProb
		}
	}

	return merged
}

func resolveCWAForecastDataset(locationID string, datasets map[string]cwaForecastDataset) (*cwaForecastDataset, error) {
	target, ok := datasets[locationID]
	if ok {
		return &target, nil
	}
	return nil, fmt.Errorf("CWA: unsupported forecast locationId %s", locationID)
}

// cwaTimeSeries 單一要素的時間序列：時間 → 該時間點的所有具名值。
type cwaTimeSeries struct {
	// 依時間排序的 (時間, 值) 序列。用序列而非 map 是因為區間要素需要
	// 「找出涵蓋某時刻的區間」，那需要順序。
	times  []string
	values []cwaElementValue
}

func buildCWAElementMap(elements []cwaForecastElement) map[string]cwaTimeSeries {
	result := make(map[string]cwaTimeSeries, len(elements))
	for _, el := range elements {
		series := cwaTimeSeries{}
		for _, t := range el.Time {
			at := t.at()
			if at == "" || len(t.ElementValue) == 0 {
				continue
			}
			series.times = append(series.times, at)
			series.values = append(series.values, t.ElementValue[0])
		}
		sort.Sort(&series)
		result[el.ElementName] = series
	}
	return result
}

func (s *cwaTimeSeries) Len() int           { return len(s.times) }
func (s *cwaTimeSeries) Less(i, j int) bool { return s.times[i] < s.times[j] }
func (s *cwaTimeSeries) Swap(i, j int) {
	s.times[i], s.times[j] = s.times[j], s.times[i]
	s.values[i], s.values[j] = s.values[j], s.values[i]
}

/*
lookup 取出涵蓋 slot 的值。

逐時要素與區間要素的時間軸粒度不同 —— 溫度是每小時一筆，降雨機率是每三小時
一筆。若用精確比對，三小時要素只有三分之一的時間點命中，其餘全部落空。
因此改為「取最後一個不晚於 slot 的項目」，讓區間值涵蓋其後的每個小時。
*/
func (s *cwaTimeSeries) lookup(slot string) (cwaElementValue, bool) {
	idx := -1
	for i, t := range s.times {
		if t <= slot {
			idx = i
		} else {
			break
		}
	}
	if idx < 0 {
		return nil, false
	}
	return s.values[idx], true
}

// extractCWATimeSlots 以「溫度」的逐時時間軸為準。
//
// 不能取所有要素時間的聯集：那會把三小時區間的起點也當成獨立時間點，
// 產生溫度為 0 的假資料列。
func extractCWATimeSlots(elemMap map[string]cwaTimeSeries) []string {
	for _, name := range []string{"溫度", "最高溫度", "最低溫度"} {
		if series, ok := elemMap[name]; ok && len(series.times) > 0 {
			slots := make([]string, len(series.times))
			copy(slots, series.times)
			return slots
		}
	}
	return nil
}

// getCWAValue 取數值。name 為要素名、valueKey 為該要素的具名鍵。
func getCWAValue(elemMap map[string]cwaTimeSeries, name, valueKey, timeSlot string) float64 {
	series, ok := elemMap[name]
	if !ok {
		return 0
	}
	val, ok := series.lookup(timeSlot)
	if !ok {
		return 0
	}
	return parseFloat(val[valueKey])
}

// getCWAStringValue 取字串值（如天氣現象的「多雲」）。
func getCWAStringValue(elemMap map[string]cwaTimeSeries, name, valueKey, timeSlot string) string {
	series, ok := elemMap[name]
	if !ok {
		return ""
	}
	val, ok := series.lookup(timeSlot)
	if !ok {
		return ""
	}
	return val[valueKey]
}

/*
cwaWindDirectionDegrees 把 CWA 的中文風向轉為角度。

CWA 的風向欄位是描述文字（「偏東風」）而非數值 —— 先前直接 ParseFloat，
結果永遠是 0（正北），也就是所有風向都顯示為北風。

回傳氣象慣例的「風的來向」角度。無法辨識時回傳 nil，讓上層省略該欄位，
而不是填一個看起來合理的錯誤值。
*/
func cwaWindDirectionDegrees(desc string) *int {
	table := map[string]int{
		"偏北風": 0, "北風": 0,
		"偏東北風": 45, "東北風": 45,
		"偏東風": 90, "東風": 90,
		"偏東南風": 135, "東南風": 135,
		"偏南風": 180, "南風": 180,
		"偏西南風": 225, "西南風": 225,
		"偏西風": 270, "西風": 270,
		"偏西北風": 315, "西北風": 315,
	}
	if deg, ok := table[strings.TrimSpace(desc)]; ok {
		return &deg
	}
	return nil
}

func parseCWATime(s string) (time.Time, error) {
	// Z07:00 才是 Go 解析數值時區的正確格式 —— 先前用字面 "+08:00" 當 layout，
	// Go 不把它當時區而是逐字比對，結果丟掉 +08:00 資訊、把台北時間當成 UTC。
	// 症狀是所有 CWA 時間在前端偏移 8 小時，聚合按小時對齊時 CWA 與其他來源的
	// 「同一個 T06」其實差 8 小時，合併後時間軸錯亂。
	//
	// 無時區資訊的 fallback 假設為台北時間（CWA 的資料一律是本地時間）。
	if t, err := time.Parse("2006-01-02T15:04:05Z07:00", s); err == nil {
		return t, nil
	}
	if t, err := time.ParseInLocation("2006-01-02T15:04:05", s, cwaTimeZone); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("cannot parse CWA time: %s", s)
}

// cwaTimeZone 是 CWA 資料的時區（台北，UTC+8）。無時區標記的時間以此解讀。
var cwaTimeZone = time.FixedZone("Asia/Taipei", 8*60*60)

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

/*
CWAWarmupTargets 回傳暖身用的 (dataset ID, 代表鄉鎮) 組合。

只需每個縣市一個鄉鎮 —— CWA 的 dataset 回應包含該縣市**所有**鄉鎮，
搭配 URL 層快取，抓一次就涵蓋整個縣市。
*/
func CWAWarmupTargets(weatherType model.WeatherType) map[string]string {
	datasets := cwaThreeDayForecastDatasets
	if weatherType == model.WeatherTypeDaily {
		datasets = cwaWeeklyForecastDatasets
	}

	result := make(map[string]string, len(datasets))
	for id, ds := range datasets {
		if township, ok := cwaRepresentativeTownship[ds.County]; ok {
			result[id] = township
		}
	}
	return result
}

// cwaRepresentativeTownship 每個縣市取一個鄉鎮作為暖身用的查詢對象。
// 選哪一個不影響快取涵蓋範圍 —— 回應永遠包含該縣市全部鄉鎮。
var cwaRepresentativeTownship = map[string]string{
	"宜蘭縣": "宜蘭市", "桃園市": "桃園區", "新竹縣": "竹北市", "苗栗縣": "苗栗市",
	"彰化縣": "彰化市", "南投縣": "南投市", "雲林縣": "斗六市", "嘉義縣": "太保市",
	"屏東縣": "屏東市", "臺東縣": "臺東市", "花蓮縣": "花蓮市", "澎湖縣": "馬公市",
	"基隆市": "仁愛區", "新竹市": "東區", "嘉義市": "東區", "臺北市": "大安區",
	"高雄市": "苓雅區", "新北市": "板橋區", "臺中市": "西屯區", "臺南市": "中西區",
	"連江縣": "南竿鄉", "金門縣": "金城鎮",
}
