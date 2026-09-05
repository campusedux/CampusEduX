import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Mirrors admin-panel/vitest.config.ts. Targets are pure logic (resume rules,
 * estimate maths, the payment-verify guard) + the Server Actions + the
 * auth gate — all Node, no jsdom. Component (jsdom + RTL) tests and the
 * cross-user RLS tests that need a live Supabase session are follow-ups
 * documented in TESTING.md.
 *
 * `esbuild.jsx` is set explicitly because there's no @vitejs/plugin-react
 * here (this suite never renders to a DOM) — without it, esbuild falls back
 * to tsconfig's `"jsx": "preserve"` (Next.js's own SWC normally handles that
 * transform) and leaves JSX untouched, which breaks the moment a test
 * exercises server-only JSX-emitting code such as @react-pdf/renderer's
 * document tree (resumeBuilder/pdfDocument.tsx).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
  },
});
