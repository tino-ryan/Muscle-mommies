import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import markdown from '@eslint/markdown';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierFlat from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Base JS files config (server and client)
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    extends: [js.configs.recommended],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
  // React files config (client)
  {
    files: ['client/**/*.{js,jsx,mjs,cjs}'],
    plugins: {
      react: pluginReact,
      prettier: pluginPrettier,
    },
    extends: [pluginReact.configs.flat.recommended, prettierFlat],
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
    },
  },
  // Jest test and mock files
  {
    files: [
      '**/__tests__/**/*.{js,jsx}',
      '**/*.{test,spec}.{js,jsx}',
      '**/__mocks__/*.js', // Include mock files
    ],
    languageOptions: {
      globals: {
        ...globals.jest, // Includes jest, test, expect, describe, etc.
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },
  // Markdown files config
  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/gfm',
    extends: [markdown.configs.recommended],
    rules: {
      'markdown/no-missing-label-refs': 'off',
    },
  },
  // Ignore unnecessary files
  {
    ignores: [
      'server/coverage/**',
      'client/coverage/**',
      'server/jest.config.js',
      'client/src/setupTests.js',
      'server/config/**',
      'server/testFirebase.js',
      'dist/**',
      'build/**',
    ],
  },
]);
