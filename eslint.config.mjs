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
  },

  // React files config
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: { react: pluginReact, prettier: pluginPrettier },
    extends: [
      pluginReact.configs.flat.recommended,
      prettierFlat, // <-- use this instead
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'error',
    },
  },

  // Test files override
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
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
      // Disable rule that mistakes YAML front matter for link refs
      'markdown/no-missing-label-refs': 'off',
    },
  },
  // Ignore CSS files completely
  {
    ignores: ['**/*.css'],
  },
]);
