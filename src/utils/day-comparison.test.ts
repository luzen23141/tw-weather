import { compareWithYesterday } from './day-comparison';

describe('compareWithYesterday', () => {
  it('缺任一值時回傳 null —— 昨日來自 history，可能缺席', () => {
    expect(compareWithYesterday(31, undefined)).toBeNull();
    expect(compareWithYesterday(undefined, 30)).toBeNull();
    expect(compareWithYesterday(undefined, undefined)).toBeNull();
  });

  it('NaN 視為缺值', () => {
    expect(compareWithYesterday(Number.NaN, 30)).toBeNull();
  });

  it('變熱時說熱', () => {
    expect(compareWithYesterday(31, 30)).toEqual({
      delta: 1,
      text: '比昨天熱 1°',
      significant: false,
    });
  });

  it('變涼時說涼，且數字取絕對值', () => {
    expect(compareWithYesterday(27, 30)).toEqual({
      delta: -3,
      text: '比昨天涼 3°',
      significant: false,
    });
  });

  it('無差異時給明確結論而非空字串', () => {
    expect(compareWithYesterday(30, 30)).toEqual({
      delta: 0,
      text: '氣溫跟昨天差不多',
      significant: false,
    });
  });

  it('先各自四捨五入再相減，結論才不會跟畫面上的數字打架', () => {
    // 兩者顯示都是 30°，若先相減（0.8）再四捨五入會得到「熱 1°」而自相矛盾
    expect(compareWithYesterday(30.4, 29.6)).toEqual({
      delta: 0,
      text: '氣溫跟昨天差不多',
      significant: false,
    });

    // 顯示為 31° 與 30°，差 1° 才說熱 1°
    expect(compareWithYesterday(30.6, 29.5)?.text).toBe('比昨天熱 1°');
  });

  it('溫差達 5 度標記為顯著', () => {
    expect(compareWithYesterday(35, 30)?.significant).toBe(true);
    expect(compareWithYesterday(25, 30)?.significant).toBe(true);
    expect(compareWithYesterday(34, 30)?.significant).toBe(false);
  });
});
