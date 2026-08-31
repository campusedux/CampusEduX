// eslint-config-expo/flat exports an *array* of flat config objects, so it has
// to be spread. Wrapping it ([expoConfig]) nests an array inside the config
// array, which ESLint 9 rejects with "TypeError: Unexpected array."
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    // supabase/functions/** is Deno (URL imports, `Deno` global) and has its own
    // toolchain (`deno lint`); scripts/** is a plain Node build script.
    ignores: [
      'node_modules/**',
      'dist/**',
      'web-build/**',
      '.expo/**',
      'supabase/functions/**',
      'scripts/**',
    ],
  },
  {
    // Test files legitimately call jest.mock()/require() before their imports so
    // the mock is registered before the module under test is loaded.
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'import/first': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
