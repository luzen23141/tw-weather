import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  kmhToMs,
  kmhToMph,
  msToKmh,
  mphToKmh,
} from '@/utils/unit-conversion';

describe('單位轉換工具', () => {
  describe('溫度轉換', () => {
    it('攝氏度轉華氏度', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
      expect(celsiusToFahrenheit(25)).toBeCloseTo(77, 1);
      expect(celsiusToFahrenheit(100)).toBe(212);
      expect(celsiusToFahrenheit(-40)).toBe(-40); // 攝氏度和華氏度相同的點
    });

    it('華氏度轉攝氏度', () => {
      expect(fahrenheitToCelsius(32)).toBe(0);
      expect(fahrenheitToCelsius(212)).toBe(100);
      expect(fahrenheitToCelsius(68)).toBeCloseTo(20, 1);
      expect(fahrenheitToCelsius(-40)).toBe(-40);
    });

    it('溫度轉換應相互反向', () => {
      const temp = 25;
      const converted = fahrenheitToCelsius(celsiusToFahrenheit(temp));
      expect(converted).toBeCloseTo(temp, 10);
    });
  });

  describe('風速轉換', () => {
    it('公里/小時轉米/秒', () => {
      expect(kmhToMs(0)).toBe(0);
      expect(kmhToMs(3.6)).toBeCloseTo(1, 1);
      expect(kmhToMs(36)).toBeCloseTo(10, 1);
    });

    it('公里/小時轉英里/小時', () => {
      expect(kmhToMph(0)).toBe(0);
      expect(kmhToMph(10)).toBeCloseTo(6.2, 0);
      expect(kmhToMph(100)).toBeCloseTo(62, 0);
    });

    it('米/秒轉公里/小時', () => {
      expect(msToKmh(0)).toBe(0);
      expect(msToKmh(1)).toBeCloseTo(3.6, 0);
      expect(msToKmh(10)).toBeCloseTo(36, 0);
    });

    it('英里/小時轉公里/小時', () => {
      expect(mphToKmh(0)).toBe(0);
      expect(mphToKmh(10)).toBeCloseTo(16, 0);
      expect(mphToKmh(62)).toBeCloseTo(100, 0);
    });

    it('風速轉換應相互反向', () => {
      const speed = 20; // km/h
      const converted = msToKmh(kmhToMs(speed));
      expect(converted).toBeCloseTo(speed, 10);
    });
  });
});
