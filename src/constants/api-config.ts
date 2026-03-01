export const API_CONFIG = {
  CWA: {
    BASE_URL: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
    API_KEY: process.env.EXPO_PUBLIC_CWA_API_KEY ?? '',
  },
  OPEN_METEO: {
    BASE_URL: 'https://api.open-meteo.com/v1',
    ARCHIVE_URL: 'https://archive-api.open-meteo.com/v1',
  },
  WEATHERAPI: {
    BASE_URL: 'https://api.weatherapi.com/v1',
    API_KEY: process.env.EXPO_PUBLIC_WEATHERAPI_KEY ?? '',
  },
} as const;
