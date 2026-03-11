package model

// Provider 天氣資料來源設定
type Provider struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Enabled      bool          `json:"enabled"`
	Capabilities []WeatherType `json:"capabilities"`
	Coverage     string        `json:"coverage"`    // "taiwan" | "global"
	Description  string        `json:"description"`
	RequiresKey  bool          `json:"requiresKey"`
}

// ProviderRegistry 所有支援的 provider
var ProviderRegistry = []Provider{
	{
		ID:           "cwa",
		Name:         "中央氣象署",
		Enabled:      true,
		Capabilities: []WeatherType{WeatherTypeCurrent, WeatherTypeHourly, WeatherTypeDaily},
		Coverage:     "taiwan",
		Description:  "台灣最精準的天氣資料，涵蓋 368 鄉鎮市區",
		RequiresKey:  true,
	},
	{
		ID:           "weatherapi",
		Name:         "WeatherAPI",
		Enabled:      true,
		Capabilities: []WeatherType{WeatherTypeCurrent, WeatherTypeHourly, WeatherTypeDaily, WeatherTypeHistory},
		Coverage:     "global",
		Description:  "全球天氣資料，支援 7 天歷史查詢",
		RequiresKey:  true,
	},
	{
		ID:           "openmeteo",
		Name:         "Open-Meteo",
		Enabled:      true,
		Capabilities: []WeatherType{WeatherTypeCurrent, WeatherTypeHourly, WeatherTypeDaily, WeatherTypeHistory},
		Coverage:     "global",
		Description:  "免費無限制，採用 WMO 標準天氣碼",
		RequiresKey:  false,
	},
}
