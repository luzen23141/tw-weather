import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  project: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}', 'e2e/**/*.ts'],
  ignore: ['__tests__/mocks/msw.setup.ts'],
  ignoreWorkspaces: [],
  rules: {},
  ignoreDependencies: [
    'expo-updates',
    'react-native-css-interop',
    '@testing-library/jest-dom',
    '@testing-library/react',
    'lint-staged',
  ],
  ignoreBinaries: ['maestro', 'tail'],
  ignoreExportsUsedInFile: true,
};

export default config;
