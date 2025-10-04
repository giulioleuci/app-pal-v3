import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
  // Base configuration for all files
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'storybook-static/**',
      '*.config.js',
      '*.config.ts',
      'scripts/**',
      'public/**',
      '.storybook/**',
      'plopfile.js'
    ]
  },

  // JavaScript/TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      'simple-import-sort': simpleImportSort,
      prettier: prettier
    },
    rules: {
      // Base ESLint rules
      ...js.configs.recommended.rules,

      // TypeScript rules
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-prototype-builtins': 'warn',

      // React rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-unescaped-entities': 'warn',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-webpack-loader-syntax': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': ['error', { maxDepth: 10 }],
      'import/no-useless-path-segments': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // Simple import sort
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Accessibility rules
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-autofocus': 'warn',

      // Prettier (disable conflicting rules)
      'prettier/prettier': 'error',

      // General code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-multiple-empty-lines': 'off', // Handled by Prettier
      'eol-last': 'off', // Handled by Prettier
      'comma-dangle': 'off', // Handled by Prettier
      'semi': 'off', // Handled by Prettier
      'quotes': 'off', // Handled by Prettier
      'jsx-quotes': 'off', // Handled by Prettier
      'arrow-spacing': 'off', // Handled by Prettier
      'template-curly-spacing': 'off', // Handled by Prettier
      'no-undef': 'warn',
      'no-case-declarations': 'warn',
      'react/display-name': 'warn',
      'no-useless-escape': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    }
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      'testing-library': testingLibrary,
      'jest-dom': jestDom
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      ...jestDom.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'testing-library/no-node-access': 'off',
      'testing-library/no-wait-for-multiple-assertions': 'warn',
      'react-hooks/rules-of-hooks': 'warn'
    }
  },

  // Storybook files configuration
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        alert: 'readonly'
      }
    },
    rules: {
      'import/no-anonymous-default-export': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
      'no-console': 'warn',
      'no-alert': 'off'
    }
  },

  // Cypress E2E test files configuration
  {
    files: ['cypress/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        cy: 'readonly',
        Cypress: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        context: 'readonly',
        specify: 'readonly',
        JQuery: 'readonly',
        indexedDB: 'readonly',
        chai: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-console': 'off',
      'no-undef': 'off',
      'import/no-unresolved': 'off'
    }
  }
];