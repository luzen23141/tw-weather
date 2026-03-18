package adapter

import (
	"context"
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

func TestCWA_ProviderID(t *testing.T) {
	assert.Equal(t, "cwa", CWA{}.ProviderID())
}

func TestCWA_Metadata(t *testing.T) {
	a := CWA{}
	assert.NotEmpty(t, a.Name())
	assert.NotEmpty(t, a.Description())
	assert.Equal(t, "CWA_API_KEY", a.APIKeyEnvVar())
	assert.True(t, a.RequiresKey())
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

func TestCWA_FetchHourly_RealFixture(t *testing.T) {
	client := fixtureClient("cwa_hourly.json")
	q := *cwaQuery

	q.LocationID = "大安區"

	resp, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHourly, resp.Type)
	assert.Equal(t, "大安區", resp.Location.Name)

	require.NotEmpty(t, resp.Hourly)
	// 按時間排序確保順序穩定（map 遍歷順序不確定）
	sort.Slice(resp.Hourly, func(i, j int) bool {
		return resp.Hourly[i].Time.Before(resp.Hourly[j].Time)
	})
	first := resp.Hourly[0]
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
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("cwa_hourly.json")}, nil
		},
	}

	q := *cwaQuery

	q.LocationID = "F-D0047-061"

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.NoError(t, err)
	assert.Contains(t, capturedURL, "locationId=F-D0047-061")
}

func TestCWA_FetchHourly_NetworkError(t *testing.T) {
	q := *cwaQuery

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA hourly fetch failed")
}

func TestCWA_FetchHourly_BadJSON(t *testing.T) {
	q := *cwaQuery

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

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "key", client)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no location data")
}

// --- Daily ---

func TestCWA_FetchDaily_RealFixture(t *testing.T) {
	client := fixtureClient("cwa_daily.json")
	q := *cwaQuery
	q.LocationID = "大安區"

	resp, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "test-key", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeDaily, resp.Type)

	require.NotEmpty(t, resp.Daily)
	// 按日期排序確保順序確定（map 遍歷順序不確定）
	sort.Slice(resp.Daily, func(i, j int) bool {
		return resp.Daily[i].Date.Before(resp.Daily[j].Date)
	})
	first := resp.Daily[0]
	assert.InDelta(t, 22.0, first.TempMax, 0.01)
	assert.InDelta(t, 15.0, first.TempMin, 0.01)
	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 10, *first.PrecipProb)
	// "晴" → WMO 0（晴天）
	assert.Equal(t, 0, first.WeatherCode)
	assert.Equal(t, "晴", first.Description)
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

	_, err := CWA{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "key", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CWA daily fetch failed")
}

func TestCWA_FetchDaily_BadJSON(t *testing.T) {
	q := *cwaQuery

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
