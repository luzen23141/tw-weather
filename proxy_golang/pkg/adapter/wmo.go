package adapter

// WMODescription 將 WMO 天氣代碼轉為中文描述
func WMODescription(code int) string {
	descriptions := map[int]string{
		0: "晴天", 1: "大致晴朗", 2: "局部多雲", 3: "陰天",
		45: "有霧", 48: "霧凇",
		51: "毛毛雨（輕）", 53: "毛毛雨", 55: "毛毛雨（濃）",
		56: "凍毛毛雨（輕）", 57: "凍毛毛雨",
		61: "小雨", 63: "中雨", 65: "大雨",
		66: "凍雨（輕）", 67: "凍雨",
		71: "小雪", 73: "中雪", 75: "大雪", 77: "霰",
		80: "陣雨（輕）", 81: "陣雨", 82: "陣雨（大）",
		85: "陣雪（輕）", 86: "陣雪",
		95: "雷雨", 96: "雷雨伴冰雹", 99: "強雷雨伴冰雹",
	}
	if d, ok := descriptions[code]; ok {
		return d
	}
	return "未知天氣"
}

// CWAWeatherToWMO 將 CWA 天氣描述轉為 WMO code（近似映射）
func CWAWeatherToWMO(weather string) int {
	mapping := map[string]int{
		"晴":      0,
		"晴天":     0,
		"大致晴":    1,
		"多雲":     2,
		"多雲時晴":   2,
		"陰":      3,
		"陰天":     3,
		"霧":      45,
		"毛毛雨":    51,
		"小雨":     61,
		"雨":      63,
		"中雨":     63,
		"大雨":     65,
		"豪雨":     65,
		"雷雨":     95,
		"雷陣雨":    95,
		"午後雷陣雨":  95,
		"雪":      73,
		"陣雨":     80,
		"多雲短暫陣雨": 80,
		"短暫陣雨":   80,
	}
	if code, ok := mapping[weather]; ok {
		return code
	}
	return 3 // 預設陰天
}
