import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  kmhToMs,
  kmhToMph,
  msToKmh,
  mphToKmh,
  formatTemperature,
  formatWindSpeed,
} from '@/utils/unit-conversion';

describe('Unit Conversion Utils', () => {
  describe('Temperature Conversions', () => {
    describe('celsiusToFahrenheit', () => {
      it('應轉換 0°C 為 32°F', () => {
        expect(celsiusToFahrenheit(0)).toBe(32);
      });

      it('應轉換 100°C 為 212°F', () => {
        expect(celsiusToFahrenheit(100)).toBe(212);
      });

      it('應轉換 -40°C 為 -40°F', () => {
        expect(celsiusToFahrenheit(-40)).toBe(-40);
      });

      it('應轉換 20°C 為 68°F', () => {
        expect(celsiusToFahrenheit(20)).toBe(68);
      });

      it('應處理小數點', () => {
        expect(celsiusToFahrenheit(37.5)).toBe(99.5);
      });
    });

    describe('fahrenheitToCelsius', () => {
      it('應轉換 32°F 為 0°C', () => {
        expect(fahrenheitToCelsius(32)).toBe(0);
      });

      it('應轉換 212°F 為 100°C', () => {
        expect(fahrenheitToCelsius(212)).toBe(100);
      });

      it('應轉換 -40°F 為 -40°C', () => {
        expect(fahrenheitToCelsius(-40)).toBe(-40);
      });

      it('應轉換 68°F 為 20°C', () => {
        expect(fahrenheitToCelsius(68)).toBe(20);
      });

      it('應處理小數點', () => {
        expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37.0, 1);
      });
    });
  });

  describe('Wind Speed Conversions', () => {
    describe('kmhToMs', () => {
      it('應轉換 0 km/h 為 0 m/s', () => {
        expect(kmhToMs(0)).toBe(0);
      });

      it('應轉換 36 km/h 為 10 m/s', () => {
        expect(kmhToMs(36)).toBe(10);
      });

      it('應轉換 1 km/h 為約 0.278 m/s', () => {
        expect(kmhToMs(1)).toBeCloseTo(0.278, 2);
      });

      it('應轉換 100 km/h 為約 27.78 m/s', () => {
        expect(kmhToMs(100)).toBeCloseTo(27.78, 2);
      });
    });

    describe('kmhToMph', () => {
      it('應轉換 0 km/h 為 0 mph', () => {
        expect(kmhToMph(0)).toBe(0);
      });

      it('應轉換 100 km/h 為約 62.1371 mph', () => {
        expect(kmhToMph(100)).toBeCloseTo(62.1371, 3);
      });

      it('應轉換 160.9 km/h 為約 100 mph', () => {
        expect(kmhToMph(160.9)).toBeCloseTo(100, 1);
      });

      it('應轉換 1 km/h 為約 0.621 mph', () => {
        expect(kmhToMph(1)).toBeCloseTo(0.621, 2);
      });
    });

    describe('msToKmh', () => {
      it('應轉換 0 m/s 為 0 km/h', () => {
        expect(msToKmh(0)).toBe(0);
      });

      it('應轉換 10 m/s 為 36 km/h', () => {
        expect(msToKmh(10)).toBe(36);
      });

      it('應轉換 27.78 m/s 為約 100 km/h', () => {
        expect(msToKmh(27.78)).toBeCloseTo(100, 1);
      });
    });

    describe('mphToKmh', () => {
      it('應轉換 0 mph 為 0 km/h', () => {
        expect(mphToKmh(0)).toBe(0);
      });

      it('應轉換 62.1371 mph 為約 100 km/h', () => {
        expect(mphToKmh(62.1371)).toBeCloseTo(100, 1);
      });

      it('應轉換 100 mph 為約 160.9 km/h', () => {
        expect(mphToKmh(100)).toBeCloseTo(160.9, 1);
      });

      it('應轉換 1 mph 為約 1.609 km/h', () => {
        expect(mphToKmh(1)).toBeCloseTo(1.609, 2);
      });
    });
  });

  describe('Format Functions', () => {
    describe('formatTemperature', () => {
      it('應格式化攝氏溫度', () => {
        expect(formatTemperature(20, 'celsius')).toBe('20°C');
      });

      it('應格式化華氏溫度', () => {
        expect(formatTemperature(68, 'fahrenheit')).toBe('68°F');
      });

      it('應四捨五入到最近的整數', () => {
        expect(formatTemperature(20.3, 'celsius')).toBe('20°C');
        expect(formatTemperature(20.7, 'celsius')).toBe('21°C');
        expect(formatTemperature(20.4, 'celsius')).toBe('20°C');
      });

      it('應處理負溫度', () => {
        expect(formatTemperature(-10, 'celsius')).toBe('-10°C');
        expect(formatTemperature(-5, 'fahrenheit')).toBe('-5°F');
      });

      it('應處理極端溫度', () => {
        expect(formatTemperature(100, 'celsius')).toBe('100°C');
        expect(formatTemperature(-273, 'celsius')).toBe('-273°C');
      });
    });

    describe('formatWindSpeed', () => {
      it('應格式化 km/h 風速', () => {
        expect(formatWindSpeed(36, 'kmh')).toBe('36.0 km/h');
      });

      it('應格式化 m/s 風速', () => {
        expect(formatWindSpeed(36, 'ms')).toBe('10.0 m/s');
      });

      it('應格式化 mph 風速', () => {
        expect(formatWindSpeed(36, 'mph')).toMatch(/^22\.[0-9]+ mph$/);
      });

      it('應使用 km/h 作為預設單位', () => {
        expect(formatWindSpeed(50)).toBe('50.0 km/h');
      });

      it('應保留一位小數', () => {
        expect(formatWindSpeed(36.5, 'kmh')).toBe('36.5 km/h');
        expect(formatWindSpeed(36.54, 'kmh')).toBe('36.5 km/h');
      });

      it('應處理 0 風速', () => {
        expect(formatWindSpeed(0, 'kmh')).toBe('0.0 km/h');
        expect(formatWindSpeed(0, 'ms')).toBe('0.0 m/s');
        expect(formatWindSpeed(0, 'mph')).toBe('0.0 mph');
      });

      it('應處理大風速', () => {
        expect(formatWindSpeed(100, 'kmh')).toBe('100.0 km/h');
        expect(formatWindSpeed(100, 'ms')).toMatch(/^27\.[0-9]+ m\/s$/);
      });
    });
  });

  describe('Conversion Round-Trip Tests', () => {
    it('攝氏轉華氏再轉回應相等', () => {
      const original = 25;
      const fahrenheit = celsiusToFahrenheit(original);
      const backToCelsius = fahrenheitToCelsius(fahrenheit);
      expect(backToCelsius).toBeCloseTo(original, 10);
    });

    it('km/h 轉 m/s 再轉回應相等', () => {
      const original = 50;
      const ms = kmhToMs(original);
      const backToKmh = msToKmh(ms);
      expect(backToKmh).toBeCloseTo(original, 10);
    });

    it('km/h 轉 mph 再轉回應相等', () => {
      const original = 100;
      const mph = kmhToMph(original);
      const backToKmh = mphToKmh(mph);
      expect(backToKmh).toBeCloseTo(original, 10);
    });
  });
});
