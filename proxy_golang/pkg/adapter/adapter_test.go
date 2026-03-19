package adapter

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRegistry(t *testing.T) {
	r := NewRegistry(
		ProviderSpec{ID: "cwa", Name: "中央氣象署（CWA）", Description: "台灣最精準，含即時觀測與預報", APIKey: "cwa-key", RequiresKey: true, Adapter: CWA{}},
		ProviderSpec{ID: "openmeteo", Name: "Open-Meteo", Description: "免費無限制，歷史資料豐富", RequiresKey: false, Adapter: OpenMeteo{}},
		ProviderSpec{ID: "weatherapi", Name: "WeatherAPI", Description: "備用來源，支援預報與 7 天歷史", APIKey: "weather-key", RequiresKey: true, Adapter: WeatherAPI{}},
	)

	p, ok := r.Get("cwa")
	require.True(t, ok)
	assert.Equal(t, "cwa", p.ID)
	assert.Equal(t, "cwa-key", p.APIKey)

	all := r.All()
	assert.Len(t, all, 3)
	openMeteo, ok := r.Get("openmeteo")
	require.True(t, ok)
	assert.False(t, openMeteo.RequiresKey)
}
