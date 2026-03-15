import { getWeatherDescription, isSevereWeather } from '@/utils/weather-code';

describe('Weather Code Utils', () => {
  describe('getWeatherDescription', () => {
    it('應返回晴天描述', () => {
      expect(getWeatherDescription(0)).toBe('晴天');
    });

    it('應返回多雲描述', () => {
      expect(getWeatherDescription(1)).toBe('多雲');
      expect(getWeatherDescription(2)).toBe('多雲');
    });

    it('應返回陰天描述', () => {
      expect(getWeatherDescription(3)).toBe('陰天');
    });

    it('應返回霧描述', () => {
      expect(getWeatherDescription(45)).toBe('霧');
      expect(getWeatherDescription(48)).toBe('霧');
    });

    it('應返回毛毛雨描述', () => {
      expect(getWeatherDescription(51)).toBe('毛毛雨');
      expect(getWeatherDescription(55)).toBe('毛毛雨');
    });

    it('應返回凍毛毛雨描述', () => {
      expect(getWeatherDescription(56)).toBe('凍毛毛雨');
      expect(getWeatherDescription(57)).toBe('凍毛毛雨');
    });

    it('應返回小雨描述', () => {
      expect(getWeatherDescription(61)).toBe('小雨');
    });

    it('應返回中雨描述', () => {
      expect(getWeatherDescription(63)).toBe('中雨');
    });

    it('應返回大雨描述', () => {
      expect(getWeatherDescription(65)).toBe('大雨');
    });

    it('應返回凍雨描述', () => {
      expect(getWeatherDescription(66)).toBe('凍雨');
    });

    it('應返回小雪描述', () => {
      expect(getWeatherDescription(71)).toBe('小雪');
    });

    it('應返回中雪描述', () => {
      expect(getWeatherDescription(73)).toBe('中雪');
    });

    it('應返回大雪描述', () => {
      expect(getWeatherDescription(75)).toBe('大雪');
    });

    it('應返回雨夾雪描述', () => {
      expect(getWeatherDescription(77)).toBe('雨夾雪');
    });

    it('應返回陣雨描述', () => {
      expect(getWeatherDescription(80)).toBe('陣雨');
    });

    it('應返回陣風雨描述', () => {
      expect(getWeatherDescription(81)).toBe('陣風雨');
    });

    it('應返回陣冰雨描述', () => {
      expect(getWeatherDescription(82)).toBe('陣冰雨');
    });

    it('應返回陣小雪描述', () => {
      expect(getWeatherDescription(85)).toBe('陣小雪');
    });

    it('應返回陣大雪描述', () => {
      expect(getWeatherDescription(86)).toBe('陣大雪');
    });

    it('應返回雷暴描述', () => {
      expect(getWeatherDescription(95)).toBe('雷暴');
    });

    it('應返回雷暴伴隨冰雹描述', () => {
      expect(getWeatherDescription(96)).toBe('雷暴伴隨冰雹');
    });

    it('應返回強雷暴描述', () => {
      expect(getWeatherDescription(99)).toBe('強雷暴');
    });

    it('應返回未知天氣碼的預設值', () => {
      expect(getWeatherDescription(999)).toBe('未知');
    });
  });

  describe('isSevereWeather', () => {
    it('應識別晴天不是嚴重天氣', () => {
      expect(isSevereWeather(0)).toBe(false);
    });

    it('應識別多雲不是嚴重天氣', () => {
      expect(isSevereWeather(1)).toBe(false);
      expect(isSevereWeather(2)).toBe(false);
    });

    it('應識別陰天不是嚴重天氣', () => {
      expect(isSevereWeather(3)).toBe(false);
    });

    it('應識別霧不是嚴重天氣', () => {
      expect(isSevereWeather(45)).toBe(false);
      expect(isSevereWeather(48)).toBe(false);
    });

    it('應識別毛毛雨不是嚴重天氣', () => {
      expect(isSevereWeather(51)).toBe(false);
      expect(isSevereWeather(55)).toBe(false);
    });

    it('應識別小雨不是嚴重天氣', () => {
      expect(isSevereWeather(61)).toBe(false);
    });

    it('應識別中雨不是嚴重天氣', () => {
      expect(isSevereWeather(63)).toBe(false);
    });

    it('應識別大雨不是嚴重天氣', () => {
      expect(isSevereWeather(65)).toBe(false);
    });

    it('應識別小雪是嚴重天氣', () => {
      expect(isSevereWeather(71)).toBe(true);
    });

    it('應識別中雪是嚴重天氣', () => {
      expect(isSevereWeather(73)).toBe(true);
    });

    it('應識別大雪是嚴重天氣', () => {
      expect(isSevereWeather(75)).toBe(true);
    });

    it('應識別雨夾雪是嚴重天氣', () => {
      expect(isSevereWeather(77)).toBe(true);
    });

    it('應識別陣雨是嚴重天氣', () => {
      expect(isSevereWeather(80)).toBe(true);
    });

    it('應識別陣風雨是嚴重天氣', () => {
      expect(isSevereWeather(81)).toBe(true);
    });

    it('應識別陣冰雨是嚴重天氣', () => {
      expect(isSevereWeather(82)).toBe(true);
    });

    it('應識別陣小雪是嚴重天氣', () => {
      expect(isSevereWeather(85)).toBe(true);
    });

    it('應識別陣大雪是嚴重天氣', () => {
      expect(isSevereWeather(86)).toBe(true);
    });

    it('應識別雷暴是嚴重天氣', () => {
      expect(isSevereWeather(95)).toBe(true);
    });

    it('應識別雷暴伴隨冰雹是嚴重天氣', () => {
      expect(isSevereWeather(96)).toBe(true);
    });

    it('應識別強雷暴是嚴重天氣', () => {
      expect(isSevereWeather(99)).toBe(true);
    });

    it('應識別邊界條件：雪類起點（71）', () => {
      expect(isSevereWeather(70)).toBe(false);
      expect(isSevereWeather(71)).toBe(true);
    });

    it('應識別邊界條件：陣雨起點（80）', () => {
      expect(isSevereWeather(79)).toBe(false);
      expect(isSevereWeather(80)).toBe(true);
    });
  });
});
