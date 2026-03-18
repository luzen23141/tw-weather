# Raw Fixtures

此目錄保存**直接呼叫三方 API 取得的最原始 response**。

規則：

- 每次抓取建立一個新的 timestamp 目錄
- 原始 response 不覆蓋、不手改
- 每個目錄都附 `manifest.json`，記錄：
  - provider
  - weather type
  - query
  - raw URL
  - status code
  - body file
  - fetched time

用途：

1. 作為後續 mock / fixture 的來源依據
2. 保留最原始資料，避免只剩手工整理過的 mock
3. 方便比對第三方 API 結構是否變動

抓取指令：

```bash
go run ./cmd/fetch_raw_fixtures
```

必要環境變數：

- `CWA_API_KEY`
- `WEATHERAPI_KEY`
- `OPENWEATHERMAP_KEY`

`Open-Meteo` 無需 API key。
