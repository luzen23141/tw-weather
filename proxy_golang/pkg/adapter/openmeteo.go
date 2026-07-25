package adapter

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"proxy_golang/pkg/model"
)

// 預設指向 Open-Meteo 官方託管服務。
//
// 官方免費層的服務條款禁止商業用途（含有廣告或訂閱的 app），但軟體本身是
// AGPLv3、資料是 CC BY 4.0 —— 自架一份即可商用。自架版本暴露的是同一組 API，
// 因此切換只需覆寫下面兩個 URL，adapter 的邏輯完全不用動。
const (
	defaultOpenMeteoForecastURL = "https://api.open-meteo.com/v1/forecast"
	defaultOpenMeteoArchiveURL  = "https://archive-api.open-meteo.com/v1/archive"
)

// OpenMeteo adapter（無需 API Key）。
//
// ForecastURL / ArchiveURL 留空時使用官方託管端點；自架時由 app 層注入。
type OpenMeteo struct {
	ForecastURL string
	ArchiveURL  string

	// Model 指定要查詢的模式（如 ecmwf_ifs025、dwd_icon、ncep_gfs013）。
	//
	// 留空時不送 models 參數，由上游以 best_match 自行挑選 —— 官方託管服務因為
	// 所有模式的資料都在，best_match 一定有解。但**自架實例只有你同步過的模式**，
	// best_match 會挑到沒有資料的模式，導致整個回應的每個欄位都變成 null
	// （不是只有缺的那個）。自架時這個值必須設定。
	Model string
}

func (o OpenMeteo) forecastURL() string {
	if o.ForecastURL == "" {
		return defaultOpenMeteoForecastURL
	}
	return o.ForecastURL
}

func (o OpenMeteo) archiveURL() string {
	if o.ArchiveURL == "" {
		return defaultOpenMeteoArchiveURL
	}
	return o.ArchiveURL
}

// Fetch retrieves weather data from Open-Meteo based on the weather type.
func (o OpenMeteo) Fetch(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, _ string, client model.UpstreamClient) (*model.WeatherResponse, error) {
	if weatherType == model.WeatherTypeHistory {
		return fetchOpenMeteoHistory(ctx, query, client, o.archiveURL())
	}
	return fetchOpenMeteoForecast(ctx, query, weatherType, client, o.forecastURL(), o.Model)
}

// --- Raw response structs ---

type openMeteoCurrent struct {
	Time                string  `json:"time"`
	Temperature2m       float64 `json:"temperature_2m"`
	ApparentTemperature float64 `json:"apparent_temperature"`
	RelativeHumidity2m  int     `json:"relative_humidity_2m"`
	// 指標型別是必要的：0 是合法的 WMO 代碼（晴天），用值型別會把 null 讀成晴天。
	// 自架的單一模式在 15 分鐘間隔的 current 上不提供 weather_code，官方託管則會
	// 跨模式補值 —— 這個差異只有用指標才分辨得出來。
	WeatherCode      *int    `json:"weather_code"`
	WindSpeed10m     float64 `json:"wind_speed_10m"`
	WindDirection10m int     `json:"wind_direction_10m"`
	Precipitation    float64 `json:"precipitation"`
	PressureMsl      float64 `json:"pressure_msl"`
	Visibility       float64 `json:"visibility"`
	IsDay            int     `json:"is_day"`
}

type openMeteoHourly struct {
	Time                []string  `json:"time"`
	Temperature2m       []float64 `json:"temperature_2m"`
	ApparentTemperature []float64 `json:"apparent_temperature"`
	RelativeHumidity2m  []int     `json:"relative_humidity_2m"`
	WeatherCode         []int     `json:"weather_code"`
	Precipitation       []float64 `json:"precipitation"`
	PrecipitationProb   []int     `json:"precipitation_probability"`
	WindSpeed10m        []float64 `json:"wind_speed_10m"`
	WindDirection10m    []int     `json:"wind_direction_10m"`
}

type openMeteoDaily struct {
	Time                 []string  `json:"time"`
	WeatherCode          []int     `json:"weather_code"`
	Temperature2mMax     []float64 `json:"temperature_2m_max"`
	Temperature2mMin     []float64 `json:"temperature_2m_min"`
	Temperature2mMean    []float64 `json:"temperature_2m_mean"`
	RelHumidity2mMean    []float64 `json:"relative_humidity_2m_mean"`
	PrecipitationSum     []float64 `json:"precipitation_sum"`
	PrecipitationProbMax []int     `json:"precipitation_probability_max"`
	WindSpeed10mMax      []float64 `json:"wind_speed_10m_max"`
	UvIndexMax           []float64 `json:"uv_index_max"`
}

type openMeteoForecastResponse struct {
	Latitude  float64          `json:"latitude"`
	Longitude float64          `json:"longitude"`
	Current   openMeteoCurrent `json:"current"`
	Hourly    openMeteoHourly  `json:"hourly"`
	Daily     openMeteoDaily   `json:"daily"`
}

// --- Fetch functions ---

func fetchOpenMeteoForecast(ctx context.Context, query *model.WeatherQuery, weatherType model.WeatherType, client model.UpstreamClient, baseURL, weatherModel string) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("latitude", fmt.Sprintf("%f", query.Lat))
	q.Set("longitude", fmt.Sprintf("%f", query.Lon))
	q.Set("timezone", "Asia/Taipei")
	if weatherModel != "" {
		q.Set("models", weatherModel)
	}

	switch weatherType {
	case model.WeatherTypeCurrent:
		q.Set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl,visibility,is_day")
		// 一併取當日逐時的 weather_code 作為 fallback。自架實例的 current 不提供
		// 天氣代碼，少了它整個 UI 的圖示與描述都會退化成「未知」。
		q.Set("hourly", "weather_code")
		q.Set("forecast_days", "1")
	case model.WeatherTypeHourly:
		q.Set("hourly", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m")
		days := query.Days
		if days <= 0 {
			days = 7
		}
		q.Set("forecast_days", fmt.Sprintf("%d", days))
	case model.WeatherTypeDaily:
		q.Set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max")
		days := query.Days
		if days <= 0 {
			days = 7
		}
		q.Set("forecast_days", fmt.Sprintf("%d", days))
	}

	rawURL := fmt.Sprintf("%s?%s", baseURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("Open-Meteo fetch failed: %w", err)
	}

	var raw openMeteoForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("Open-Meteo parse failed: %w", err)
	}

	loc := model.Location{
		Name: fmt.Sprintf("%.4f,%.4f", raw.Latitude, raw.Longitude),
		Lat:  raw.Latitude,
		Lon:  raw.Longitude,
	}

	result := &model.WeatherResponse{
		Provider:  "openmeteo",
		Type:      weatherType,
		Location:  loc,
		UpdatedAt: time.Now(),
	}

	switch weatherType {
	case model.WeatherTypeCurrent:
		result.Current = parseOpenMeteoCurrent(raw)
	case model.WeatherTypeHourly:
		result.Hourly = parseOpenMeteoHourly(raw)
	case model.WeatherTypeDaily:
		result.Daily = parseOpenMeteoDaily(raw)
	}

	return result, nil
}

// openMeteoHistoryEndDate 由起始日與天數推出結束日（含頭尾）。
//
// 上限為昨天：archive API 不含當日資料，帶入未來日期會讓整個請求失敗而非略過。
// 起始日無法解析或 days <= 1 時退回起始日本身，維持單日查詢的舊行為。
func openMeteoHistoryEndDate(startDate string, days int) string {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil || days <= 1 {
		return startDate
	}

	end := start.AddDate(0, 0, days-1)
	yesterday := time.Now().AddDate(0, 0, -1)
	if end.After(yesterday) {
		end = yesterday
	}
	if end.Before(start) {
		return startDate
	}
	return end.Format("2006-01-02")
}

func fetchOpenMeteoHistory(ctx context.Context, query *model.WeatherQuery, client model.UpstreamClient, archiveURL string) (*model.WeatherResponse, error) {
	q := url.Values{}
	q.Set("latitude", fmt.Sprintf("%f", query.Lat))
	q.Set("longitude", fmt.Sprintf("%f", query.Lon))
	q.Set("timezone", "Asia/Taipei")
	// end_date 依 days 往後推。先前 start 與 end 同為 query.Date，archive 請求
	// 永遠只涵蓋一天 —— days 參數對歷史查詢完全沒有作用，前端要 92 天也只會拿到 1 天。
	q.Set("start_date", query.Date)
	q.Set("end_date", openMeteoHistoryEndDate(query.Date, query.Days))
	q.Set("daily", "weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max,uv_index_max")

	rawURL := fmt.Sprintf("%s?%s", archiveURL, q.Encode())
	resp, err := client.Do(ctx, &model.UpstreamRequest{URL: rawURL, Method: "GET"})
	if err != nil {
		return nil, fmt.Errorf("Open-Meteo history fetch failed: %w", err)
	}

	var raw openMeteoForecastResponse
	if err := json.Unmarshal(resp.Body, &raw); err != nil {
		return nil, fmt.Errorf("Open-Meteo history parse failed: %w", err)
	}

	return &model.WeatherResponse{
		Provider:  "openmeteo",
		Type:      model.WeatherTypeHistory,
		Location:  model.Location{Lat: raw.Latitude, Lon: raw.Longitude},
		UpdatedAt: time.Now(),
		Daily:     parseOpenMeteoDaily(raw),
	}, nil
}

// currentWeatherCode 取當前天氣代碼。
//
// current 缺值時退回同一時刻的逐時代碼 —— 自架實例（單一模式）不提供 current
// 的 weather_code，而官方託管會跨模式補值。少了它 UI 的天氣圖示與描述會整個失效，
// 所以這個 fallback 不是錦上添花。
func currentWeatherCode(raw openMeteoForecastResponse) int {
	if raw.Current.WeatherCode != nil {
		return *raw.Current.WeatherCode
	}

	h := raw.Hourly
	if len(h.Time) == 0 || len(h.WeatherCode) == 0 {
		return 0
	}

	// 逐時時間為當地時間（timezone=Asia/Taipei），與 current.time 同格式，
	// 取第一筆不早於 current.time 的項目
	for i, t := range h.Time {
		if i < len(h.WeatherCode) && t >= raw.Current.Time {
			return h.WeatherCode[i]
		}
	}

	last := len(h.WeatherCode) - 1
	if last >= 0 {
		return h.WeatherCode[last]
	}
	return 0
}

func parseOpenMeteoCurrent(raw openMeteoForecastResponse) *model.CurrentWeather {
	c := raw.Current
	apparent := c.ApparentTemperature
	pressure := c.PressureMsl
	visibility := c.Visibility / 1000 // m → km
	precip := c.Precipitation
	isDay := c.IsDay == 1
	code := currentWeatherCode(raw)

	return &model.CurrentWeather{
		Temperature:         c.Temperature2m,
		ApparentTemperature: &apparent,
		Humidity:            c.RelativeHumidity2m,
		WindSpeed:           c.WindSpeed10m,
		WindDirection:       &c.WindDirection10m,
		Pressure:            &pressure,
		Visibility:          &visibility,
		Precipitation:       &precip,
		WeatherCode:         code,
		Description:         WMODescription(code),
		IsDay:               &isDay,
	}
}

func parseOpenMeteoHourly(raw openMeteoForecastResponse) []model.HourlyWeather {
	h := raw.Hourly
	hourly := make([]model.HourlyWeather, 0, len(h.Time))

	loc := time.FixedZone("CST", 8*3600)
	for i, timeStr := range h.Time {
		t, err := time.ParseInLocation("2006-01-02T15:04", timeStr, loc)
		if err != nil {
			continue
		}

		var apparent *float64
		if i < len(h.ApparentTemperature) {
			v := h.ApparentTemperature[i]
			apparent = &v
		}
		var precip *float64
		if i < len(h.Precipitation) {
			v := h.Precipitation[i]
			precip = &v
		}
		var precipProb *int
		if i < len(h.PrecipitationProb) {
			v := h.PrecipitationProb[i]
			precipProb = &v
		}
		var windDir *int
		if i < len(h.WindDirection10m) {
			v := h.WindDirection10m[i]
			windDir = &v
		}

		code := 0
		if i < len(h.WeatherCode) {
			code = h.WeatherCode[i]
		}
		temp := 0.0
		if i < len(h.Temperature2m) {
			temp = h.Temperature2m[i]
		}
		humidity := 0
		if i < len(h.RelativeHumidity2m) {
			humidity = h.RelativeHumidity2m[i]
		}
		windSpeed := 0.0
		if i < len(h.WindSpeed10m) {
			windSpeed = h.WindSpeed10m[i]
		}

		hourly = append(hourly, model.HourlyWeather{
			Time:                t,
			Temperature:         temp,
			ApparentTemperature: apparent,
			Humidity:            humidity,
			WindSpeed:           windSpeed,
			WindDirection:       windDir,
			Precipitation:       precip,
			PrecipProb:          precipProb,
			WeatherCode:         code,
			Description:         WMODescription(code),
		})
	}
	return hourly
}

func parseOpenMeteoDaily(raw openMeteoForecastResponse) []model.DailyWeather {
	d := raw.Daily
	daily := make([]model.DailyWeather, 0, len(d.Time))

	for i, dateStr := range d.Time {
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}

		code := 0
		if i < len(d.WeatherCode) {
			code = d.WeatherCode[i]
		}
		maxTemp := 0.0
		if i < len(d.Temperature2mMax) {
			maxTemp = d.Temperature2mMax[i]
		}
		minTemp := 0.0
		if i < len(d.Temperature2mMin) {
			minTemp = d.Temperature2mMin[i]
		}

		var precip *float64
		if i < len(d.PrecipitationSum) {
			v := d.PrecipitationSum[i]
			precip = &v
		}
		var precipProb *int
		if i < len(d.PrecipitationProbMax) {
			v := d.PrecipitationProbMax[i]
			precipProb = &v
		}
		var windSpeed *float64
		if i < len(d.WindSpeed10mMax) {
			v := d.WindSpeed10mMax[i]
			windSpeed = &v
		}
		var uv *float64
		if i < len(d.UvIndexMax) {
			v := d.UvIndexMax[i]
			uv = &v
		}
		// 平均溫與平均濕度只有 archive 端點提供，預報端點不回傳這兩個欄位，
		// 因此都是可選的 —— 缺值時前端顯示破折號，而不是把 0 當成真實觀測值。
		var meanTemp *float64
		if i < len(d.Temperature2mMean) {
			v := d.Temperature2mMean[i]
			meanTemp = &v
		}
		var humidity *int
		if i < len(d.RelHumidity2mMean) {
			v := int(d.RelHumidity2mMean[i] + 0.5)
			humidity = &v
		}

		daily = append(daily, model.DailyWeather{
			Date:          t,
			TempMax:       maxTemp,
			TempMin:       minTemp,
			TempMean:      meanTemp,
			Humidity:      humidity,
			Precipitation: precip,
			PrecipProb:    precipProb,
			WindSpeed:     windSpeed,
			UV:            uv,
			WeatherCode:   code,
			Description:   WMODescription(code),
		})
	}
	return daily
}
