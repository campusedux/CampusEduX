import { describe, it, expect, vi } from "vitest";

// `react`'s `cache()` (used by @/lib/learning) only exists on the canary build
// Next aliases at build time — shim it as a pass-through, as the other SEO tests do.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

// /mock-tests/[testId] used to export static `{ robots: noindex }` only, so it
// inherited the root layout's canonical ("/" — the homepage). Its metadata is
// built from the route param alone (no data fetch), so it is safe to call here.
describe("/mock-tests/[testId] metadata", () => {
  it("has an encoded, self-referencing canonical and stays noindex", async () => {
    const { generateMetadata } = await import("@/app/mock-tests/[testId]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ testId: "java basics/1" }) });

    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/mock-tests/java%20basics%2F1");
    expect(metadata.alternates?.canonical).not.toBe("https://www.campusedux.com/");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
