# proxy_golang

tw-weather 前端使用的 Go proxy server。

## 常用指令

### 開發

```bash
make run
make build
```

### 測試

```bash
make test
make test-unit
make test-integration
make test-coverage
```

### Fixture 流程

抓取三方 API 的**最原始 response**：

```bash
make fixtures-raw
```

將最新 raw fixtures 同步成 generated fixtures：

```bash
make fixtures-sync
```

完整流程：

```bash
make fixtures-refresh
```

## Fixture 分層

### Raw fixtures

- 位置：`test/raw_fixtures/<timestamp>/`
- 用途：保存直接呼叫三方 API 的最原始 response
- 特性：保留成功與失敗回應，不覆蓋舊批次

### Generated fixtures

- 位置：`test/generated_fixtures/`
- 用途：由 raw fixtures 同步產生的中介資料

### Curated fixtures / mocks

- `pkg/adapter/testdata/`
- `pkg/service/mock_data.go`

這層是目前 unit / integration tests 使用的**穩定測試資料**，
不直接被 raw fixtures 覆蓋，避免測試因真實天氣變動而漂移。

詳細說明：

- `test/FIXTURES.md`

## 注意

抓 raw fixtures 需要可用的 API keys：

- `CWA_API_KEY`
- `WEATHERAPI_KEY`
- `OPENWEATHERMAP_KEY`

`Open-Meteo` 不需要 key。
