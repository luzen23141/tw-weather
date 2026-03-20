/**
 * 將 WeatherApiError 或一般 Error 轉換為使用者友善的繁體中文訊息
 */
export function getWeatherErrorMessage(error: Error): string {
  const msg = error.message;
  if (msg.includes('PROXY_URL')) return '應用程式設定錯誤，請聯繫開發者。';
  if (msg.includes('401') || msg.includes('403')) return '認證失敗，請稍後再試。';
  if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
    return '無法連線至資料來源，請檢查網路後重試。';
  }
  if (msg.includes('502') || msg.includes('504'))
    return '天氣資料來源暫時無法連線，請稍後再試或切換資料來源。';
  if (msg.includes('地點未定義')) return '尚未選擇地點，請先選擇你想查看的城市。';
  return '暫時無法取得資料，請稍後再試。';
}
