module.exports = {
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js)', '<rootDir>/__tests__/**/*.test.(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/__tests__/mocks/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { babelConfig: false, tsconfig: { jsx: 'react-jsx', noUnusedLocals: false } },
    ],
  },
  setupFiles: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/)?(msw|@mswjs|until-async|expo|@expo|react-native|@react-native)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/e2e/'],
  coverageThreshold: {
    global: {
      lines: 0,
      branches: 0,
      functions: 0,
      statements: 0,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  testEnvironment: 'node',
  testTimeout: 10000,
};
