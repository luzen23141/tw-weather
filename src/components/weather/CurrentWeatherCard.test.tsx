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

jest.mock('@/components/ui/glass', () => ({
  getGlassStyle: jest.fn(() => ({})),
}));

jest.mock('@/utils/unit-conversion', () => ({
  formatWindSpeed: jest.fn((value: number) => `${value} km/h`),
}));

jest.mock('@/utils/weather-code', () => ({
  getWeatherCodeInfo: jest.fn((code: number) => ({
    icon: `icon-${code}`,
    description: `weather-${code}`,
  })),
}));

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
  uvIndex: 7,
};

describe('CurrentWeatherCard', () => {
  it('應渲染地點、溫度、天氣描述與四格指標', () => {
    const { getByText, queryByText } = render(
      <CurrentWeatherCard data={mockCurrentWeather} location={mockLocation} />,
    );

    expect(getByText('台北市信義區')).toBeTruthy();
    expect(getByText('市府站')).toBeTruthy();
    expect(getByText('25°')).toBeTruthy();
    expect(getByText('weather-3')).toBeTruthy();

    expect(getByText('濕度')).toBeTruthy();
    expect(getByText('66%')).toBeTruthy();
    expect(getByText('降水')).toBeTruthy();
    expect(getByText('70%')).toBeTruthy();
    expect(getByText('1.3 mm')).toBeTruthy();
    expect(getByText('UV')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();

    // 原始 description 欄位不直接顯示，一律經 getWeatherCodeInfo 轉換
    expect(queryByText('原始描述不應直接顯示')).toBeNull();
  });

  it('未帶今日高低溫時不顯示區間那一行，體感仍顯示', () => {
    const { getByText, queryByText } = render(
      <CurrentWeatherCard data={mockCurrentWeather} location={mockLocation} />,
    );

    expect(queryByText(/\d+° \/ \d+°/)).toBeNull();
    expect(getByText('體感 27°')).toBeTruthy();
  });

  it('帶入今日高低溫與最高體感時一併顯示', () => {
    const { getByText } = render(
      <CurrentWeatherCard
        data={mockCurrentWeather}
        location={mockLocation}
        todayHigh={31}
        todayLow={24}
        apparentHigh={34}
      />,
    );

    expect(getByText('31° / 24°')).toBeTruthy();
    expect(getByText('體感 27° · 最高 34°')).toBeTruthy();
  });
});
