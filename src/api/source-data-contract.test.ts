import type {
  CurrentWeather,
  DailyForecast,
  HistoricalDayWeather,
  HourlyForecast,
  Location,
} from '@/api/types';

const TEST_LOCATION: Location = {
  name: '台北市信義區',
  city: '台北市',
  district: '信義區',
  latitude: 25.033,
  longitude: 121.5654,
};

function createJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'ERROR',
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

function expectCurrentContract(current: CurrentWeather) {
  expect(Number.isFinite(current.temperature)).toBe(true);
  expect(Number.isFinite(current.apparentTemperature)).toBe(true);
  expect(Number.isFinite(current.humidity)).toBe(true);
  expect(Number.isFinite(current.weatherCode)).toBe(true);
  expect(Number.isFinite(current.windSpeed)).toBe(true);
  expect(Number.isFinite(current.windDirection)).toBe(true);
  expect(Number.isFinite(current.precipitation)).toBe(true);
  expect(typeof current.description).toBe('string');
  expect(current.description.length).toBeGreaterThan(0);
  expect(typeof current.timestamp).toBe('string');
}

function expectHourlyContract(hourly: HourlyForecast[]) {
  expect(hourly.length).toBeGreaterThan(0);
  const first = hourly[0];
  expect(first).toBeDefined();
  if (!first) return;

  expect(typeof first.timestamp).toBe('string');
  expect(Number.isFinite(first.temperature)).toBe(true);
  expect(Number.isFinite(first.apparentTemperature)).toBe(true);
  expect(Number.isFinite(first.weatherCode)).toBe(true);
  expect(Number.isFinite(first.precipitationProbability)).toBe(true);
  expect(Number.isFinite(first.precipitation)).toBe(true);
  expect(Number.isFinite(first.humidity)).toBe(true);
  expect(Number.isFinite(first.windSpeed)).toBe(true);
  expect(Number.isFinite(first.windDirection)).toBe(true);
}

function expectDailyContract(daily: DailyForecast[]) {
  expect(daily.length).toBeGreaterThan(0);
  const first = daily[0];
  expect(first).toBeDefined();
  if (!first) return;

  expect(typeof first.date).toBe('string');
  expect(Number.isFinite(first.temperatureMax)).toBe(true);
  expect(Number.isFinite(first.temperatureMin)).toBe(true);
  expect(Number.isFinite(first.weatherCode)).toBe(true);
  expect(Number.isFinite(first.precipitationProbability)).toBe(true);
  expect(Number.isFinite(first.precipitationSum)).toBe(true);
}

function expectHistoryContract(history: HistoricalDayWeather[]) {
  expect(history.length).toBeGreaterThan(0);
  const first = history[0];
  expect(first).toBeDefined();
  if (!first) return;

  expect(typeof first.date).toBe('string');
  expect(Number.isFinite(first.temperatureMax)).toBe(true);
  expect(Number.isFinite(first.temperatureMin)).toBe(true);
  expect(Number.isFinite(first.temperatureAvg)).toBe(true);
  expect(Number.isFinite(first.weatherCode)).toBe(true);
  expect(Number.isFinite(first.precipitationSum)).toBe(true);
  expect(Number.isFinite(first.windSpeedAvg)).toBe(true);
  expect(Number.isFinite(first.humidityAvg)).toBe(true);
}

describe('資料源資料契約（頁面使用欄位）', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.EXPO_PUBLIC_CWA_API_KEY = 'test-cwa-key';
    process.env.EXPO_PUBLIC_WEATHERAPI_KEY = 'test-weatherapi-key';
    process.env.EXPO_PUBLIC_OPENWEATHERMAP_KEY = 'test-owm-key';
    delete process.env.EXPO_PUBLIC_PROXY_URL;

    global.fetch = jest.fn();
  });

  it('CWA adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const { default: cwaAdapter } = await import('@/api/adapters/cwa.adapter');

    (global.fetch as jest.Mock).mockImplementation((url: string | URL) => {
      const urlString = url.toString();

      if (urlString.includes('O-A0001-001')) {
        return Promise.resolve(
          createJsonResponse({
            success: true,
            records: {
              Station: [
                {
                  StationName: '台北站',
                  GeoInfo: { StationLatitude: '25.0375', StationLongitude: '121.5637' },
                  ObsTime: { DateTime: '2026-03-07T10:00:00+08:00' },
                  WeatherElement: {
                    AirTemperature: '20.1',
                    RelativeHumidity: '82',
                    Weather: '陰',
                    WindSpeed: '1.2',
                    WindDirection: '200',
                    AirPressure: '1012.5',
                    Now: { Precipitation: '0' },
                  },
                },
              ],
            },
          }),
        );
      }

      if (urlString.includes('F-D0047-089')) {
        return Promise.resolve(
          createJsonResponse({
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
        );
      }

      if (urlString.includes('F-D0047-091')) {
        return Promise.resolve(
          createJsonResponse({
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
        );
      }

      throw new Error(`Unexpected URL: ${urlString}`);
    });

    const result = await cwaAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('Open-Meteo adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const { default: openMeteoAdapter } = await import('@/api/adapters/open-meteo.adapter');

    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse({
        current: {
          temperature: 23,
          relative_humidity: 75,
          apparent_temperature: 24,
          is_day: 1,
          weathercode: 3,
          wind_speed_10m: 4,
          wind_direction_10m: 170,
          precipitation: 0,
          pressure_msl: 1011,
          visibility: 10000,
        },
        hourly: {
          time: ['2026-03-07T12:00'],
          temperature_2m: [23],
          apparent_temperature: [24],
          weather_code: [3],
          precipitation: [0],
          precipitation_probability: [20],
          relative_humidity_2m: [75],
          wind_speed_10m: [4],
          wind_direction_10m: [170],
        },
        daily: {
          time: ['2026-03-07'],
          weather_code: [3],
          temperature_2m_max: [27],
          temperature_2m_min: [20],
          precipitation_sum: [1.2],
          precipitation_probability_max: [40],
          sunrise: ['2026-03-07T06:12'],
          sunset: ['2026-03-07T17:58'],
          wind_speed_10m_max: [8],
          uv_index_max: [5],
        },
      }),
    );

    const result = await openMeteoAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('WeatherAPI adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const { default: weatherApiAdapter } = await import('@/api/adapters/weatherapi.adapter');

    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse({
        current: {
          last_updated_epoch: 1709800000,
          last_updated: '2026-03-07 12:00',
          temp_c: 24,
          is_day: 1,
          condition: { code: 1003, text: 'Partly cloudy', icon: '' },
          wind_kph: 7,
          wind_degree: 150,
          humidity: 70,
          feelslike_c: 25,
          precip_mm: 0,
          pressure_mb: 1012,
          vis_km: 10,
        },
        forecast: {
          forecastday: [
            {
              date: '2026-03-07',
              day: {
                date: '2026-03-07',
                maxtemp_c: 29,
                mintemp_c: 22,
                avgtemp_c: 25,
                condition: { text: 'Cloudy', code: 1006 },
                daily_chance_of_rain: 30,
                totalprecip_mm: 1.4,
                maxwind_kph: 12,
                sunrise: '06:10 AM',
                sunset: '05:58 PM',
                avg_humidity: 72,
                uv: 6,
              },
              astro: { sunrise: '06:10 AM', sunset: '05:58 PM' },
              hour: [
                {
                  time: '2026-03-07 12:00',
                  temp_c: 24,
                  feelslike_c: 25,
                  humidity: 70,
                  condition: { text: 'Cloudy', code: 1006 },
                  chance_of_rain: 35,
                  precip_mm: 0.1,
                  wind_kph: 7,
                  wind_degree: 150,
                },
              ],
            },
          ],
        },
      }),
    );

    const result = await weatherApiAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('OpenWeatherMap adapter 應回傳首頁與預報頁需要的欄位', async () => {
    const { default: openWeatherMapAdapter } =
      await import('@/api/adapters/openweathermap.adapter');

    (global.fetch as jest.Mock).mockImplementation((url: string | URL) => {
      const urlString = url.toString();

      if (urlString.includes('data/2.5/weather')) {
        return Promise.resolve(
          createJsonResponse({
            dt: 1709800000,
            main: {
              temp: 23,
              feels_like: 24,
              temp_min: 21,
              temp_max: 25,
              pressure: 1011,
              humidity: 74,
            },
            wind: { speed: 5, deg: 160 },
            weather: [{ id: 803, main: 'Clouds', description: 'broken clouds' }],
            visibility: 10000,
          }),
        );
      }

      if (urlString.includes('data/2.5/forecast')) {
        return Promise.resolve(
          createJsonResponse({
            list: [
              {
                dt: 1709800000,
                main: {
                  temp: 23,
                  feels_like: 24,
                  temp_min: 22,
                  temp_max: 24,
                  pressure: 1011,
                  humidity: 74,
                },
                weather: [{ id: 803, main: 'Clouds', description: 'broken clouds' }],
                wind: { speed: 5, deg: 160 },
                pop: 0.3,
                rain: { '3h': 0.2 },
                dt_txt: '2026-03-07 12:00:00',
              },
              {
                dt: 1709886400,
                main: {
                  temp: 22,
                  feels_like: 23,
                  temp_min: 20,
                  temp_max: 23,
                  pressure: 1010,
                  humidity: 76,
                },
                weather: [{ id: 500, main: 'Rain', description: 'light rain' }],
                wind: { speed: 6, deg: 180 },
                pop: 0.5,
                rain: { '3h': 1.1 },
                dt_txt: '2026-03-08 12:00:00',
              },
            ],
            city: { sunrise: 1709772000, sunset: 1709815200 },
          }),
        );
      }

      throw new Error(`Unexpected URL: ${urlString}`);
    });

    const result = await openWeatherMapAdapter.fetchWeather(TEST_LOCATION);
    expectCurrentContract(result.current);
    expectHourlyContract(result.hourlyForecast);
    expectDailyContract(result.dailyForecast);
  });

  it('歷史頁資料契約：weatherService 應在 Open-Meteo 失敗時 fallback 到 WeatherAPI', async () => {
    const { weatherService } = await import('@/api/weather.service');

    (global.fetch as jest.Mock).mockImplementation((url: string | URL) => {
      const urlString = url.toString();

      if (urlString.includes('archive-api.open-meteo.com')) {
        return Promise.resolve(createJsonResponse({ error: 'failed' }, false, 500));
      }

      if (urlString.includes('weatherapi.com') && urlString.includes('/history.json')) {
        return Promise.resolve(
          createJsonResponse({
            current: {
              last_updated_epoch: 1709800000,
              last_updated: '2026-03-07 12:00',
              temp_c: 24,
              is_day: 1,
              condition: { code: 1003, text: 'Partly cloudy', icon: '' },
              wind_kph: 7,
              wind_degree: 150,
              humidity: 70,
              feelslike_c: 25,
              precip_mm: 0,
              pressure_mb: 1012,
              vis_km: 10,
            },
            forecast: {
              forecastday: [
                {
                  date: '2026-03-06',
                  day: {
                    date: '2026-03-06',
                    maxtemp_c: 28,
                    mintemp_c: 21,
                    avgtemp_c: 24,
                    condition: { text: 'Cloudy', code: 1006 },
                    daily_chance_of_rain: 40,
                    totalprecip_mm: 2.2,
                    maxwind_kph: 14,
                    sunrise: '06:10 AM',
                    sunset: '05:58 PM',
                    avg_humidity: 75,
                    uv: 5,
                  },
                  astro: { sunrise: '06:10 AM', sunset: '05:58 PM' },
                  hour: [],
                },
              ],
            },
          }),
        );
      }

      throw new Error(`Unexpected URL: ${urlString}`);
    });

    const history = await weatherService.fetchHistory(TEST_LOCATION, 1);
    expectHistoryContract(history);
    expect(history[0]?.source).toBe('weatherapi');
  });
});
