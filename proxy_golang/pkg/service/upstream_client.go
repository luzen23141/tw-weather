package service

import (
	"context"
	"io"
	"net/http"
	"time"

	"github.com/rotisserie/eris"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/model"
)

const defaultTimeout = 8 * time.Second

// UpstreamClient 上游 HTTP 客戶端介面
type UpstreamClient interface {
	Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error)
}

// httpUpstreamClient HTTP 實作
type httpUpstreamClient struct {
	client *http.Client
}

// NewUpstreamClient 建立 UpstreamClient
func NewUpstreamClient() UpstreamClient {
	return &httpUpstreamClient{
		client: &http.Client{
			Timeout: defaultTimeout,
		},
	}
}

func (c *httpUpstreamClient) Do(ctx context.Context, req *model.UpstreamRequest) (*model.UpstreamResponse, error) {
	log.Debug().Str("url", req.URL).Str("method", req.Method).Msg("forwarding upstream request")

	httpReq, err := http.NewRequestWithContext(ctx, req.Method, req.URL, nil)
	if err != nil {
		return nil, eris.Wrap(err, "failed to create upstream request")
	}

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return nil, eris.New("upstream timeout")
		}
		return nil, eris.Wrap(err, "upstream request failed")
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, eris.Wrap(err, "failed to read upstream response")
	}

	log.Debug().Int("status", resp.StatusCode).Int("bodySize", len(body)).Msg("upstream response received")

	return &model.UpstreamResponse{
		StatusCode: resp.StatusCode,
		Body:       body,
	}, nil
}
