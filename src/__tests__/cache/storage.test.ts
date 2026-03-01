// Mock react-native 模組以避免 ESM 問題
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

import { serializeValue, deserializeValue } from '@/cache/storage';

describe('Storage serialization utils', () => {
  describe('serializeValue', () => {
    it('應序列化字符串值', () => {
      expect(serializeValue('hello')).toBe('"hello"');
    });

    it('應序列化數字值', () => {
      expect(serializeValue(42)).toBe('42');
    });

    it('應序列化對象', () => {
      const obj = { name: 'test', value: 123 };
      expect(serializeValue(obj)).toBe(JSON.stringify(obj));
    });

    it('應序列化 null', () => {
      expect(serializeValue(null)).toBe('null');
    });
  });

  describe('deserializeValue', () => {
    it('應還原序列化字符串值', () => {
      expect(deserializeValue<string>('"hello"')).toBe('hello');
    });

    it('應還原序列化數字值', () => {
      expect(deserializeValue<number>('42')).toBe(42);
    });

    it('應還原序列化對象', () => {
      const obj = { name: 'test', value: 123 };
      expect(deserializeValue(JSON.stringify(obj))).toEqual(obj);
    });

    it('null 輸入應返回 null', () => {
      expect(deserializeValue(null)).toBeNull();
    });
  });
});
