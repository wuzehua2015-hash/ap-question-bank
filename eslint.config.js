import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'venv/**',
    '.venv/**',
    'backup/**',
    'backup_*/**',
    'backups/**',
    'temp_*/**',
    'temp-page-renders/**',
    'public/**',
  ]),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // require-await: checks that async functions actually contain at least one await.
      // NOTE: this does NOT catch 'calling an async function without await'.
      // For that we use runtime assertions + pre-deploy smoke tests.
      'require-await': 'error',
      // 页面会从 sessionStorage、URL 参数和远程数据初始化状态；这些是外部状态同步。
      // 该规则对本项目会产生大量非风险提示，保留 exhaustive-deps 等更有价值的 Hook 检查。
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.{js,cjs,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
])
