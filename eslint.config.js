import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', 'data/**', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['**/*.{ts,astro,mjs,js}'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Blob: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      // Todos os usos de `set:html` neste projeto passam por `markdownParaHtml`
      // (src/lib/markdown.ts), que descarta HTML cru e neutraliza links com
      // esquema perigoso (javascript:, data:, vbscript:). Nenhum conteúdo
      // arbitrário chega ao HTML.
      'astro/no-set-html-directive': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.ts'],
    rules: { 'no-undef': 'off' },
  },
];
