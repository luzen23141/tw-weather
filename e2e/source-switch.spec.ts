import { expect, test } from '@playwright/test';

type WeatherSource = 'cwa' | 'open-meteo' | 'weatherapi' | 'openweathermap';

type PersistedStore<T> = {
  state: T;
  version: number;
};

const LOCATION_STORE: PersistedStore<{
  savedLocations: Array<{
    name: string;
    city: string;
    district?: string;
    township?: string;
    latitude: number;
    longitude: number;
  }>;
  selectedLocation: {
    name: string;
    city: string;
    district?: string;
    township?: string;
    latitude: number;
    longitude: number;
  };
}> = {
  state: {
    savedLocations: [
      {
        name: '台北市信義區',
        city: '台北市',
        district: '信義區',
        township: '信義區',
        latitude: 25.033,
        longitude: 121.5654,
      },
    ],
    selectedLocation: {
      name: '台北市信義區',
      city: '台北市',
      district: '信義區',
      township: '信義區',
      latitude: 25.033,
      longitude: 121.5654,
    },
  },
  version: 0,
};

const CWA_TOWNSHIP_ONLY_LOCATION_STORE: PersistedStore<{
  savedLocations: Array<{
    name: string;
    city: string;
    district?: string;
    township?: string;
    latitude: number;
    longitude: number;
  }>;
  selectedLocation: {
    name: string;
    city: string;
    district?: string;
    township?: string;
    latitude: number;
    longitude: number;
  };
}> = {
  state: {
    savedLocations: [
      {
        name: '新北市板橋區',
        city: '新北市',
        township: '板橋區',
        latitude: 25.0142,
        longitude: 121.4592,
      },
    ],
    selectedLocation: {
      name: '新北市板橋區',
      city: '新北市',
      township: '板橋區',
      latitude: 25.0142,
      longitude: 121.4592,
    },
  },
  version: 0,
};

function buildSingleSettings(source: WeatherSource): PersistedStore<{
  theme: 'light';
  temperatureUnit: 'celsius';
  windSpeedUnit: 'kmh';
  displayMode: 'single';
  locationDisplayFormat: 'township';
  activeSource: WeatherSource;
  enabledSources: WeatherSource[];
}> {
  return {
    state: {
      theme: 'light',
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      displayMode: 'single',
      locationDisplayFormat: 'township',
      activeSource: source,
      enabledSources: [source],
    },
    version: 0,
  };
}

const AGGREGATE_SETTINGS: PersistedStore<{
  theme: 'light';
  temperatureUnit: 'celsius';
  windSpeedUnit: 'kmh';
  displayMode: 'aggregate';
  locationDisplayFormat: 'township';
  activeSource: 'cwa';
  enabledSources: ['cwa', 'open-meteo'];
}> = {
  state: {
    theme: 'light',
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    displayMode: 'aggregate',
    locationDisplayFormat: 'township',
    activeSource: 'cwa',
    enabledSources: ['cwa', 'open-meteo'],
  },
  version: 0,
};

async function seedState(
  page: import('@playwright/test').Page,
  settings: PersistedStore<unknown>,
  locations: PersistedStore<unknown> = LOCATION_STORE,
): Promise<void> {
  await page.goto('/settings');
  await page.evaluate(
    ({ state, locations }) => {
      window.localStorage.setItem('weather-settings', JSON.stringify(state));
      window.localStorage.setItem('weather-locations', JSON.stringify(locations));
    },
    { state: settings, locations },
  );
  await page.reload();
}

async function mockAllWeatherApis(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        records: {
          Station: [
            {
              StationName: '台北站',
              GeoInfo: { StationLatitude: '25.0375', StationLongitude: '121.5637' },
              ObsTime: { DateTime: '2026-03-07T10:00:00+08:00' },
              WeatherElement: {
                AirTemperature: '20',
                RelativeHumidity: '82',
                Weather: '陰',
                WindSpeed: '2',
                WindDirection: '180',
                AirPressure: '1012',
                Now: { Precipitation: '0' },
              },
            },
          ],
        },
      }),
    });
  });

  await page.route('**/opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-089**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
  });

  await page.route('**/opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
  });

  await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          temperature_2m: 23,
          relative_humidity_2m: 75,
          apparent_temperature: 24,
          is_day: 1,
          weather_code: 3,
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
    });
  });

  await page.route('**/archive-api.open-meteo.com/v1/archive**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        daily: {
          time: ['2026-03-06'],
          weather_code: [3],
          temperature_2m_max: [27],
          temperature_2m_min: [21],
          temperature_2m_mean: [24],
          precipitation_sum: [1.2],
          wind_speed_10m_max: [8],
          relative_humidity_2m_mean: [70],
        },
      }),
    });
  });

  await page.route('**/api.weatherapi.com/v1/forecast.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
    });
  });

  await page.route('**/api.weatherapi.com/v1/history.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
    });
  });

  await page.route('**/api.openweathermap.org/data/2.5/weather**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
    });
  });

  await page.route('**/api.openweathermap.org/data/2.5/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
    });
  });
}

async function mockCwaTownshipFallbackApis(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-089**', async (route) => {
    const url = decodeURIComponent(route.request().url());

    if (url.includes('LocationName=板橋區')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          records: { Locations: [{ Location: [] }] },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
                  ],
                },
              ],
            },
          ],
        },
      }),
    });
  });

  await page.route('**/opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091**', async (route) => {
    const url = decodeURIComponent(route.request().url());

    if (url.includes('LocationName=板橋區')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          records: { Locations: [{ Location: [] }] },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
                  ],
                },
              ],
            },
          ],
        },
      }),
    });
  });
}

async function assertWeatherPagesBySource(
  page: import('@playwright/test').Page,
  badge: string,
): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('信義區', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(badge, { exact: true }).first()).toBeVisible();

  await page.goto('/forecast');
  await expect(page.getByText('逐時與每日預報', { exact: true })).toBeVisible();
  await expect(page.getByText(badge, { exact: true }).first()).toBeVisible();
}

test.describe('資料源 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllWeatherApis(page);
  });

  test.describe('單一資料源', () => {
    const cases: Array<{ source: WeatherSource; badge: string }> = [
      { source: 'cwa', badge: 'CWA' },
      { source: 'open-meteo', badge: 'Open-Meteo' },
      { source: 'weatherapi', badge: 'WeatherAPI' },
      { source: 'openweathermap', badge: 'OWM' },
    ];

    for (const item of cases) {
      test(`${item.source} 應在首頁與預報頁顯示正確來源標籤`, async ({ page }) => {
        await seedState(page, buildSingleSettings(item.source));
        await assertWeatherPagesBySource(page, item.badge);
      });
    }
  });

  test('CWA township 優先地點在第一候選失敗時可 fallback 並顯示有效預報', async ({ page }) => {
    await mockCwaTownshipFallbackApis(page);
    await seedState(page, buildSingleSettings('cwa'), CWA_TOWNSHIP_ONLY_LOCATION_STORE);

    await page.goto('/forecast');
    await expect(page.getByText('逐時與每日預報', { exact: true })).toBeVisible();
    await expect(page.getByText('逐時預報', { exact: true })).toBeVisible();
    await expect(page.getByText('7 日預報', { exact: true })).toBeVisible();
    await expect(page.getByText('無逐時預報資料', { exact: true })).toHaveCount(0);
    await expect(page.getByText('無每日預報資料', { exact: true })).toHaveCount(0);
  });

  test('聚合模式應在首頁、預報、歷史頁顯示聚合來源', async ({ page }) => {
    await seedState(page, AGGREGATE_SETTINGS);

    await page.goto('/');
    await expect(page.getByText('聚合', { exact: true }).first()).toBeVisible();

    await page.goto('/forecast');
    await expect(page.getByText('逐時與每日預報', { exact: true })).toBeVisible();
    await expect(page.getByText('聚合', { exact: true }).first()).toBeVisible();

    await page.goto('/history');
    await expect(page.getByText('聚合', { exact: true }).first()).toBeVisible();
  });
});
