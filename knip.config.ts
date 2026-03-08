import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'babel.config.js',
    'eslint.config.mjs',
    'commitlint.config.js',
  ],
  project: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '__tests__/**/*.{ts,tsx}',
    'e2e/**/*.ts',
    'scripts/**/*.{js,mjs,ts}',
    '*.{js,mjs,ts}',
  ],
  ignore: ['__tests__/mocks/msw.setup.ts'],
  ignoreWorkspaces: [],
  rules: {},
  ignoreDependencies: [
    'expo-updates',
    '@testing-library/jest-dom',
    'lint-staged',
  ],
  ignoreBinaries: ['maestro', 'tail'],
  ignoreExportsUsedInFile: true,
};

export default config;
