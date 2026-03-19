package fixtures

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

func TestBodyFileNameAndPath(t *testing.T) {
	assert.Equal(t, "abc.json", BodyFileName("abc"))
	assert.Equal(t, filepath.Join("root", "abc.json"), BodyFilePath("root", "abc"))
}

func TestDefaultScenarios(t *testing.T) {
	scenarios := DefaultScenarios()
	require.Len(t, scenarios, 12)

	ids := map[string]bool{}
	for _, scenario := range scenarios {
		assert.NotEmpty(t, scenario.ID)
		assert.NotEmpty(t, scenario.Provider)
		assert.NotEmpty(t, scenario.Description)
		assert.False(t, ids[scenario.ID])
		ids[scenario.ID] = true
	}

	assert.Equal(t, model.WeatherTypeCurrent, scenarios[0].WeatherType)
	assert.Equal(t, "C0TB40", scenarios[0].Query.LocationID)
	assert.Equal(t, "F-D0047-061", scenarios[1].Query.LocationID)
	assert.Equal(t, "F-D0047-063", scenarios[2].Query.LocationID)
	assert.Equal(t, model.WeatherTypeHistory, scenarios[8].WeatherType)
	assert.Equal(t, "2024-06-01", scenarios[8].Query.Date)
}
