import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => {
  const React = require('react');

  return {
    Alert: {
      alert: jest.fn(),
    },
    Text: 'Text',
    View: 'View',
    StyleSheet: {
      flatten: jest.fn((style) => style),
    },
    Platform: {
      OS: 'web',
    },
    useColorScheme: jest.fn(() => 'light'),
    FlatList: ({
      data,
      renderItem,
    }: {
      data: unknown[];
      renderItem: (arg: any) => React.ReactNode;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        data.map((item, index) =>
          React.createElement(React.Fragment, { key: String(index) }, renderItem({ item, index })),
        ),
      ),
  };
});

import { HourlyForecastList } from '@/components/weather/HourlyForecastList';
import type { HourlyForecast } from '@/api/types';

jest.mock('@/utils/date', () => ({
  formatTime: jest.fn((value: string) => `formatted:${value}`),
}));

jest.mock('@/utils/glass', () => ({
  getGlassStyle: jest.fn(() => ({})),
}));

jest.mock('@/utils/weather-code', () => ({
  getWeatherCodeInfo: jest.fn((code: number) => ({
    icon: `icon-${code}`,
    description: `weather-${code}`,
  })),
}));

const makeHourlyForecast = (index: number): HourlyForecast => ({
  timestamp: `2026-03-09T${String(index).padStart(2, '0')}:00:00.000Z`,
  temperature: 20.2 + index,
  apparentTemperature: 21 + index,
  weatherCode: index,
  description: `desc-${index}`,
  precipitationProbability: index,
  precipitation: 0,
  humidity: 70,
  windSpeed: 10,
  windDirection: 180,
});

describe('HourlyForecastList', () => {
  it('無資料時應顯示空狀態', () => {
    const { getByText } = render(<HourlyForecastList forecasts={[]} />);

    expect(getByText('逐時預報')).toBeTruthy();
    expect(getByText('無逐時預報資料')).toBeTruthy();
  });

  it('應渲染前 24 筆並格式化時間與溫度', () => {
    const forecasts = Array.from({ length: 25 }, (_, index) => makeHourlyForecast(index));
    const { getByText, queryByText } = render(<HourlyForecastList forecasts={forecasts} />);

    expect(getByText('formatted:2026-03-09T00:00:00.000Z')).toBeTruthy();
    expect(getByText('formatted:2026-03-09T23:00:00.000Z')).toBeTruthy();
    expect(queryByText('formatted:2026-03-09T24:00:00.000Z')).toBeNull();

    expect(getByText('20°')).toBeTruthy();
    expect(getByText('23%')).toBeTruthy();
  });
});
