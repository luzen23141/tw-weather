import cwaAdapter from './src/api/adapters/cwa.adapter';
import { Location } from './src/api/types';

// Mock `fetch` globally
global.fetch = async (url: any) => {
  if (url.toString().includes('O-A0001-001')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        records: {
          Station: [
            {
              StationName: '臺北',
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
    };
  }
  if (url.toString().includes('F-D0047-089')) {
    return {
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
    };
  }
  if (url.toString().includes('F-D0047-091')) {
    return {
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
    };
  }
  throw new Error('Unexpected URL: ' + url);
};

process.env.EXPO_PUBLIC_CWA_API_KEY = 'test-key';

async function main() {
  const result = await cwaAdapter.fetchWeather({
    city: '臺北市',
    name: '臺北市',
    latitude: 25.033,
    longitude: 121.5654,
  });
  console.log('hourlyForecast length:', result.hourlyForecast.length);
  console.log('dailyForecast length:', result.dailyForecast.length);
}

main().catch(console.error);
