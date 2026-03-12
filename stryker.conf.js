module.exports = {
  testRunner: 'jest',
  plugins: ['@stryker-mutator/jest-runner'],
  reporters: ['clear-text', 'progress', 'html', 'json'],
  coverageAnalysis: 'off',
  ignorePatterns: ['ios/Pods/**', 'coverage/**', 'dist/**', 'playwright-report/**'],
  mutate: [
    'src/utils/date.ts',
    'src/utils/unit-conversion.ts',
    'src/utils/weather-code.ts',
    'src/cache/keys.ts',
    'src/api/adapters/openweathermap.adapter.ts',
  ],
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.unit.js',
    enableFindRelatedTests: true,
  },
  thresholds: {
    high: 70,
    low: 50,
    break: 40,
  },
};
