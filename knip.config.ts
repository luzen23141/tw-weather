import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'babel.config.js',
    'eslint.config.mjs',
    'metro.config.js',
    'jest.setup.ts',
    'debug_cwa.ts',
    'commitlint.config.js',
    'postcss.config.js',
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
    '@tailwindcss/postcss',
    'expo-updates',
    '@testing-library/jest-dom',
    'lint-staged',
    'babel-plugin-transform-define',
    'babel-plugin-transform-import-meta',
    'eslint-plugin-import-x',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
  ],
  ignoreBinaries: ['maestro', 'tail'],
  ignoreExportsUsedInFile: true,
};

export default config;
