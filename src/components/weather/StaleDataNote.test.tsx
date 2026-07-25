import React from 'react';
import { render } from '@testing-library/react-native';

import { StaleDataNote } from '@/components/weather/StaleDataNote';

jest.mock('@/components/ui/glass', () => ({ getGlassStyle: jest.fn(() => ({})) }));
jest.mock('@/components/icons/AppIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { AppIcon: () => React.createElement(Text, null, 'icon') };
});

const NOW = new Date(2026, 6, 23, 12, 0, 0).getTime();
const iso = (minutesAgo: number) => new Date(NOW - minutesAgo * 60000).toISOString();

describe('StaleDataNote', () => {
  it('資料還新時不顯示，不造成常駐的視覺負擔', () => {
    const { toJSON } = render(<StaleDataNote fetchedAt={iso(30)} now={NOW} />);
    expect(toJSON()).toBeNull();
  });

  it('超過一小時即提示，並說明資料有多舊', () => {
    const { getByText } = render(<StaleDataNote fetchedAt={iso(90)} now={NOW} />);
    expect(getByText(/1 小時前/)).toBeTruthy();
  });

  it('超過一天以天為單位', () => {
    const { getByText } = render(<StaleDataNote fetchedAt={iso(60 * 50)} now={NOW} />);
    expect(getByText(/2 天前/)).toBeTruthy();
  });

  it('重新取得中不警告 —— 等結果即可，不必先嚇使用者', () => {
    const { toJSON } = render(<StaleDataNote fetchedAt={iso(90)} isRefetching now={NOW} />);
    expect(toJSON()).toBeNull();
  });

  it('時間戳無法解析時不顯示，而非顯示 NaN', () => {
    const { toJSON } = render(<StaleDataNote fetchedAt="not-a-date" now={NOW} />);
    expect(toJSON()).toBeNull();
  });
});
