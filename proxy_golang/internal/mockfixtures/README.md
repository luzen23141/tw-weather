同步後的 mock fixture 檔案會放在這裡。

來源：

- `test/raw_fixtures/<timestamp>/`

更新方式：

1. 先執行 `go run ./cmd/fetch_raw_fixtures`
2. 再執行 `go run ./cmd/sync_fixtures`

注意：

- 這裡是給 mock mode 使用的 shared fixture
- `test/raw_fixtures/` 才是不可改寫的最原始 response 保存區
