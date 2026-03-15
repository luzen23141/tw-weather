module.exports = {
  rootDir: '../',
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/__mocks__/',
    '\\.integration\\.test\\.',
    '/src/components/weather/.*\\.test\\.tsx$',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { babelConfig: false, tsconfig: { jsx: 'react-jsx', noUnusedLocals: false } },
    ],
  },
  setupFiles: ['<rootDir>/config/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/)?(msw|@mswjs|until-async|expo|@expo|react-native|@react-native|@react-native-async-storage)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/api/**/*.{ts,tsx}',
    'src/cache/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!src/api/sources.ts',
    '!src/components/ui/glass.ts',
    '!src/utils/weather-theme.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/e2e/'],
  coverageThreshold: {
    global: {
      lines: 54,
      branches: 45,
      functions: 46,
      statements: 54,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  testEnvironment: 'node',
  testTimeout: 10000,
};
