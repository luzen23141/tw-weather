# Fixtures 分層說明

此專案現在有三層 fixture：

## 1. Raw fixtures

位置：

- `test/raw_fixtures/<timestamp>/`

用途：

- 保存**直接呼叫三方 API** 的最原始 response
- 做為後續 mock / fixture 的來源依據
- 保留第三方 API 實際結構與錯誤回應

特性：

- 不覆蓋舊批次
- 每批有 `manifest.json`
- 即使是 4xx / 5xx 也保留 body

## 2. Generated fixtures

位置：

- `test/generated_fixtures/adapter/`
- `pkg/service/mock_fixtures/`

用途：

- 由 raw fixtures 同步產生
- 方便人工檢視 raw → 測試資料的中介結果

特性：

- 可以重建
- 不視為穩定測試基準

## 3. Curated fixtures / curated mocks

位置：

- `pkg/adapter/testdata/`
- `pkg/service/mock_data.go`

用途：

- 給 unit / integration tests 使用
- 保持測試穩定，不受即時天氣變動影響

特性：

- 這層是**穩定且可預期**的測試資料
- 不會被 `sync_fixtures` 自動覆蓋

## 建議流程

1. 抓原始資料

```bash
go run ./cmd/fetch_raw_fixtures
```

2. 同步產生中介 fixture

```bash
go run ./cmd/sync_fixtures
```

3. 人工確認後，再決定是否更新：

- `pkg/adapter/testdata/`
- `pkg/service/mock_data.go`

這樣可以同時兼顧：

- 原始資料可追溯
- 測試資料可控
- 不讓真實天氣直接破壞測試穩定性
