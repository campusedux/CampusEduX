import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Mirrors admin-panel/vitest.config.ts. Targets are pure logic (resume rules,
 * estimate maths, the payment-verify guard) + the Server Actions + the
 * auth gate — all Node, no jsdom. Component (jsdom + RTL) tests and the
 * cross-user RLS tests that need a live Supabase session are follow-ups
 * documented in TESTING.md.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
  },
});
