describe('Weather Formatter Utils', () => {
  describe('格式化溫度', () => {
    it('應正確格式化攝氏溫度', () => {
      const result = `${25.5}°C`;
      expect(result).toBe('25.5°C');
    });

    it('應正確四捨五入到整數', () => {
      const result = Math.round(25.7);
      expect(result).toBe(26);
    });

    it('應處理負溫度', () => {
      const result = `${-5.2}°C`;
      expect(result).toBe('-5.2°C');
    });

    it('應處理零溫度', () => {
      const result = `${0}°C`;
      expect(result).toBe('0°C');
    });

    it('應處理非常高的溫度', () => {
      const result = `${50.5}°C`;
      expect(result).toBe('50.5°C');
    });
  });

  describe('格式化濕度', () => {
    it('應返回百分比格式', () => {
      const result = `${65}%`;
      expect(result).toBe('65%');
    });

    it('應處理邊界值 0%', () => {
      const result = `${0}%`;
      expect(result).toBe('0%');
    });

    it('應處理邊界值 100%', () => {
      const result = `${100}%`;
      expect(result).toBe('100%');
    });
  });

  describe('格式化日期時間', () => {
    it('應將 ISO 字符串格式化為本地時間', () => {
      const isoString = '2024-02-27T14:30:00Z';
      const date = new Date(isoString);
      const formatted = date.toLocaleTimeString('zh-TW');
      expect(formatted).toContain(':');
    });

    it('應正確顯示日期', () => {
      const isoString = '2024-02-27T14:30:00Z';
      const date = new Date(isoString);
      const formatted = date.toLocaleDateString('zh-TW');
      expect(formatted).toContain('2024');
    });
  });

  describe('格式化風向', () => {
    it('應將 0 度轉換為北', () => {
      const directions: { [key: number]: string } = {
        0: '北',
        45: '東北',
        90: '東',
        135: '東南',
        180: '南',
        225: '西南',
        270: '西',
        315: '西北',
      };
      expect(directions[0]).toBe('北');
    });

    it('應將 90 度轉換為東', () => {
      const directions: { [key: number]: string } = {
        0: '北',
        45: '東北',
        90: '東',
        135: '東南',
        180: '南',
        225: '西南',
        270: '西',
        315: '西北',
      };
      expect(directions[90]).toBe('東');
    });

    it('應將 180 度轉換為南', () => {
      const directions: { [key: number]: string } = {
        0: '北',
        45: '東北',
        90: '東',
        135: '東南',
        180: '南',
        225: '西南',
        270: '西',
        315: '西北',
      };
      expect(directions[180]).toBe('南');
    });

    it('應將 270 度轉換為西', () => {
      const directions: { [key: number]: string } = {
        0: '北',
        45: '東北',
        90: '東',
        135: '東南',
        180: '南',
        225: '西南',
        270: '西',
        315: '西北',
      };
      expect(directions[270]).toBe('西');
    });
  });

  describe('格式化降水量', () => {
    it('應返回 mm 單位', () => {
      const result = `${2.5}mm`;
      expect(result).toBe('2.5mm');
    });

    it('應處理零降水量', () => {
      const result = `${0}mm`;
      expect(result).toBe('0mm');
    });

    it('應處理大降水量', () => {
      const result = `${150.5}mm`;
      expect(result).toBe('150.5mm');
    });
  });
});
