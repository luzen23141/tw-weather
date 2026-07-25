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
  /*
    門檻的用途是擋退步，不是拿來追指標 —— 所以設在實際值下方留一點緩衝，
    讓正常的重構不會無故變紅，但整段掉下去時會被擋住。
    實際值約 lines 78 / branches 66 / functions 76 / statements 78。
  */
  coverageThreshold: {
    global: {
      lines: 74,
      branches: 62,
      functions: 72,
      statements: 74,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  testEnvironment: 'node',
  testTimeout: 10000,
};
