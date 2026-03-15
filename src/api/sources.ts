/**
 * 資料源 Registry
 *
 * 所有資料源的 metadata 集中定義於此，避免散落在各模組。
 * 新增資料源時只需在此處新增一筆，其他地方 import 即可。
 */

import type { WeatherSource } from './types';

export interface SourceMeta {
  /** 資料源 ID（對應 WeatherSource） */
  id: WeatherSource;
  /** 後端 provider ID（對應 proxy API 回傳的 id） */
  providerId: string;
  /** 顯示名稱 */
  label: string;
  /** SourceBadge 樣式 class */
  badgeClassName: string;
}

/**
 * 所有可選資料源（不含 aggregate 虛擬來源）
 */
export const WEATHER_SOURCES: SourceMeta[] = [
  {
    id: 'cwa',
    providerId: 'cwa',
    label: 'CWA',
    badgeClassName: 'bg-md-primary/15 border-glass-border',
  },
  {
    id: 'open-meteo',
    providerId: 'openmeteo',
    label: 'Open-Meteo',
    badgeClassName: 'bg-md-tertiary/15 border-glass-border',
  },
  {
    id: 'weatherapi',
    providerId: 'weatherapi',
    label: 'WeatherAPI',
    badgeClassName: 'bg-md-secondary/15 border-glass-border',
  },
  {
    id: 'openweathermap',
    providerId: 'openweathermap',
    label: 'OWM',
    badgeClassName: 'bg-md-error/15 border-glass-border',
  },
];

/**
 * 聚合虛擬來源的 badge 樣式
 */
export const AGGREGATE_BADGE_CLASS = 'bg-md-primary-container border-glass-border';

/**
 * 預設啟用的資料源
 */
export const DEFAULT_ACTIVE_SOURCE: WeatherSource = 'cwa';
export const DEFAULT_ENABLED_SOURCES: WeatherSource[] = ['cwa', 'open-meteo'];

/**
 * 依 WeatherSource ID 快速查找 SourceMeta
 */
export const SOURCE_META_MAP: Record<string, SourceMeta> = Object.fromEntries(
  WEATHER_SOURCES.map((s) => [s.id, s]),
);

/**
 * 依後端 providerId 快速查找 WeatherSource
 */
export const PROVIDER_ID_TO_SOURCE: Record<string, WeatherSource> = Object.fromEntries(
  WEATHER_SOURCES.map((s) => [s.providerId, s.id]),
);
