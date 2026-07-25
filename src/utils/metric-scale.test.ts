import { humidityScale, uvScale, windScale } from './metric-scale';

describe('humidityScale', () => {
  it.each([
    [20, 1, '乾燥'],
    [40, 1, '乾燥'],
    [41, 2, '舒適'],
    [60, 2, '舒適'],
    [74, 3, '偏濕'],
    [80, 3, '偏濕'],
    [95, 4, '潮濕'],
  ])('濕度 %i%% 落在第 %i 段（%s）', (value, filled, level) => {
    const result = humidityScale(value);
    expect(result.segments).toBe(4);
    expect(result.filled).toBe(filled);
    expect(result.level).toBe(level);
  });

  it('濕度不觸發警示色 —— 台灣長年偏濕，轉色會變成常駐裝飾', () => {
    expect(humidityScale(95).warn).toBe(false);
  });
});

describe('windScale', () => {
  it.each([
    [0, 1, '平靜'],
    [8, 2, '微風'],
    [12, 3, '和風'],
    [35, 4, '強風'],
    [60, 5, '烈風'],
    [120, 6, '暴風'],
  ])('風速 %i km/h 落在第 %i 段（%s）', (value, filled, level) => {
    const result = windScale(value);
    expect(result.segments).toBe(6);
    expect(result.filled).toBe(filled);
    expect(result.level).toBe(level);
  });

  it('超出最高段上界時收斂到最後一段，不會溢出', () => {
    expect(windScale(9999).filled).toBe(6);
  });
});

describe('uvScale', () => {
  it.each([
    [0, 1, '低量', false],
    [2, 1, '低量', false],
    [5, 2, '中量', false],
    [6, 3, '高量', true],
    [7, 3, '高量', true],
    [9, 4, '過量', true],
    [11, 5, '危險', true],
  ])('UV %i 落在第 %i 段（%s），警示 = %s', (value, filled, level, warn) => {
    const result = uvScale(value);
    expect(result.segments).toBe(5);
    expect(result.filled).toBe(filled);
    expect(result.level).toBe(level);
    expect(result.warn).toBe(warn);
  });

  it('警示從「高量」開始 —— 對應 WHO 建議採取防護措施的門檻', () => {
    expect(uvScale(5).warn).toBe(false);
    expect(uvScale(6).warn).toBe(true);
  });
});
