/**
 * 聚合引擎工具函式（純函式，方便測試）
 */

import { TemperatureAggregationRule, ThresholdRule } from './aggregation.types';

/**
 * 計算中位數
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1];
    const right = sorted[mid];
    return left !== undefined && right !== undefined ? (left + right) / 2 : 0;
  }
  const center = sorted[mid];
  return center !== undefined ? center : 0;
}

/**
 * 聚合數值（平均、中位數、最小、最大）
 */
export function aggregateNumericValues(
  values: number[],
  strategy: 'average' | 'median' | 'min' | 'max',
): number {
  if (values.length === 0) return 0;

  switch (strategy) {
    case 'average':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'median':
      return median(values);
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
  }
}

/**
 * 聚合溫度值
 * - union: 取最小值與最大值的範圍中點
 * - average: 取平均值
 * - median: 取中位數
 */
export function aggregateTemperature(values: number[], rule: TemperatureAggregationRule): number {
  if (values.length === 0) return 20;

  if (rule === 'union') {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (min + max) / 2;
  } else if (rule === 'average') {
    return aggregateNumericValues(values, 'average');
  } else if (rule === 'median') {
    return aggregateNumericValues(values, 'median');
  } else if (typeof rule === 'object' && 'source' in rule) {
    // 指定單一來源時，使用第一個值作為 fallback
    return values[0] ?? 20;
  }

  return aggregateNumericValues(values, 'average');
}

/**
 * 聚合溫度範圍（最高溫、最低溫）
 */
export function aggregateTemperatureRange(
  mins: number[],
  maxes: number[],
  rule: TemperatureAggregationRule,
): { min: number; max: number } {
  if (mins.length === 0 || maxes.length === 0) {
    return { min: 15, max: 25 };
  }

  if (rule === 'union') {
    // 取所有來源的最低最低溫 ~ 最高最高溫
    return {
      min: Math.min(...mins),
      max: Math.max(...maxes),
    };
  } else if (rule === 'average') {
    // 分別平均
    return {
      min: aggregateNumericValues(mins, 'average'),
      max: aggregateNumericValues(maxes, 'average'),
    };
  } else if (rule === 'median') {
    // 分別取中位數
    return {
      min: aggregateNumericValues(mins, 'median'),
      max: aggregateNumericValues(maxes, 'median'),
    };
  }

  // Fallback: 平均
  return {
    min: aggregateNumericValues(mins, 'average'),
    max: aggregateNumericValues(maxes, 'average'),
  };
}

/**
 * 評估閾值規則
 * - any: 只要有一個達標即為 true
 * - all: 全部達標才為 true
 * - half: 半數以上達標
 * - { count: N }: N 個達標
 */
export function evaluateThreshold(
  positiveCount: number,
  totalCount: number,
  rule: ThresholdRule,
): boolean {
  if (totalCount === 0) return false;

  if (rule === 'any') {
    return positiveCount > 0;
  } else if (rule === 'all') {
    return positiveCount === totalCount;
  } else if (rule === 'half') {
    return positiveCount >= Math.ceil(totalCount / 2);
  } else if (typeof rule === 'object' && 'count' in rule) {
    return positiveCount >= rule.count;
  }

  return false;
}

/**
 * 聚合降雨機率
 * 根據閾值規則判斷是否「有下雨」，若有則回傳 100，否則回傳 0
 * 或者取平均降雨機率
 */
export function aggregatePrecipitationProbability(probs: number[], rule: ThresholdRule): number {
  if (probs.length === 0) return 0;

  // 將降雨機率轉為計數（>= 50% 視為下雨）
  const rainyCount = probs.filter((p) => p >= 50).length;
  const hasRain = evaluateThreshold(rainyCount, probs.length, rule);

  // 若根據規則判斷有下雨，回傳最高機率；否則回傳最低機率
  if (hasRain) {
    return Math.max(...probs);
  }

  // 沒有下雨時，回傳平均機率
  return aggregateNumericValues(probs, 'average');
}

/**
 * 取眾數（最常出現的值）
 * 用於聚合天氣代碼等離散值
 */
export function mode(values: number[]): number {
  if (values.length === 0) return 0;

  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  let maxCount = 0;
  let modeValue = values[0] ?? 0;

  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  }

  return modeValue;
}
