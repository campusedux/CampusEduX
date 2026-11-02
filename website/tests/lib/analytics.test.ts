import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runInNewContext } from "node:vm";
import { analyticsFrameDocument } from "@/lib/analyticsFrame";

const ORIGIN = "https://website-fixture.invalid";
const SECRET = "fabricated-sec08-credential";
let analytics: typeof import("@/lib/analytics");
let cleanup = () => {};
let cookie = "campusedux_consent_v1=a1d0";
let location: URL;
let events: EventTarget;
type Frame = {
  srcdoc: string;
  onload?: () => void;
  remove: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  contentWindow: { postMessage: ReturnType<typeof vi.fn> };
};
let frames: Frame[];

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-SEC08TEST");
  cookie = "campusedux_consent_v1=a1d0";
  location = new URL("/projects", ORIGIN);
  events = new EventTarget();
  frames = [];
  vi.stubGlobal("window", {
    get location() { return location; },
    crypto: { getRandomValues: (values: Uint32Array) => { values[0] = 123456; return values; } },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  });
  vi.stubGlobal("document", {
    get cookie() { return cookie; },
    set cookie(value: string) {
      const entry = value.split(";")[0];
      cookie = cookie.split("; ").filter(item => !item.startsWith(entry.split("=")[0] + "=")).concat(entry).join("; ");
    },
    referrer: `${ORIGIN}/reset-password?token_hash=${SECRET}`,
    createElement: () => {
      const frame = { srcdoc: "", remove: vi.fn(), setAttribute: vi.fn(), contentWindow: { postMessage: vi.fn() } };
      frames.push(frame);
      return frame;
    },
    body: { appendChild: vi.fn() },
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

describe("actual analytics initialization and navigation", () => {
  it.each(privatePaths)("never loads the tag on initial %s, even with prior consent", path => {
    location = new URL(`${path}?token_hash=${SECRET}&code=${SECRET}&state=${SECRET}`, ORIGIN);
    const original = location.href;
    cleanup = analytics.initializeAnalytics();
    analytics.sendPageview("/projects");
    expect(frames).toHaveLength(0);
    expect(location.href).toBe(original);
  });

  it.each(["", "campusedux_consent_v1=a0d0", "campusedux_consent_v1=invalid"])("does not load without valid consent (%s)", choice => {
    cookie = choice;
    cleanup = analytics.initializeAnalytics();
    expect(frames).toHaveLength(0);
  });

  it("sends only sanitized locations before and after sensitive navigation", () => {
    location = new URL(`/projects?access_token=${SECRET}#refresh_token=${SECRET}`, ORIGIN);
    cleanup = analytics.initializeAnalytics();
    expect(frames[0].setAttribute).toHaveBeenCalledWith("sandbox", "allow-scripts");
    expect(frames[0].srcdoc).not.toContain(SECRET);
    frames[0].onload?.();
    expect(frames[0].contentWindow.postMessage).toHaveBeenCalledWith({ page_path: "/projects", page_location: `${ORIGIN}/projects`, page_referrer: "" }, "*");
    location = new URL(`/reset-password?token_hash=${SECRET}&type=recovery`, ORIGIN);
    analytics.sendPageview(location.pathname + location.search);
    expect(frames[0].remove).toHaveBeenCalledOnce();
    location = new URL(`/jobs?code=${SECRET}&state=${SECRET}`, ORIGIN);
    analytics.sendPageview(location.pathname + location.search);
    frames[1].onload?.();
    expect(frames[1].contentWindow.postMessage).toHaveBeenCalledWith({ page_path: "/jobs", page_location: `${ORIGIN}/jobs`, page_referrer: "" }, "*");
    expect(JSON.stringify(frames.map(f => f.contentWindow.postMessage.mock.calls))).not.toContain(SECRET);
  });

  it("supports consent grant/revocation/regrant and removes pending frames", () => {
    cookie = "";
    cleanup = analytics.initializeAnalytics();
    cookie = "campusedux_consent_v1=a1d0";
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    expect(frames).toHaveLength(1);
    cookie = "campusedux_consent_v1=a0d0";
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    frames[0].onload?.();
    expect(frames[0].remove).toHaveBeenCalledOnce();
    expect(frames[0].contentWindow.postMessage).not.toHaveBeenCalled();
    cookie = "campusedux_consent_v1=a1d0";
    events.dispatchEvent(new Event("campusedux:cookie-consent"));
    frames[1].onload?.();
    expect(frames[1].contentWindow.postMessage).toHaveBeenCalledOnce();
  });

  it("sanitizes hash-only navigation and keeps ordinary navigation referrers", () => {
    cleanup = analytics.initializeAnalytics();
    frames[0].onload?.();
    location = new URL(`/projects#access_token=${SECRET}`, ORIGIN);
    events.dispatchEvent(new Event("hashchange"));
    location = new URL("/jobs?sort=newest", ORIGIN);
    analytics.sendPageview(location.href);
    expect(frames[0].contentWindow.postMessage).toHaveBeenLastCalledWith({ page_path: "/jobs", page_location: `${ORIGIN}/jobs`, page_referrer: `${ORIGIN}/projects` }, "*");
    expect(JSON.stringify(frames[0].contentWindow.postMessage.mock.calls)).not.toContain(SECRET);
  });

  it("retains an existing pseudonymous visitor ID without forwarding other cookie values", () => {
    cookie += `; _ga=GA1.2.12345.67890; unrelated_cookie=${SECRET}`;
    cleanup = analytics.initializeAnalytics();
    expect(frames[0].srcdoc).toContain('const clientId = "12345.67890"');
    expect(frames[0].srcdoc).not.toContain(SECRET);
    expect(cookie).toContain("_ga=GA1.1.12345.67890");
  });

  it("replaces a malformed GA cookie instead of sending its value", () => {
    cookie += `; _ga=${SECRET}`;
    cleanup = analytics.initializeAnalytics();
    expect(frames[0].srcdoc).not.toContain(SECRET);
    expect(cookie).toMatch(/_ga=GA1\.1\.123456\.\d+/);
  });

  it.each([undefined, "invalid-id"])("stays off for absent/invalid measurement ID %s", async id => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);
    vi.resetModules();
    analytics = await import("@/lib/analytics");
    cleanup = analytics.initializeAnalytics();
    expect(frames).toHaveLength(0);
  });
});

describe("actual isolated tag bootstrap", () => {
  function bootstrap() {
    const parent = {};
    const scripts: unknown[] = [];
    let receive: (event: unknown) => void = () => {};
    const window = { dataLayer: [] as IArguments[], addEventListener: (_: string, fn: typeof receive) => { receive = fn; } };
    const html = analyticsFrameDocument("G-SEC08TEST", ORIGIN, "fabricated-client");
    const source = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
    runInNewContext(source!, { window, parent, URL, Date, document: { createElement: () => ({}), head: { appendChild: (script: unknown) => scripts.push(script) } } });
    return { parent, scripts, receive, calls: () => window.dataLayer.map(args => Array.from(args)) };
  }

  it("queues denied defaults, safe config and one explicit pageview before loading Google", () => {
    const tag = bootstrap();
    expect(tag.scripts).toHaveLength(0);
    tag.receive({ source: tag.parent, origin: ORIGIN, data: analytics.analyticsPage(`/projects?code=${SECRET}`, ORIGIN) });
    const calls = tag.calls();
    expect(calls[0]).toMatchObject(["consent", "default", { analytics_storage: "denied", ad_storage: "denied" }]);
    expect(calls.find(call => call[0] === "config")).toMatchObject(["config", "G-SEC08TEST", { send_page_view: false, page_location: `${ORIGIN}/projects`, page_referrer: "" }]);
    expect(calls.filter(call => call[0] === "event")).toHaveLength(1);
    expect(tag.scripts).toHaveLength(1);
    expect(JSON.stringify(calls)).not.toContain(SECRET);
  });

  it("rejects foreign messages and unsafe URLs and drops arbitrary event parameters", () => {
    const tag = bootstrap();
    const page = analytics.analyticsPage("/projects", ORIGIN)!;
    tag.receive({ source: {}, origin: ORIGIN, data: page });
    tag.receive({ source: tag.parent, origin: "https://external.invalid", data: page });
    for (const field of ["page_location", "page_referrer"]) {
      tag.receive({ source: tag.parent, origin: ORIGIN, data: { ...page, [field]: `${ORIGIN}/projects?token_hash=${SECRET}` } });
    }
    expect(tag.scripts).toHaveLength(0);
    tag.receive({ source: tag.parent, origin: ORIGIN, data: { ...page, token_hash: SECRET, event_params: { code: SECRET }, page_title: SECRET } });
    expect(JSON.stringify(tag.calls())).not.toContain(SECRET);
  });
});
