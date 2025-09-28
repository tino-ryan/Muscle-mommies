import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import markdown from '@eslint/markdown';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierFlat from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Base JS files config
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: { js },
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // React files config
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: { react: pluginReact, prettier: pluginPrettier },
    extends: [pluginReact.configs.flat.recommended, prettierFlat],
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
    },
  },

  // Jest test files override
  {
    files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
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

  // Ignore CSS files completely
  // Ignore CSS + test files
  {
    ignores: [
      '**/*.css',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
    ],
  },
]);
