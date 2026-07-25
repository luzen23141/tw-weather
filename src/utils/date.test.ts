import {
  formatDate,
  formatTime,
  formatShortDate,
  getDayOfWeek,
  isToday,
  daysAgo,
  dayOffsetFromToday,
  toLocalDateString,
} from '@/utils/date';

describe('Date Utils', () => {
  describe('formatTime', () => {
    it('應正確格式化時間為「上午/下午 H:mm」', () => {
      const date = new Date('2024-03-15T15:30:00Z');
      const result = formatTime(date.toISOString());
      expect(result).toMatch(/^(上午|下午) \d{1,2}:\d{2}$/);
    });

    it('應包含時間數字', () => {
      const date = new Date('2024-03-15T03:45:00Z');
      const result = formatTime(date.toISOString());
      expect(result).toContain(':');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('應區分上午和下午', () => {
      const morningDate = new Date();
      morningDate.setHours(9, 30, 0);
      const eveningDate = new Date();
      eveningDate.setHours(18, 45, 0);

      const morningResult = formatTime(morningDate.toISOString());
      const eveningResult = formatTime(eveningDate.toISOString());

      // 上午應該包含「上午」
      expect(morningResult).toContain('上午');
      // 下午應該包含「下午」
      expect(eveningResult).toContain('下午');
    });

    it('應使用 12 小時制', () => {
      const date = new Date();
      date.setHours(15, 30, 0);
      const result = formatTime(date.toISOString());
      // 15:30 應該顯示為「下午 3:30」，不是「下午 15:30」
      expect(result).not.toMatch(/\d{2}:/);
      expect(result).toMatch(/\d{1}:\d{2}|\d{2}:\d{2}/);
    });
  });

  describe('formatDate', () => {
    it('應格式化日期為「3月15日（五）」格式', () => {
      const result = formatDate('2024-03-15T00:00:00Z');
      expect(result).toBe('3月15日（五）');
    });

    it('應包含月份、日期和週資訊', () => {
      const result = formatDate('2024-01-01T00:00:00Z');
      expect(result).toContain('1月');
      expect(result).toContain('1日');
    });

    it('應處理不同月份', () => {
      const result12 = formatDate('2024-12-25T00:00:00Z');
      expect(result12).toContain('12月');
    });
  });

  describe('formatShortDate', () => {
    it('應格式化日期為「3/15」格式', () => {
      const result = formatShortDate('2024-03-15T00:00:00Z');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}/);
    });

    it('應返回簡短日期格式', () => {
      const result = formatShortDate('2024-01-05T00:00:00Z');
      expect(result).toBe('1/5');
    });
  });

  describe('getDayOfWeek', () => {
    it('應識別今天', () => {
      const today = new Date().toISOString();
      expect(getDayOfWeek(today)).toBe('今天');
    });

    it('應識別明天', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDayOfWeek(tomorrow.toISOString())).toBe('明天');
    });

    it('應返回昨天的週', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = getDayOfWeek(yesterday.toISOString());
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('應返回週字符串', () => {
      const result = getDayOfWeek('2024-03-18T00:00:00Z');
      expect(['今天', '明天', '週一', '週二', '週三', '週四', '週五', '週六', '週日']).toContain(
        result,
      );
    });
  });

  describe('isToday', () => {
    it('應識別今天的日期', () => {
      const today = new Date().toISOString();
      expect(isToday(today)).toBe(true);
    });

    it('應識別昨天不是今天', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday.toISOString())).toBe(false);
    });

    it('應識別明天不是今天', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow.toISOString())).toBe(false);
    });
  });

  describe('daysAgo', () => {
    it('應計算今天為 0 天前', () => {
      const today = new Date().toISOString();
      expect(daysAgo(today)).toBe(0);
    });

    it('應計算昨天為 1 天前', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(daysAgo(yesterday.toISOString())).toBe(1);
    });

    it('應計算明天為 -1 天前（未來）', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(daysAgo(tomorrow.toISOString())).toBe(-1);
    });

    it('應計算多天前', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      expect(daysAgo(sevenDaysAgo.toISOString())).toBe(7);
    });
  });

  describe('toLocalDateString', () => {
    it('應輸出本地時區的 YYYY-MM-DD 並補零', () => {
      expect(toLocalDateString(new Date(2026, 6, 5))).toBe('2026-07-05');
      expect(toLocalDateString(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    /*
      台灣是 UTC+8，凌晨時段 UTC 仍停在前一天。先前各處用
      `toISOString().slice(0, 10)` 取日期，在這個時段會整整少一天 ——
      查歷史少要一天、快取鍵與查詢日期錯開。
    */
    it('凌晨時段不應退回 UTC 的前一天', () => {
      const earlyMorning = new Date(2026, 6, 26, 1, 30);
      expect(toLocalDateString(earlyMorning)).toBe('2026-07-26');

      // 對照組：在 UTC 以東（台灣 UTC+8）的環境，舊寫法會得到前一天。
      // 以時區偏移判斷而非寫死，否則這個測試在 UTC 的 CI 上會假性失敗。
      const isEastOfUTC = earlyMorning.getTimezoneOffset() < 0;
      if (isEastOfUTC) {
        expect(earlyMorning.toISOString().slice(0, 10)).toBe('2026-07-25');
      }
    });
  });

  describe('dayOffsetFromToday', () => {
    const shiftDays = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString();
    };

    it('今天為 0、明天為 1、昨天為 -1', () => {
      expect(dayOffsetFromToday(shiftDays(0))).toBe(0);
      expect(dayOffsetFromToday(shiftDays(1))).toBe(1);
      expect(dayOffsetFromToday(shiftDays(-1))).toBe(-1);
    });

    it('無效日期回傳 undefined', () => {
      expect(dayOffsetFromToday('not-a-date')).toBeUndefined();
    });

    /*
      這是 CWA 在當日晚間的真實行為：每日預報不再包含今天，第一筆是明天。
      先前各處假設「陣列第 0 筆＝今天」，在這個時段就會整條時間軸錯位一天。
    */
    it('當預報首筆是明天時，不應被誤判為今天', () => {
      const forecastDates = [shiftDays(1), shiftDays(2), shiftDays(3)];
      expect(forecastDates.filter((d) => dayOffsetFromToday(d) === 0)).toHaveLength(0);
      expect(dayOffsetFromToday(forecastDates[0] as string)).toBe(1);
    });
  });
});
