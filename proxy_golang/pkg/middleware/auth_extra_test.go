package middleware

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSortedQuery(t *testing.T) {
	assert.Equal(t, "a=1&b=2", sortedQuery("b=2&a=1"))
	assert.Equal(t, "a=1&a=2&b=3", sortedQuery("b=3&a=1&a=2"))
	assert.Equal(t, "name=a%2Bb", sortedQuery("name=a%2Bb"))
	assert.Equal(t, "a=1", sortedQuery("path=%2Fapi%2Fproxy&a=1"))
}

func TestSortedQuery_InvalidRawQueryFallsBack(t *testing.T) {
	assert.Equal(t, "%zz", sortedQuery("%zz"))
}
