---
description: React Native (Expo) 專案驗證與自動化部署循環 (Verify & Deploy Cycle)
---

# /deploy-verify - Automated Verify & Deploy Cycle

自動化執行 React Native 專案的全面安全與品質審核、跨平台 UI/E2E 驗證、智慧提交以及最終的線上部署與通知。此流程高度整合專案內建指令。

## 前置作業 (Prerequisites)

- 確保 `.env` 已正確設定（包含 `AG_TELEGRAM_BOT_TOKEN` 和 `AG_TELEGRAM_CHAT_ID` 等必要環境變數）。
- 確保 `gh` CLI 已安裝並認證（`gh auth login`），用於 CI 驗證。
- 專案已就緒，所有本地修改已初步儲存。

---

## 第一階段：深度檢查與審核 (Deep Verification & Audit)

此階段將依序執行各項嚴格的安全與品質檢查。若有任何一項顯示失敗，Agent 須自動進行分析並進入「迭代修復循環」。
你可以使用專案內建指令一次跑完靜態代碼檢查：`pnpm check:all`

### 1. 核心安全與靜態分析 (Security & Linting)

> 優先解決安全性與語法架構問題。

```bash
# 安全性掃描
// turbo
pnpm check:security

# 依賴套件結構與未使用的套件分析
// turbo
pnpm check:deps
// turbo
pnpm check:unused

# 靜態代碼與規範檢查 (Lint, Format, Type Check)
// turbo
pnpm lint
// turbo
pnpm format:check
// turbo
pnpm type-check
```

### 2. 邏輯與架構驗證 (Testing & Structure)

> 確保商業邏輯與資料結構完整。

```bash
# 執行單元測試
// turbo
pnpm test
```

---

## 第二階段：端到端與視覺驗證 (E2E & Visual Verification)

### 3. 跨平台自動化頁面測試 (Web & Mobile E2E)

啟動本地伺服器並使用 Playwright 與 Maestro 進行端到端測試。

```bash
# 啟動本地開發伺服器進行 Web 預覽
pnpm web
// turbo
# Agent Action: 使用內建瀏覽器工具造訪 http://localhost:8081
```

```bash
# Playwright 端到端 Web 測試
// turbo
pnpm test:e2e:web
```

```bash
# Maestro 端到端 Mobile 測試
// turbo
pnpm test:e2e:mobile
```

> **Agent 視覺驗證重點**：
>
> 1. **環境檢查**: 確認 E2E 測試日誌是否有報錯。
> 2. **跨平台行為**: 確認 Web 與 Mobile 的重要路徑皆能正常執行。

### 4. 迭代修復循環與止損機制 (Iterative Fix Cycle & Safeguard)

若在第一階段（腳本檢查）或第二階段（視覺/E2E驗證）中發現問題：

1. **自動修復**: Agent 分析錯誤日誌或截圖，自動修改原始碼。
2. **重試**: 針對失敗的項目重新執行對應的驗證腳本。
3. **安全閥 (Safeguard)**：單一問題**最多重複修復 3 次**。若超過仍未通過，強制停止工作流，發出 Telegram 異常通報要求人類介入，避免無窮迴圈耗損資源。

---

## 第三階段：智慧部署與通知 (Smart Deployment & Notification)

### 5. 智慧 Git 提交 (Smart Git Commit)

所有驗證通過後，遵循 **Conventional Commits** 規範進行版本控制，可搭配 `/cr-and-commit` 技能。

```bash
git add .
# Agent Action: 分析變動清單並生成高品質、語意化的 Commit 訊息
# 格式: <type>(<scope>): <subject>
git commit -m "<generated_message>"
git push origin main
```

### 6. CI 流水線最終確認 (GitHub Actions CI)

推送後等待 CI 流程完成，確保雲端建置環境也全數通過。

```bash
# 等待最新 run 完成（阻塞式，串流 log）
// turbo
gh run watch --repo luzen23141/tw-weather --exit-status
```

> **判定邏輯**：
>
> 1. **CI 通過** → 繼續至步驟 7（通知）。
> 2. **CI 失敗** →
>    a. `gh run view <run-id> --log-failed` 擷取失敗日誌。
>    b. 進入「迭代修復循環」(步驟 4)。
>    c. 修復後重新 commit + push，再回到此步驟。

### 7. 優雅通知推送 (Refined Notification)

若全線登頂成功，透過 Telegram Reporter 發佈高質感的摘要報告。

## 全域致命錯誤處理 (Global Fatal Safeguard)

發生系統性崩潰或無法自動修復之情況（例如 API 憑證失效）：

1. **即刻中斷流程**。
2. **通報警報**："🚨 **部署中斷** 於步驟 [Step Name]。請人類工程師檢視日誌與截圖。"
