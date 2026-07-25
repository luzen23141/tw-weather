# proxy_golang — CLAUDE.md

此檔案提供給 Claude Code 在此子專案中工作時的指引。

---

## 專案概覽

**proxy_golang** — tw-weather 前端的後端代理伺服器

- **用途**：保護 API Key、轉發天氣資料源請求、提供記憶體快取與 HMAC 認證
- **語言**：Go
- **框架**：Gin v1.12.0
- **位置**：`/proxy_golang/`（tw-weather monorepo 子目錄）

---

## 目錄結構

```
proxy_golang/
├── cmd/proxy/main.go          # 應用程式入口
├── pkg/
│   ├── app/                   # DI 容器，組裝所有元件
│   ├── config/                # 環境變數載入（.env）
│   ├── adapter/               # 天氣資料源適配器（CWA / WeatherAPI / Open-Meteo）
│   ├── controller/            # HTTP 處理器
│   ├── middleware/            # CORS、HMAC 認證、RequestLogger
│   ├── model/                 # 資料結構定義
│   ├── repository/            # TTL 記憶體快取層
│   ├── router/                # Gin 路由設定
│   └── service/               # 商業邏輯（請求驗證、代理轉發）
├── test/integration/          # 整合測試（E2E）
├── go.mod / go.sum            # 依賴管理
├── Dockerfile                 # 多階段容器化構建
├── Makefile                   # 編譯腳本
├── .golangci.yml              # Lint 規則（Go 標準規範）
└── .env.example               # 環境變數範本
```

---

## API 端點

| 端點                       | 認證 | 說明                                                     |
| -------------------------- | ---- | -------------------------------------------------------- |
| `GET /api/health`          | 無   | Liveness —— 行程活著即回 ok，零依賴，給 load balancer 用 |
| `GET /api/debug`           | 無   | 診斷 —— Redis 連線、provider 金鑰有無、暖身狀態、uptime  |
| `GET /api/provider/list`   | 無   | 可用資料源清單                                           |
| `GET /api/weather/current` | HMAC | 即時天氣（`provider` + `lat`/`lon` 或 `locationId`）     |
| `GET /api/weather/hourly`  | HMAC | 逐時預報（CWA 需 `locationId` + `township`）             |
| `GET /api/weather/daily`   | HMAC | 每日預報（CWA 需 `locationId` + `township`）             |
| `GET /api/weather/history` | HMAC | 歷史天氣（`date` + `days`，上限 92 天）                  |

### 請求流程

```
前端請求
  → CORS → HMAC（PROXY_SECRET 為空則跳過）→ RequestLogger
  → WeatherController
      → Redis 快取（新鮮 → 直接回；過期 → 回舊資料 + 背景更新〔鎖保護〕）
      → Adapter → CachingUpstreamClient（URL 層快取）→ 上游 API
```

### 快取架構

- **Redis 為硬性依賴**：`REDIS_URL` 未設或連不上，啟動即失敗（無記憶體降級 ——
  靜默降級會讓「Redis 掛了、上游被狂打」這件事完全不可見）
- **兩層快取**：解析後結果（`cwa:*` 等）+ 上游 URL 回應（`upstream:*`）。
  URL 層讓 CWA 一支縣市 dataset 服務該縣市所有鄉鎮 —— 44 次上游呼叫涵蓋全臺
- **Stale-while-revalidate**：過期資料立即回應，背景以分散式鎖（SET NX EX）更新
- **啟動暖身**：背景預抓全臺縣市預報，週期依 `REFRESH_INTERVAL_SECONDS`；
  實際上游資料新鮮度由 `REDIS_TTL_SECONDS` 決定
- 本地開發：`docker-compose up -d` 啟動 Redis

---

## 環境變數

```ini
CWA_API_KEY=<string>          # 中央氣象署 API 金鑰（必要）
WEATHERAPI_KEY=<string>       # WeatherAPI 金鑰（選填）
OPENWEATHERMAP_KEY=<string>   # OpenWeatherMap 金鑰（選填）
PORT=8080                      # 伺服器監聽埠（預設 8080）
PROXY_SECRET=<string>          # HMAC 簽名密鑰（留空則跳過認證）
GIN_MODE=release               # Gin 執行模式（debug/release）
REDIS_URL=<string>             # 必要！如 redis://localhost:6379/0
REDIS_TTL_SECONDS=3600         # 快取存活時間 = 上游資料的實際更新週期
REFRESH_INTERVAL_SECONDS=300   # 視為過期並觸發背景更新的門檻
OPENMETEO_FORECAST_URL=        # 自架 Open-Meteo 時覆寫（留空用官方託管）
OPENMETEO_ARCHIVE_URL=         # 同上（歷史資料端點）
OPENMETEO_MODEL=               # 自架時必填（如 ecmwf_ifs025），否則 best_match 全 null
```

---

## 主要依賴

| 套件                  | 版本    | 用途           |
| --------------------- | ------- | -------------- |
| `gin-gonic/gin`       | v1.12.0 | Web 框架       |
| `jellydator/ttlcache` | v3.4.0  | TTL 記憶體快取 |
| `rs/zerolog`          | v1.34.0 | 結構化日誌     |
| `joho/godotenv`       | v1.5.1  | .env 載入      |
| `rotisserie/eris`     | v0.5.4  | 錯誤包裝與追蹤 |
| `stretchr/testify`    | v1.11.1 | 測試斷言       |

---

## 常用指令

```bash
# 開發
make run              # 啟動開發伺服器
make build            # 編譯 binary

# 測試
make test             # 執行單元測試
make test-integration # 執行整合測試

# 品質檢查
make lint             # golangci-lint 檢查

# 容器
docker build -t proxy_golang .
docker run -p 8080:8080 --env-file .env proxy_golang
```

---

## 核心設計

### 適配器模式（Adapter Pattern）

每個天氣資料源實作統一介面，`ProxyController` 透過 `service` 層選擇對應 Adapter 轉發請求。新增資料源只需：

1. 在 `pkg/adapter/` 新增適配器實作
2. 在 `pkg/app/app.go` 註冊至 DI 容器
3. 新增對應環境變數

### HMAC 認證

- `PROXY_SECRET` 設定後，前端請求需帶 HMAC 簽名
- 留空則跳過，適合本地開發

---

## 與前端的關係

- 前端（`../src/`）透過 `EXPO_PUBLIC_PROXY_URL` 指向此 proxy 伺服器
- proxy 負責持有真實 API Key，前端不直接呼叫天氣 API
- 部署：Docker 容器或任意支援 Go binary 的平台
