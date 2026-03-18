package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/model"
)

const maxUpstreamErrorBody = 256

// httpUpstreamClient HTTP 實作
type httpUpstreamClient struct {
	client *http.Client
}

// NewUpstreamClient 建立 model.UpstreamClient（timeout 由呼叫方的 context 控制）
func NewUpstreamClient() model.UpstreamClient {
	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 5 * time.Second,
		DisableCompression:  false,
	}

	return &httpUpstreamClient{
		client: &http.Client{Transport: transport},
	}
}

func (c *httpUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	log.Debug().Str("url", req.URL).Str("method", req.Method).Msg("forwarding upstream request")

	httpReq, err := http.NewRequestWithContext(ctx, req.Method, req.URL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create upstream request: %w", err)
	}

	// Set a custom User-Agent to bypass WAFs (like CWA) that block default Go client
	httpReq.Header.Set("User-Agent", "tw-weather-proxy/1.0")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return nil, errors.New("upstream timeout")
		}
		return nil, fmt.Errorf("upstream request failed: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read upstream response: %w", err)
	}

	log.Debug().Int("status", resp.StatusCode).Int("bodySize", len(body)).Msg("upstream response received")

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		bodyPreview := string(body)
		if len(bodyPreview) > maxUpstreamErrorBody {
			bodyPreview = bodyPreview[:maxUpstreamErrorBody]
		}
		return nil, &UpstreamStatusError{
			StatusCode: resp.StatusCode,
			Body:       bodyPreview,
		}
	}

	return &model.UpstreamResponse{
		StatusCode: resp.StatusCode,
		Body:       body,
	}, nil
}
