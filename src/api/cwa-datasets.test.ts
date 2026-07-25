import { getCwaForecastLocationId } from '@/api/cwa-datasets';

describe('getCwaForecastLocationId', () => {
  it('逐時與每日是不同的 dataset', () => {
    expect(getCwaForecastLocationId('臺北市', 'hourly')).toBe('F-D0047-061');
    expect(getCwaForecastLocationId('臺北市', 'daily')).toBe('F-D0047-063');
  });

  // 使用者輸入與 TAIWAN_CITIES 多用「台」，CWA 官方用「臺」——
  // 不做正規化的話台北、台中、台南、台東四個縣市全部查不到
  it.each([
    ['台北市', 'F-D0047-061'],
    ['台中市', 'F-D0047-073'],
    ['台南市', 'F-D0047-077'],
    ['台東縣', 'F-D0047-037'],
  ])('「%s」能對應到官方的「臺」字寫法', (input, expected) => {
    expect(getCwaForecastLocationId(input, 'hourly')).toBe(expected);
  });

  it('容忍前後空白', () => {
    expect(getCwaForecastLocationId('  高雄市  ', 'hourly')).toBe('F-D0047-065');
  });

  it('缺值或未知縣市回傳 undefined，讓呼叫端略過而非猜一個 dataset', () => {
    expect(getCwaForecastLocationId(undefined, 'hourly')).toBeUndefined();
    expect(getCwaForecastLocationId('', 'hourly')).toBeUndefined();
    expect(getCwaForecastLocationId('東京都', 'hourly')).toBeUndefined();
  });

  it('涵蓋全部 22 個縣市', () => {
    const counties = [
      '宜蘭縣',
      '桃園市',
      '新竹縣',
      '苗栗縣',
      '彰化縣',
      '南投縣',
      '雲林縣',
      '嘉義縣',
      '屏東縣',
      '臺東縣',
      '花蓮縣',
      '澎湖縣',
      '基隆市',
      '新竹市',
      '嘉義市',
      '臺北市',
      '高雄市',
      '新北市',
      '臺中市',
      '臺南市',
      '連江縣',
      '金門縣',
    ];
    for (const c of counties) {
      expect(getCwaForecastLocationId(c, 'hourly')).toBeDefined();
      expect(getCwaForecastLocationId(c, 'daily')).toBeDefined();
    }
  });
});
