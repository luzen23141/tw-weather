package adapter

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRegistry(t *testing.T) {
	r := NewRegistry(CWA{}, OpenMeteo{}, WeatherAPI{})

	a, ok := r.Get("cwa")
	require.True(t, ok)
	assert.Equal(t, "cwa", a.ProviderID())

	all := r.All()
	assert.Len(t, all, 3)
	assert.True(t, r.RequiresKey("cwa"))
	assert.False(t, r.RequiresKey("openmeteo"))
	assert.True(t, r.RequiresKey("missing"))
}
