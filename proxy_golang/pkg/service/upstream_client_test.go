package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"proxy_golang/pkg/model"
)

func TestUpstreamClient_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"temperature": 25}`))
	}))
	defer server.Close()

	client := NewUpstreamClient()
	req := &model.UpstreamRequest{URL: server.URL, Method: http.MethodGet}

	resp, err := client.Do(context.Background(), req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
	assert.Equal(t, []byte(`{"temperature": 25}`), resp.Body)
}

func TestUpstreamClient_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "internal"}`))
	}))
	defer server.Close()

	client := NewUpstreamClient()
	req := &model.UpstreamRequest{URL: server.URL, Method: http.MethodGet}

	resp, err := client.Do(context.Background(), req)
	assert.Nil(t, resp)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "status 500")
}

func TestUpstreamClient_Timeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(2 * time.Second)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := NewUpstreamClient()
	req := &model.UpstreamRequest{URL: server.URL, Method: http.MethodGet}

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	_, err := client.Do(ctx, req)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "timeout")
}

func TestUpstreamClient_InvalidURL(t *testing.T) {
	client := NewUpstreamClient()
	req := &model.UpstreamRequest{URL: "http://localhost:99999", Method: http.MethodGet}

	_, err := client.Do(context.Background(), req)
	require.Error(t, err)
}
