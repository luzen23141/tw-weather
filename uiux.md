# tw-weather UI / UX Team Spec

## AI Usage Contract

本文件主要提供 AI assistant、code reviewer、UI implementer 與 PR reviewer 使用。

### A. 使用順序

AI 在處理任何 UI / UX 任務時，必須依以下順序套用規則：

1. 先讀 `uiux.md`，理解產品氣質、設計邊界、token 規則、元件規則
2. 實作或提出方案時，優先滿足硬性規則，再處理視覺風格
3. 輸出前必須再對照 `ui-checklist.md` 逐項自查
4. 若兩份文件衝突，以 `uiux.md` 為準

### B. 優先級

當多條規則互相拉扯時，優先順序固定為：

1. `readability`：文字可讀、數值可掃讀、對比合格
2. `information hierarchy`：主次資訊清楚，單頁焦點明確
3. `touch & accessibility`：可點、可操作、可讀屏、可放大、reduced motion 可用
4. `consistency`：token、間距、元件狀態一致
5. `performance & stability`：避免 layout shift、避免多餘動畫、避免影響捲動與操作
6. `decorative style`：玻璃感、光影、點綴色、進場效果

### C. 衝突裁決規則

若發生以下衝突，AI 必須採用對應裁決：

- 若 `glass` 與文字可讀性衝突，選 `readability`，改為實色 surface
- 若動畫與資訊理解、效能、reduced motion 衝突，選穩定與清楚，降低或移除動畫
- 若說明文字與 UI 狀態重複，刪除說明文字
- 若裝飾效果與主資訊競爭注意力，削弱裝飾效果
- 若品牌色與 dark mode 對比衝突，先保對比，再調品牌色
- 若畫面資訊過多，先刪 Meta，再整理 Secondary，最後保留 Primary
- 若單一元件需要同時滿足「好看」與「易懂」，先滿足易懂

### D. 輸出要求

AI 產出 UI 方案、設計描述或實作程式碼時，必須遵守：

- 不可引入本文件明確禁止的視覺模式
- 不可在元件內直接硬編 raw hex 當作設計解法
- 不可用抽象形容詞取代具體設計決策
- 不可只提升裝飾層，卻不處理資訊層級、觸控、狀態與 dark mode
- 若需求與本規範相衝突，必須明確指出衝突點，不可默默違反

本文件是專案唯一的 UI / UX 團隊規範。
目標是讓設計、前端與產品在同一套標準下工作，減少風格漂移、資訊過載與實作落差。

文件分工：

- `uiux.md`：完整規範來源（source of truth）
- `ui-checklist.md`：UI 驗收 / PR review / 自查快速清單

若兩份文件有衝突，**以 `uiux.md` 為準**。

---

## 1. Design Principles

### 1.1 產品定位

**Modern Glass Utility / Calm Clarity**

本產品不是純平面工具 UI。
預設應具備可感知的 glass 材質、柔和層次與現代 premium 感。
但所有玻璃效果都必須服務可讀性、資訊層級與操作清晰度，不能為了炫技而存在。

- 現代
- 簡約
- 有質感
- 玻璃感
- 可信
- 安靜
- 清楚
- 在地
- 適合長時間閱讀

### 1.2 核心原則

- 像有質感的現代工具，不像炫技展示頁
- 第一眼先看到結論，再看到裝飾
- 一頁只允許一個主要焦點
- 現代感來自比例、層級、材質與節奏，不來自誇張特效
- 毛玻璃是品牌材質語言之一，但必須低干擾、低強度、可讀性優先
- glass 用來建立層次、聚焦與材質感，不用來表演或搶戲
- 能不解釋就不解釋，能靠 UI 表達就不靠文案補救
- 設定頁屬高頻工具頁，優先追求清楚、對齊一致、低認知負擔，再追求裝飾感
- 若 glass 存在感不足，可增加穿透、邊界與高光；不要只單純增加 blur
- 同一頁面的 icon 語意必須穩定且避免重複，優先選擇最直覺的系統圖示
- 跨頁共用元件優先遵守規範；若改一個共用層能同時修正多頁，就不要先在單頁各自補丁
- 優先刪除非必要包裝層、過度抽象與只為了視覺存在的結構，保持頁面可讀與可維護

### 1.2.1 抽象詞操作化

以下詞彙在 AI 產出時必須轉成具體設計決策，不可只停留在形容詞：

- `可信`：使用穩定中性色、清楚資訊層級、低干擾背景、可預期狀態
- `安靜`：降低高彩度面積、減少強動效、避免同頁多個搶眼區塊
- `清楚`：Primary 明顯、Secondary 退後、Meta 不搶戲、文案短句
- `有質感`：一致 radius、穩定 spacing、克制陰影、克制高光、對比充足
- `現代`：用乾淨比例、token 化、系統化狀態與低干擾 motion 建立，不靠炫技特效
- `簡約`：減少不必要說明與裝飾，保留必要層次，不做空洞極簡
- `玻璃感`：使用半透明 surface、柔和 blur、清楚邊界與穩定對比來建立材質感，不做重霧化與大面積炫光
- `在地`：優先服務台灣天氣使用情境與中文閱讀習慣，不做西式 marketing hero 風格
- `不像展示頁`：避免滿版 hero、避免大面積漸層主背景、避免炫技動畫、避免為裝飾而裝飾

### 1.3 禁則

- 不做重玻璃感
- 不做高彩度大面積漸層
- 不做擬物化天氣插畫主畫面
- 不讓裝飾壓過資訊可讀性
- 不做無功能性的裝飾動畫
- 不做依賴背景變化才成立的半透明文字區塊
- 不做大面積炫光、鏡面反射、流動光帶
- 不用額外 wrapper、config 陣列或無重用價值的抽象，增加閱讀與維護成本

---

## 2. Color & Contrast

使用 **semantic tokens**。元件內禁止直接寫 raw hex。

### 2.1 Light Theme

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

### 2.2 Dark Theme

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

### 2.3 Token 用途

- `background`：整頁背景
- `surface`：主要卡片
- `surfaceSecondary`：次層容器 / 分組背景
- `surfaceTertiary`：pressed / selected 背景
- `textPrimary`：核心資訊
- `textSecondary`：次要資訊
- `textTertiary`：metadata
- `primary`：焦點、CTA、選中狀態
- `accent*`：天氣點綴，不作大面積底色

### 2.4 色彩規則

- 主色藍只用在導航、焦點、互動
- 狀態色只用於狀態，不用於大面積裝飾
- 避免整頁彩色背景
- dark mode 不是 light mode 反相
- border 在 light / dark 都必須可見，不能只靠陰影分層

### 2.5 對比硬性規則

- 正文文字與背景對比至少 `4.5:1`
- 大字、粗體大標與背景對比至少 `3:1`
- `textSecondary` 不可用於核心天氣數值或主要操作文字
- `textTertiary` 只可用於 metadata，不可承載重要資訊
- 半透明 surface 放正文前必須驗證對比；不通過就改實底
- 禁止使用淺底白字、低對比灰字、或依賴文字陰影補救可讀性
- 禁止把正文直接放在高變化漸層、照片、強烈天氣色塊上

### 2.6 AI 判定規則

- 若核心數值、主要按鈕、主要標題使用 `textSecondary` 或 `textTertiary`，判定為不通過
- 若任何正文需要依靠陰影、模糊或背景亮度碰運氣才看得清楚，判定為不通過
- 若半透明 surface 上無法穩定保證前景對比，AI 必須改成實底，不可保留原設計

---

## 3. Typography

### 3.1 原則

- 系統字優先
- 正文預設優先使用 `15` 或 `16`
- `14` 只用於次要說明、輔助資訊、列表次層內容
- `12` 只用於 caption / metadata，不可承載關鍵資訊
- 內容行高維持 `1.4–1.6`
- 數字資訊建議使用 tabular figures
- 長時間閱讀區避免過細字重或過緊字距

### 3.2 Type Scale

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

### 3.3 使用對應

- 現在溫度：`displayLg`
- 城市名 / 卡片主標：`titleLg`
- 區塊標題：`titleMd`
- 內文 / 預報條目：`bodyLg` 或 `bodyMd`
- 時間 / 資料來源 / 次要說明：`bodySm` 或 `caption`
- tab label / settings label：`labelMd`

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

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

### 4.2 間距規則

- page gutter：`16`
- section gap：`24–32`
- card padding：`16`
- 緊密資訊群：`8`
- label 與 value：`4–8`
- list row 垂直 padding：`12–16`
- tab bar 可視 padding：`8–10`

### 4.3 Radius / Border

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

### 4.4 元件對應

- badge / chip：`sm`
- settings row / list cell：`md`
- weather card：`lg`
- sheet / modal：`xl`

### 4.5 版面規則

- 一頁只允許一個主要焦點
- Primary 內容放在視線起點
- Secondary 緊鄰 Primary
- Meta 靠後，不能搶過 Secondary
- 若一區塊超過三層資訊，應拆區塊，不應繼續加文案
- 底部內容不可被 tab bar / safe area 擋住

### 4.6 AI 版面裁決

- 若單頁同時存在兩個以上高權重視覺焦點，AI 必須刪減或降權其中至少一個
- 若加入新區塊會讓 Primary 區塊失焦，AI 應延後、折疊或移除新區塊
- 若 row、card、section 因文案減少而留下大面積空白，AI 必須同步收緊密度

---

## 5. Glass / Translucent Surface

玻璃感是本產品的核心材質語言之一，但必須克制、可讀、可重複使用。
它可以明確存在，但不能變成炫技效果。

### 5.1 可使用場景

- header overlay
- tab bar / floating control
- modal / sheet surface
- hero card
- hero card 的次層裝飾
- section header container
- 關鍵篩選 / segmented control 外框

### 5.2 不可使用場景

- 長文閱讀區
- 設定頁主要資訊卡全文區
- 大量列表 row 背景
- 主要表單輸入區底板
- 會造成資訊混濁的多層重疊玻璃

### 5.3 強度限制

- blur 建議範圍：`8–16`
- blur 不可超過：`20`
- light theme surface alpha：`0.72–0.88`
- dark theme surface alpha：`0.78–0.90`
- 同一畫面高存在感 glass 區塊建議不超過 `2–3` 個

### 5.4 必備條件

- 必須有清楚 border
- 必須有穩定文字對比
- 必須可獨立成立，不依賴背景圖案
- 若文字可讀性下降，優先改為實色 surface
- 必須有一致的 blur、alpha、border、highlight 規則，不可每個區塊各自發揮
- 若要讓 glass「看得出來」，至少同時具備：半透明 surface、背景 blur、可見邊界、微弱高光
- glass 應看起來像材質，不應只像一張透明度降低的普通卡片

### 5.5 AI 使用規則

- glass 可用於 hero card、tab bar、overlay、sheet 等關鍵材質層，但需控制總量
- 若同頁已存在 card、section、tab bar 等多個 layer，AI 不可再額外疊加重玻璃效果
- 若 glass 只提供「看起來比較酷」但不提供層級價值，應移除
- 若 glass 已能表達材質感，就不要再疊加 glow、shine、粒子、強漸層
- 優先做「清楚的玻璃」，不要做「誇張的玻璃」
- 若某個頁面已有足夠 glass 存在感，應優先減少裝飾數量，而不是繼續加 blur 或粒子
- 背景裝飾只能作為 glass 的支撐層，不可變成主視覺

### 5.6 Glass Token 規範

glass token 是本產品材質系統的一部分，必須以 semantic token 管理，不可在元件內各自硬寫 blur、alpha、border 與 highlight。

#### 規範原則

- glass token 只定義材質，不直接定義內容層級
- 同一層級的 glass surface 必須共用同一套 token
- light / dark theme 必須分開定義，不可直接反相
- glass token 的目的，是讓 hero card、tab bar、sheet、overlay 有一致材質語言
- 若某個元件需要例外 glass 樣式，必須先證明現有 token 不足，不可先自創變體

#### token 分層

- `glass.surface.*`：半透明底色與透明度
- `glass.border.*`：玻璃邊界線
- `glass.highlight.*`：玻璃高光 / edge highlight
- `glass.blur.*`：背景模糊等級
- `glass.shadow.*`：玻璃材質對應的柔和陰影
- `glass.overlay.*`：特定場景的組合型 token（tab bar、sheet、hero 等）

#### 命名規則

- 使用 `weak / base / strong` 表示材質存在感
- 使用 `hero / tabBar / sheet / header` 表示場景，不使用臨時命名
- 同類 token 命名需能同時對應 light / dark

#### 實作規則

- component 不可直接寫 `backdropBlur: 14`、`backgroundColor: rgba(...)` 當最終方案
- 應先對應 glass token，再由元件引用
- 若不需要玻璃材質，優先使用 `surface` / `surfaceSecondary`，不要硬套 glass token

### 5.7 Weather App Glass Design Tokens

以下 token 為本專案推薦實作值，可直接作為 design token base。

```ts
export const glassTokens = {
  light: {
    blur: {
      sm: 8,
      md: 12,
      lg: 16,
    },

    surface: {
      weak: 'rgba(255, 255, 255, 0.72)',
      base: 'rgba(255, 255, 255, 0.80)',
      strong: 'rgba(255, 255, 255, 0.88)',
    },

    border: {
      weak: 'rgba(255, 255, 255, 0.32)',
      base: 'rgba(255, 255, 255, 0.44)',
      strong: 'rgba(255, 255, 255, 0.58)',
    },

    highlight: {
      weak: 'rgba(255, 255, 255, 0.16)',
      base: 'rgba(255, 255, 255, 0.24)',
      strong: 'rgba(255, 255, 255, 0.32)',
    },

    shadow: {
      soft: 'rgba(15, 23, 42, 0.08)',
      base: 'rgba(15, 23, 42, 0.12)',
    },

    overlay: {
      hero: {
        blur: 16,
        surface: 'rgba(255, 255, 255, 0.82)',
        border: 'rgba(255, 255, 255, 0.48)',
        highlight: 'rgba(255, 255, 255, 0.28)',
      },
      tabBar: {
        blur: 14,
        surface: 'rgba(255, 255, 255, 0.84)',
        border: 'rgba(255, 255, 255, 0.42)',
      },
      sheet: {
        blur: 16,
        surface: 'rgba(255, 255, 255, 0.88)',
        border: 'rgba(255, 255, 255, 0.50)',
      },
      header: {
        blur: 10,
        surface: 'rgba(255, 255, 255, 0.74)',
        border: 'rgba(255, 255, 255, 0.36)',
      },
    },
  },

  dark: {
    blur: {
      sm: 8,
      md: 12,
      lg: 16,
    },

    surface: {
      weak: 'rgba(17, 24, 39, 0.78)',
      base: 'rgba(17, 24, 39, 0.84)',
      strong: 'rgba(23, 33, 51, 0.90)',
    },

    border: {
      weak: 'rgba(148, 163, 184, 0.18)',
      base: 'rgba(148, 163, 184, 0.26)',
      strong: 'rgba(191, 219, 254, 0.34)',
    },

    highlight: {
      weak: 'rgba(255, 255, 255, 0.04)',
      base: 'rgba(255, 255, 255, 0.08)',
      strong: 'rgba(255, 255, 255, 0.12)',
    },

    shadow: {
      soft: 'rgba(2, 6, 23, 0.24)',
      base: 'rgba(2, 6, 23, 0.32)',
    },

    overlay: {
      hero: {
        blur: 16,
        surface: 'rgba(17, 24, 39, 0.86)',
        border: 'rgba(148, 163, 184, 0.28)',
        highlight: 'rgba(255, 255, 255, 0.10)',
      },
      tabBar: {
        blur: 14,
        surface: 'rgba(17, 24, 39, 0.88)',
        border: 'rgba(148, 163, 184, 0.24)',
      },
      sheet: {
        blur: 16,
        surface: 'rgba(23, 33, 51, 0.90)',
        border: 'rgba(148, 163, 184, 0.30)',
      },
      header: {
        blur: 10,
        surface: 'rgba(17, 24, 39, 0.80)',
        border: 'rgba(148, 163, 184, 0.20)',
      },
    },
  },
};
```

### 5.8 Glass Token 使用對應

- `hero weather card`
  - 優先使用：`glass.overlay.hero`
  - 可搭配低強度天氣色點綴，但不可蓋過主要數值

- `tab bar / floating navigation`
  - 優先使用：`glass.overlay.tabBar`
  - 不可再額外疊加強 glow 或大面積 gradient

- `sheet / modal`
  - 優先使用：`glass.overlay.sheet`
  - 若內容為長文或高密度設定，應退回實色 surface

- `page header overlay`
  - 優先使用：`glass.overlay.header`
  - 只作弱層次，不可搶走頁面主卡焦點

- `settings section card`
  - 可使用接近 `glass.overlay.header` 或 `glass.surface.base + glass.blur.md/lg` 的組合
  - 必須保留清楚邊界與頂部微高光
  - 若只有 blur 沒有材質邊界，視為 glass 不成立
  - 同頁 section card 的 glass 規則必須一致，不可每個 section 各自調一套透明度或邊框

- `secondary decorative glass`
  - 使用：`glass.surface.weak` + `glass.blur.sm`
  - 只作陪襯，不承載高密度資訊

### 5.9 Glass Token 禁則

- 不可同時混用多套 border 色與 blur 值製造「看起來比較設計」的效果
- 不可在同一元件同時使用 glass + 強 glow + 強陰影 + 高彩 gradient
- 不可把 glass token 套在所有 card 上，導致畫面失去層級差異
- 不可讓 glass token 破壞文字對比、點擊辨識或滾動穩定性

---

## 6. Motion / Animation

### 6.1 原則

- 該動的地方要動，但只做功能性動畫
- 動畫目的是幫助理解狀態變化、層級切換、內容載入
- 不做表演型、持續型、搶注意力的動效

### 6.2 必須有動畫的地方

- page / route 切換
- modal / sheet 開關
- tab / segmented control 切換
- pressed / selected / expanded state 變化
- loading 超過 `300ms` 時的 skeleton 或淡入切換

### 6.3 可選動畫

- 卡片進場
- 小量 list row 淡入
- 圖表初次載入淡入

### 6.4 不應使用的動畫

- 背景持續漂浮
- 大面積光暈流動
- 無意義的天氣粒子特效
- 為了炫技而存在的彈跳、旋轉、長距離滑入

### 6.5 時間與節奏

- micro interaction：`160–220ms`
- card / list state change：`180–240ms`
- modal / sheet / page transition：`220–320ms`
- 複雜轉場不可超過 `400ms`
- exit 應比 enter 更快

### 6.6 技術規則

- 只動 `opacity`、`transform`
- 禁止動 `width`、`height`、`top`、`left`
- 每頁最多 `1–2` 種主要動效
- 動畫不可造成 layout shift
- 動畫必須可中斷，不可阻塞互動

### 6.7 Reduced Motion

- 必須支援 reduced motion
- reduced motion 下改用淡入、直接切換、或取消位移效果
- reduced motion 不可影響資訊理解與操作完整性

### 6.8 AI 動效裁決

- 若動畫無法幫助理解狀態變化、層級切換或載入過程，視為多餘動畫
- 若列表內容可滾動且數量偏多，預設不做 stagger
- 若元件已靠色彩、文字與位置清楚表達狀態，不應額外增加吸睛動效

---

## 7. Information & Copy Rules

### 7.1 資訊層級

每個區塊最多只保留三層資訊：

1. **Primary**：使用者最想知道的答案
2. **Secondary**：幫助判讀的輔助資訊
3. **Meta**：更新時間、資料來源、限制說明

### 7.2 文案最小化原則

- 先靠標題、數值、狀態、選中樣式表達，再決定要不要補文案
- 說明文字只回答：
  1. 這個設定會影響什麼
  2. 什麼情況下需要改
  3. 改了之後結果會怎樣
- 沒有決策價值的背景說明不要寫
- 重複標題意思的說明不要寫
- 一條說明文只講一件事
- 優先短句，不用 marketing 語氣
- UI 狀態已經足夠清楚時，description / hint / summary 應直接省略
- 若 subtitle、summary、footer note 只是重複 section 內容或當前狀態，應刪除

### 7.3 說明文字何時省略

以下情況預設不寫說明文字：

- 目前狀態已由 selected / switch / segmented control 清楚表達
- 只有 2–3 個互斥選項，且差異容易理解
- 文案只是重複 section title 或 row title
- 不影響資料來源、結果判讀、風險或使用成本

### 7.4 資訊密度分級

#### 高頻、低風險、易理解

- 只顯示 `title`
- 例：淺色模式 / 深色模式

#### 中等理解成本

- 顯示 `title + description`
- 例：單一資料源 / 聚合模式

#### 高理解成本、影響資料結果

- 顯示 `title + description + hint / footer`
- 例：溫度聚合 / 降雨判定

### 7.5 Row 密度分級

#### Compact row

- 僅 `title`
- 建議高度：`56`

#### Comfort row

- `title + description`
- 或 `title + description + hint`
- 建議高度：`64–72`

### 7.6 密度規則

- 刪掉 description / hint 後，row 應自動收緊
- 不可保留大面積空白
- 同一 section 內盡量維持相近密度

### 7.7 AI 文案裁決

- 若 title 已能單獨支持決策，預設不加 description
- 若 description 只是在改寫 title，刪除
- 若 hint 不影響資料判讀、風險理解或使用成本，刪除
- 若 footer note 只是二次解釋 UI 已經表達的內容，刪除
- 若一段文案超過一個決策點，拆開或刪減

---

## 8. Page Structure

### 8.1 Page 結構

每個頁面優先遵守：

1. **Page Header**
   - 頁面名稱
   - 一句用途說明（可省略）
   - 必要時顯示摘要狀態
2. **Primary Section**
   - 該頁最重要的資訊或操作
3. **Secondary Sections**
   - 補充資訊
   - 次要操作
   - 進階設定
4. **Footer Note / Help Text**
   - 只在需要補充限制、條件、風險時出現

### 8.2 分組邏輯

區塊排序優先看：

1. 使用頻率
2. 理解難度
3. 影響範圍

### 8.3 Summary 使用條件

只有以下情況才顯示 summary：

- 使用者需要快速回看目前狀態
- 狀態不在列表中直接可見
- 畫面需要降低掃描成本

適合：

- `溫度：平均 / 降雨：任一來源`
- `目前啟用 2 個來源`

不一定需要：

- 主題切換只有 2 個 radio，且選中狀態已很清楚
- 區塊內容本身已直接表達目前設定

### 8.4 設定頁極簡模式

工具型 app 的設定頁預設採 **極簡模式**：

- Header 可只有 title
- Section 可只有 icon + title
- Row 預設只顯示必要資訊
- 只有在選項會影響資料結果、判讀邏輯或有風險時，才補充說明文字
- 優先刪除 subtitle、summary、footer note 等非必要輔助文字
- 若 summary 只是重複 section 內容，應省略
- 區塊標題、卡片邊界、row 內容左緣需維持一致對齊
- 不可為了視覺裝飾增加多餘的容器層，padding 應優先合併到既有結構
- 設定頁背景裝飾應比首頁、預報頁更克制；若 glass 已足夠，不再額外增加第二層裝飾

### 8.5 AI 頁面生成規則

- Home / 天氣首頁：優先呈現現在天氣答案，不可先做裝飾層
- Forecast / 預報頁：優先維持掃讀節奏，不可為了視覺花樣破壞列表效率
- History / 歷史頁：優先提升日期與資料比較的可讀性，不可堆太多裝飾卡
- Locations / 地點頁：優先區分目前位置、收藏、搜尋結果，不可混成同一權重
- Settings / 設定頁：預設極簡；只有資料判讀、聚合邏輯、來源選擇才需要補說明
- Settings / 設定頁：避免為了「看起來比較設計」而增加額外包裝層、重複 icon 或無資訊價值的容器
- 所有頁面：若同一問題能在 `GlassBackground`、`PageHeaderCard`、`PageScrollView`、tab bar 等共用層解決，優先改共用層

---

## 9. Component Specs

### 9.1 Card

#### 目標

- 一眼知道這張卡回答什麼問題
- 第一層資訊 1 秒內掃到
- 第二層資訊不干擾第一層

#### 結構

1. Header：標題、時間 / 更新時間 / 資料來源
2. Primary Content：現在溫度、降雨機率、今日高低溫
3. Secondary Content：濕度、風速、體感、空氣品質等

#### 視覺規則

- 背景使用 `surface`
- 用 border + soft shadow 建層級
- 主要數值大，輔助數值小
- 卡片內最多 1 個強調色
- icon 只輔助辨識，不能搶主數值

#### 建議樣式

- padding：`16`
- gap：`12`
- radius：`18`
- border：`1px`
- pressed state：只改背景或 opacity，不做明顯縮放跳動

#### Motion

- 卡片互動只允許功能性動畫
- pressed / selected state：`160–220ms`
- 只動 `opacity`、`transform`
- 不可用持續漂浮、閃爍、發光流動等裝飾動畫

#### Weather Card 補充

- 首頁 hero card 仍要克制
- 不要滿版天氣插畫
- 可用微弱天氣色點綴

### 9.2 List

#### 適用場景

- 逐時預報
- 每日預報
- 地點清單
- 歷史資料條目

#### 結構

- 左：時間 / 日期 / 地點
- 中：主要摘要
- 右：關鍵值或 chevron

#### 規則

- 每列高度至少 `56–72`
- 列與列之間可用 divider 或小間距群組
- 行內資訊不超過 3 層
- 數值欄位建議右對齊
- 欄位節奏需一致

#### Motion

- list row 進場可使用淡入或微位移進場
- 單頁最多 1 種 list 進場效果
- 小量內容可做 stagger，間隔 `30–40ms`
- 大量內容、可滾動長列表預設不做 stagger

### 9.3 Settings Item

#### 氣質

- 系統感
- 平靜
- 高可讀
- 不像 marketing 頁面

#### 結構

- 左：icon + title + optional description
- 右：switch / value / chevron
- 支援 disabled / destructive / selected

#### 文案規則

- `title`：必要
- `description`：title 不足以解釋時才補
- `hint`：需要說明影響、限制、風險時才出現
- `footer note`：只保留重要提醒

#### 規則

- 高度至少 `56`
- 有副文字可到 `68–72`
- icon 容器固定大小
- switch 類 item 整列可點
- destructive item 單獨分組
- title 已足以表達功能時，不補 description
- description 若不能幫助決策，就刪除
- hint 只用於風險、限制、資料影響
- footer note 只留真正重要提醒，不做二次解釋

#### 模式對應

- `single mode` 必須明確提供 `active source` 選擇
- `active source` 只顯示目前已啟用的來源
- 切回 `single mode` 時，要能一眼看出目前實際使用哪個來源
- `aggregate mode` 顯示聚合規則時，優先提供規則摘要，避免逐列掃描

#### 視覺層級

- section header 要比 row 更明確，但不可比首頁核心卡更搶眼
- summary chip 視覺重量必須低於 section title
- `selected` row 可用淡色底 + 主色文字表達，不可只靠 radio / switch 本體
- light mode 不應使用低對比半透明白字卡
- dark mode 不應讓次要文字掉到模糊感等級
- 設定頁的字級差應克制，優先用字重與色階建立層級，不用過大的字級差
- section header icon 容器應小而準確，不可搶過標題本身
- 若卡片、標題、row 左緣未對齊，視為不通過

#### 互動狀態

- pressed state 只允許背景或 opacity 微調，不做明顯縮放
- segmented control 適合 2–3 個互斥的低風險選項
- switch row 必須整列可點，且 switch 本身仍可直接操作
- selected / disabled / error 狀態都要同時提供語意與視覺差異

#### 結構簡化原則

- 若一層 wrapper 只為了補少量 padding，優先合併到父層或子層
- 設定頁專用元件應優先直寫可讀結構，不必為了抽象化拆成過多小元件
- 若某個 config object 只被單一頁面使用且沒有重用價值，優先 inline
- `React.memo` 不應用在低複雜度、低重渲染壓力的設定選項區塊
- 單一設定頁面若能用 1 個共用 row 元件完成，就不要為每個 section 再包 1 層薄元件

### 9.4 Form / State

#### 狀態優先級

1. readable
2. tappable
3. stateful
4. decorative

#### 規則

- helper text 僅在有決策成本時出現
- 表單說明文字若只是重複 label，不顯示
- success / selected 狀態可共享品牌主色語言，但不可等同錯誤或警告色
- disabled 狀態除了降 opacity，也要保留可辨識文字輪廓
- 錯誤訊息必須比次要說明更醒目，但不能破壞整體節奏
- 高頻工具型操作優先選擇穩定、接近原生的控件樣式
- 輸入區若使用半透明底，仍需優先確保文字清晰，不通過就改實底

### 9.5 Tab Bar

#### 原則

- 穩定
- 可預期
- 單手拇指易觸及
- 不過度搶視覺焦點

#### 規則

- top-level tabs 最多 `5` 個
- tab bar 預設應有 icon；label 是否顯示依資訊密度與版面決定
- 若使用 icon-only tab bar，必須確保 icon 語意足夠直覺，且各 tab 圖示不可混淆
- active 狀態用 color + weight + indicator 表達
- inactive 不可低對比到看不見
- tab bar 要保留 safe area padding
- 若使用半透明 tab bar，blur 強度仍遵守 glass 上限，且文字 / 圖示對比不可下降
- icon-only tab bar 必須提供 `accessibilityLabel` 或等價語意標記
- 設定頁所在 tab 可使用 `options-outline` / 滑桿類圖示，若產品中「設定」偏向偏好與切換，而非系統設定，優先考慮滑桿而非齒輪

#### 建議樣式

- 背景：`surface`
- 上方細分隔線：`border`
- 高度：icon + label 約 `56` + safe area；icon-only 可更緊湊，但仍需 ≥ `52`
- icon：`22–24`
- label：`12–13`
- 若採 icon-only，可使用膠囊型 tab bar 與較強 glass 材質，但不可犧牲點擊面積
- icon-only tab bar 可優先採用膠囊型（pill）玻璃外框，以減少文字噪音並提升現代感

---

## 10. Accessibility / Touch Checklist

### 10.1 Accessibility

- icon-only 元件必須有 `accessibilityLabel`
- 狀態不能只靠顏色表達
- 正文對比至少 `4.5:1`，大字至少 `3:1`
- 關鍵資訊不可放在低對比半透明底上
- 字體放大後內容仍可讀
- reduced motion 與 dark mode 都要可用

### 10.2 Touch

- 最小可點區域 `44x44`，建議 row 高度 `56+`
- 相鄰可點元素至少 `8` 間距
- 不依賴 hover
- 按壓回饋在 `100ms` 內可見
- 不可因按壓造成 layout shift

### 10.3 Motion

- micro interaction 建議 `160–220ms`
- route / modal 轉場建議 `220–320ms`
- reduced motion 需提供降級方案

### 10.4 Spacing

- page gutter：`16`
- section gap：`24–32`
- card padding：`16`
- row 內節奏一致
- 底部內容不可被 tab bar / safe area 擋住

---

## 11. NativeWind Implementation

### 11.1 Token 分層

- `colors`
- `spacing`
- `radius`
- `typography`
- `elevation`
- `motion`

### 11.2 class 命名方向

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

## 12. Anti-patterns

### 12.1 視覺

1. 過度天氣擬物
2. 高飽和全彩卡片
3. 過強玻璃感 / 模糊
4. 過多陰影
5. 把狀態色當品牌色亂用
6. 白字放在淺色半透明底上
7. 用陰影硬撐文字可讀性

### 12.2 資訊架構

8. 首頁塞太多維度
9. 主次資訊同權重
10. 只靠顏色區分狀態
11. 資料來源資訊藏太深
12. 每個設定都加滿說明文字
13. 刪掉文案後仍保留大面積空白
14. 用說明文重複 UI 已經表達清楚的事
15. 用 config 陣列、索引或過度抽象讓設定頁結構難以閱讀
16. 只為了補少量 padding 或排列，再包一層無語意的容器

### 12.3 互動

16. 點擊區太小
17. 把 hover 思維搬到 mobile
18. 過度動畫
19. 按壓回饋造成 layout shift
20. 底部 tab 與內容搶空間
21. 用持續型背景動畫干擾閱讀
22. icon-only tab bar 卻使用辨識度不足的圖示
23. tab bar 圖示語意與頁面功能不一致，造成辨識負擔

### 12.4 Dark Mode

21. 直接反相 light theme
22. 使用純黑 + 純白
23. divider / 邊界在暗色中消失
24. 次要文字對比低到像霧化

---

## 13. One-page Summary

### Style

- Modern Glass Utility / Calm Clarity
- modern、minimal、glass、可信、有質感、低裝飾、清楚分層
- light / dark 同時設計
- 適合單手操作與長時間閱讀
- 動畫只做功能性表達，不做炫技
- 玻璃感可明確存在，但必須低干擾、有上限、可讀性優先

### Color

- 基底：藍灰中性色
- 品牌：穩定中性藍
- 天氣色：只點綴，不主導畫面
- semantic tokens 優先
- 正文對比至少 `4.5:1`
- 半透明 surface 不通過對比就改實底

### Typography

- 主字級：14 / 15 / 16 / 18 / 20 / 24 / 32 / 40
- 行高寬鬆
- 主數值大、次資訊退後
- 數字可用 tabular
- 正文預設 `15/16`，`12` 只用於 metadata

### Spacing

- 4pt / 8pt system
- page gutter `16`
- card padding `16`
- section gap `24–32`
- row 依內容密度分 compact / comfort

### Components

- card：三層結構，主數值優先
- list：固定欄位節奏，右側關鍵值
- settings：系統感、分組清楚、預設極簡、必要時才補說明
- settings：避免多餘 wrapper、重複文案、未對齊的左緣
- tab bar：可用 icon-only 或 icon + label；若是 icon-only，圖示語意必須足夠直覺
- glass：需要同時有 blur、邊界、高光與背景支撐，才算成立的玻璃感
- 說明文字只在影響理解、判讀、風險時出現

### Avoid

- 彩色大片背景
- 擬物天氣插畫主畫面
- 過強玻璃感
- 過多陰影
- 過度動畫
- 無功能性的持續動效
- 低對比半透明文字區
- 炫光、鏡面反射、流動光帶
- 僅靠顏色表意
- 每個設定都塞滿說明文字
- 刪掉文案後仍保留大面積空白
