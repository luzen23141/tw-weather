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

jest.mock('@/components/ui/glass', () => ({
  getGlassStyle: jest.fn(() => ({})),
}));

jest.mock('@/utils/weather-code', () => ({
  getWeatherCodeInfo: jest.fn((code: number) => ({
    icon: `icon-${code}`,
    description: `weather-${code}`,
  })),
}));

/** 基準日 2026-03-09，逐時以本地時間建構，避免時區讓斷言飄移 */
function makeHourlyForecast(hourOfDay: number, overrides: Partial<HourlyForecast> = {}) {
  return {
    timestamp: new Date(2026, 2, 9, hourOfDay, 0, 0).toISOString(),
    temperature: 20.2 + hourOfDay,
    apparentTemperature: 21 + hourOfDay,
    weatherCode: hourOfDay,
    description: `desc-${hourOfDay}`,
    precipitationProbability: hourOfDay,
    precipitation: 0,
    humidity: 70,
    windSpeed: 10,
    windDirection: 180,
    ...overrides,
  } satisfies HourlyForecast;
}

describe('HourlyForecastList', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('無資料時應顯示空狀態', () => {
    const { getByText } = render(<HourlyForecastList forecasts={[]} />);

    expect(getByText('逐時預報')).toBeTruthy();
    expect(getByText('無逐時預報資料')).toBeTruthy();
  });

  it('顯示筆數由後端決定，不做截斷', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 9, 0, 0, 0));

    // 後端可能回傳 7 天共 168 筆；先前寫死的 slice(0, 24) 會砍掉 144 筆
    const forecasts = Array.from({ length: 48 }, (_, index) =>
      makeHourlyForecast(0, {
        timestamp: new Date(2026, 2, 9, index, 0, 0).toISOString(),
        temperature: index,
        precipitationProbability: index,
      }),
    );
    const { getByText } = render(<HourlyForecastList forecasts={forecasts} />);

    // 第 47 筆（超過 24）仍要渲染得出來
    expect(getByText('47%')).toBeTruthy();
  });

  it('以 24 小時制顯示時間，並把當前時段標為「現在」', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 9, 14, 0, 0));

    const forecasts = [
      makeHourlyForecast(12),
      makeHourlyForecast(13),
      makeHourlyForecast(14),
      makeHourlyForecast(15),
    ];
    const { getByText, queryByText } = render(<HourlyForecastList forecasts={forecasts} />);

    expect(getByText('現在')).toBeTruthy();
    // 14:00 是「現在」，因此不以時間呈現
    expect(queryByText('14:00')).toBeNull();
    expect(getByText('12:00')).toBeTruthy();
    expect(getByText('15:00')).toBeTruthy();
  });

  it('跨日時在該筆標出日期', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 9, 22, 0, 0));

    const forecasts = [
      makeHourlyForecast(22),
      makeHourlyForecast(23),
      {
        ...makeHourlyForecast(0),
        timestamp: new Date(2026, 2, 10, 0, 0, 0).toISOString(),
      },
    ];
    const { getByText } = render(<HourlyForecastList forecasts={forecasts} />);

    expect(getByText('3/10')).toBeTruthy();
  });
});
