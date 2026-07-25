package adapter

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

var openMeteoQuery = &model.WeatherQuery{
	Provider: "openmeteo",
	Lat:      25.048,
	Lon:      121.517,
}

func TestOpenMeteo_FetchHistory_RealFixture_Smoke(t *testing.T) {
	client := fixtureClient("openmeteo_archive.json")
	q := *openMeteoQuery
	q.Date = "2024-01-01"

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHistory, resp.Type)
}

// --- Current ---

func TestOpenMeteo_FetchCurrent_RealFixture(t *testing.T) {
	// 使用真實 Open-Meteo API 回傳結構的 fixture
	client := fixtureClient("openmeteo_forecast.json")
	q := *openMeteoQuery

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "openmeteo", resp.Provider)
	assert.Equal(t, model.WeatherTypeCurrent, resp.Type)

	// 驗證 fixture 中的 lat/lon
	assert.InDelta(t, 25.0, resp.Location.Lat, 0.1)
	assert.InDelta(t, 121.5, resp.Location.Lon, 0.1)

	require.NotNil(t, resp.Current)
	assert.InDelta(t, 15.7, resp.Current.Temperature, 0.01)
	assert.Equal(t, 64, resp.Current.Humidity)
	assert.InDelta(t, 13.0, resp.Current.WindSpeed, 0.01)
	assert.Equal(t, 2, resp.Current.WeatherCode)

	require.NotNil(t, resp.Current.WindDirection)
	assert.Equal(t, 66, *resp.Current.WindDirection)

	require.NotNil(t, resp.Current.Pressure)
	assert.InDelta(t, 1019.1, *resp.Current.Pressure, 0.01)

	// visibility 24140m → 24.14 km
	require.NotNil(t, resp.Current.Visibility)
	assert.InDelta(t, 24.14, *resp.Current.Visibility, 0.01)

	require.NotNil(t, resp.Current.IsDay)
	assert.True(t, *resp.Current.IsDay)
}

func TestOpenMeteo_FetchCurrent_RequestURL(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("openmeteo_forecast.json")}, nil
		},
	}

	q := *openMeteoQuery

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "", client)
	require.NoError(t, err)

	assert.Contains(t, capturedURL, "api.open-meteo.com")
	assert.Contains(t, capturedURL, "latitude=25")
	assert.Contains(t, capturedURL, "current=")
}

func TestOpenMeteo_FetchCurrent_NetworkError(t *testing.T) {
	q := *openMeteoQuery

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo fetch failed")
}

func TestOpenMeteo_FetchCurrent_BadJSON(t *testing.T) {
	q := *openMeteoQuery

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeCurrent, "", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo parse failed")
}

// --- Hourly ---

func TestOpenMeteo_FetchHourly_RealFixture(t *testing.T) {
	client := fixtureClient("openmeteo_forecast.json")
	q := *openMeteoQuery

	q.Days = 3

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHourly, resp.Type)

	// fixture 中有 3 筆逐時資料
	require.Len(t, resp.Hourly, 3)

	first := resp.Hourly[0]
	assert.InDelta(t, 13.4, first.Temperature, 0.01)
	assert.Equal(t, 79, first.Humidity)
	assert.InDelta(t, 9.0, first.WindSpeed, 0.01)
	assert.Equal(t, 3, first.WeatherCode)

	require.NotNil(t, first.ApparentTemperature)
	assert.InDelta(t, 12.0, *first.ApparentTemperature, 0.01)

	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 0, *first.PrecipProb)
}

func TestOpenMeteo_FetchHourly_DefaultDays(t *testing.T) {
	// Days = 0 → 預設 7 天，URL 要帶 forecast_days=7
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("openmeteo_forecast.json")}, nil
		},
	}

	q := *openMeteoQuery

	q.Days = 0

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHourly, "", client)
	require.NoError(t, err)
	assert.Contains(t, capturedURL, "forecast_days=7")
}

// --- Daily ---

func TestOpenMeteo_FetchDaily_RealFixture(t *testing.T) {
	client := fixtureClient("openmeteo_forecast.json")
	q := *openMeteoQuery

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeDaily, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeDaily, resp.Type)

	// fixture 有 3 天
	require.Len(t, resp.Daily, 3)

	first := resp.Daily[0]
	assert.InDelta(t, 18.3, first.TempMax, 0.01)
	assert.InDelta(t, 13.2, first.TempMin, 0.01)
	assert.Equal(t, 3, first.WeatherCode)

	require.NotNil(t, first.Precipitation)
	assert.InDelta(t, 0.0, *first.Precipitation, 0.01)

	require.NotNil(t, first.PrecipProb)
	assert.Equal(t, 3, *first.PrecipProb)

	require.NotNil(t, first.UV)
	assert.InDelta(t, 6.85, *first.UV, 0.01)
}

// --- History ---

func TestOpenMeteo_FetchHistory_RealFixture(t *testing.T) {
	// 使用真實 Open-Meteo archive API 回傳結構
	client := fixtureClient("openmeteo_archive.json")
	q := *openMeteoQuery

	q.Date = "2026-03-06"

	resp, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "", client)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, model.WeatherTypeHistory, resp.Type)
	assert.Equal(t, "openmeteo", resp.Provider)

	// fixture 有 5 天歷史資料
	require.Len(t, resp.Daily, 5)

	first := resp.Daily[0]
	assert.InDelta(t, 18.0, first.TempMax, 0.01)
	assert.InDelta(t, 14.6, first.TempMin, 0.01)
	assert.Equal(t, 51, first.WeatherCode) // 毛毛雨

	require.NotNil(t, first.Precipitation)
	assert.InDelta(t, 2.7, *first.Precipitation, 0.01)
}

func TestOpenMeteo_FetchHistory_RequestURL(t *testing.T) {
	var capturedURL string
	client := &mockUpstreamClient{
		doFn: func(_ context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
			capturedURL = req.URL
			return &model.UpstreamResponse{StatusCode: 200, Body: mustReadFixture("openmeteo_archive.json")}, nil
		},
	}

	q := *openMeteoQuery

	q.Date = "2026-03-06"

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "", client)
	require.NoError(t, err)

	assert.Contains(t, capturedURL, "archive-api.open-meteo.com")
	assert.Contains(t, capturedURL, "start_date=2026-03-06")
	assert.Contains(t, capturedURL, "end_date=2026-03-06")
}

func TestOpenMeteo_FetchHistory_NetworkError(t *testing.T) {
	q := *openMeteoQuery

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "", errorClient(assert.AnError))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo history fetch failed")
}

func TestOpenMeteo_FetchHistory_BadJSON(t *testing.T) {
	q := *openMeteoQuery

	_, err := OpenMeteo{}.Fetch(context.Background(), &q, model.WeatherTypeHistory, "", badJSONClient())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Open-Meteo history parse failed")
}

// --- WMODescription ---

func TestWMODescription(t *testing.T) {
	cases := []struct {
		code     int
		expected string
	}{
		{0, "晴天"},
		{3, "陰天"},
		{61, "小雨"},
		{95, "雷雨"},
		{999, "未知天氣"},
	}
	for _, c := range cases {
		t.Run(c.expected, func(t *testing.T) {
			assert.Equal(t, c.expected, WMODescription(c.code))
		})
	}
}

// end_date 先前與 start_date 同值，導致 archive 請求永遠只涵蓋一天 ——
// days 參數對歷史查詢完全沒有作用。這組測試把區間行為鎖住。
func TestOpenMeteoHistoryEndDate(t *testing.T) {
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")

	t.Run("依天數往後推，含頭尾", func(t *testing.T) {
		assert.Equal(t, "2020-03-10", openMeteoHistoryEndDate("2020-03-01", 10))
	})

	t.Run("單日查詢維持原本行為", func(t *testing.T) {
		assert.Equal(t, "2020-03-01", openMeteoHistoryEndDate("2020-03-01", 1))
		assert.Equal(t, "2020-03-01", openMeteoHistoryEndDate("2020-03-01", 0))
	})

	t.Run("無法解析的起始日原樣回傳，不讓請求帶著空日期出去", func(t *testing.T) {
		assert.Equal(t, "not-a-date", openMeteoHistoryEndDate("not-a-date", 30))
	})

	t.Run("上限為昨天 —— archive 不含當日，帶未來日期會讓整個請求失敗", func(t *testing.T) {
		start := time.Now().AddDate(0, 0, -3).Format("2006-01-02")
		assert.Equal(t, yesterday, openMeteoHistoryEndDate(start, 365))
	})

	t.Run("起始日晚於昨天時退回起始日，避免產生反向區間", func(t *testing.T) {
		tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")
		assert.Equal(t, tomorrow, openMeteoHistoryEndDate(tomorrow, 30))
	})
}

// 自架實例（單一模式）的 current 不提供 weather_code，官方託管則會跨模式補值。
// 少了天氣代碼，UI 的圖示與描述會整個退化，所以必須退回逐時值。
func TestCurrentWeatherCode_Fallback(t *testing.T) {
	code := func(v int) *int { return &v }

	t.Run("current 有值時直接採用", func(t *testing.T) {
		raw := openMeteoForecastResponse{
			Current: openMeteoCurrent{Time: "2026-07-23T19:00", WeatherCode: code(61)},
			Hourly:  openMeteoHourly{Time: []string{"2026-07-23T19:00"}, WeatherCode: []int{3}},
		}
		assert.Equal(t, 61, currentWeatherCode(raw))
	})

	t.Run("current 為 0 時仍採用，不誤判為缺值", func(t *testing.T) {
		raw := openMeteoForecastResponse{
			Current: openMeteoCurrent{Time: "2026-07-23T19:00", WeatherCode: code(0)},
			Hourly:  openMeteoHourly{Time: []string{"2026-07-23T19:00"}, WeatherCode: []int{95}},
		}
		assert.Equal(t, 0, currentWeatherCode(raw))
	})

	t.Run("current 缺值時取同一時刻的逐時值", func(t *testing.T) {
		raw := openMeteoForecastResponse{
			Current: openMeteoCurrent{Time: "2026-07-23T19:00"},
			Hourly: openMeteoHourly{
				Time:        []string{"2026-07-23T17:00", "2026-07-23T18:00", "2026-07-23T19:00", "2026-07-23T20:00"},
				WeatherCode: []int{1, 2, 61, 80},
			},
		}
		assert.Equal(t, 61, currentWeatherCode(raw))
	})

	t.Run("current 時刻落在逐時之間時取下一個時段", func(t *testing.T) {
		raw := openMeteoForecastResponse{
			Current: openMeteoCurrent{Time: "2026-07-23T19:15"},
			Hourly: openMeteoHourly{
				Time:        []string{"2026-07-23T19:00", "2026-07-23T20:00"},
				WeatherCode: []int{61, 80},
			},
		}
		assert.Equal(t, 80, currentWeatherCode(raw))
	})

	t.Run("逐時全部早於 current 時取最後一筆", func(t *testing.T) {
		raw := openMeteoForecastResponse{
			Current: openMeteoCurrent{Time: "2026-07-23T23:00"},
			Hourly:  openMeteoHourly{Time: []string{"2026-07-23T20:00"}, WeatherCode: []int{45}},
		}
		assert.Equal(t, 45, currentWeatherCode(raw))
	})

	t.Run("兩邊都沒有時回傳 0", func(t *testing.T) {
		assert.Equal(t, 0, currentWeatherCode(openMeteoForecastResponse{}))
	})
}
