import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      '.expo/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '.git/**',
    ],
  },
  {
    files: [
      'app/**/*.{ts,tsx}',
      'src/**/*.{ts,tsx}',
      '*.ts',
      'e2e/**/*.ts',
      '**/__tests__/**/*.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      '*.test.{ts,tsx}',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        React: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,

      // Strict TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // General rules
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-duplicate-imports': 'error',

      // 禁止在原始碼中使用 import.meta（Metro 不支援 ESM 語法，會造成瀏覽器 SyntaxError）
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MetaProperty[meta.name="import"][property.name="meta"]',
          message:
            'import.meta 不支援 Metro bundler，請改用 process.env。詳見 metro.config.js 的 unstable_enablePackageExports 設定。',
        },
      ],

      // Disable prettier conflicting rules
      ...prettier.rules,
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}', '*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // jest.mock() factory 必須用 require()，無法改用 import
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['*.{js,mjs}', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
