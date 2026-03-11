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

import { DailyForecastList } from '@/components/weather/DailyForecastList';
import type { DailyForecast } from '@/api/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

jest.mock('@/utils/date', () => ({
  getDayOfWeek: jest.fn((value: string) => `day:${value}`),
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

const mockDailyForecasts: DailyForecast[] = [
  {
    date: '2026-03-09',
    temperatureMax: 28.9,
    temperatureMin: 19.2,
    weatherCode: 1,
    description: '晴時多雲',
    precipitationProbability: 20,
    precipitationSum: 0,
    sunrise: '2026-03-09T06:00:00.000Z',
    sunset: '2026-03-09T18:00:00.000Z',
    windSpeedMax: 18,
  },
  {
    date: '2026-03-10',
    temperatureMax: 26.1,
    temperatureMin: 18.6,
    weatherCode: 3,
    description: '陰天',
    precipitationProbability: 50,
    precipitationSum: 2,
    sunrise: '2026-03-10T06:00:00.000Z',
    sunset: '2026-03-10T18:00:00.000Z',
    windSpeedMax: 20,
  },
];

describe('DailyForecastList', () => {
  it('無資料時應顯示空狀態', () => {
    const { getByText } = render(<DailyForecastList forecasts={[]} />);

    expect(getByText('7 日預報')).toBeTruthy();
    expect(getByText('無每日預報資料')).toBeTruthy();
  });

  it('應渲染每日項目與四捨五入溫度', () => {
    const { getByText, getAllByText } = render(
      <DailyForecastList forecasts={mockDailyForecasts} />,
    );

    expect(getByText('day:2026-03-09')).toBeTruthy();
    expect(getByText('day:2026-03-10')).toBeTruthy();

    expect(getAllByText('19°')).toHaveLength(2);
    expect(getByText('29°')).toBeTruthy();
    expect(getByText('26°')).toBeTruthy();
  });
});
