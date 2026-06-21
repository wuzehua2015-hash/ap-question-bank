import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
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
      // react-hooks/set-state-in-effect: warns on setState in useEffect.
      // DOWNSIZED to 'warn' because initializing state from sessionStorage
      // in useEffect is a legitimate pattern (external system sync).
      // If this becomes a real problem, refactor to useSyncExternalStore.
      'react-hooks/set-state-in-effect': 'warn',
      // Warn on unused variables (excluding _ prefixed)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
])
