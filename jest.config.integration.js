module.exports = {
  testMatch: [
    '<rootDir>/src/**/__tests__/integration/**/*.test.(ts|tsx|js)',
    '<rootDir>/src/**/__tests__/components/**/*.test.(ts|tsx|js)',
    '<rootDir>/src/hooks/*.test.(ts|tsx|js)',
    '<rootDir>/src/__tests__/aggregation.test.ts',
    '<rootDir>/__tests__/components/**/*.test.(ts|tsx|js)',
    '<rootDir>/__tests__/proxy.api.test.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/__tests__/mocks/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
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
      lines: 50,
      branches: 50,
      functions: 50,
      statements: 50,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/)?(@react-native|@react-native-async-storage|expo|@expo|nativewind|tailwindcss|@unimodules|react-native)/)',
  ],
  testEnvironment: 'node',
  testTimeout: 10000,
};
