import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  project: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}', 'e2e/**/*.ts'],
  ignore: ['__tests__/mocks/msw.setup.ts'],
  ignoreWorkspaces: [],
  rules: {},
  ignoreDependencies: [
    'expo-updates',
    'react-native-mmkv',
    'react-native-css-interop',
    '@testing-library/dom',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@types/react-native',
    'eslint-plugin-react-native',
    'eslint-plugin-security',
    'eslint-plugin-security-node',
    'eslint-plugin-sonarjs',
    'jest-environment-jsdom',
    'jest-extended',
    'jest-mock-extended',
    'lint-staged',
  ],
  ignoreBinaries: ['maestro', 'tail'],
  ignoreExportsUsedInFile: true,
};

export default config;
