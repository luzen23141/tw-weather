package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadMockFixture(t *testing.T) {
	assert.Contains(t, loadMockFixture("weatherapi_history.json"), "forecastday")
	assert.Equal(t, "{}", loadMockFixture("missing.json"))
}
