import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Test runner for the admin panel. The targets are pure logic (permission
 * matrix), the auth gate, and the money-moving Server Actions — all of which
 * run in Node, so no jsdom/RTL is needed here. Add `environment: 'jsdom'` +
 * @testing-library/react later if/when component tests are introduced.
 */
export default defineConfig({
  // Component render tests (react-dom/server) need the automatic JSX runtime.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
  },
});
