/**
 * Test-only stand-in for `next/font/google` (aliased in vitest.config.ts).
 * The real module is a compile-time marker that only Next's SWC transform can
 * evaluate — importing `src/app/layout.tsx` under Vitest would otherwise throw
 * "Plus_Jakarta_Sans is not a function". Every font loader returns the same
 * shape Next produces, with the requested CSS variable name echoed back.
 */
type FontOptions = { variable?: string };
type FontResult = { className: string; variable: string; style: { fontFamily: string } };

const loader = (options: FontOptions = {}): FontResult => ({
  className: "font-stub",
  variable: options.variable ? `font-stub-${options.variable.replace(/^--/, "")}` : "",
  style: { fontFamily: "sans-serif" },
});

export const Plus_Jakarta_Sans = loader;
export const Bricolage_Grotesque = loader;
