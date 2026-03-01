# CLAUDE.md

此檔案提供給 Claude Code（claude.ai/code）在此專案中工作時的指引。

---

## 專案概覽

**tw-weather** — 台灣天氣跨平台應用

- **框架**：Expo SDK 55 + React Native 0.83 + TypeScript 5.9 (strict mode)
- **支援平台**：iOS / Android / Web
- **套件管理器**：pnpm 10
- **儲存庫**：https://github.com/luzen23141/tw-weather
- **Live Demo**：https://luzen23141.github.io/tw-weather/

---

## 快速開始

### 環境設定

```bash
# 1. 複製專案並安裝依賴
git clone git@github.com:luzen23141/tw-weather.git
cd tw-weather
pnpm install

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env，填入 CWA API Key 與 WeatherAPI Key
```

### 常用開發指令

```bash
# 啟動開發伺服器
pnpm start                 # Expo 開發伺服器
pnpm ios                   # iOS 模擬器
pnpm android               # Android 模擬器
pnpm web                   # Web 瀏覽器

# 程式碼品質檢查
pnpm lint                  # ESLint 檢查
pnpm lint:fix              # ESLint 自動修復
pnpm format                # Prettier 格式化
pnpm format:check          # 檢查格式
pnpm type-check            # TypeScript 型別檢查

# 測試
pnpm test                  # Jest 單元測試
pnpm test:watch            # 監視模式
pnpm test:coverage         # 生成覆蓋率報告（目標 >= 70%）
pnpm test:e2e:web          # Playwright E2E 測試（Web）
pnpm test:e2e:mobile       # Maestro E2E 測試（Mobile）
```

---

## 系統架構

### 高層設計

```
API 層 (Adapters) → Service (統一介面) → Aggregator → UI Hooks → Components
└─ CWA           ├─ Weather Service
├─ Open-Meteo    └─ 自選資料源 + 聚合邏輯
└─ WeatherAPI

狀態管理 (Zustand)：settings.store + locations.store
快取層 (TanStack Query + MMKV)：記憶體 + 持久化
```

### 關鍵路徑

**API 整合層** (`src/api/`)

- `types.ts` — 統一型別定義
- `weather.service.ts` — 統一 Weather Service，管理 Adapters 與聚合邏輯
- `adapters/` — 多資料源實作 (`cwa.ts` / `open-meteo.ts` / `weatherapi.ts`)

**聚合引擎** (`src/aggregator/`)

- `AggregationEngine.ts` — 聚合演算法（溫度：聯集/平均/中位數；降雨：任一/全部/半數）

**狀態管理** (`src/store/`)

- `settings.store.ts` — 單位、主題、資料源選擇
- `locations.store.ts` — 位置管理（當前位置 + 收藏位置）

**快取策略** (`src/cache/`)

- `keys.ts` — Cache Key 設計 + TTL 過期策略
- TanStack Query (記憶體) + MMKV (持久化)
- 歷史天氣永不過期，30 天 lazy cleanup

**路由** (`app/`)

- Expo Router v4 檔案式路由
- Tabs 導航結構：首頁 / 逐時預報 / 每日預報 / 歷史天氣 / 地點管理 / 設定

**UI 組件** (`src/components/`)

- CurrentWeatherCard — 當前天氣卡
- HourlyForecastList / DailyForecastList — 預報列表
- LoadingSpinner / ErrorBoundary — 通用組件

---

## 程式碼規範

### TypeScript 嚴格設定

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**關鍵規則**：

- 陣列索引回傳 `T | undefined`，**必須** 做 nullish check
- 禁止 `any` 型別，除非使用 `@ts-ignore` 且註記理由
- 禁止非 null assertion (`!`)

### ESLint 規則（Flat Config v9）

- `@typescript-eslint/strict-type-checked` — 最嚴格規則集
- `no-explicit-any` → error
- `no-non-null-assertion` → error
- 僅允許 `console.warn` 和 `console.error`（禁止 `console.log`）
- Import 排序：builtin → external → internal → parent → sibling → index

### Prettier 格式化

- Print Width: 100
- Tabs: 2 spaces
- Pre-commit hook 自動執行（Husky + lint-staged）

### Path Alias

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./app/*"]
    }
  }
}
```

---

## 核心功能

### 1. 多資料源整合

三大天氣資料來源，各有特色：

- **CWA 中央氣象署** — 台灣最精準，支援即時觀測 + 3 日逐時預報 + 1 週每日預報
- **Open-Meteo** — 免費無限，支援預報 + 最多 92 天歷史資料
- **WeatherAPI.com** — 備用來源，支援預報 + 7 天歷史

### 2. 自選資料源模式

使用者可自由開啟/關閉任一資料源，非固定主備模式。選擇儲存於 `settings.store`。

### 3. 聚合模式（Aggregate Mode）

當多來源啟用時，透過自訂規則聚合：

- **溫度** — 聯集範圍 / 平均 / 中位數 / 指定來源
- **降雨** — 任一來源有雨 / 全部有雨 / 半數有雨 / 自定義數量
- **其他指標** — 濕度、風速、UV、能見度各有獨立閾值

### 4. 快取與離線支援

- TanStack Query (v5) — 記憶體快取 + 後台重取
- MMKV (v4.1.2) — 本地持久化儲存
- 離線時顯示上次快取資料 + 最後更新時間標示
- 歷史天氣永不過期，30 天 lazy cleanup

### 5. 台灣在地化

涵蓋 368 鄉鎮市區，預報精細度最高。

---

## 測試策略

### 單元測試（Jest）

- 覆蓋率目標：>= 70%
- 位置：`src/**/*.test.ts` 或 `__tests__/`
- 執行：`pnpm test` / `pnpm test:watch` / `pnpm test:coverage`
- 配置：`jest.config.ts`（使用 jest-expo preset）

### E2E 測試（Web）

- 框架：Playwright v1.58+
- 位置：`e2e/`
- 執行：`pnpm test:e2e:web`
- CI 整合：GitHub Actions

### E2E 測試（Mobile）

- 框架：Maestro
- 位置：`.maestro/`
- 執行：`pnpm test:e2e:mobile`
- CI 整合：GitHub Actions

---

## CI/CD 流水線

### GitHub Actions

**ci.yml** — Lint + Type Check + Unit Tests

- 觸發：Push to `main` or PR to `main`
- 步驟：依賴安裝 → 型別檢查 → ESLint → Jest (+ Coverage 上傳)

**e2e.yml** — Playwright E2E 測試（Web）

- 觸發：Push to `main` or PR to `main`
- 失敗時上傳 playwright-report 至 artifacts

**deploy-pages.yml** — GitHub Pages 自動部署

- 觸發：Push to `main`

---

## 環境變數

### .env 設定

```bash
# 必要
EXPO_PUBLIC_CWA_API_KEY=your_cwa_api_key

# 選填（備用資料源）
EXPO_PUBLIC_WEATHERAPI_KEY=your_weatherapi_key
```

### 申請 API Key

- **CWA**：https://opendata.cwa.gov.tw/ （免費申請）
- **WeatherAPI**：https://www.weatherapi.com/（免費方案限制）

---

## 擴展指南

### 新增天氣來源

1. **型別定義** (`src/api/types.ts`)
   - `WeatherSource` enum 新增 ID

2. **實作 Adapter** (`src/api/adapters/mynewsource.ts`)
   - 實作 `WeatherApiAdapter` 介面
   - 考量 API 限制、免費額度、精準度

3. **註冊 Service** (`src/api/weather.service.ts`)
   - `getSourceAdapter()` 新增 case

4. **更新 Store** (`src/store/settings.store.ts`)
   - `enabledSources` 預設值新增

5. **更新 UI** (`app/settings.tsx`)
   - 新增 Toggle 開關

### 新增新頁面（使用 Expo Router）

```typescript
// app/mynewpage.tsx
import { View, Text } from 'react-native';

export default function MyNewPage() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>New Page</Text>
    </View>
  );
}
```

路由自動註冊，無需額外設定。

---

## 技術選型

| 類別       | 選擇                        | 版本   | 理由                         |
| ---------- | --------------------------- | ------ | ---------------------------- |
| 框架       | Expo                        | SDK 55 | 跨平台一體化                 |
| 語言       | TypeScript                  | 5.9    | 型別安全 + strict mode       |
| 路由       | Expo Router                 | v4     | 檔案式路由，減少設定         |
| 狀態管理   | Zustand                     | v5     | 輕量、API 簡潔               |
| 非同步查詢 | TanStack Query              | v5     | 強大快取機制                 |
| 樣式       | NativeWind                  | v4     | Tailwind CSS 於 React Native |
| 持久化     | MMKV                        | v4.1.2 | 比 AsyncStorage 快 10 倍     |
| Lint       | ESLint                      | v9     | Flat Config，嚴格規則        |
| 格式化     | Prettier                    | v3     | 自動化一致性                 |
| 測試       | Jest + Playwright + Maestro | —      | 單元 + Web E2E + Mobile E2E  |

---

## 常見問題

### Q: 如何新增單位換算（如 km/h 轉 mph）？

**A**: `src/utils/unit-conversion.ts` — 所有轉換邏輯集中於此。新增函式後記得補單元測試。

### Q: 如何修改快取 TTL？

**A**: `src/cache/keys.ts` — 修改 `getTTL()` 函式或個別 key 的 config。

### Q: 如何除錯聚合邏輯？

**A**: `src/aggregator/AggregationEngine.ts` — 使用 `console.warn`（不要 `console.log`）。也可寫單元測試驗證。

### Q: 為什麼陣列索引檢查這麼嚴格？

**A**: TypeScript strict mode + `noUncheckedIndexedAccess` 防止 undefined 潛在錯誤。務必做 nullish check：`if (arr[i] !== undefined) { ... }`

---

## 相關文件

- `README.md` — 功能特色、快速開始
- `ARCHITECTURE.md` — 詳細系統架構
- `FEATURES.md` — 功能詳解
- `DECISIONS.md` — 架構決策記錄（ADR）
- `DEVELOPMENT.md` — 開發工作流
- `API.md` — API 整合細節
- `TESTING.md` — 測試策略
- `CHANGELOG.md` — 版本變更記錄
