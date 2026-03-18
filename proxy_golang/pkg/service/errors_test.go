package service

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestProxyError(t *testing.T) {
	inner := errors.New("bad gateway")
	err := &ProxyError{Code: 502, Err: inner}

	assert.Equal(t, "bad gateway", err.Error())
	assert.ErrorIs(t, err, inner)
}

func TestUpstreamStatusError(t *testing.T) {
	assert.Equal(t, "upstream returned status 500", (&UpstreamStatusError{StatusCode: 500}).Error())
	assert.Equal(t, "upstream returned status 429: rate limited", (&UpstreamStatusError{StatusCode: 429, Body: "  rate limited  "}).Error())
}
