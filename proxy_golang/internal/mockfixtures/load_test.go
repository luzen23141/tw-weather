package mockfixtures

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad(t *testing.T) {
	assert.Contains(t, Load("weatherapi_history.json"), "forecastday")
	assert.Equal(t, "{}", Load("missing.json"))
}
