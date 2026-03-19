# tw-weather Design System

本文件是專案唯一的 UI / UX 設計規格來源。

---

## 1. 設計定位

### 風格關鍵詞

**Quiet Utility / Calm Clarity**

- 可信
- 安靜
- 清楚
- 有質感
- 現代
- 在地
- 適合長時間閱讀

### 產品氣質

- 像可靠的生活工具，不像華麗的資訊展示板
- 有現代感，但不靠炫技表現質感
- 高頻查看時不刺眼、不吵、不疲勞
- 第一眼先看到結論，不先看到裝飾
- 一頁只允許一個主視覺焦點

### 視覺語言

- 乾淨底色
- 清楚層級
- 低飽和主色
- 現代而克制的細節
- 柔和圓角
- 輕微陰影與邊框
- 可用**低強度** glass / translucent surface

### 禁則

- 不做重玻璃感
- 不做高彩度大面積漸層
- 不做擬物化天氣插畫主畫面
- 不讓裝飾壓過資訊可讀性

---

## 2. 色彩系統

使用 **semantic tokens**，元件內不要直接寫 raw hex。

### Light Theme

```ts
export const lightColors = {
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF2F7',
  surfaceTertiary: '#E7ECF3',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textInverse: '#F8FAFC',

  primary: '#2563EB',
  primarySoft: '#DBEAFE',
  primaryMuted: '#93C5FD',

  accentSky: '#0EA5E9',
  accentSun: '#F59E0B',
  accentRain: '#0284C7',
  accentCloud: '#94A3B8',

  border: '#D7DEE8',
  borderStrong: '#C2CCD8',

  success: '#0F766E',
  warning: '#B45309',
  error: '#B91C1C',
  info: '#0369A1',

  tabInactive: '#64748B',
  tabActive: '#2563EB',
  iconPrimary: '#334155',
  iconSecondary: '#64748B',

  scrim: 'rgba(15, 23, 42, 0.45)',
};
```

### Dark Theme

```ts
export const darkColors = {
  background: '#0B1220',
  surface: '#111827',
  surfaceSecondary: '#172133',
  surfaceTertiary: '#1E293B',

  textPrimary: '#E5EEF8',
  textSecondary: '#B6C2D1',
  textTertiary: '#8A99AD',
  textInverse: '#0F172A',

  primary: '#60A5FA',
  primarySoft: '#1D4ED8',
  primaryMuted: '#3B82F6',

  accentSky: '#38BDF8',
  accentSun: '#FBBF24',
  accentRain: '#60A5FA',
  accentCloud: '#94A3B8',

  border: '#243244',
  borderStrong: '#334155',

  success: '#2DD4BF',
  warning: '#F59E0B',
  error: '#F87171',
  info: '#38BDF8',

  tabInactive: '#7C8CA1',
  tabActive: '#93C5FD',
  iconPrimary: '#D6E2F0',
  iconSecondary: '#94A3B8',

  scrim: 'rgba(2, 6, 23, 0.60)',
};
```

### 使用原則

- `background`：整頁背景
- `surface`：主要卡片
- `surfaceSecondary`：次層容器 / 分組背景
- `surfaceTertiary`：pressed / selected 背景
- `textPrimary`：核心資訊
- `textSecondary`：次要資訊
- `primary`：焦點、CTA、選中狀態
- `accent*`：天氣類型點綴，不作大片底色

### 色彩規則

- 主色藍只用在導航、焦點、互動
- 狀態色只用於狀態，不用於大面積裝飾
- 避免整頁彩色背景
- dark mode 不是 light mode 反相
- 低強度玻璃感可以使用，但不可犧牲：
  - 對比
  - 邊界清晰度
  - 長時間閱讀舒適度

---

## 3. 字級、間距、密度

## Typography

- 系統字優先
- body 最小不要低於 `14`
- 內容行高維持 `1.4–1.6`
- 數字資訊建議使用 tabular figures

### Type Scale

```ts
export const typeScale = {
  displayLg: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
  displayMd: { fontSize: 32, lineHeight: 40, fontWeight: '700' },

  titleXl: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  titleLg: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  titleMd: { fontSize: 18, lineHeight: 26, fontWeight: '600' },

  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },

  labelLg: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  labelMd: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  labelSm: { fontSize: 12, lineHeight: 16, fontWeight: '600' },

  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
};
```

### 使用建議

- 現在溫度：`displayLg`
- 城市名 / 卡片主標：`titleLg`
- 區塊標題：`titleMd`
- 內文 / 預報條目：`bodyLg` 或 `bodyMd`
- 時間 / 資料來源 / 次要說明：`bodySm` 或 `caption`
- tab label / settings label：`labelMd`

## Spacing

採 **4pt / 8pt** 系統。

```ts
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
};
```

### 間距規則

- page gutter：`16`
- section gap：`24–32`
- card padding：`16`
- 緊密資訊群：`8`
- label 與 value：`4–8`
- list row 垂直 padding：`12–16`
- tab bar 可視 padding：`8–10`

## Radius / Border

```ts
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const borderWidth = {
  hairline: 1,
  regular: 1,
  strong: 1.5,
};
```

### 建議對應

- badge / chip：`sm`
- settings row / list cell：`md`
- weather card：`lg`
- sheet / modal：`xl`

## 資訊密度規則

不是每個區塊、每個 row 都需要 description / hint / summary。

### 高頻、低風險、易理解

- 只顯示 `title`
- 例：淺色模式 / 深色模式

### 中等理解成本

- 顯示 `title + description`
- 例：單一資料源 / 聚合模式

### 高理解成本、影響資料結果

- 顯示 `title + description + hint / footer`
- 例：溫度聚合 / 降雨判定

## Row 密度分級

### Compact row

- 僅 `title`
- 建議高度：`56`

### Comfort row

- `title + description`
- 或 `title + description + hint`
- 建議高度：`64–72`

### 規則

- 刪掉 description / hint 後，row 應自動收緊
- 不可保留大面積空白
- 同一 section 內盡量維持相近密度

---

## 4. 頁面結構

### Page 結構

每個頁面優先遵守：

1. **Page Header**
   - 頁面名稱
   - 一句用途說明（可省略）
   - 必要時顯示摘要狀態
2. **Primary Section**
   - 該頁最重要的資訊或操作
   - 一頁只允許一個主焦點
3. **Secondary Sections**
   - 補充資訊
   - 次要操作
   - 進階設定
4. **Footer Note / Help Text**
   - 只在需要補充限制、條件、風險時出現

### 分組邏輯

區塊排序優先看：

1. 使用頻率
2. 理解難度
3. 影響範圍

### Section 規格

每個 section 可包含：

- `icon`
- `title`
- `description`（可選）
- `summary`（可選）
- `footer note`（可選）

### Summary 使用條件

只有以下情況才顯示 summary：

- 使用者需要快速回看目前狀態
- 狀態不在列表中直接可見
- 畫面需要降低掃描成本

適合：

- `溫度：平均 / 降雨：任一來源`
- `目前啟用 2 個來源`

不一定需要：

- 主題切換只有 2 個 radio，且選中狀態已很清楚
- 區塊內容本身就已直接表達目前設定

### 設定頁極簡模式

工具型 app 的設定頁預設採 **極簡模式**：

- Header 可只有 title
- Section 可只有 icon + title
- Row 預設只顯示必要資訊
- 只有在選項會影響資料結果、判讀邏輯或有風險時，才補充說明文字

---

## 5. 元件規則

## A. Card

### 目標

- 一眼知道這張卡回答什麼問題
- 第一層資訊 1 秒內掃到
- 第二層資訊不干擾第一層

### 結構

1. **Header**
   - 標題
   - 時間 / 更新時間 / 資料來源
2. **Primary Content**
   - 主指標：現在溫度、降雨機率、今日高低溫
3. **Secondary Content**
   - 濕度、風速、體感、空氣品質等輔助資訊

### 視覺規則

- 卡片背景使用 `surface`
- 用 border + soft shadow 建層級
- 主要數值大，輔助數值小
- 卡片內最多 1 個強調色
- icon 只能輔助辨識，不能搶主數值

### 建議樣式

- padding：`16`
- gap：`12`
- radius：`18`
- border：`1px`
- pressed state：只改背景或 opacity，不做明顯縮放跳動

### Weather Card 補充

- 首頁 hero card 仍要克制
- 不要滿版天氣插畫
- 可用微弱天氣色點綴：
  - 晴天：上緣淡暖色
  - 雨天：上緣淡冷藍

## B. List

### 適用場景

- 逐時預報
- 每日預報
- 地點清單
- 歷史資料條目

### 結構

- 左：時間 / 日期 / 地點
- 中：主要摘要
- 右：關鍵值或 chevron

### 規則

- 每列高度至少 `56–72`
- 列與列之間可用 divider 或小間距群組
- 行內資訊不超過 3 層
- 數值欄位建議右對齊
- 欄位節奏需一致

## C. Settings Item

### 氣質

- 系統感
- 平靜
- 高可讀
- 不像 marketing 頁面

### 結構

- 左：icon + title + optional description
- 右：switch / value / chevron
- 支援 disabled / destructive / selected

### 文案規則

- `title`：必要
- `description`：title 不足以解釋時才補
- `hint`：需要說明影響、限制、風險時才出現
- `footer note`：只保留重要提醒

### 建議長度

- section description：`0–1 行`
- row description：`0–1 行`
- hint：能刪就刪
- footer note：只留限制條件或真正重要提醒

### 規則

- 高度至少 `56`
- 有副文字可到 `68–72`
- icon 容器固定大小
- switch 類 item 整列可點
- destructive item 單獨分組

### 設定頁建議順序

1. 外觀
2. 資料來源
3. 資料整合方式
4. 單一資料源（僅在 single mode 顯示）
5. 聚合規則（僅在 aggregate mode 顯示）

### 模式對應規則

- `single mode` 必須明確提供 `active source` 選擇
- `active source` 只顯示目前已啟用的來源
- 切回 `single mode` 時，使用者要能一眼看出目前實際使用哪個來源
- `aggregate mode` 顯示聚合規則時，優先提供目前規則摘要，避免使用者逐列掃描

### 視覺層級規則

- settings 頁的 section header 應比 row 有更明確的層級，但不可比主頁核心天氣卡更搶眼
- summary chip 用於快速回看狀態，視覺重量必須低於 section title
- `selected` row 可以用淡色底 + 主色文字表達，不可只靠 radio / switch 本體
- light mode 以高可讀淺面為主，不應使用低對比半透明白字卡
- dark mode 以深色實面為主，不應讓次要文字掉到過低對比

### 互動狀態規則

- settings row pressed state 只允許背景或 opacity 微調，不做明顯縮放
- segmented control 適合 2–3 個互斥的低風險選項，例如 theme mode
- switch row 必須整列可點，且 switch 本身仍可直接操作
- selected / disabled / error 狀態都要同時提供語意與視覺差異

### Light / Dark 對比規則

- `onSurface` 與 `surfaceContainer` 必須優先確保正文可讀，再考慮玻璃感
- light mode：正文應接近深藍灰，不使用白字覆在淺半透明卡上
- dark mode：次要文字最低仍需保持明顯可辨，避免只有 60% 白造成模糊感
- border 在兩種模式下都必須可見，不能只靠陰影分層
- decorative blur 在工具型頁面需降到低干擾，避免與正文競爭

## E. Form / State

### 狀態優先級

1. readable
2. tappable
3. stateful
4. decorative

### 表單與狀態規則

- helper text 僅在有決策成本時出現
- success / selected 狀態可共享品牌主色語言，但不可等同錯誤或警告色
- disabled 狀態除了降 opacity，也要保留可辨識文字輪廓
- 錯誤訊息必須比次要說明更醒目，但不能破壞整體節奏
- 若頁面屬高頻工具型操作，優先選擇穩定、接近原生的控件樣式

## D. Tab Bar

### 原則

- 穩定
- 可預期
- 單手拇指易觸及
- 不過度搶視覺焦點

### 規則

- top-level tabs 最多 `5` 個
- 每個 tab 必須有 icon + label
- active 狀態用 color + weight + indicator 表達
- inactive 不可低對比到看不見
- tab bar 要保留 safe area padding

### 建議樣式

- 背景：`surface`
- 上方細分隔線：`border`
- 高度：內容區約 `56` + safe area
- icon：`22–24`
- label：`12–13`

### 不建議

- 大量模糊
- 過亮發光 active icon
- 只有 icon 沒文字
- 浮動巨大膠囊式 tab bar

---

## 6. Accessibility / Touch / Spacing Checklist

### Accessibility

- 對比足夠
- 狀態不能只靠顏色表達
- icon-only 元件必須有 `accessibilityLabel`
- 字體放大後內容仍可讀
- reduced motion 與 dark mode 都要可用

### Touch

- 最小可點區域 `44x44`，建議 row 高度 `56+`
- 相鄰可點元素至少 `8` 間距
- 不依賴 hover
- 按壓回饋在 `100ms` 內可見
- 不可因按壓造成 layout shift

### Spacing

- page gutter：`16`
- section gap：`24–32`
- card padding：`16`
- row 內節奏一致
- 底部內容不可被 tab bar / safe area 擋住

---

## 7. Anti-patterns

## 視覺

1. 過度天氣擬物
2. 高飽和全彩卡片
3. 過強玻璃感 / 模糊
4. 過多陰影
5. 把狀態色當品牌色亂用

## 資訊架構

6. 首頁塞太多維度
7. 主次資訊同權重
8. 只靠顏色區分狀態
9. 資料來源資訊藏太深
10. 每個設定都加滿說明文字
11. 刪掉文案後仍保留大面積空白

## 互動

12. 點擊區太小
13. 把 hover 思維搬到 mobile
14. 過度動畫
15. 按壓回饋造成 layout shift
16. 底部 tab 與內容搶空間

## Dark Mode

17. 直接反相 light theme
18. 使用純黑 + 純白
19. divider / 邊界在暗色中消失

---

## 8. NativeWind 實作建議

### Token 分層

- `colors`
- `spacing`
- `radius`
- `typography`
- `elevation`
- `motion`

### class 命名方向

- `bg-bg`
- `bg-surface`
- `bg-surface-2`
- `text-primary`
- `text-secondary`
- `border-default`
- `text-weather-rain`
- `text-weather-sun`

避免在 component 內直接出現：

- `bg-blue-500`
- `text-slate-700`
- `rounded-2xl`

應先定 semantic token，再在 NativeWind theme 對應。

---

## 9. 一頁摘要版

### Style

- Quiet Utility / Calm Clarity
- minimal、可信、有質感、現代、低裝飾、清楚分層
- light / dark 同時設計
- 適合單手操作與長時間閱讀

### Color

- 基底：藍灰中性色
- 品牌：穩定中性藍
- 天氣色：只點綴，不主導畫面
- semantic tokens 優先

### Typography

- 主字級：14 / 15 / 16 / 18 / 20 / 24 / 32 / 40
- 行高寬鬆
- 主數值大、次資訊退後
- 數字可用 tabular

### Spacing

- 4pt / 8pt system
- page gutter 16
- card padding 16
- section gap 24–32
- row 依內容密度分 compact / comfort

### Components

- card：三層結構，主數值優先
- list：固定欄位節奏，右側關鍵值
- settings：系統感、分組清楚、預設極簡、必要時才補說明
- tab bar：icon + label，最多 5 個，穩定低干擾

### Avoid

- 彩色大片背景
- 擬物天氣插畫主畫面
- 過強玻璃感
- 過多陰影
- 過度動畫
- 僅靠顏色表意
- 每個設定都塞滿說明文字
- 刪掉文案後仍保留大面積空白
