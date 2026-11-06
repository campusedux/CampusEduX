import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { normalizeSiteUrl } from "@/lib/siteOrigin";

afterEach(() => vi.unstubAllEnvs());

describe("canonical origin policy", () => {
  it.each([undefined, "", "https://campusedux.com", "https://www.campusedux.com/"])("pins production origin for %s", value => {
    expect(normalizeSiteUrl(value, "production")).toBe("https://www.campusedux.com");
  });

  const unsafe = ["http://localhost:3000", "http://127.0.0.1", "https://campusedux.onrender.com", "https://staging.campusedux.com", "https://example.com", "http://www.campusedux.com", "https://www.campusedux.com:8443", "https://www.campusedux.com.evil.test", "not a URL", "javascript:alert(1)", "https://user:password@www.campusedux.com"];
  it.each(unsafe)("rejects production override %s", value => {
    expect(() => normalizeSiteUrl(value, "production")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("allows development/test origin overrides and strips their path", () => {
    expect(normalizeSiteUrl("http://localhost:3000/demo", "development")).toBe("http://localhost:3000");
    expect(normalizeSiteUrl("https://staging.example.test/demo", "test")).toBe("https://staging.example.test");
  });

  it("rejects unsafe configuration when Next loads its build config", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const require = createRequire(import.meta.url);
    const path = require.resolve("../../next.config.js");
    delete require.cache[path];
    expect(() => require(path)).toThrow(/Production NEXT_PUBLIC_SITE_URL/);
    delete require.cache[path];
  });
});
