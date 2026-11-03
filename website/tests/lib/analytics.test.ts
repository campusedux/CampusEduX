import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCsp } from "@/lib/csp";

const ORIGIN = "https://website-fixture.invalid";
const SECRET = "fabricated-sec08-credential";
let analytics: typeof import("@/lib/analytics");
let cleanup = () => {};
let cookie: string;
let location: URL;
let events: EventTarget;
type Tag = { src: string; nonce?: string; onload?: () => void; onerror?: () => void; remove: ReturnType<typeof vi.fn> };
let scripts: Tag[];
let browser: Window;
let nonce: string | undefined;
const calls = () => (browser.dataLayer ?? []).map(args => Array.from(args as IArguments));
const pageviews = () => calls().filter(call => call[0] === "event" && call[1] === "page_view");
const optOut = () => (browser as unknown as Record<string, unknown>)["ga-disable-G-SEC08TEST"];

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-SEC08TEST");
  cookie = "campusedux_consent_v1=a1d0";
  nonce = undefined;
  location = new URL("/projects", ORIGIN);
  events = new EventTarget();
  scripts = [];
  browser = {
    get location() { return location; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  } as unknown as Window;
  vi.stubGlobal("window", browser);
  vi.stubGlobal("document", {
    get cookie() { return cookie; },
    referrer: `${ORIGIN}/reset-password?token_hash=${SECRET}`,
    querySelector: () => nonce ? { content: nonce } : null,
    createElement: (name: string) => {
      // Google's cookie reader cannot run in the old opaque sandbox. The
      // replacement must execute as a script in this HTTP(S) document.
      if (name === "iframe") throw new DOMException("The document is sandboxed and lacks the 'allow-same-origin' flag.", "SecurityError");
      expect(name).toBe("script");
      const script = { src: "", remove: vi.fn() };
      scripts.push(script);
      return script;
    },
    head: { appendChild: vi.fn() },
  });
  analytics = await import("@/lib/analytics");
});

afterEach(() => {
  cleanup();
  cleanup = () => {};
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const privatePaths = ["/reset-password", "/auth/callback", "/auth/confirm", "/api/auth/verify-email", "/verify-email", "/email-verified", "/login", "/register", "/forgot-password", "/account", "/onboarding", "/r/share-secret", "/%72eset-password"];

describe("central analytics URL policy", () => {
  it.each(privatePaths)("excludes sensitive route %s", path => {
    expect(analytics.analyticsPage(`${path}?token_hash=${SECRET}#access_token=${SECRET}`, ORIGIN)).toBeNull();
  });

  it.each(["token_hash", "access_token", "refresh_token", "code", "otp", "verification_token", "state", "password", "unknown_secret", "next"])("drops every query, including %s", key => {
    expect(analytics.analyticsPage(`/projects?${key}=${SECRET}&page=2#${SECRET}`, ORIGIN)).toEqual({
      page_path: "/projects", page_location: `${ORIGIN}/projects`, page_referrer: "",
    });
  });

  it.each(["https://external.invalid/projects", "javascript:alert(1)", "/projects/%3Ftoken_hash%3Dsecret", "/projects/%252Fsecret", "/projects/%zz"])("rejects unsafe location %s", value => {
    expect(analytics.analyticsPage(value, ORIGIN)).toBeNull();
  });

  it("sanitizes same-origin and external referrers and omits auth referrers", () => {
    expect(analytics.analyticsPage("/jobs?page=2", ORIGIN, `${ORIGIN}/projects?otp=${SECRET}#${SECRET}`)?.page_referrer).toBe(`${ORIGIN}/projects`);
    expect(analytics.analyticsPage("/jobs", ORIGIN, `https://search.invalid/path?code=${SECRET}#${SECRET}`)?.page_referrer).toBe("https://search.invalid/");
    expect(analytics.analyticsPage("/jobs", ORIGIN, `${ORIGIN}/auth/callback?code=${SECRET}`)?.page_referrer).toBe("");
  });
});

describe("page-level analytics lifecycle", () => {
  it.each(privatePaths)("never loads on initial %s, even with stored consent", path => {
    location = new URL(`${path}?token_hash=${SECRET}`, ORIGIN);
    cleanup = analytics.initializeAnalytics();
    analytics.sendPageview("/projects");
    expect(scripts).toHaveLength(0);
    expect(optOut()).toBe(true);
    expect(location.search).toContain(SECRET);
  });

  it.each(["", "campusedux_consent_v1=a0d0", "campusedux_consent_v1=invalid", "campusedux_consent_v1=a0d1"])("does not load with absent/denied consent (%s)", choice => {
    cookie = choice;
    cleanup = analytics.initializeAnalytics();
    expect(scripts).toHaveLength(0);
    expect(browser.gtag).toBeUndefined();
  });

  it("uses HTTP(S) document cookie access and queues defaults before config", () => {
    cleanup = analytics.initializeAnalytics();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("https://www.googletagmanager.com/gtag/js?id=G-SEC08TEST");
    expect(calls()[0]).toMatchObject(["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
    expect(calls()[1]).toMatchObject(["consent", "update", { analytics_storage: "granted", ad_storage: "denied" }]);
    expect(calls().find(c => c[0] === "config")).toMatchObject(["config", "G-SEC08TEST", { send_page_view: false }]);
    expect(pageviews()).toHaveLength(0);
    scripts[0].onload?.();
    expect(pageviews()).toHaveLength(1);
    expect(optOut()).toBe(false);
  });

  it.each([undefined, "documentNonce123"])("carries the document nonce (%s)", value => {
    nonce = value;
    cleanup = analytics.initializeAnalytics();
    expect(scripts[0].nonce).toBe(value);
  });

  it("deduplicates initialization, unchanged consent, query and hash changes", () => {
    cleanup = analytics.initializeAnalytics();
    const secondCleanup = analytics.initializeAnalytics();
    scripts[0].onload?.();
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    location = new URL(`/projects?code=${SECRET}#${SECRET}`, ORIGIN);
    events.dispatchEvent(new Event("hashchange"));
    analytics.sendPageview(location.href);
    expect(scripts).toHaveLength(1);
    expect(calls().filter(c => c[0] === "config")).toHaveLength(1);
    expect(pageviews()).toHaveLength(1);
    secondCleanup();
    secondCleanup();
    expect(optOut()).toBe(false);
  });

  it("retains navigation order and safe referrers while the tag is loading", () => {
    cleanup = analytics.initializeAnalytics();
    location = new URL(`/jobs?code=${SECRET}`, ORIGIN);
    analytics.sendPageview(location.href);
    scripts[0].onload?.();
    expect(pageviews().map(c => c[2])).toMatchObject([
      { page_path: "/projects", page_referrer: "" },
      { page_path: "/jobs", page_referrer: `${ORIGIN}/projects` },
    ]);
    expect(JSON.stringify(calls())).not.toContain(SECRET);
  });

  it("tracks revisiting a public page without counting private pages", () => {
    cleanup = analytics.initializeAnalytics();
    scripts[0].onload?.();
    location = new URL(`/reset-password?token_hash=${SECRET}`, ORIGIN);
    analytics.sendPageview(location.href);
    expect(optOut()).toBe(true);
    expect(calls().at(-1)).toMatchObject(["consent", "update", { analytics_storage: "denied" }]);
    location = new URL("/jobs", ORIGIN);
    analytics.sendPageview(location.href);
    location = new URL("/projects", ORIGIN);
    analytics.sendPageview(location.href);
    expect(pageviews().map(c => (c[2] as { page_path: string }).page_path)).toEqual(["/projects", "/jobs", "/projects"]);
    expect(scripts).toHaveLength(1);
    expect(JSON.stringify(calls())).not.toContain(SECRET);
  });

  it("drops pending events on withdrawal and reuses the tag on regrant", () => {
    cleanup = analytics.initializeAnalytics();
    cookie = "campusedux_consent_v1=a0d0";
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    scripts[0].onload?.();
    expect(pageviews()).toHaveLength(0);
    expect(optOut()).toBe(true);
    cookie = "campusedux_consent_v1=a1d0";
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    expect(pageviews()).toHaveLength(1);
    expect(scripts).toHaveLength(1);
  });

  it("fails closed on script error and retries only on a later user action", () => {
    cleanup = analytics.initializeAnalytics();
    scripts[0].onerror?.();
    expect(optOut()).toBe(true);
    expect(pageviews()).toHaveLength(0);
    expect(scripts[0].remove).toHaveBeenCalledOnce();
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    expect(scripts).toHaveLength(2);
    scripts[0].onload?.(); // stale callback cannot flush the retry
    expect(pageviews()).toHaveLength(0);
    scripts[1].onload?.();
    expect(pageviews()).toHaveLength(1);
    expect(calls().filter(c => c[0] === "config")).toHaveLength(1);
  });

  it("disables collection after cleanup and ignores a late script load", () => {
    cleanup = analytics.initializeAnalytics();
    cleanup();
    scripts[0].onload?.();
    analytics.sendPageview(location.href);
    expect(optOut()).toBe(true);
    expect(pageviews()).toHaveLength(0);
  });

  it.each([undefined, "invalid-id"])("stays off for missing/invalid ID %s", async id => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);
    vi.resetModules();
    analytics = await import("@/lib/analytics");
    cleanup = analytics.initializeAnalytics();
    expect(scripts).toHaveLength(0);
  });

  it("does not attempt to load Google in an about: document", () => {
    location = new URL("about:blank");
    cleanup = analytics.initializeAnalytics();
    expect(scripts).toHaveLength(0);
  });
});

describe("analytics CSP", () => {
  it.each([false, true])("allows analytics resources without weakening script policy (nonce mode %s)", adsEnabled => {
    const csp = buildCsp({ adsEnabled, nonce: "testNonce123" });
    expect(csp).toContain("https://*.google-analytics.com");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    if (adsEnabled) {
      expect(csp).toContain("'nonce-testNonce123' 'strict-dynamic'");
      expect(csp.split("; ").find(d => d.startsWith("script-src"))).not.toContain("unsafe-inline");
    }
  });
});
