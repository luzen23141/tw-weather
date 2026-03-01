import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? '阿古熊天氣',
  slug: config.slug ?? 'tw-weather',
  experiments: {
    ...(config.experiments ?? {}),
    // GitHub Pages 部署時需設 BASE_URL=/tw-weather/
    // 本地開發不需設定（預設空字串 = root path）
    baseUrl: process.env.BASE_URL ?? '',
  },
});
