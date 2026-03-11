package model

// ServiceRoute 定義上游服務設定
type ServiceRoute struct {
	BaseURL          string
	AllowedEndpoints []string
	APIKeyEnvVar     string
	APIKeyParam      string
}

// ServiceRoutes 所有支援的服務路由白名單
var ServiceRoutes = map[string]ServiceRoute{
	"cwa": {
		BaseURL:          "https://opendata.cwa.gov.tw/api/v1/rest/datastore",
		AllowedEndpoints: []string{"O-A0001-001", "F-D0047-089", "F-D0047-091"},
		APIKeyEnvVar:     "CWA_API_KEY",
		APIKeyParam:      "Authorization",
	},
	"weatherapi": {
		BaseURL:          "https://api.weatherapi.com/v1",
		AllowedEndpoints: []string{"current.json", "forecast.json", "history.json"},
		APIKeyEnvVar:     "WEATHERAPI_KEY",
		APIKeyParam:      "key",
	},
	"openweathermap": {
		BaseURL:          "https://api.openweathermap.org",
		AllowedEndpoints: []string{"data/2.5/weather", "data/2.5/forecast"},
		APIKeyEnvVar:     "OPENWEATHERMAP_KEY",
		APIKeyParam:      "appid",
	},
}
