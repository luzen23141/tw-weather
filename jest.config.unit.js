module.exports = {
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js)', '<rootDir>/__tests__/**/*.test.(ts|tsx|js)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/__tests__/mocks/',
    '/src/__tests__/integration/',
    '/src/__tests__/components/',
    '/__tests__/components/',
    '/__tests__/proxy.api.test.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { babelConfig: false, tsconfig: { jsx: 'react-jsx', noUnusedLocals: false } },
    ],
  },
  setupFiles: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/)?(msw|@mswjs|until-async|expo|@expo|react-native|@react-native|@react-native-async-storage)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/api/**/*.{ts,tsx}',
    'src/cache/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/e2e/'],
  coverageThreshold: {
    global: {
      lines: 30,
      branches: 30,
      functions: 30,
      statements: 30,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  testEnvironment: 'node',
  testTimeout: 10000,
};
