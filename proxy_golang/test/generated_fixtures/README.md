此目錄保存由 `test/raw_fixtures/` 同步產生的 fixture。

- `adapter/`：可供人工檢視或未來導入 adapter tests 的生成版本
- `pkg/service/mock_fixtures/`：mock mode 實際使用

同步指令：

```bash
go run ./cmd/sync_fixtures
```

注意：

- `pkg/adapter/testdata/` 目前維持穩定測試資料，不會被此指令覆蓋
- 原始資料來源仍是 `test/raw_fixtures/`
