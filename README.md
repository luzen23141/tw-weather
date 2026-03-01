# tw-weather

[![CI](https://github.com/luzen23141/tw-weather/actions/workflows/ci.yml/badge.svg)](https://github.com/luzen23141/tw-weather/actions/workflows/ci.yml)
[![Deploy](https://github.com/luzen23141/tw-weather/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/luzen23141/tw-weather/actions/workflows/deploy-pages.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo_SDK-55-000020?logo=expo)](https://expo.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm)](https://pnpm.io/)

台灣天氣 App — 跨平台（iOS / Android / Web）天氣應用程式，整合多個氣象資料來源，支援聚合模式與歷史天氣查詢。

> **Live Demo**: [GitHub Pages](https://luzen23141.github.io/tw-weather/)（Web 版）

---

## 功能特色

- **多資料源整合** — 同時支援 CWA 中央氣象署、Open-Meteo、WeatherAPI 三大來源
- **使用者自選資料源** — 自由開啟/關閉任一來源，非固定主備模式
- **聚合模式** — 整合多來源資料，氣溫取聯集範圍、降雨閾值判斷，可自定義規則
- **歷史天氣** — 透過 Open-Meteo 提供最多 92 天歷史資料，本地快取加速
- **跨平台** — 單一 TypeScript 程式碼產出 iOS、Android、Web 三平台
- **離線支援** — TanStack Query + MMKV 持久化快取，離線仍可查看上次資料
- **台灣在地化** — 涵蓋 368 鄉鎮市區，預報精細度最高

## 截圖

<!-- 待 UI 完成後補充截圖 -->

| 首頁                               | 逐時預報                             | 每日預報                            | 設定                                   |
| ---------------------------------- | ------------------------------------ | ----------------------------------- | -------------------------------------- |
| ![首頁](docs/screenshots/home.png) | ![逐時](docs/screenshots/hourly.png) | ![每日](docs/screenshots/daily.png) | ![設定](docs/screenshots/settings.png) |

---

## 快速開始

### 環境需求

- Node.js >= 20
- pnpm >= 10
- iOS 模擬器（Xcode）或 Android 模擬器（Android Studio）

### 安裝與啟動

```bash
# 1. 複製專案
git clone git@github.com:luzen23141/tw-weather.git
cd tw-weather

# 2. 安裝依賴
pnpm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env，填入 CWA API Key 與 WeatherAPI Key

# 4. 啟動開發伺服器
pnpm start
```

### 各平台啟動

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web
pnpm web
```

### 環境變數

| 變數名稱                     | 說明                   | 必要           |
| ---------------------------- | ---------------------- | -------------- |
| `EXPO_PUBLIC_CWA_API_KEY`    | 中央氣象署 API 授權碼  | 是             |
| `EXPO_PUBLIC_WEATHERAPI_KEY` | WeatherAPI.com API Key | 否（備用來源） |

> CWA API Key 可至[中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)免費申請。

---

## 技術棧

| 類別      | 選擇                                | 版本              |
| --------- | ----------------------------------- | ----------------- |
| 框架      | Expo (React Native)                 | SDK 55            |
| 語言      | TypeScript                          | 5.9 (strict mode) |
| 路由      | Expo Router                         | v4                |
| 狀態管理  | Zustand + TanStack Query            | v5 / v5           |
| 樣式      | NativeWind (Tailwind CSS)           | v4                |
| 持久化    | MMKV + localStorage polyfill        | v4                |
| Lint      | ESLint Flat Config                  | v9                |
| 格式化    | Prettier                            | v3                |
| 測試      | Playwright (Web) + Maestro (Mobile) | —                 |
| Git Hooks | Husky + lint-staged                 | —                 |

---

## 專案結構

```
weather/
├── app/                    # Expo Router 檔案式路由
│   ├── _layout.tsx         # Root Layout
│   ├── index.tsx           # 首頁
│   ├── forecast/           # 預報頁面
│   ├── history.tsx         # 歷史天氣
│   ├── locations.tsx       # 地點管理
│   └── settings.tsx        # 設定
├── src/
│   ├── api/                # API 整合層（adapters + service）
│   ├── aggregator/         # 聚合引擎
│   ├── components/         # UI 組件
│   ├── hooks/              # 自訂 Hooks
│   ├── store/              # Zustand stores
│   ├── cache/              # 快取層
│   ├── utils/              # 工具函式
│   └── constants/          # 常數定義
├── e2e/                    # Playwright E2E 測試
├── .maestro/               # Maestro Mobile E2E 測試
└── __tests__/              # 單元測試
```

詳細架構設計請參閱 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 開發指令

```bash
# 開發
pnpm start              # 啟動 Expo 開發伺服器
pnpm ios                # iOS 模擬器
pnpm android            # Android 模擬器
pnpm web                # Web 瀏覽器

# 程式碼品質
pnpm lint               # ESLint 檢查
pnpm lint:fix           # ESLint 自動修復
pnpm format             # Prettier 格式化
pnpm format:check       # Prettier 檢查
pnpm type-check         # TypeScript 型別檢查

# 測試
pnpm test:e2e:web       # Playwright Web E2E
pnpm test:e2e:mobile    # Maestro Mobile E2E
```

---

## 貢獻指南

1. Fork 此專案
2. 建立功能分支（`git checkout -b feature/my-feature`）
3. 確保通過所有檢查：
   ```bash
   pnpm type-check && pnpm lint && pnpm format:check
   ```
4. Commit（遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式）
5. 推送分支並建立 Pull Request

> Pre-commit hook（Husky + lint-staged）會自動執行 ESLint 修復與 Prettier 格式化。

---

## 相關文件

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系統架構設計
- [FEATURES.md](./FEATURES.md) — 詳細功能說明
- [DECISIONS.md](./DECISIONS.md) — 架構決策記錄（ADR）
- [DEVELOPMENT.md](./DEVELOPMENT.md) — 開發指南
- [API.md](./API.md) — 天氣 API 整合說明
- [TESTING.md](./TESTING.md) — 測試策略
- [CHANGELOG.md](./CHANGELOG.md) — 版本變更記錄
