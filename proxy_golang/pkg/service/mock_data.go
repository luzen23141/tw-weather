package service

// 各三方天氣 API 的原始回傳資料（hardcoded mock）
// 模擬台北（25.0330, 121.5654）的天氣資料

// ===== CWA 中央氣象署 =====

const mockCWACurrent = `{
  "records": {
    "Station": [
      {
        "StationId": "466920",
        "StationName": "臺北",
        "GeoInfo": {
          "Coordinates": [
            {"StationLatitude": "25.0375", "StationLongitude": "121.5144"}
          ]
        },
        "ObsTime": {
          "DateTime": "2024-06-15T14:00:00+08:00"
        },
        "WeatherElement": {
          "AirTemperature": "28.5",
          "RelativeHumidity": "72",
          "WindSpeed": "3.2",
          "WindDirection": "180",
          "AirPressure": "1008.5",
          "VisibilityDescription": "20公里以上",
          "Weather": "多雲時晴",
          "Now": {
            "Precipitation": "0.0"
          }
        }
      }
    ]
  }
}`

const mockCWAHourly = `{
  "records": {
    "Locations": [
      {
        "Location": [
          {
            "LocationName": "臺北市",
            "Lat": "25.0330",
            "Lon": "121.5654",
            "WeatherElement": [
              {
                "ElementName": "溫度",
                "Time": [
                  {"StartTime": "2024-06-15T06:00:00+08:00", "EndTime": "2024-06-15T09:00:00+08:00", "ElementValue": [{"Value": "26.0", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-15T09:00:00+08:00", "EndTime": "2024-06-15T12:00:00+08:00", "ElementValue": [{"Value": "29.0", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-15T12:00:00+08:00", "EndTime": "2024-06-15T15:00:00+08:00", "ElementValue": [{"Value": "32.0", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-15T15:00:00+08:00", "EndTime": "2024-06-15T18:00:00+08:00", "ElementValue": [{"Value": "30.5", "Measures": "攝氏度"}]}
                ]
              },
              {
                "ElementName": "相對濕度",
                "Time": [
                  {"StartTime": "2024-06-15T06:00:00+08:00", "EndTime": "2024-06-15T09:00:00+08:00", "ElementValue": [{"Value": "85", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-15T09:00:00+08:00", "EndTime": "2024-06-15T12:00:00+08:00", "ElementValue": [{"Value": "75", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-15T12:00:00+08:00", "EndTime": "2024-06-15T15:00:00+08:00", "ElementValue": [{"Value": "65", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-15T15:00:00+08:00", "EndTime": "2024-06-15T18:00:00+08:00", "ElementValue": [{"Value": "70", "Measures": "百分比"}]}
                ]
              },
              {
                "ElementName": "風速",
                "Time": [
                  {"StartTime": "2024-06-15T06:00:00+08:00", "EndTime": "2024-06-15T09:00:00+08:00", "ElementValue": [{"Value": "2.5", "Measures": "公尺/秒"}]},
                  {"StartTime": "2024-06-15T09:00:00+08:00", "EndTime": "2024-06-15T12:00:00+08:00", "ElementValue": [{"Value": "3.0", "Measures": "公尺/秒"}]},
                  {"StartTime": "2024-06-15T12:00:00+08:00", "EndTime": "2024-06-15T15:00:00+08:00", "ElementValue": [{"Value": "3.5", "Measures": "公尺/秒"}]},
                  {"StartTime": "2024-06-15T15:00:00+08:00", "EndTime": "2024-06-15T18:00:00+08:00", "ElementValue": [{"Value": "2.8", "Measures": "公尺/秒"}]}
                ]
              },
              {
                "ElementName": "風向",
                "Time": [
                  {"StartTime": "2024-06-15T06:00:00+08:00", "EndTime": "2024-06-15T09:00:00+08:00", "ElementValue": [{"Value": "180", "Measures": "度"}]},
                  {"StartTime": "2024-06-15T09:00:00+08:00", "EndTime": "2024-06-15T12:00:00+08:00", "ElementValue": [{"Value": "200", "Measures": "度"}]},
                  {"StartTime": "2024-06-15T12:00:00+08:00", "EndTime": "2024-06-15T15:00:00+08:00", "ElementValue": [{"Value": "210", "Measures": "度"}]},
                  {"StartTime": "2024-06-15T15:00:00+08:00", "EndTime": "2024-06-15T18:00:00+08:00", "ElementValue": [{"Value": "190", "Measures": "度"}]}
                ]
              },
              {
                "ElementName": "3小時降雨機率",
                "Time": [
                  {"StartTime": "2024-06-15T06:00:00+08:00", "EndTime": "2024-06-15T09:00:00+08:00", "ElementValue": [{"Value": "10", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-15T09:00:00+08:00", "EndTime": "2024-06-15T12:00:00+08:00", "ElementValue": [{"Value": "20", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-15T12:00:00+08:00", "EndTime": "2024-06-15T15:00:00+08:00", "ElementValue": [{"Value": "30", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-15T15:00:00+08:00", "EndTime": "2024-06-15T18:00:00+08:00", "ElementValue": [{"Value": "40", "Measures": "百分比"}]}
                ]
              },
              {
                "ElementName": "天氣現象",
                "Time": [
                  {"StartTime": "2024-06-15T06:00:00+08:00", "EndTime": "2024-06-15T09:00:00+08:00", "ElementValue": [{"Value": "晴時多雲", "Measures": "自定義 Wx 文字"}]},
                  {"StartTime": "2024-06-15T09:00:00+08:00", "EndTime": "2024-06-15T12:00:00+08:00", "ElementValue": [{"Value": "多雲", "Measures": "自定義 Wx 文字"}]},
                  {"StartTime": "2024-06-15T12:00:00+08:00", "EndTime": "2024-06-15T15:00:00+08:00", "ElementValue": [{"Value": "多雲時晴", "Measures": "自定義 Wx 文字"}]},
                  {"StartTime": "2024-06-15T15:00:00+08:00", "EndTime": "2024-06-15T18:00:00+08:00", "ElementValue": [{"Value": "多雲短暫雨", "Measures": "自定義 Wx 文字"}]}
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}`

const mockCWADaily = `{
  "records": {
    "Locations": [
      {
        "Location": [
          {
            "LocationName": "臺北市",
            "Lat": "25.0330",
            "Lon": "121.5654",
            "WeatherElement": [
              {
                "ElementName": "最高溫度",
                "Time": [
                  {"StartTime": "2024-06-15T00:00:00+08:00", "EndTime": "2024-06-16T00:00:00+08:00", "ElementValue": [{"Value": "33.0", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-16T00:00:00+08:00", "EndTime": "2024-06-17T00:00:00+08:00", "ElementValue": [{"Value": "32.0", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-17T00:00:00+08:00", "EndTime": "2024-06-18T00:00:00+08:00", "ElementValue": [{"Value": "31.0", "Measures": "攝氏度"}]}
                ]
              },
              {
                "ElementName": "最低溫度",
                "Time": [
                  {"StartTime": "2024-06-15T00:00:00+08:00", "EndTime": "2024-06-16T00:00:00+08:00", "ElementValue": [{"Value": "25.0", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-16T00:00:00+08:00", "EndTime": "2024-06-17T00:00:00+08:00", "ElementValue": [{"Value": "24.5", "Measures": "攝氏度"}]},
                  {"StartTime": "2024-06-17T00:00:00+08:00", "EndTime": "2024-06-18T00:00:00+08:00", "ElementValue": [{"Value": "24.0", "Measures": "攝氏度"}]}
                ]
              },
              {
                "ElementName": "12小時降雨機率",
                "Time": [
                  {"StartTime": "2024-06-15T00:00:00+08:00", "EndTime": "2024-06-16T00:00:00+08:00", "ElementValue": [{"Value": "30", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-16T00:00:00+08:00", "EndTime": "2024-06-17T00:00:00+08:00", "ElementValue": [{"Value": "50", "Measures": "百分比"}]},
                  {"StartTime": "2024-06-17T00:00:00+08:00", "EndTime": "2024-06-18T00:00:00+08:00", "ElementValue": [{"Value": "60", "Measures": "百分比"}]}
                ]
              },
              {
                "ElementName": "天氣現象",
                "Time": [
                  {"StartTime": "2024-06-15T00:00:00+08:00", "EndTime": "2024-06-16T00:00:00+08:00", "ElementValue": [{"Value": "多雲時晴", "Measures": "自定義 Wx 文字"}]},
                  {"StartTime": "2024-06-16T00:00:00+08:00", "EndTime": "2024-06-17T00:00:00+08:00", "ElementValue": [{"Value": "多雲短暫雨", "Measures": "自定義 Wx 文字"}]},
                  {"StartTime": "2024-06-17T00:00:00+08:00", "EndTime": "2024-06-18T00:00:00+08:00", "ElementValue": [{"Value": "陰天", "Measures": "自定義 Wx 文字"}]}
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}`

// ===== Open-Meteo =====

const mockOpenMeteoForecast = `{
  "latitude": 25.03,
  "longitude": 121.57,
  "current": {
    "time": "2024-06-15T14:00",
    "temperature_2m": 29.5,
    "apparent_temperature": 33.2,
    "relative_humidity_2m": 70,
    "weather_code": 2,
    "wind_speed_10m": 12.5,
    "wind_direction_10m": 180,
    "precipitation": 0.0,
    "pressure_msl": 1008.3,
    "visibility": 24000,
    "is_day": 1
  },
  "hourly": {
    "time": ["2024-06-15T00:00", "2024-06-15T03:00", "2024-06-15T06:00", "2024-06-15T09:00", "2024-06-15T12:00", "2024-06-15T15:00", "2024-06-15T18:00", "2024-06-15T21:00"],
    "temperature_2m": [25.0, 24.5, 25.5, 28.0, 31.0, 30.0, 28.5, 26.0],
    "apparent_temperature": [27.0, 26.5, 27.5, 30.5, 34.0, 33.0, 31.0, 28.0],
    "relative_humidity_2m": [85, 88, 82, 72, 60, 65, 75, 82],
    "weather_code": [0, 0, 1, 2, 3, 80, 2, 1],
    "precipitation": [0.0, 0.0, 0.0, 0.0, 0.0, 2.5, 0.0, 0.0],
    "precipitation_probability": [0, 0, 5, 10, 20, 60, 15, 5],
    "wind_speed_10m": [8.0, 6.5, 7.0, 10.0, 14.0, 12.5, 9.0, 7.5],
    "wind_direction_10m": [170, 175, 180, 190, 200, 210, 195, 180]
  },
  "daily": {
    "time": ["2024-06-15", "2024-06-16", "2024-06-17"],
    "weather_code": [2, 61, 3],
    "temperature_2m_max": [32.5, 30.0, 31.0],
    "temperature_2m_min": [24.0, 23.5, 24.5],
    "precipitation_sum": [2.5, 12.0, 0.5],
    "precipitation_probability_max": [60, 85, 20],
    "wind_speed_10m_max": [14.0, 18.0, 12.0],
    "uv_index_max": [9.5, 5.0, 8.0]
  }
}`

const mockOpenMeteoHistory = `{
  "latitude": 25.03,
  "longitude": 121.57,
  "daily": {
    "time": ["2024-06-01"],
    "weather_code": [61],
    "temperature_2m_max": [30.5],
    "temperature_2m_min": [24.0],
    "precipitation_sum": [8.5],
    "wind_speed_10m_max": [16.0],
    "uv_index_max": [7.0]
  }
}`

// ===== WeatherAPI =====

const mockWeatherAPIForecast = `{
  "location": {
    "name": "Taipei",
    "lat": 25.033,
    "lon": 121.565
  },
  "current": {
    "last_updated": "2024-06-15 14:00",
    "temp_c": 29.0,
    "feelslike_c": 33.0,
    "humidity": 72,
    "wind_kph": 11.0,
    "wind_degree": 185,
    "pressure_mb": 1008.0,
    "vis_km": 20.0,
    "precip_mm": 0.0,
    "condition": {
      "text": "Partly cloudy",
      "code": 1003
    }
  },
  "forecast": {
    "forecastday": [
      {
        "date": "2024-06-15",
        "day": {
          "maxtemp_c": 33.0,
          "mintemp_c": 25.0,
          "daily_chance_of_rain": 35,
          "totalprecip_mm": 3.0,
          "maxwind_kph": 15.0,
          "avghumidity": 70,
          "uv": 9.0,
          "condition": {"text": "Partly cloudy", "code": 1003}
        },
        "hour": [
          {"time": "2024-06-15 00:00", "temp_c": 25.5, "feelslike_c": 27.0, "humidity": 85, "wind_kph": 8.0, "wind_degree": 170, "chance_of_rain": 5, "precip_mm": 0.0, "condition": {"text": "Clear", "code": 1000}},
          {"time": "2024-06-15 06:00", "temp_c": 26.0, "feelslike_c": 28.0, "humidity": 80, "wind_kph": 9.0, "wind_degree": 180, "chance_of_rain": 10, "precip_mm": 0.0, "condition": {"text": "Sunny", "code": 1000}},
          {"time": "2024-06-15 12:00", "temp_c": 32.0, "feelslike_c": 36.0, "humidity": 60, "wind_kph": 14.0, "wind_degree": 200, "chance_of_rain": 25, "precip_mm": 0.0, "condition": {"text": "Partly cloudy", "code": 1003}},
          {"time": "2024-06-15 18:00", "temp_c": 28.0, "feelslike_c": 31.0, "humidity": 75, "wind_kph": 10.0, "wind_degree": 190, "chance_of_rain": 40, "precip_mm": 1.5, "condition": {"text": "Light rain shower", "code": 1240}}
        ]
      },
      {
        "date": "2024-06-16",
        "day": {
          "maxtemp_c": 31.0,
          "mintemp_c": 24.0,
          "daily_chance_of_rain": 70,
          "totalprecip_mm": 15.0,
          "maxwind_kph": 20.0,
          "avghumidity": 80,
          "uv": 5.0,
          "condition": {"text": "Moderate rain", "code": 1189}
        },
        "hour": [
          {"time": "2024-06-16 00:00", "temp_c": 24.5, "feelslike_c": 26.0, "humidity": 88, "wind_kph": 7.0, "wind_degree": 175, "chance_of_rain": 50, "precip_mm": 2.0, "condition": {"text": "Light rain", "code": 1183}},
          {"time": "2024-06-16 06:00", "temp_c": 25.0, "feelslike_c": 27.0, "humidity": 85, "wind_kph": 10.0, "wind_degree": 185, "chance_of_rain": 65, "precip_mm": 3.5, "condition": {"text": "Moderate rain", "code": 1189}},
          {"time": "2024-06-16 12:00", "temp_c": 29.0, "feelslike_c": 32.0, "humidity": 70, "wind_kph": 18.0, "wind_degree": 210, "chance_of_rain": 40, "precip_mm": 1.0, "condition": {"text": "Patchy rain possible", "code": 1063}},
          {"time": "2024-06-16 18:00", "temp_c": 26.0, "feelslike_c": 28.5, "humidity": 80, "wind_kph": 12.0, "wind_degree": 195, "chance_of_rain": 30, "precip_mm": 0.5, "condition": {"text": "Cloudy", "code": 1006}}
        ]
      }
    ]
  }
}`

const mockWeatherAPIHistory = `{
  "location": {
    "name": "Taipei",
    "lat": 25.033,
    "lon": 121.565
  },
  "current": {
    "last_updated": "2024-06-01 23:00",
    "temp_c": 26.0,
    "feelslike_c": 28.5,
    "humidity": 80,
    "wind_kph": 9.0,
    "wind_degree": 175,
    "pressure_mb": 1010.0,
    "vis_km": 15.0,
    "precip_mm": 0.5,
    "condition": {
      "text": "Light rain",
      "code": 1183
    }
  },
  "forecast": {
    "forecastday": [
      {
        "date": "2024-06-01",
        "day": {
          "maxtemp_c": 30.5,
          "mintemp_c": 24.0,
          "daily_chance_of_rain": 60,
          "totalprecip_mm": 8.5,
          "maxwind_kph": 16.0,
          "avghumidity": 78,
          "uv": 7.0,
          "condition": {"text": "Moderate rain", "code": 1189}
        },
        "hour": []
      }
    ]
  }
}`

// ===== OpenWeatherMap =====

const mockOWMCurrent = `{
  "dt": 1718430000,
  "main": {
    "temp": 28.5,
    "feels_like": 32.0,
    "temp_min": 26.0,
    "temp_max": 30.0,
    "pressure": 1008,
    "humidity": 72
  },
  "wind": {
    "speed": 3.5,
    "deg": 185
  },
  "weather": [
    {"id": 802, "main": "Clouds", "description": "scattered clouds"}
  ],
  "visibility": 20000,
  "name": "Taipei",
  "coord": {
    "lat": 25.033,
    "lon": 121.565
  }
}`

const mockOWMForecast = `{
  "list": [
    {
      "dt": 1718420400,
      "main": {"temp": 29.0, "feels_like": 33.0, "temp_min": 28.0, "temp_max": 30.0, "pressure": 1008, "humidity": 70},
      "weather": [{"id": 802, "main": "Clouds", "description": "scattered clouds"}],
      "wind": {"speed": 3.5, "deg": 185},
      "visibility": 20000,
      "pop": 0.1,
      "dt_txt": "2024-06-15 09:00:00"
    },
    {
      "dt": 1718431200,
      "main": {"temp": 31.5, "feels_like": 35.0, "temp_min": 30.0, "temp_max": 33.0, "pressure": 1007, "humidity": 62},
      "weather": [{"id": 803, "main": "Clouds", "description": "broken clouds"}],
      "wind": {"speed": 4.0, "deg": 200},
      "visibility": 18000,
      "pop": 0.25,
      "dt_txt": "2024-06-15 12:00:00"
    },
    {
      "dt": 1718442000,
      "main": {"temp": 30.0, "feels_like": 33.5, "temp_min": 29.0, "temp_max": 31.0, "pressure": 1007, "humidity": 68},
      "weather": [{"id": 500, "main": "Rain", "description": "light rain"}],
      "wind": {"speed": 3.0, "deg": 210},
      "visibility": 15000,
      "pop": 0.6,
      "rain": {"3h": 1.5},
      "dt_txt": "2024-06-15 15:00:00"
    },
    {
      "dt": 1718452800,
      "main": {"temp": 27.0, "feels_like": 30.0, "temp_min": 26.0, "temp_max": 28.0, "pressure": 1008, "humidity": 78},
      "weather": [{"id": 801, "main": "Clouds", "description": "few clouds"}],
      "wind": {"speed": 2.5, "deg": 190},
      "visibility": 20000,
      "pop": 0.15,
      "dt_txt": "2024-06-15 18:00:00"
    },
    {
      "dt": 1718463600,
      "main": {"temp": 25.5, "feels_like": 27.0, "temp_min": 25.0, "temp_max": 26.0, "pressure": 1009, "humidity": 82},
      "weather": [{"id": 800, "main": "Clear", "description": "clear sky"}],
      "wind": {"speed": 2.0, "deg": 180},
      "visibility": 24000,
      "pop": 0.05,
      "dt_txt": "2024-06-15 21:00:00"
    },
    {
      "dt": 1718506800,
      "main": {"temp": 27.0, "feels_like": 30.0, "temp_min": 26.0, "temp_max": 29.0, "pressure": 1008, "humidity": 75},
      "weather": [{"id": 500, "main": "Rain", "description": "light rain"}],
      "wind": {"speed": 3.0, "deg": 195},
      "visibility": 16000,
      "pop": 0.5,
      "rain": {"3h": 2.0},
      "dt_txt": "2024-06-16 09:00:00"
    },
    {
      "dt": 1718517600,
      "main": {"temp": 29.5, "feels_like": 33.0, "temp_min": 28.0, "temp_max": 31.0, "pressure": 1007, "humidity": 68},
      "weather": [{"id": 501, "main": "Rain", "description": "moderate rain"}],
      "wind": {"speed": 4.5, "deg": 210},
      "visibility": 12000,
      "pop": 0.7,
      "rain": {"3h": 5.0},
      "dt_txt": "2024-06-16 12:00:00"
    },
    {
      "dt": 1718528400,
      "main": {"temp": 26.0, "feels_like": 28.5, "temp_min": 25.0, "temp_max": 27.0, "pressure": 1008, "humidity": 80},
      "weather": [{"id": 802, "main": "Clouds", "description": "scattered clouds"}],
      "wind": {"speed": 2.8, "deg": 185},
      "visibility": 20000,
      "pop": 0.2,
      "dt_txt": "2024-06-16 18:00:00"
    }
  ],
  "city": {
    "name": "Taipei",
    "sunrise": 1718398800,
    "sunset": 1718447400,
    "coord": {
      "lat": 25.033,
      "lon": 121.565
    }
  }
}`
