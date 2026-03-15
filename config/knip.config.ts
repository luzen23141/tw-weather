import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'babel.config.js',
    'eslint.config.mjs',
    'metro.config.js',
    'config/jest.setup.ts',
    'config/commitlint.config.ts',
    'postcss.config.js',
  ],
  project: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'e2e/**/*.ts',
    'scripts/**/*.{js,mjs,ts}',
    '*.{js,mjs,ts}',
    'config/**/*.{js,ts}',
  ],
  ignore: ['src/__mocks__/server.ts'],
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
  ignoreBinaries: ['maestro', 'tail', 'vercel'],
  ignoreExportsUsedInFile: true,
};

export default config;
