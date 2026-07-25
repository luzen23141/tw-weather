// Mock react-native 以避免 ESM 問題（與 storage.test.ts 同一套做法）
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

/*
  以記憶體 Map 取代真實 storage。

  serializeValue / deserializeValue 保持真實實作 —— 序列化本身就是被測行為的
  一部分（快取存的是字串），把它一起 mock 掉會讓測試繞過真正會出錯的地方。
*/
const memory = new Map<string, string>();

jest.mock('@/cache/storage', () => {
  const actual = jest.requireActual<typeof import('@/cache/storage')>('@/cache/storage');
  return {
    serializeValue: actual.serializeValue,
    deserializeValue: actual.deserializeValue,
    storage: {
      getItem: jest.fn(async (key: string) => memory.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        memory.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        memory.delete(key);
      }),
      clear: jest.fn(async () => {
        memory.clear();
      }),
      getAllKeys: jest.fn(async () => [...memory.keys()]),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => memory.delete(k));
      }),
    },
  };
});

import { HistoryCacheManager } from '@/cache/history-cache';
import { CacheKeys } from '@/cache/keys';
import type { HistoricalDayWeather } from '@/api/types';
import { toLocalDateString } from '@/utils/date';

/** 相對今天位移 n 天的本地日期字串（-1 = 昨天） */
function shiftDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

function makeDay(date: string, tempMax = 30): HistoricalDayWeather {
  return {
    date,
    temperatureMax: tempMax,
    temperatureMin: 20,
    temperatureAvg: 25,
    weatherCode: 3,
    description: '陰天',
    precipitationSum: 0,
    windSpeedAvg: 5,
    humidityAvg: 70,
    source: 'open-meteo',
  };
}

const LAT = 25.0142;
const LON = 121.4592;

describe('HistoryCacheManager', () => {
  let cache: HistoryCacheManager;

  beforeEach(() => {
    memory.clear();
    cache = new HistoryCacheManager();
  });

  describe('單日存取', () => {
    it('存入後應能取回同一天的資料', async () => {
      const day = makeDay('2026-07-24', 34);
      await cache.saveHistoryDay(LAT, LON, day);

      await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.toEqual(day);
    });

    it('未快取的日期應回傳 null', async () => {
      await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.toBeNull();
    });

    it('不同地點的同一天不應互相污染', async () => {
      await cache.saveHistoryDay(LAT, LON, makeDay('2026-07-24', 34));

      await expect(cache.getHistoryDay(24.1477, 120.6736, '2026-07-24')).resolves.toBeNull();
    });

    /*
      歷史觀測是既成事實，不會再改變，所以刻意設為永不過期
      （expiryTime: Infinity）。若哪天改成有限 TTL，這個測試會提醒你
      「30 天 lazy cleanup」才是清理機制，不是 TTL。
    */
    it('歷史資料不應因時間經過而過期', async () => {
      await cache.saveHistoryDay(LAT, LON, makeDay('2026-07-24'));

      const realNow = Date.now;
      // 跳到十年後
      Date.now = () => realNow() + 10 * 365 * 24 * 60 * 60 * 1000;
      try {
        await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.not.toBeNull();
      } finally {
        Date.now = realNow;
      }
    });

    /*
      迴歸測試：先前寫入用 `expiryTime: Infinity` 表示永不過期，但 JSON 沒有
      Infinity，序列化後變成 null；讀取時 `Date.now() > null` 把 null 當 0，
      恆為 true，於是每一筆存進去的歷史在第一次讀取就被判定過期並刪除 ——
      歷史快取等於從未生效。這條直接檢查落盤格式，避免有人改回 Infinity。
    */
    it('落盤的過期時間必須是可被 JSON 表達的值', async () => {
      await cache.saveHistoryDay(LAT, LON, makeDay('2026-07-24'));

      const { storage } = jest.requireMock<typeof import('@/cache/storage')>('@/cache/storage');
      const raw = await storage.getItem(CacheKeys.historyDay(LAT, LON, '2026-07-24'));
      const parsed = JSON.parse(raw ?? '{}') as { expiryTime: unknown };

      expect(parsed.expiryTime).toBeNull();
      // 存入後立刻讀取必須拿得到 —— 這正是先前失效的地方
      await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.not.toBeNull();
    });

    it('資料損毀時應回傳 null 而非拋錯', async () => {
      const { storage } = jest.requireMock<typeof import('@/cache/storage')>('@/cache/storage');
      await storage.setItem(CacheKeys.historyDay(LAT, LON, '2026-07-24'), '{ 壞掉的 JSON');

      await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.toBeNull();
    });
  });

  describe('範圍查詢', () => {
    /*
      這是本檔最重要的一條。

      archive 資料源不含當日觀測，所以範圍要從**昨天**起算；若從今天起算，
      days=2 會浪費一格在永遠取不到的今天上，實際只拿得到昨天一天。
    */
    it('應從昨天起算，不含今天', async () => {
      const { missingDates } = await cache.getHistoryRange(LAT, LON, 2);

      expect(missingDates).toEqual([shiftDate(-1), shiftDate(-2)]);
      expect(missingDates).not.toContain(shiftDate(0));
    });

    it('已快取的日期不應出現在 missingDates', async () => {
      await cache.saveHistoryDay(LAT, LON, makeDay(shiftDate(-1)));

      const { cached, missingDates } = await cache.getHistoryRange(LAT, LON, 2);

      expect(cached.map((d) => d.date)).toEqual([shiftDate(-1)]);
      expect(missingDates).toEqual([shiftDate(-2)]);
    });

    it('批次寫入後整段範圍都應命中', async () => {
      await cache.saveHistoryRange(LAT, LON, [
        makeDay(shiftDate(-1), 34),
        makeDay(shiftDate(-2), 33),
      ]);

      const { cached, missingDates } = await cache.getHistoryRange(LAT, LON, 2);

      expect(cached).toHaveLength(2);
      expect(missingDates).toEqual([]);
    });

    it('空清單不應建立索引', async () => {
      await cache.saveHistoryRange(LAT, LON, []);

      const { storage } = jest.requireMock<typeof import('@/cache/storage')>('@/cache/storage');
      await expect(storage.getItem(CacheKeys.historyIndex(LAT, LON))).resolves.toBeNull();
    });

    /*
      索引說有、實體資料卻不在時（例如被 cleanup 清掉或寫入中斷），
      該日期必須回到 missingDates 讓上層重新抓，而不是靜默少一天。
    */
    it('索引存在但實體資料遺失時應補回 missingDates', async () => {
      const yesterday = shiftDate(-1);
      await cache.saveHistoryDay(LAT, LON, makeDay(yesterday));

      const { storage } = jest.requireMock<typeof import('@/cache/storage')>('@/cache/storage');
      // 只刪資料，索引仍宣稱有這天
      await storage.removeItem(CacheKeys.historyDay(LAT, LON, yesterday));

      const { cached, missingDates } = await cache.getHistoryRange(LAT, LON, 1);

      expect(cached).toEqual([]);
      expect(missingDates).toContain(yesterday);
    });
  });

  describe('cleanup', () => {
    it('應移除超過保留期的資料並保留期限內的', async () => {
      const recent = shiftDate(-5);
      const old = shiftDate(-40);
      await cache.saveHistoryRange(LAT, LON, [makeDay(recent), makeDay(old)]);

      await cache.cleanup(30);

      await expect(cache.getHistoryDay(LAT, LON, recent)).resolves.not.toBeNull();
      await expect(cache.getHistoryDay(LAT, LON, old)).resolves.toBeNull();
    });

    it('清理後索引不應再宣稱持有已刪除的日期', async () => {
      const old = shiftDate(-40);
      await cache.saveHistoryRange(LAT, LON, [makeDay(shiftDate(-5)), makeDay(old)]);

      await cache.cleanup(30);

      const { storage } = jest.requireMock<typeof import('@/cache/storage')>('@/cache/storage');
      const raw = await storage.getItem(CacheKeys.historyIndex(LAT, LON));
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw ?? '{}')).toEqual({ cachedDates: [shiftDate(-5)] });
    });

    it('沒有任何快取時應安靜結束', async () => {
      await expect(cache.cleanup(30)).resolves.toBeUndefined();
    });
  });

  describe('清除', () => {
    it('clearLocation 應只清掉指定地點', async () => {
      await cache.saveHistoryDay(LAT, LON, makeDay('2026-07-24'));
      await cache.saveHistoryDay(24.1477, 120.6736, makeDay('2026-07-24'));

      await cache.clearLocation(LAT, LON);

      await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.toBeNull();
      await expect(cache.getHistoryDay(24.1477, 120.6736, '2026-07-24')).resolves.not.toBeNull();
    });

    it('clearAll 應清掉所有地點的歷史快取', async () => {
      await cache.saveHistoryDay(LAT, LON, makeDay('2026-07-24'));
      await cache.saveHistoryDay(24.1477, 120.6736, makeDay('2026-07-24'));

      await cache.clearAll();

      await expect(cache.getHistoryDay(LAT, LON, '2026-07-24')).resolves.toBeNull();
      await expect(cache.getHistoryDay(24.1477, 120.6736, '2026-07-24')).resolves.toBeNull();
    });
  });
});
