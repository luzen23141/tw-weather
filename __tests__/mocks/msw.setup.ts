import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createMockWeatherData } from '../factories/weather.factory';

export const handlers = [
  // CWA API
  http.get('https://api.cwa.gov.tw/*', () => {
    return HttpResponse.json(createMockWeatherData());
  }),

  // Open-Meteo API
  http.get('https://api.open-meteo.com/*', () => {
    return HttpResponse.json({
      current: {
        temperature: 25.5,
        relative_humidity: 65,
        weather_code: 0,
        wind_speed_10m: 10,
        wind_direction_10m: 180,
      },
      hourly: {
        time: ['2024-02-27T11:00', '2024-02-27T12:00'],
        temperature_2m: [26.0, 26.5],
      },
      daily: {
        time: ['2024-02-28', '2024-02-29'],
        temperature_2m_max: [28.0, 27.5],
        temperature_2m_min: [20.0, 19.5],
        weather_code: [1, 2],
      },
    });
  }),

  // WeatherAPI
  http.get('https://api.weatherapi.com/*', () => {
    return HttpResponse.json({
      current: {
        temp_c: 25.5,
        humidity: 65,
        condition: { text: '晴天', code: 1000 },
        wind_kph: 10,
        wind_degree: 180,
      },
      forecast: {
        forecastday: [
          {
            date: '2024-02-28',
            day: {
              maxtemp_c: 28.0,
              mintemp_c: 20.0,
              condition: { text: '多雲', code: 1003 },
            },
          },
        ],
      },
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
