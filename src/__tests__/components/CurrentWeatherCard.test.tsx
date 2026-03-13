import React from 'react';
import { render } from '@testing-library/react-native';

import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import type { CurrentWeather, Location } from '@/api/types';

jest.mock('@/hooks/useMDColors', () => ({
  useMDColors: () => ({
    primary: '#3366ff',
    outline: '#778899',
  }),
}));

jest.mock('@/utils/date', () => ({
  formatTime: jest.fn((value: string) => `formatted:${value}`),
}));

jest.mock('@/utils/glass', () => ({
  getGlassStyle: jest.fn(() => ({})),
}));

jest.mock('@/utils/unit-conversion', () => ({
  formatWindSpeed: jest.fn((value: number, unit: string) => `${value}-${unit}`),
}));

jest.mock('@/utils/weather-code', () => ({
  getWeatherCodeInfo: jest.fn((code: number) => ({
    icon: `icon-${code}`,
    description: `weather-${code}`,
  })),
}));

jest.mock('@/components/ui/SourceBadge', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    SourceBadge: ({ source }: { source: string }) =>
      React.createElement(Text, null, `badge:${source}`),
  };
});

const mockLocation: Location = {
  latitude: 25.033,
  longitude: 121.5654,
  name: '台北市信義區',
  city: '台北市',
  township: '信義區',
  neighborhood: '市府站',
};

const mockCurrentWeather: CurrentWeather = {
  timestamp: '2026-03-09T06:30:00.000Z',
  temperature: 25.4,
  apparentTemperature: 27.2,
  humidity: 66,
  description: '原始描述不應直接顯示',
  weatherCode: 3,
  windSpeed: 18,
  windDirection: 90,
  precipitation: 1.25,
  precipitationProbability: 70,
};

describe('CurrentWeatherCard', () => {
  it('應渲染主要資訊、次要地點文字與來源 badge', () => {
    const { getByText, queryByText } = render(
      <CurrentWeatherCard data={mockCurrentWeather} location={mockLocation} source="weatherapi" />,
    );

    expect(getByText('台北市信義區')).toBeTruthy();
    expect(getByText('市府站')).toBeTruthy();
    expect(getByText('badge:weatherapi')).toBeTruthy();
    expect(getByText('25°')).toBeTruthy();
    expect(getByText('weather-3')).toBeTruthy();
    expect(getByText('體感溫度')).toBeTruthy();
    expect(getByText('27°')).toBeTruthy();
    expect(getByText('濕度')).toBeTruthy();
    expect(getByText('66%')).toBeTruthy();
    expect(getByText('降水量')).toBeTruthy();
    expect(getByText('1.3 mm')).toBeTruthy();
    expect(getByText('最後更新：formatted:2026-03-09T06:30:00.000Z')).toBeTruthy();
    expect(queryByText('原始描述不應直接顯示')).toBeNull();
  });
});
