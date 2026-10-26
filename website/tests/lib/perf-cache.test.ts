import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { isAllowedLearningTag, learningTag } from "@/lib/learningTags";
import { isPublicGet } from "@/lib/middlewarePaths";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (t: string) => revalidateTag(t), revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

const HEADER = "x-revalidate-secret";
const CONFIGURED = "unit-test-value-123";

function post(body: unknown, value?: string) {
  const headers = new Headers({ "content-type": "application/json" });
  if (value !== undefined) headers.set(HEADER, value);
  return new Request("http://x/api/revalidate", { method: "POST", headers, body: JSON.stringify(body) });
}
const load = () => import("../../src/app/api/revalidate/route");

describe("learning cache tags", () => {
  it("builds tags that satisfy the allowlist", () => {
    for (const t of [
      learningTag.list,
      learningTag.sitemap,
      learningTag.grid("Spring-Boot-Tutorial"),
      learningTag.topic("java", "Intro"),
      learningTag.coding("two-sum"),
    ]) {
      expect(isAllowedLearningTag(t)).toBe(true);
    }
    expect(learningTag.grid("Spring-Boot-Tutorial")).toBe("learning:grid:spring-boot-tutorial");
  });

  it("rejects anything outside the allowlist pattern", () => {
    for (const t of ["learning", "learning:", "learning:grid:", "learning:grid:a b", "learning:topic:a", "learning:other", "projects:1", "learning:grid:a/../b", "learning:grid:" + "x".repeat(101)]) {
      expect(isAllowedLearningTag(t)).toBe(false);
    }
  });
});

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    vi.stubEnv("REVALIDATE_SECRET", CONFIGURED);
  });

  it("is disabled (404) when not configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const { POST } = await load();
    expect((await POST(post({ tags: ["learning:list"] }, CONFIGURED))).status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects missing, wrong and different-length credentials", async () => {
    const { POST } = await load();
    for (const v of [undefined, "wrong-value-123456789", "short"]) {
      expect((await POST(post({ tags: ["learning:list"] }, v))).status).toBe(401);
    }
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a mixed invalid batch atomically without refreshing caches", async () => {
    const { POST } = await load();
    const res = await POST(
      post({ tags: ["learning:list", "learning:grid:spring-boot-tutorial", "learning:sitemap", "evil:tag", "learning:grid:a b", 42] }, CONFIGURED),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid revalidation request" });
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects mixed valid and malformed granular tags without side effects", async () => {
    const { POST } = await load();
    const res = await POST(post({ tags: ["practice:problem:two-sum", "interview:category:java", "interview:topic:java:collections", "interview:topic:java", "practice:problem:a b"] }, CONFIGURED));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid revalidation request" });
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("accepts valid learning and granular tags and refreshes the sitemap", async () => {
    const { POST } = await load();
    const tags = ["learning:list", "learning:grid:spring-boot-tutorial", "learning:sitemap", "practice:problem:two-sum", "interview:category:java", "interview:topic:java:collections"];
    const res = await POST(post({ tags }, CONFIGURED));
    expect(res.status).toBe(200);
    expect((await res.json()).tags).toEqual(tags);
    expect(revalidateTag.mock.calls.map((c) => c[0])).toEqual(tags);
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("keeps the coarse legacy tags working", async () => {
    const { POST } = await load();
    const res = await POST(post({ tags: ["learning", "blog"] }, CONFIGURED));
    expect((await res.json()).tags).toEqual(["learning", "blog"]);
  });
});

describe("middleware public-GET bypass", () => {
  it("skips session refresh only for GET/HEAD on public content", () => {
    for (const p of ["/learning", "/learning/java/intro", "/blog/x", "/jobs/1", "/projects/2", "/sitemap.xml", "/robots.txt", "/coding-problems/two-sum", "/practice/interview-questions/java"]) {
      expect(isPublicGet("GET", p)).toBe(true);
      expect(isPublicGet("HEAD", p)).toBe(true);
      expect(isPublicGet("POST", p)).toBe(false); // Server Actions keep the refresh
    }
  });

  it("never skips private, auth or payment paths", () => {
    for (const p of ["/account", "/account/wallet", "/login", "/register", "/onboarding", "/premium", "/resume", "/custom-projects/checkout", "/practice/submissions", "/mock-tests/1", "/api/session", "/api/learning/progress", "/auth/callback", "/projects-x", "/custom-projects/start"]) {
      expect(isPublicGet("GET", p)).toBe(false);
    }
  });
});

// Static guard: cached/ISR public content must stay free of request-scoped APIs
// (cookies()/headers()/session helpers) and of user-scoped data.
describe("public cached routes stay cookie-free", () => {
  const root = join(__dirname, "..", "..", "src");
  // Sitemap: index route + child routes + their shared loaders (all ISR, anon client only).
  const PUBLIC_DIRS = ["app/learning", "app/coding-problems", "app/practice/interview-questions", "app/blog", "app/sitemaps", "lib/sitemap"];
  const PUBLIC_FILES = ["app/practice/problems/[slug]/page.tsx", "app/jobs/[id]/page.tsx", "app/projects/[id]/page.tsx", "app/page.tsx", "app/sitemap.xml/route.ts"];
  const FORBIDDEN = [
    /from\s+["']next\/headers["']/,
    /\bcookies\s*\(/,
    /\bheaders\s*\(/,
    /getOptionalUser|requireUser|createAuthedServerSupabase|resolveApiCaller/,
    /\.auth\.(getUser|getSession)/,
  ];

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
  }
  const files = [...PUBLIC_DIRS.flatMap((d) => walk(join(root, d))), ...PUBLIC_FILES.map((f) => join(root, f))];

  it("scans a meaningful set of files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  for (const f of files) {
    const src = readFileSync(f, "utf8");
    if (/^\s*["']use client["']/.test(src)) continue; // client islands fetch per-user data over HTTP
    it(`${f.slice(root.length + 1)} has no request-scoped API`, () => {
      for (const re of FORBIDDEN) expect(src).not.toMatch(re);
    });
  }

  it("the learning data layer only uses the anon public client", () => {
    for (const f of ["lib/learning.ts", "lib/practice.ts", "lib/interviewQuestions.ts", "lib/publicCache.ts"]) {
      const src = readFileSync(join(root, f), "utf8");
      if (f !== "lib/publicCache.ts") expect(src, f).toMatch(/getPublicSupabase/);
      for (const re of FORBIDDEN) expect(src, f).not.toMatch(re);
    }
  });
});
