package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"

	"proxy_golang/pkg/model"
)

/*
Redis 快取。

## 為什麼需要它

上游是有配額的第三方 API（CWA 需金鑰、Open-Meteo 有速率限制），而預報資料本身
只有小時級的更新頻率 —— 每個使用者請求都打上游既慢又浪費配額。

先前只有行程內的 in-memory 快取，有兩個限制：**重啟就全沒了**（部署一次就要把
所有上游重打一輪），以及**無法跨實例共用**（水平擴充時每台各自打上游）。

## 為什麼不降級到記憶體快取

因為靜默降級會讓你**不知道 Redis 掛了**，而那正是三方 API 正在被狂打的時候 ——
配額耗盡、被限流、甚至被封鎖，都會在沒有任何訊號的情況下發生。

快取在這裡不是效能優化，是對上游的保護。保護機制失效時應該大聲失敗，
而不是安靜地繼續跑。
*/

/** Redis 操作的逾時。快取查詢不該成為請求的瓶頸，寧可當作 miss 直接打上游。 */
const redisOpTimeout = 300 * time.Millisecond

// RedisCache 以 Redis 為後端的快取。無記憶體降級 —— 見上方說明。
type RedisCache struct {
	client *redis.Client
	ttl    time.Duration
}

// NewRedisCache 依連線字串建立 Redis 快取。
//
// 連線失敗時回傳錯誤，呼叫端應讓程式啟動失敗 —— 沒有快取就跑起來，
// 等同於放任所有請求直接打上游。
func NewRedisCache(url string, ttl time.Duration) (*RedisCache, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}

	if ttl <= 0 {
		ttl = defaultTTL
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		return nil, err
	}

	return &RedisCache{client: client, ttl: ttl}, nil
}

// Get 依 key 取出快取。Redis 失敗時當作 miss —— 單次請求打上游是可接受的降級，
// 但不會靜默切換到另一套快取而讓問題被掩蓋。
func (c *RedisCache) Get(key string) (*model.CacheEntry, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()

	raw, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err != redis.Nil {
			// 連線層級的錯誤要能被監控看到；redis.Nil 是正常的 cache miss
			log.Error().Err(err).Str("key", key).Msg("redis get failed")
		}
		return nil, false
	}

	var entry model.CacheEntry
	if err := json.Unmarshal(raw, &entry); err != nil {
		// 格式不符多半是舊版留下的資料 —— 當作 miss 重取，並清掉這個 key，
		// 否則它會在 TTL 到期前一直造成解析失敗
		log.Warn().Err(err).Str("key", key).Msg("redis entry unmarshal failed, treating as miss")
		c.client.Del(ctx, key)
		return nil, false
	}

	return &entry, true
}

// Set 寫入快取。失敗時記錄錯誤 —— 寫不進去代表下一個相同請求會再打一次上游，
// 這需要被看見。
func (c *RedisCache) Set(key string, entry *model.CacheEntry) {
	raw, err := json.Marshal(entry)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("redis entry marshal failed")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()

	if err := c.client.Set(ctx, key, raw, c.ttl).Err(); err != nil {
		log.Error().Err(err).Str("key", key).Msg("redis set failed")
	}
}

// Close 關閉底層連線。
func (c *RedisCache) Close() error {
	return c.client.Close()
}

/*
分散式鎖。

用途是讓「更新快取」這件事在任一時刻只有一個持有者 —— 沒有鎖的話，快取過期的
瞬間所有並行請求會同時打上游（cache stampede），這正是配額被瞬間燒光的典型原因。

以 SET NX EX 實作：原子地「不存在才設定」並帶自動過期。過期時間是必要的，
否則持有者當掉會讓鎖永遠留著，快取再也不會更新。
*/

// TryLock 嘗試取得鎖。回傳 true 表示取得，呼叫端負責在完成後 Unlock。
//
// 取不到不是錯誤 —— 代表別人正在更新，呼叫端應直接使用現有的（可能過期的）資料。
func (c *RedisCache) TryLock(key string, ttl time.Duration) bool {
	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()

	ok, err := c.client.SetNX(ctx, lockKey(key), "1", ttl).Result()
	if err != nil {
		// Redis 有問題時保守地當作「拿不到鎖」，避免多個實例同時打上游
		log.Error().Err(err).Str("key", key).Msg("redis lock failed")
		return false
	}
	return ok
}

// Unlock 釋放鎖。
func (c *RedisCache) Unlock(key string) {
	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()

	if err := c.client.Del(ctx, lockKey(key)).Err(); err != nil {
		// 沒釋放成功不致命：鎖有 TTL，最壞情況是下次更新晚一點
		log.Warn().Err(err).Str("key", key).Msg("redis unlock failed")
	}
}

func lockKey(key string) string {
	return "lock:" + key
}

/*
原始位元組的讀寫。

供 upstream 回應快取使用 —— 那一層存的是 HTTP 回應本身而非解析後的
WeatherResponse，因此不能沿用 CacheEntry 的序列化路徑。
*/

// GetRaw 取出原始位元組。
func (c *RedisCache) GetRaw(key string) ([]byte, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()

	raw, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err != redis.Nil {
			log.Error().Err(err).Str("key", key).Msg("redis getRaw failed")
		}
		return nil, false
	}
	return raw, true
}

// SetRaw 寫入原始位元組，使用呼叫端指定的 TTL。
func (c *RedisCache) SetRaw(key string, value []byte, ttl time.Duration) {
	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()

	if ttl <= 0 {
		ttl = c.ttl
	}
	if err := c.client.Set(ctx, key, value, ttl).Err(); err != nil {
		log.Error().Err(err).Str("key", key).Msg("redis setRaw failed")
	}
}

// Ping 檢查 Redis 連線。供 /api/debug 診斷用。
func (c *RedisCache) Ping() error {
	ctx, cancel := context.WithTimeout(context.Background(), redisOpTimeout)
	defer cancel()
	return c.client.Ping(ctx).Err()
}
