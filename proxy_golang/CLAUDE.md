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

| 端點                                      | 說明                               |
| ----------------------------------------- | ---------------------------------- |
| `GET /api/proxy?service=xxx&endpoint=yyy` | 主要代理端點，轉發至對應天氣資料源 |
| `GET /api/debug`                          | 調試端點，無認證要求               |

### 請求流程

```
前端請求
  → CORS 中間件
  → HMAC 認證中間件（PROXY_SECRET 為空則跳過）
  → RequestLogger 中間件
  → ProxyController
      → 查詢 TTL Cache（X-Cache: HIT/MISS）
      → 呼叫對應 Adapter（CWA / WeatherAPI / Open-Meteo）
      → 回傳 JSON + 快取標頭
```

---

## 環境變數

```ini
CWA_API_KEY=<string>          # 中央氣象署 API 金鑰（必要）
WEATHERAPI_KEY=<string>       # WeatherAPI 金鑰（選填）
OPENWEATHERMAP_KEY=<string>   # OpenWeatherMap 金鑰（選填）
PORT=8080                      # 伺服器監聽埠（預設 8080）
PROXY_SECRET=<string>          # HMAC 簽名密鑰（留空則跳過認證）
GIN_MODE=release               # Gin 執行模式（debug/release）
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

### 快取策略

- 使用 `ttlcache` 以 `(service, endpoint, query)` 為 Key 做記憶體快取
- 回應 Header 包含 `X-Cache: HIT` 或 `X-Cache: MISS`

### HMAC 認證

- `PROXY_SECRET` 設定後，前端請求需帶 HMAC 簽名
- 留空則跳過，適合本地開發

---

## 與前端的關係

- 前端（`../src/`）透過 `EXPO_PUBLIC_PROXY_URL` 指向此 proxy 伺服器
- proxy 負責持有真實 API Key，前端不直接呼叫天氣 API
- 部署：Docker 容器或任意支援 Go binary 的平台
