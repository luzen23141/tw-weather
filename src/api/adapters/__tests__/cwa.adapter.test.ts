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

  it('should fallback from district to city when district has no forecast records', async () => {
    const banqiaoLocation: Location = {
      name: '新北市板橋區',
      city: '新北市',
      district: '板橋區',
      latitude: 25.0142,
      longitude: 121.4592,
    };

    (global.fetch as jest.Mock).mockImplementation((url: { toString: () => string } | string) => {
      const urlStr = url.toString();
      const decodedUrl = decodeURIComponent(urlStr);

      if (urlStr.includes('O-A0001-001')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: {
              Station: [
                {
                  StationName: '板橋',
                  GeoInfo: {
                    StationLatitude: '25.0130',
                    StationLongitude: '121.4630',
                  },
                  ObsTime: { DateTime: '2026-03-07T07:00:00+08:00' },
                  WeatherElement: {
                    AirTemperature: '20',
                    RelativeHumidity: '85',
                    Weather: '陰',
                    WindSpeed: '1.5',
                    WindDirection: '120',
                    AirPressure: '1012',
                    Now: { Precipitation: '0' },
                  },
                },
              ],
            },
          }),
        });
      }

      if (urlStr.includes('F-D0047-089') && decodedUrl.includes('LocationName=板橋區')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: {
              Locations: [{ Location: [] }],
            },
          }),
        });
      }

      if (urlStr.includes('F-D0047-089') && decodedUrl.includes('LocationName=新北市')) {
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
                              DataTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ Temperature: '21' }],
                            },
                          ],
                        },
                        {
                          ElementName: '3小時降雨機率',
                          Time: [
                            {
                              StartTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ ProbabilityOfPrecipitation: '40' }],
                            },
                          ],
                        },
                        {
                          ElementName: '相對濕度',
                          Time: [
                            {
                              DataTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ RelativeHumidity: '80' }],
                            },
                          ],
                        },
                        {
                          ElementName: '風速',
                          Time: [
                            {
                              DataTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ WindSpeed: '3' }],
                            },
                          ],
                        },
                        {
                          ElementName: '風向',
                          Time: [
                            {
                              DataTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ WindDirection: '150' }],
                            },
                          ],
                        },
                        {
                          ElementName: '體感溫度',
                          Time: [
                            {
                              DataTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ Temperature: '22' }],
                            },
                          ],
                        },
                        {
                          ElementName: '天氣現象',
                          Time: [
                            {
                              DataTime: '2026-03-07T12:00:00+08:00',
                              ElementValue: [{ WeatherCode: '04', Weather: '陰' }],
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

      if (urlStr.includes('F-D0047-091') && decodedUrl.includes('LocationName=板橋區')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: {
              Locations: [{ Location: [] }],
            },
          }),
        });
      }

      if (urlStr.includes('F-D0047-091') && decodedUrl.includes('LocationName=新北市')) {
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
                          ElementName: '最高溫度',
                          Time: [
                            {
                              StartTime: '2026-03-07T06:00:00+08:00',
                              ElementValue: [{ Temperature: '24' }],
                            },
                          ],
                        },
                        {
                          ElementName: '最低溫度',
                          Time: [
                            {
                              StartTime: '2026-03-07T06:00:00+08:00',
                              ElementValue: [{ Temperature: '18' }],
                            },
                          ],
                        },
                        {
                          ElementName: '12小時降雨機率',
                          Time: [
                            {
                              StartTime: '2026-03-07T06:00:00+08:00',
                              ElementValue: [{ ProbabilityOfPrecipitation: '30' }],
                            },
                          ],
                        },
                        {
                          ElementName: '天氣現象',
                          Time: [
                            {
                              StartTime: '2026-03-07T06:00:00+08:00',
                              ElementValue: [{ WeatherCode: '04', Weather: '陰' }],
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

    const result = await cwaAdapter.fetchWeather(banqiaoLocation);
    expect(result.hourlyForecast.length).toBeGreaterThan(0);
    expect(result.dailyForecast.length).toBeGreaterThan(0);

    const requestUrls = (global.fetch as jest.Mock).mock.calls.map(([url]) =>
      decodeURIComponent(String(url)),
    );
    expect(requestUrls.some((url) => url.includes('LocationName=板橋區'))).toBe(true);
    expect(requestUrls.some((url) => url.includes('LocationName=新北市'))).toBe(true);
  });
});
