package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"

	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/model"
)

/*
以 URL 為鍵的上游回應快取。

## 解決什麼問題

CWA 的預報 dataset 是「一個縣市一支 API」，而該 API 的回應包含**該縣市的所有
鄉鎮**。若快取只做在「解析後的單一鄉鎮結果」這一層，大安區與信義區會各自打一次
`F-D0047-061` —— 同一份 1MB 的資料被重複下載 N 次，N = 該縣市的鄉鎮數。

把快取放在 URL 這一層，一次下載就服務整個縣市。22 個縣市 × 2 種預報 = 44 次
上游呼叫即可涵蓋全臺 368 鄉鎮。

## 為什麼是裝飾器

它包在 `model.UpstreamClient` 外面，所有 adapter 自動受惠且完全不需要改動 ——
adapter 只知道自己在「打一個 URL」，不需要知道快取的存在。
*/

/** 快取的上游回應。只存必要欄位，避免把整個 http.Response 序列化進 Redis。 */
type cachedUpstreamResponse struct {
	StatusCode int    `json:"statusCode"`
	Body       []byte `json:"body"`
}

type cachingUpstreamClient struct {
	inner model.UpstreamClient
	cache upstreamCacheStore
	ttl   time.Duration
}

// upstreamCacheStore 是 cacheStore 的子集 —— 這一層不需要鎖。
type upstreamCacheStore interface {
	GetRaw(key string) ([]byte, bool)
	SetRaw(key string, value []byte, ttl time.Duration)
}

// NewCachingUpstreamClient 以快取包裝上游 client。
func NewCachingUpstreamClient(
	inner model.UpstreamClient,
	cache upstreamCacheStore,
	ttl time.Duration,
) model.UpstreamClient {
	if cache == nil || ttl <= 0 {
		return inner
	}
	return &cachingUpstreamClient{inner: inner, cache: cache, ttl: ttl}
}

func (c *cachingUpstreamClient) Do(
	ctx context.Context,
	req *model.UpstreamRequest,
) (*model.UpstreamResponse, error) {
	// 只快取 GET —— 其他方法可能有副作用，重放不安全
	if req.Method != "" && req.Method != "GET" {
		return c.inner.Do(ctx, req)
	}

	key := upstreamCacheKey(req.URL)

	if raw, ok := c.cache.GetRaw(key); ok {
		var cached cachedUpstreamResponse
		if err := json.Unmarshal(raw, &cached); err == nil {
			log.Debug().Str("key", key).Msg("upstream cache hit")
			return &model.UpstreamResponse{StatusCode: cached.StatusCode, Body: cached.Body}, nil
		}
		// 解析失敗當作 miss，重打上游
		log.Warn().Str("key", key).Msg("upstream cache entry corrupt, refetching")
	}

	resp, err := c.inner.Do(ctx, req)
	if err != nil {
		return nil, err
	}

	// 只快取成功的回應 —— 快取錯誤會把一次暫時性失敗放大成整個 TTL 期間的失敗
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if encoded, err := json.Marshal(cachedUpstreamResponse{
			StatusCode: resp.StatusCode,
			Body:       resp.Body,
		}); err == nil {
			c.cache.SetRaw(key, encoded, c.ttl)
		}
	}

	return resp, nil
}

/*
upstreamCacheKey 以 URL 的雜湊為鍵。

用雜湊而非原始 URL 有兩個理由：URL 含 API 金鑰，不該以明文存在 Redis 裡；
以及 CWA 的 URL 很長，雜湊後的鍵長度固定、便於觀察。
*/
func upstreamCacheKey(url string) string {
	sum := sha256.Sum256([]byte(url))
	return "upstream:" + hex.EncodeToString(sum[:16])
}
