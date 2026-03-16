module.exports = {
  rootDir: '../',
  testMatch: [
    '<rootDir>/src/**/*.integration.test.(ts|tsx|js)',
    '<rootDir>/src/components/weather/*.test.(ts|tsx|js)',
    '<rootDir>/src/hooks/*.test.(ts|tsx|js)',
    '<rootDir>/src/aggregator/aggregation.test.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/__mocks__/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.ts'],
  collectCoverage: true,
  coverageProvider: 'babel',
  collectCoverageFrom: [
    'src/aggregator/AggregationEngine.ts',
    'src/aggregator/aggregation.utils.ts',
    'src/components/weather/CurrentWeatherCard.tsx',
    'src/hooks/useWeather.ts',
    'src/hooks/useHistory.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/e2e/'],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 46,
      functions: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/)?(@react-native|@react-native-async-storage|expo|@expo|nativewind|tailwindcss|@unimodules|react-native-reanimated|react-native)/)',
  ],
  testEnvironment: 'node',
  testTimeout: 10000,
};
