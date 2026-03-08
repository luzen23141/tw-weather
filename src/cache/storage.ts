import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const APP_STORAGE_PREFIXES = [
  'weather-settings',
  'weather-locations',
  'weather:',
  'history:',
  'timestamp:history:',
] as const;

function isAppStorageKey(key: string): boolean {
  return APP_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * 統一 Storage 層 adapter
 * Platform-aware：
 * - React Native: 優先 MMKV（若可用），否則 AsyncStorage
 * - Web: localStorage
 */

export interface StorageAdapter {
  /** 取得值 */
  getItem(key: string): Promise<string | null>;

  /** 設定值 */
  setItem(key: string, value: string): Promise<void>;

  /** 移除值 */
  removeItem(key: string): Promise<void>;

  /** 清空所有 */
  clear(): Promise<void>;

  /** 取得所有 keys */
  getAllKeys(): Promise<string[]>;

  /** 多鍵移除 */
  multiRemove(keys: string[]): Promise<void>;
}

function getBrowserStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const hasStorageApi =
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function' &&
    typeof localStorage.removeItem === 'function' &&
    typeof localStorage.clear === 'function' &&
    typeof localStorage.key === 'function' &&
    typeof localStorage.length === 'number';

  if (!hasStorageApi) {
    return null;
  }

  return localStorage;
}

/**
 * Web localStorage adapter 實作
 */
class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const browserStorage = getBrowserStorage();
    if (browserStorage === null) {
      return null;
    }

    try {
      return browserStorage.getItem(key);
    } catch (error) {
      console.error(`localStorage getItem 失敗 [${key}]:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const browserStorage = getBrowserStorage();
    if (browserStorage === null) {
      return;
    }

    try {
      browserStorage.setItem(key, value);
    } catch (error) {
      console.error(`localStorage setItem 失敗 [${key}]:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    const browserStorage = getBrowserStorage();
    if (browserStorage === null) {
      return;
    }

    try {
      browserStorage.removeItem(key);
    } catch (error) {
      console.error(`localStorage removeItem 失敗 [${key}]:`, error);
    }
  }

  async clear(): Promise<void> {
    const browserStorage = getBrowserStorage();
    if (browserStorage === null) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < browserStorage.length; i += 1) {
        const key = browserStorage.key(i);
        if (key && isAppStorageKey(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        browserStorage.removeItem(key);
      });
    } catch (error) {
      console.error('localStorage clear 失敗:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    const browserStorage = getBrowserStorage();
    if (browserStorage === null) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < browserStorage.length; i += 1) {
        const key = browserStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      console.error('localStorage getAllKeys 失敗:', error);
      return [];
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    const browserStorage = getBrowserStorage();
    if (browserStorage === null) {
      return;
    }

    try {
      keys.forEach((key) => {
        browserStorage.removeItem(key);
      });
    } catch (error) {
      console.error('localStorage multiRemove 失敗:', error);
    }
  }
}

/**
 * AsyncStorage adapter 實作（React Native 備選方案）
 */
class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`AsyncStorage getItem 失敗 [${key}]:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`AsyncStorage setItem 失敗 [${key}]:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`AsyncStorage removeItem 失敗 [${key}]:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(isAppStorageKey);
      if (keysToRemove.length === 0) {
        return;
      }

      await this.multiRemove(keysToRemove);
    } catch (error) {
      console.error('AsyncStorage clear 失敗:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return Array.isArray(keys) ? [...keys] : [];
    } catch (error) {
      console.error('AsyncStorage getAllKeys 失敗:', error);
      return [];
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(async (key) => AsyncStorage.removeItem(key)));
    } catch (error) {
      console.error('AsyncStorage multiRemove 失敗:', error);
    }
  }
}

/**
 * 取得平台對應的 storage adapter
 */
function getStorageAdapter(): StorageAdapter {
  if (Platform.OS === 'web') {
    return new LocalStorageAdapter();
  }
  // React Native（iOS、Android）使用 AsyncStorage
  // 注：未來可升級為 MMKV + AsyncStorage fallback
  return new AsyncStorageAdapter();
}

/**
 * 單例 storage adapter（平台感知）
 */
export const storage = getStorageAdapter();

/**
 * JSON 序列化/反序列化輔助函式
 */
export function serializeValue<T>(value: T): string {
  return JSON.stringify(value);
}

export function deserializeValue<T>(value: string | null): T | null {
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('反序列化值失敗:', error);
    return null;
  }
}
