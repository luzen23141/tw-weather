import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)', 'src/**/*.test.(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.expo/', '/build/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/*.d.ts', '!**/node_modules/**', '!**/dist/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/e2e/', '/__tests__/'],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 70,
      functions: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    // Mock react-native modules
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|expo|nativewind|tailwindcss|@unimodules|react-native)/)',
  ],
  testEnvironment: 'node',
  testTimeout: 10000,
};

export default config;
