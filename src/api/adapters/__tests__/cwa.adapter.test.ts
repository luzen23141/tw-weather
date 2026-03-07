import cwaAdapter, { selectNearestStation } from '../cwa.adapter';
import { Location } from '../../types';

// Mock `fetch` globally
global.fetch = jest.fn();

describe('CwaAdapter', () => {
  const mockLocation: Location = {
    city: '臺北市',
    name: '臺北市',
    latitude: 25.033,
    longitude: 121.5654,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.EXPO_PUBLIC_CWA_API_KEY = 'test-key';
  });

  it('should choose the nearest station instead of the first station', () => {
    const station = selectNearestStation(mockLocation, [
      {
        StationName: '高雄',
        GeoInfo: {
          StationLatitude: '22.6273',
          StationLongitude: '120.3014',
        },
        WeatherElement: {
          AirTemperature: '28',
        },
      },
      {
        StationName: '台北',
        GeoInfo: {
          StationLatitude: '25.0375',
          StationLongitude: '121.5637',
        },
        WeatherElement: {
          AirTemperature: '19',
        },
      },
    ]);

    expect(station?.StationName).toBe('台北');
  });

  it('should successfully fetch current weather, hourly, and daily forecasts', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: { toString: () => string } | string) => {
      const urlStr = url.toString();
      if (urlStr.includes('O-A0001-001')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: {
              Station: [
                {
                  StationName: '高雄',
                  GeoInfo: {
                    StationLatitude: '22.6273',
                    StationLongitude: '120.3014',
                  },
                  ObsTime: { DateTime: '2026-02-28T06:00:00+08:00' },
                  WeatherElement: {
                    AirTemperature: '28.1',
                    RelativeHumidity: '70',
                    Weather: '晴',
                    WindSpeed: '2.1',
                    WindDirection: '180',
                    AirPressure: '1010.5',
                  },
                },
                {
                  StationName: '臺北',
                  GeoInfo: {
                    StationLatitude: '25.0375',
                    StationLongitude: '121.5637',
                  },
                  ObsTime: { DateTime: '2026-02-28T07:00:00+08:00' },
                  WeatherElement: {
                    AirTemperature: '18.7',
                    RelativeHumidity: '86',
                    Weather: '陰',
                    WindSpeed: '0.8',
                    WindDirection: '273',
                    AirPressure: '1013.2',
                  },
                },
              ],
            },
          }),
        });
      }
      if (urlStr.includes('F-D0047-089')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: {
              Locations: [
                {
                  Location: [
                    {
                      WeatherElement: [
                        {
                          ElementName: '溫度',
                          Time: [
                            {
                              DataTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ Temperature: '19' }],
                            },
                          ],
                        },
                        {
                          ElementName: '3小時降雨機率',
                          Time: [
                            {
                              StartTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ ProbabilityOfPrecipitation: '30' }],
                            },
                          ],
                        },
                        {
                          ElementName: '相對濕度',
                          Time: [
                            {
                              DataTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ RelativeHumidity: '80' }],
                            },
                          ],
                        },
                        {
                          ElementName: '風速',
                          Time: [
                            {
                              DataTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ WindSpeed: '2' }],
                            },
                          ],
                        },
                        {
                          ElementName: '風向',
                          Time: [
                            {
                              DataTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ WindDirection: '120' }],
                            },
                          ],
                        },
                        {
                          ElementName: '體感溫度',
                          Time: [
                            {
                              DataTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ Temperature: '19' }],
                            },
                          ],
                        },
                        {
                          ElementName: '天氣現象',
                          Time: [
                            {
                              DataTime: '2026-02-28T09:00:00+08:00',
                              ElementValue: [{ WeatherCode: '04' }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          }),
        });
      }
      if (urlStr.includes('F-D0047-091')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: {
              Locations: [
                {
                  Location: [
                    {
                      WeatherElement: [
                        {
                          ElementName: '平均溫度',
                          Time: [
                            {
                              StartTime: '2026-02-28T06:00:00+08:00',
                              ElementValue: [{ Temperature: '18' }],
                            },
                          ],
                        },
                        {
                          ElementName: '最高溫度',
                          Time: [
                            {
                              StartTime: '2026-02-28T06:00:00+08:00',
                              ElementValue: [{ Temperature: '21' }],
                            },
                          ],
                        },
                        {
                          ElementName: '最低溫度',
                          Time: [
                            {
                              StartTime: '2026-02-28T06:00:00+08:00',
                              ElementValue: [{ Temperature: '15' }],
                            },
                          ],
                        },
                        {
                          ElementName: '12小時降雨機率',
                          Time: [
                            {
                              StartTime: '2026-02-28T06:00:00+08:00',
                              ElementValue: [{ ProbabilityOfPrecipitation: '20' }],
                            },
                          ],
                        },
                        {
                          ElementName: '天氣現象',
                          Time: [
                            {
                              StartTime: '2026-02-28T06:00:00+08:00',
                              ElementValue: [{ WeatherCode: '04' }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + urlStr));
    });

    const result = await cwaAdapter.fetchWeather(mockLocation);

    expect(global.fetch).toHaveBeenCalledTimes(3);

    // Assert Current Weather
    expect(result.current.temperature).toBe(18.7);
    expect(result.current.humidity).toBe(86);
    expect(result.current.windSpeed).toBe(0.8);
    expect(result.current.description).toBe('陰');

    // Assert Hourly
    expect(result.hourlyForecast).toHaveLength(1);
    expect(result.hourlyForecast[0]!.temperature).toBe(19);

    // Assert Daily
    expect(result.dailyForecast).toHaveLength(1);
    expect(result.dailyForecast[0]!.temperatureMax).toBe(21);
    expect(result.dailyForecast[0]!.temperatureMin).toBe(15);
  });
});
