import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { sourceType: 'module' },
      globals: { process: 'readonly', console: 'readonly' },
    },
    rules: {
      // Nest DTOs use definite-assignment (`title!: string`) by design.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
