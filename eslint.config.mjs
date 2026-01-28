import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'jscpd-report'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        // Order matters: more specific patterns (outer layers) first
        // to prevent false matches on folder names like "session" or "settings"
        {
          type: 'presentation',
          pattern: 'src/presentation',
          mode: 'full',
        },
        {
          type: 'infrastructure',
          pattern: 'src/infrastructure',
          mode: 'full',
        },
        {
          type: 'application',
          pattern: 'src/application',
          mode: 'full',
        },
        // Domain layer contexts (innermost layer)
        {
          type: 'shared',
          pattern: 'src/domain/shared',
          mode: 'full',
        },
        {
          type: 'domain-session',
          pattern: 'src/domain/session',
          mode: 'full',
        },
        {
          type: 'domain-transcript',
          pattern: 'src/domain/transcript',
          mode: 'full',
        },
        {
          type: 'domain-coaching',
          pattern: 'src/domain/coaching',
          mode: 'full',
        },
        {
          type: 'domain-settings',
          pattern: 'src/domain/settings',
          mode: 'full',
        },
      ],
    },
    rules: {
      // React rules
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // General rules
      'no-console': 'error',

      // Import rules
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            { pattern: '@domain/**', group: 'internal', position: 'before' },
            {
              pattern: '@application/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@infrastructure/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@presentation/**',
              group: 'internal',
              position: 'after',
            },
            { pattern: '@shared/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // File size limit
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],

      // Boundary rules - Clean Architecture enforcement
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Shared can only import from shared
            { from: 'shared', allow: ['shared'] },

            // Domain layers can import from themselves and shared, but NOT from other domain contexts
            { from: 'domain-session', allow: ['domain-session', 'shared'] },
            { from: 'domain-transcript', allow: ['domain-transcript', 'shared'] },
            { from: 'domain-coaching', allow: ['domain-coaching', 'shared'] },
            { from: 'domain-settings', allow: ['domain-settings', 'shared'] },

            // Application can import from any domain and shared
            {
              from: 'application',
              allow: [
                'application',
                'domain-session',
                'domain-transcript',
                'domain-coaching',
                'domain-settings',
                'shared',
              ],
            },

            // Infrastructure can import from application and domain
            {
              from: 'infrastructure',
              allow: [
                'infrastructure',
                'application',
                'domain-session',
                'domain-transcript',
                'domain-coaching',
                'domain-settings',
                'shared',
              ],
            },

            // Presentation can import from application and domain (NOT infrastructure)
            {
              from: 'presentation',
              allow: [
                'presentation',
                'application',
                'domain-session',
                'domain-transcript',
                'domain-coaching',
                'domain-settings',
                'shared',
              ],
            },
          ],
        },
      ],
    },
  },
);
