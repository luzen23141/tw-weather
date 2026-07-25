# 設計稿（Mockups）

可執行的設計稿。用瀏覽器直接打開 `.html` 即可，不需要 dev server、不需要網路。

```bash
open design-system/mockups/home.html
```

## 為什麼是 HTML 而不是 Figma

- **同一個 git 歷史**：設計改動與程式碼改動出現在同一個 PR、同一次 review
- **可 diff**：純文字，改了什麼一目瞭然
- **行為是真的**：捲動收合、透明度梯度、玻璃層次都是實際跑出來的，不是 prototype 模擬
- **不會漂移**：Figma 檔案與程式碼是兩份會各自演化的真相，這裡只有一份

代價是沒有設計師慣用的畫布工具。若之後需要 Figma，這些 HTML 可以當作規格來源重建。

## 檔案

| 檔案                     | 內容                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `home.html`              | 首頁 —— 當前天氣、昨日比較、資料來源分歧、降雨摘要、逐時、每日、底部導航 |
| `_assets/mockup.css`     | 共用 design token 與元件樣式                                             |
| `_assets/icons.js`       | SVG symbol sprite（inline，無 CDN 依賴）                                 |
| `_assets/scroll-demo.js` | 捲動行為驅動器（導航欄收合、頂部標題淡入）                               |

各頁面的設計決策與理由寫在該 `.html` 右側的說明欄，不另外拆檔 —— 圖與理由分家，理由就會沒人看。

## 與程式碼的關係

設計稿是**設計意圖的來源**，程式碼是**實際行為的來源**。兩者數值應一致；若不一致，先確認是實作漏了還是設計過時，不要默默各走各的。

對應關係：

| 設計稿                         | 程式碼                                                                      |
| ------------------------------ | --------------------------------------------------------------------------- |
| `--grad-*`                     | `src/utils/weather-theme.ts`                                                |
| `--glass-*`、`backdrop-filter` | `src/components/ui/glass.ts` 的 `getGlassStyle()`                           |
| `.tabbar`                      | `app/(tabs)/_layout.tsx`                                                    |
| `.card`、`.metrics`            | `src/components/weather/CurrentWeatherCard.tsx`                             |
| `.hours`                       | `src/components/weather/HourlyForecastList.tsx`                             |
| `.days`                        | `src/components/weather/DailyTrendList.tsx`                                 |
| `.metrics`、`.scale`           | `src/components/weather/MetricRow.tsx`、`src/components/ui/MetricScale.tsx` |
| `.sources`                     | `src/components/weather/SourceRow.tsx`                                      |
| `.rain-note`                   | `src/components/weather/RainSummaryNote.tsx`                                |

## 分頁結構

四個分頁：**天氣 / 歷史 / 地點 / 設定**，外加兩個下鑽路由：

- `app/day/[date].tsx` —— 單日詳情，由首頁每日列點入；與歷史頁共用 `DayDetailCard`
- `app/hourly.tsx` —— 完整逐時，由首頁逐時區塊點入

原本的「預報」分頁已移除 —— 它只渲染每日列表，是首頁的嚴格子集。

> 目前只有 `home.html` 有設計稿。其餘頁面沿用同一套 design token 與元件語彙
> （單層玻璃、lens 選取態、SectionLabel、細分隔線），以實作為準。
> 為每頁各寫一份會漂移的靜態 HTML，價值低於維護成本。

## 已知資料缺口

設計稿裡有幾個欄位目前後端給不出來，實作時先以 mock 呈現：

| 欄位                 | 狀況                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 體感溫度             | CWA adapter 未提供，前端 fallback 會顯示氣溫。以 CWA 為來源時畫面上的「體感」其實是氣溫                                  |
| UV                   | CWA 與 Open-Meteo 的 current 都不提供。缺值時該格整格不渲染，而非顯示破折號                                              |
| weather_code（自架） | Open-Meteo 自架的 `ecmwf_ifs025` 不提供天氣代碼，連 hourly 都是 null。正式自架前需改用 `dwd_icon` 或 `ncep_gfs013` 驗證  |
| 當日最高體感         | 已實作：由今日逐時的 apparent 取最大值（`src/utils/today-summary.ts`）                                                   |
| 過去逐時             | proxy 的 `/api/weather/hourly` 無 `past_hours` 參數；CWA 上游本就不支援。無過去資料時時間軸從「現在」開始，即為 fallback |
| 降雨時段摘要         | 已實作（`src/utils/rain-summary.ts`）                                                                                    |

聚合的來源分歧原本也在此清單，現已改為真實資料 —— `AggregationEngine` 會在
`WeatherData.sourceReadings` 保留各來源的原始讀數。
