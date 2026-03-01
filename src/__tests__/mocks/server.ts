import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const cwaHandler = http.get('https://api.cwa.gov.tw/*', () => {
  return HttpResponse.json({
    success: true,
    data: {
      temperature: 25.5,
      humidity: 65,
      windSpeed: 10,
      windDirection: 180,
      description: '晴天',
      weatherCode: 0,
    },
  });
});

const openMeteoHandler = http.get('https://api.open-meteo.com/*', () => {
  return HttpResponse.json({
    current: {
      temperature: 25.8,
      relative_humidity: 62,
      weather_code: 1,
      wind_speed_10m: 9,
      wind_direction_10m: 175,
    },
    hourly: {
      time: ['2024-02-27T10:00', '2024-02-27T11:00'],
      temperature_2m: [25, 26],
      humidity: [65, 60],
    },
    daily: {
      time: ['2024-02-27', '2024-02-28'],
      weather_code: [0, 1],
      temperature_2m_max: [28, 27],
      temperature_2m_min: [20, 19],
    },
  });
});

const weatherAPIHandler = http.get('https://api.weatherapi.com/*', () => {
  return HttpResponse.json({
    current: {
      temp_c: 25.2,
      humidity: 68,
      wind_kph: 9.5,
      wind_degree: 178,
      condition: { text: '晴天', code: 1000 },
    },
    forecast: {
      forecastday: [
        {
          date: '2024-02-27',
          day: {
            maxtemp_c: 28.5,
            mintemp_c: 20.5,
            condition: { text: '晴天', code: 1000 },
          },
        },
      ],
    },
  });
});

export const server = setupServer(cwaHandler, openMeteoHandler, weatherAPIHandler);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
