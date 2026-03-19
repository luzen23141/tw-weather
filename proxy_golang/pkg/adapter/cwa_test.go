package adapter

import (
	"context"
	"encoding/json"
	"sort"
	"testing"

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
		windDirInt := int(getCWAValue(elemMap, "風向", slot))
		precipProbInt := int(getCWAValue(elemMap, "3小時降雨機率", slot))
		weather := getCWAStringValue(elemMap, slot)
		hourly = append(hourly, model.HourlyWeather{
			Time:          tm,
			Temperature:   getCWAValue(elemMap, "溫度", slot),
			Humidity:      int(getCWAValue(elemMap, "相對濕度", slot)),
			WindSpeed:     getCWAValue(elemMap, "風速", slot) * 3.6,
			WindDirection: &windDirInt,
			PrecipProb:    &precipProbInt,
			WeatherCode:   CWAWeatherToWMO(weather),
			Description:   weather,
		})
	}

	sort.Slice(hourly, func(i, j int) bool { return hourly[i].Time.Before(hourly[j].Time) })
	first := hourly[0]
	assert.InDelta(t, 18.0, first.Temperature, 0.01)
	assert.Equal(t, 75, first.Humidity)
	assert.InDelta(t, 12.6, first.WindSpeed, 0.01)
	require.NotNil(t, first.WindDirection)
	assert.Equal(t, 45, *first.WindDirection)
	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 20, *first.PrecipProb)
	assert.Equal(t, "陰", first.Description)
}

func TestCWA_FetchHourly_WithLocationID(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"records":{"Locations":[{"Location":[{"LocationName":"臺北市","Lat":"25.03","Lon":"121.56","WeatherElement":[{"ElementName":"溫度","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Value":"28"}]}]},{"ElementName":"相對濕度","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Value":"70"}]}]},{"ElementName":"風速","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Value":"3.0"}]}]},{"ElementName":"風向","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Value":"180"}]}]},{"ElementName":"3小時降雨機率","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Value":"20"}]}]},{"ElementName":"天氣現象","Time":[{"StartTime":"2026-03-18T12:00:00+08:00","ElementValue":[{"Value":"多雲"}]}]}]}]}]}}`)}, nil
		},
	}

	q := *cwaQuery

	q.LocationID = "F-D0047-061"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.NoError(t, err)
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
	assert.Contains(t, err.Error(), "no location data")
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
		precipProbInt := int(getCWAValue(elemMap, "12小時降雨機率", slot))
		weather := getCWAStringValue(elemMap, slot)
		daily = append(daily, model.DailyWeather{
			Date:        tm,
			TempMax:     getCWAValue(elemMap, "最高溫度", slot),
			TempMin:     getCWAValue(elemMap, "最低溫度", slot),
			PrecipProb:  &precipProbInt,
			WeatherCode: CWAWeatherToWMO(weather),
			Description: weather,
		})
	}

	sort.Slice(daily, func(i, j int) bool { return daily[i].Date.Before(daily[j].Date) })
	first := daily[0]
	assert.InDelta(t, 22.0, first.TempMax, 0.01)
	assert.InDelta(t, 15.0, first.TempMin, 0.01)
	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 10, *first.PrecipProb)
	assert.Equal(t, 0, first.WeatherCode)
	assert.Equal(t, "晴", first.Description)
}

func TestCWA_FetchDaily_WithLocationID_UsesWeeklyMapping(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: []byte(`{"records":{"Locations":[{"Location":[{"LocationName":"臺北市","Lat":"25.03","Lon":"121.56","WeatherElement":[{"ElementName":"最高溫度","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","ElementValue":[{"Value":"28"}]}]},{"ElementName":"最低溫度","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","ElementValue":[{"Value":"21"}]}]},{"ElementName":"12小時降雨機率","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","ElementValue":[{"Value":"30"}]}]},{"ElementName":"天氣現象","Time":[{"StartTime":"2026-03-18T06:00:00+08:00","ElementValue":[{"Value":"多雲"}]}]}]}]}]}}`)}, nil
		},
	}

	q := *cwaQuery
	q.LocationID = "F-D0047-063"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "key", client)
	require.NoError(t, err)
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
	elemMap := map[string]map[string]string{
		"溫度": {
			"2024-01-02T06:00:00+08:00": "20",
			"2024-01-01T06:00:00+08:00": "18",
		},
	}

	slots := extractCWATimeSlots(elemMap)

	require.Len(t, slots, 2)
	assert.Equal(t, "2024-01-01T06:00:00+08:00", slots[0])
	assert.Equal(t, "2024-01-02T06:00:00+08:00", slots[1])
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
