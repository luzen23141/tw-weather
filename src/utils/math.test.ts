describe('數學工具測試', () => {
  describe('基本算術', () => {
    it('應能進行加法', () => {
      expect(1 + 1).toBe(2);
      expect(5 + 3).toBe(8);
    });

    it('應能進行減法', () => {
      expect(5 - 3).toBe(2);
      expect(10 - 4).toBe(6);
    });

    it('應能進行乘法', () => {
      expect(3 * 4).toBe(12);
      expect(5 * 2).toBe(10);
    });

    it('應能進行除法', () => {
      expect(10 / 2).toBe(5);
      expect(6 / 3).toBe(2);
    });
  });

  describe('陣列操作', () => {
    it('應能計算陣列長度', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.length).toBe(5);
    });

    it('應能求陣列總和', () => {
      const arr = [1, 2, 3, 4, 5];
      const sum = arr.reduce((a, b) => a + b, 0);
      expect(sum).toBe(15);
    });

    it('應能計算平均值', () => {
      const arr = [10, 20, 30];
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      expect(avg).toBe(20);
    });
  });

  describe('物件操作', () => {
    it('應能訪問物件屬性', () => {
      const obj = { temperature: 25, humidity: 65 };
      expect(obj.temperature).toBe(25);
      expect(obj.humidity).toBe(65);
    });

    it('應能更新物件屬性', () => {
      const obj = { value: 10 };
      obj.value = 20;
      expect(obj.value).toBe(20);
    });
  });

  describe('字符串操作', () => {
    it('應能拼接字符串', () => {
      const str1 = 'Hello';
      const str2 = 'World';
      expect(`${str1} ${str2}`).toBe('Hello World');
    });

    it('應能轉換字符串大小寫', () => {
      expect('hello'.toUpperCase()).toBe('HELLO');
      expect('WORLD'.toLowerCase()).toBe('world');
    });

    it('應能檢查字符串包含', () => {
      const str = 'weather';
      expect(str.includes('wea')).toBe(true);
      expect(str.includes('xyz')).toBe(false);
    });
  });
});
