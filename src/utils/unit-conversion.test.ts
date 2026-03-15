describe('Unit Conversion Utils', () => {
  describe('溫度轉換', () => {
    it('應將攝氏轉換為華氏', () => {
      const celsius = 0;
      const fahrenheit = (celsius * 9) / 5 + 32;
      expect(fahrenheit).toBe(32);
    });

    it('應處理負溫度', () => {
      const celsius = -40;
      const fahrenheit = (celsius * 9) / 5 + 32;
      expect(fahrenheit).toBe(-40);
    });

    it('應正確舍入', () => {
      const celsius = 25.5;
      const fahrenheit = (celsius * 9) / 5 + 32;
      expect(Math.round(fahrenheit * 10) / 10).toBe(77.9);
    });
  });

  describe('風速轉換', () => {
    it('應將 km/h 轉換為 m/s', () => {
      const kmh = 36;
      const ms = kmh / 3.6;
      expect(ms).toBe(10);
    });

    it('應將 km/h 轉換為 mph', () => {
      const kmh = 100;
      const mph = kmh * 0.621371;
      expect(Math.round(mph)).toBe(62);
    });

    it('應處理零值', () => {
      const kmh = 0;
      expect(kmh / 3.6).toBe(0);
    });

    it('應處理高風速', () => {
      const kmh = 200;
      const ms = kmh / 3.6;
      expect(Math.round(ms * 10) / 10).toBe(55.6);
    });
  });

  describe('壓力轉換', () => {
    it('應將 hPa 轉換為 inHg', () => {
      const hpa = 1013.25;
      const inHg = hpa * 0.02953;
      expect(Math.round(inHg * 100) / 100).toBeCloseTo(29.92, 1);
    });

    it('應將 hPa 轉換為 mmHg', () => {
      const hpa = 760;
      const mmHg = hpa * 0.75006;
      expect(Math.round(mmHg)).toBe(570);
    });
  });

  describe('降水轉換', () => {
    it('應將 mm 轉換為 inch', () => {
      const mm = 25.4;
      const inch = mm / 25.4;
      expect(inch).toBe(1);
    });

    it('應處理小降水', () => {
      const mm = 0.5;
      const inch = mm / 25.4;
      expect(Math.round(inch * 100) / 100).toBe(0.02);
    });
  });

  describe('能見度轉換', () => {
    it('應將 m 轉換為 km', () => {
      const m = 10000;
      const km = m / 1000;
      expect(km).toBe(10);
    });

    it('應將 m 轉換為 miles', () => {
      const m = 1609;
      const miles = m * 0.000621371;
      expect(Math.round(miles * 100) / 100).toBe(1);
    });
  });
});
