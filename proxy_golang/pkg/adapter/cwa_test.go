package adapter

import (
	"context"
	"encoding/json"
	"sort"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

var cwaQuery = &model.WeatherQuery{
	Provider: "cwa",
	Lat:      25.048,
	Lon:      121.517,
}

func TestCWA_Fetch_UnsupportedType_EarlyGuard(t *testing.T) {
	resp, err := CWA{}.Fetch(context.Background(), cwaQuery, model.WeatherTypeHistory, "test-key", &mockUpstreamClient{})
	assert.Nil(t, resp)
	assert.Error(t, err)
}

// --- Current ---

func TestCWA_FetchCurrent_RealFixture(t *testing.T) {
	// 使用真實 API 回傳結構的 fixture（CWA O-A0001-001）
	client := fixtureClient("cwa_current.json")
	q := *cwaQuery

	resp, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "cwa", resp.Provider)
	assert.Equal(t, model.WeatherTypeCurrent, resp.Type)

	// 驗證 fixture 資料：崇德站
	assert.Equal(t, "崇德", resp.Location.Name)
	assert.Equal(t, "C0TB40", resp.Location.ID)

	require.NotNil(t, resp.Current)
	assert.InDelta(t, 19.7, resp.Current.Temperature, 0.01)
	assert.Equal(t, 65, resp.Current.Humidity)
	assert.InDelta(t, 9.0, resp.Current.WindSpeed, 0.01)

	require.NotNil(t, resp.Current.WindDirection)
	assert.Equal(t, 37, *resp.Current.WindDirection)

	require.NotNil(t, resp.Current.Pressure)
	assert.InDelta(t, 1016.3, *resp.Current.Pressure, 0.01)

	// VisibilityDescription "10公里" → 10.0
	require.NotNil(t, resp.Current.Visibility)
	assert.InDelta(t, 10.0, *resp.Current.Visibility, 0.01)

	// "陰" → WMO 3（Overcast）
	assert.Equal(t, 3, resp.Current.WeatherCode)
	assert.Equal(t, "陰", resp.Current.Description)
}

func TestCWA_FetchCurrent_WithStationID(t *testing.T) {
	// 驗證 StationId query param 有被帶入 URL
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("cwa_current.json")}, nil
		},
	}

	q := *cwaQuery

	q.LocationID = "C0TB40"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "my-key", client)
	require.NoError(t, err)
	assert.Contains(t, capturedURL, "StationId=C0TB40")
	assert.Contains(t, capturedURL, "Authorization=my-key")
}

func TestCWA_FetchCurrent_NoStations(t *testing.T) {
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"records":{"Station":[]}}`)}, nil
		},
	}

	q := *cwaQuery

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "key", client)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no station data")
}

func TestCWA_FetchCurrent_NetworkError(t *testing.T) {
	q := *cwaQuery

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "key", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA current fetch failed")
}

func TestCWA_FetchCurrent_BadJSON(t *testing.T) {
	q := *cwaQuery

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "key", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA current parse failed")
}

// --- Hourly ---

func TestExtractCWALocation_ByLocationName(t *testing.T) {
	var raw cwaForecastResponse
	require.NoError(t, json.Unmarshal(mustReadFixture("cwa_hourly.json"), &raw))

	loc, elements := extractCWALocation(raw, "大安區")
	require.NotNil(t, loc)
	require.NotEmpty(t, elements)
	assert.Equal(t, "大安區", loc.LocationName)
}

func TestCWAHourlyParsing_WithCuratedFixture(t *testing.T) {
	var raw cwaForecastResponse
	require.NoError(t, json.Unmarshal(mustReadFixture("cwa_hourly.json"), &raw))

	loc, elements := extractCWALocation(raw, "大安區")
	require.NotNil(t, loc)
	elemMap := buildCWAElementMap(elements)
	timeSlots := extractCWATimeSlots(elemMap)
	require.NotEmpty(t, timeSlots)

	hourly := make([]model.HourlyWeather, 0, len(timeSlots))
	for _, slot := range timeSlots {
		tm, err := parseCWATime(slot)
		require.NoError(t, err)
		windDir := cwaWindDirectionDegrees(getCWAStringValue(elemMap, "風向", "WindDirection", slot))
		precipProbInt := int(getCWAValue(elemMap, "3小時降雨機率", "ProbabilityOfPrecipitation", slot))
		weather := getCWAStringValue(elemMap, "天氣現象", "Weather", slot)
		hourly = append(hourly, model.HourlyWeather{
			Time:          tm,
			Temperature:   getCWAValue(elemMap, "溫度", "Temperature", slot),
			Humidity:      int(getCWAValue(elemMap, "相對濕度", "RelativeHumidity", slot)),
			WindSpeed:     getCWAValue(elemMap, "風速", "WindSpeed", slot) * 3.6,
			WindDirection: windDir,
			PrecipProb:    &precipProbInt,
			WeatherCode:   CWAWeatherToWMO(weather),
			Description:   weather,
		})
	}

	sort.Slice(hourly, func(i, j int) bool { return hourly[i].Time.Before(hourly[j].Time) })
	first := hourly[0]
	// 期望值取自 testdata/cwa_hourly.json 的第一筆（重新產生 fixture 時需同步更新）
	assert.InDelta(t, 32.0, first.Temperature, 0.01)
	assert.Equal(t, 77, first.Humidity)
	assert.InDelta(t, 10.8, first.WindSpeed, 0.01) // 3 m/s × 3.6
	require.NotNil(t, first.WindDirection)
	assert.Equal(t, 90, *first.WindDirection) // 「偏東風」
	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 10, *first.PrecipProb)
	assert.Equal(t, "晴", first.Description)
}

func TestCWA_FetchHourly_WithLocationID(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"records":{"Locations":[{"Location":[{"LocationName":"臺北市","Latitude":"25.03","Longitude":"121.56","WeatherElement":[{"ElementName":"溫度","Time":[{"DataTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Temperature":"28"}]}]},{"ElementName":"相對濕度","Time":[{"DataTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"RelativeHumidity":"70"}]}]},{"ElementName":"風速","Time":[{"DataTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"WindSpeed":"3.0"}]}]},{"ElementName":"風向","Time":[{"DataTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"WindDirection":"偏南風"}]}]},{"ElementName":"3小時降雨機率","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","EndTime":"2026-03-18T15:00:00+08:00","ElementValue":[{"ProbabilityOfPrecipitation":"20"}]}]},{"ElementName":"天氣現象","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","EndTime":"2026-03-18T15:00:00+08:00","ElementValue":[{"Weather":"多雲","WeatherCode":"04"}]}]}]}]}]}}`)}, nil
		},
	}

	q := *cwaQuery

	q.LocationID = "F-D0047-061"
	q.Township = "臺北市"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.NoError(t, err)
	// 必須打縣市版 dataset —— 全臺版（F-D0047-089）以 LocationName 過濾鄉鎮會回 0 筆
	assert.Contains(t, capturedURL, "/F-D0047-061?")
	// LocationName 帶的是鄉鎮名（此處 fixture 用縣市名當地點名），不是縣市名
	assert.Contains(t, capturedURL, "LocationName=%E8%87%BA%E5%8C%97%E5%B8%82")
	assert.NotContains(t, capturedURL, "locationId=")
}

func TestCWA_FetchHourly_NetworkError(t *testing.T) {
	q := *cwaQuery
	q.LocationID = "F-D0047-061"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA hourly fetch failed")
}

func TestCWA_FetchHourly_BadJSON(t *testing.T) {
	q := *cwaQuery
	q.LocationID = "F-D0047-061"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA hourly parse failed")
}

func TestCWA_FetchHourly_EmptyLocations(t *testing.T) {
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"records":{"Locations":[]}}`)}, nil
		},
	}

	q := *cwaQuery
	q.LocationID = "F-D0047-061"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no forecast data")
}

// --- Daily ---

func TestCWADailyParsing_WithCuratedFixture(t *testing.T) {
	var raw cwaForecastResponse
	require.NoError(t, json.Unmarshal(mustReadFixture("cwa_daily.json"), &raw))

	loc, elements := extractCWALocation(raw, "大安區")
	require.NotNil(t, loc)
	elemMap := buildCWAElementMap(elements)
	timeSlots := extractCWATimeSlots(elemMap)
	require.NotEmpty(t, timeSlots)

	daily := make([]model.DailyWeather, 0, len(timeSlots))
	for _, slot := range timeSlots {
		tm, err := parseCWATime(slot)
		require.NoError(t, err)
		precipProbInt := int(getCWAValue(elemMap, "12小時降雨機率", "ProbabilityOfPrecipitation", slot))
		weather := getCWAStringValue(elemMap, "天氣現象", "Weather", slot)
		daily = append(daily, model.DailyWeather{
			Date:        tm,
			TempMax:     getCWAValue(elemMap, "最高溫度", "MaxTemperature", slot),
			TempMin:     getCWAValue(elemMap, "最低溫度", "MinTemperature", slot),
			PrecipProb:  &precipProbInt,
			WeatherCode: CWAWeatherToWMO(weather),
			Description: weather,
		})
	}

	sort.Slice(daily, func(i, j int) bool { return daily[i].Date.Before(daily[j].Date) })
	first := daily[0]
	// 期望值取自 testdata/cwa_daily.json 的第一筆
	assert.InDelta(t, 32.0, first.TempMax, 0.01)
	assert.InDelta(t, 26.0, first.TempMin, 0.01)
	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 10, *first.PrecipProb)
	assert.Equal(t, "晴時多雲", first.Description)
}

func TestCWA_FetchDaily_WithLocationID_UsesWeeklyMapping(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"records":{"Locations":[{"Location":[{"LocationName":"臺北市","Latitude":"25.03","Longitude":"121.56","WeatherElement":[{"ElementName":"最高溫度","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","EndTime":"2026-03-18T18:00:00+08:00","ElementValue":[{"MaxTemperature":"28"}]}]},{"ElementName":"最低溫度","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","EndTime":"2026-03-18T18:00:00+08:00","ElementValue":[{"MinTemperature":"21"}]}]},{"ElementName":"12小時降雨機率","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","EndTime":"2026-03-18T18:00:00+08:00","ElementValue":[{"ProbabilityOfPrecipitation":"30"}]}]},{"ElementName":"天氣現象","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","EndTime":"2026-03-18T18:00:00+08:00","ElementValue":[{"Weather":"多雲","WeatherCode":"04"}]}]}]}]}]}}`)}, nil
		},
	}

	q := *cwaQuery
	q.LocationID = "F-D0047-063"
	q.Township = "臺北市"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "key", client)
	require.NoError(t, err)
	// 週預報要用 weekly dataset（F-D0047-063），不是 3 日的 061
	assert.Contains(t, capturedURL, "/F-D0047-063?")
	assert.Contains(t, capturedURL, "LocationName=%E8%87%BA%E5%8C%97%E5%B8%82")
	assert.NotContains(t, capturedURL, "locationId=")
}

func TestCWA_FetchHourly_WithGeneratedFixture_SelectsTaipeiCity(t *testing.T) {
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{
				StatusCode: 200,
				Body:       mustReadProjectFixture("test/generated_fixtures/adapter/cwa_hourly.json"),
			}, nil
		},
	}

	q := *cwaQuery
	q.LocationID = "F-D0047-061"
	q.Township = "臺北市"

	resp, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "臺北市", resp.Location.Name)
	assert.Equal(t, "F-D0047-061", resp.Location.ID)
}

func TestCWA_FetchDaily_WithGeneratedFixture_SelectsTaipeiCity(t *testing.T) {
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, _ *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			return &model.UpstreamResponse{
				StatusCode: 200,
				Body:       mustReadProjectFixture("test/generated_fixtures/adapter/cwa_daily.json"),
			}, nil
		},
	}

	q := *cwaQuery
	q.LocationID = "F-D0047-063"
	q.Township = "臺北市"

	resp, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "key", client)
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "臺北市", resp.Location.Name)
	assert.Equal(t, "F-D0047-063", resp.Location.ID)
}

func TestCWA_FetchHourly_UnsupportedForecastLocationID(t *testing.T) {
	q := *cwaQuery
	q.LocationID = "F-D0047-063"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", &mockUpstreamClient{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported forecast locationId")
}

func TestExtractCWATimeSlots_Sorted(t *testing.T) {
	elemMap := buildCWAElementMap([]cwaForecastElement{
		{
			ElementName: "溫度",
			Time: []cwaForecastTime{
				{DataTime: "2024-01-02T06:00:00+08:00", ElementValue: []cwaElementValue{{"Temperature": "20"}}},
				{DataTime: "2024-01-01T06:00:00+08:00", ElementValue: []cwaElementValue{{"Temperature": "18"}}},
			},
		},
	})

	slots := extractCWATimeSlots(elemMap)

	require.Len(t, slots, 2)
	assert.Equal(t, "2024-01-01T06:00:00+08:00", slots[0])
	assert.Equal(t, "2024-01-02T06:00:00+08:00", slots[1])
}

// 時間軸只取自逐時要素，不能是所有要素時間的聯集 ——
// 否則三小時區間的起點會被當成獨立時間點，產生溫度為 0 的假資料列
func TestExtractCWATimeSlots_IgnoresIntervalElements(t *testing.T) {
	elemMap := buildCWAElementMap([]cwaForecastElement{
		{
			ElementName: "溫度",
			Time: []cwaForecastTime{
				{DataTime: "2024-01-01T06:00:00+08:00", ElementValue: []cwaElementValue{{"Temperature": "18"}}},
			},
		},
		{
			ElementName: "3小時降雨機率",
			Time: []cwaForecastTime{
				{StartTime: "2024-01-01T03:00:00+08:00", ElementValue: []cwaElementValue{{"ProbabilityOfPrecipitation": "20"}}},
			},
		},
	})

	assert.Equal(t, []string{"2024-01-01T06:00:00+08:00"}, extractCWATimeSlots(elemMap))
}

// 區間要素的粒度較粗（三小時一筆），必須讓其值涵蓋其後的每個逐時時間點，
// 否則三分之二的小時會取不到降雨機率
func TestCWATimeSeries_IntervalValueCoversFollowingHours(t *testing.T) {
	elemMap := buildCWAElementMap([]cwaForecastElement{
		{
			ElementName: "3小時降雨機率",
			Time: []cwaForecastTime{
				{StartTime: "2024-01-01T06:00:00+08:00", ElementValue: []cwaElementValue{{"ProbabilityOfPrecipitation": "20"}}},
				{StartTime: "2024-01-01T09:00:00+08:00", ElementValue: []cwaElementValue{{"ProbabilityOfPrecipitation": "80"}}},
			},
		},
	})

	assert.InDelta(t, 20, getCWAValue(elemMap, "3小時降雨機率", "ProbabilityOfPrecipitation", "2024-01-01T07:00:00+08:00"), 0.01)
	assert.InDelta(t, 80, getCWAValue(elemMap, "3小時降雨機率", "ProbabilityOfPrecipitation", "2024-01-01T10:00:00+08:00"), 0.01)
	// 早於第一筆區間時沒有值可用，回傳 0
	assert.InDelta(t, 0, getCWAValue(elemMap, "3小時降雨機率", "ProbabilityOfPrecipitation", "2024-01-01T05:00:00+08:00"), 0.01)
}

// CWA 的風向是中文描述而非角度，直接 ParseFloat 會讓所有風向變成正北
func TestCWAWindDirectionDegrees(t *testing.T) {
	cases := map[string]int{"偏北風": 0, "偏東風": 90, "偏南風": 180, "偏西風": 270, "東北風": 45}
	for desc, want := range cases {
		got := cwaWindDirectionDegrees(desc)
		require.NotNil(t, got, desc)
		assert.Equal(t, want, *got, desc)
	}
	assert.Nil(t, cwaWindDirectionDegrees("不明風向"))
	assert.Nil(t, cwaWindDirectionDegrees(""))
}

func TestCWA_FetchDaily_NetworkError(t *testing.T) {
	q := *cwaQuery
	q.LocationID = "F-D0047-063"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "key", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA daily fetch failed")
}

func TestCWA_FetchDaily_BadJSON(t *testing.T) {
	q := *cwaQuery
	q.LocationID = "F-D0047-063"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "key", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA daily parse failed")
}

// --- Unsupported type ---

func TestCWA_Fetch_UnsupportedType(t *testing.T) {
	q := *cwaQuery

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherType("unsupported"), "key", &mockUpstreamClient{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA does not support type")
}

// --- parseVisibility ---

func TestParseVisibility(t *testing.T) {
	cases := []struct {
		input    string
		expected float64
	}{
		{"10公里", 10.0},
		{"5 km", 5.0},
		{"2.5", 2.5},
		{"不良", 10.0}, // 無數字 → 預設 10
		{"", 10.0},
	}
	for _, c := range cases {
		t.Run(c.input, func(t *testing.T) {
			assert.InDelta(t, c.expected, parseVisibility(c.input), 0.01)
		})
	}
}

// --- CWAWeatherToWMO ---

func TestCWAWeatherToWMO(t *testing.T) {
	cases := []struct {
		desc     string
		expected int
	}{
		{"晴", 0},
		{"多雲", 2},
		{"陰", 3},
		{"雨", 63},
		{"雷雨", 95},
		{"未知天氣", 3}, // 預設
	}
	for _, c := range cases {
		t.Run(c.desc, func(t *testing.T) {
			assert.Equal(t, c.expected, CWAWeatherToWMO(c.desc))
		})
	}
}

// CWA 週預報以 12 小時為單位，一天拆成白天／晚上兩段。
// 不合併的話「明天」會在畫面上出現兩列。
func TestMergeCWADailySegments(t *testing.T) {
	day := func(iso string, max, min float64, prob int) model.DailyWeather {
		tm, err := time.Parse(time.RFC3339, iso)
		require.NoError(t, err)
		p := prob
		return model.DailyWeather{Date: tm, TempMax: max, TempMin: min, PrecipProb: &p, Description: "晴"}
	}

	t.Run("同一天的兩段合併為一筆", func(t *testing.T) {
		merged := mergeCWADailySegments([]model.DailyWeather{
			day("2026-07-24T06:00:00+08:00", 36, 30, 10),
			day("2026-07-24T18:00:00+08:00", 32, 27, 40),
			day("2026-07-25T06:00:00+08:00", 33, 28, 20),
		})

		require.Len(t, merged, 2)
		// 最高取較高、最低取較低 —— 一整天的實際範圍
		assert.InDelta(t, 36, merged[0].TempMax, 0.01)
		assert.InDelta(t, 27, merged[0].TempMin, 0.01)
		// 降雨機率取較高者：保守判斷才不會漏掉「晚上會下」
		assert.Equal(t, 40, *merged[0].PrecipProb)
		// 描述取白天那段
		assert.Equal(t, "晴", merged[0].Description)
	})

	t.Run("空輸入不 panic", func(t *testing.T) {
		assert.Empty(t, mergeCWADailySegments(nil))
	})

	t.Run("已是單段時原樣回傳", func(t *testing.T) {
		in := []model.DailyWeather{day("2026-07-24T06:00:00+08:00", 30, 25, 10)}
		assert.Len(t, mergeCWADailySegments(in), 1)
	})
}

// CWA 的時間帶 +08:00 台北偏移。先前用字面 "+08:00" 當 layout 會丟掉時區、
// 把台北時間當成 UTC，導致前端整批偏移 8 小時、聚合時間軸錯亂。
func TestParseCWATime_KeepsTaipeiOffset(t *testing.T) {
	got, err := parseCWATime("2026-07-24T06:00:00+08:00")
	require.NoError(t, err)

	// 必須是 06:00，且時區偏移為 +8h（28800 秒）
	assert.Equal(t, 6, got.Hour())
	_, offset := got.Zone()
	assert.Equal(t, 8*60*60, offset)

	// 序列化後應保留 +08:00 而非變成 Z
	assert.Contains(t, got.Format(time.RFC3339), "+08:00")
	assert.NotContains(t, got.Format(time.RFC3339), "Z")
}

func TestParseCWATime_NoZoneAssumesTaipei(t *testing.T) {
	got, err := parseCWATime("2026-07-24T06:00:00")
	require.NoError(t, err)
	_, offset := got.Zone()
	assert.Equal(t, 8*60*60, offset)
}

func TestParseCWATime_Invalid(t *testing.T) {
	_, err := parseCWATime("not-a-time")
	assert.Error(t, err)
}
