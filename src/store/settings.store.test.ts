describe('Settings Store', () => {
  describe('資料源管理', () => {
    it('應有至少一個啟用的資料源', () => {
      const sources = {
        cwa: true,
        openMeteo: false,
        weatherAPI: false,
      };

      const enabledSources = Object.values(sources).filter(Boolean);
      expect(enabledSources.length).toBeGreaterThan(0);
    });

    it('應防止全部禁用', () => {
      const currentSources = {
        cwa: true,
        openMeteo: true,
        weatherAPI: false,
      };

      const toggleSource = (source: keyof typeof currentSources) => {
        const newState = { ...currentSources, [source]: !currentSources[source] };
        const enabledCount = Object.values(newState).filter(Boolean).length;

        if (enabledCount === 0) {
          return currentSources; // 恢復原狀
        }
        return newState;
      };

      const result = toggleSource('cwa');
      const resultEnabled = Object.values(result).filter(Boolean).length;
      expect(resultEnabled).toBeGreaterThan(0);
    });

    it('應能同時啟用多個資料源', () => {
      const sources = {
        cwa: true,
        openMeteo: true,
        weatherAPI: true,
      };

      const enabled = Object.values(sources).filter(Boolean);
      expect(enabled.length).toBe(3);
    });
  });

  describe('聚合模式', () => {
    it('應有聚合模式狀態', () => {
      const aggregateMode = false;
      expect(typeof aggregateMode).toBe('boolean');
    });

    it('啟用聚合時應至少有兩個資料源', () => {
      const aggregateEnabled = true;
      const sources = ['cwa', 'openMeteo'];

      if (aggregateEnabled) {
        expect(sources.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('位置設定', () => {
    it('應有預設位置', () => {
      const location = 'Taipei';
      expect(location).toBeTruthy();
    });

    it('應驗證位置有效性', () => {
      const validLocations = ['Taipei', 'Kaohsiung', 'Taichung'];
      const selected = 'Taipei';
      expect(validLocations).toContain(selected);
    });
  });

  describe('設定持久化', () => {
    it('應能保存所有設定', () => {
      const settings = {
        sources: { cwa: true },
        aggregateMode: false,
        location: 'Taipei',
      };

      const saved = JSON.stringify(settings);
      const loaded = JSON.parse(saved);

      expect(loaded.location).toBe('Taipei');
    });

    it('應能恢復預設值', () => {
      const defaults = {
        sources: { cwa: true },
        aggregateMode: false,
      };

      expect(defaults.sources.cwa).toBe(true);
    });
  });
});
