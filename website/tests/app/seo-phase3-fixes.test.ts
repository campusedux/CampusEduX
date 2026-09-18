import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Phase 3 SEO audit fixes:
 *   1. 7 pages that silently inherited the root layout's `canonical: "/"`
 *      now self-canonicalize. (/projects/new, /projects/premium and
 *      /projects/best-sellers — originally 3 of the 10 — were later
 *      consolidated into permanent redirects to /projects; see the
 *      orphan-URL redirect tests below.)
 *   2. The public résumé share route (`/r/[token]`) is noindex/nofollow.
 *   3. The 5 bare auth/transactional pages are noindex, follow.
 *   4. robots.ts disallows `/r`.
 *   5. The account referral link never falls back to the old
 *      `campusedux.app` domain.
 */

// ---------------------------------------------------------------------------
// 1. Self-referencing canonicals
// ---------------------------------------------------------------------------
describe("Phase 3: previously-broken canonicals now self-reference", () => {
  it("/about", async () => {
    const { metadata } = await import("@/app/about/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/about");
  });

  it("/faq", async () => {
    const { generateMetadata } = await import("@/app/faq/page");
    const metadata = await generateMetadata();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/faq");
  });

  it("/support", async () => {
    const { metadata } = await import("@/app/support/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/support");
  });

  it("/premium", async () => {
    const { generateMetadata } = await import("@/app/premium/page");
    const metadata = await generateMetadata();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/premium");
  });

  it("/referral", async () => {
    const { generateMetadata } = await import("@/app/referral/page");
    const metadata = await generateMetadata();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/referral");
  });

  it("/custom-projects", async () => {
    const { metadata } = await import("@/app/custom-projects/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/custom-projects");
  });

  it("/projects/trending", async () => {
    const { generateMetadata } = await import("@/app/projects/trending/page");
    const metadata = await generateMetadata();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects/trending");
  });

  it("none of the 7 pages canonicalize to the homepage anymore", async () => {
    const [about, faq, support, premium, referral, customProjects, trending] = await Promise.all([
      import("@/app/about/page").then((m) => m.metadata),
      import("@/app/faq/page").then((m) => m.generateMetadata()),
      import("@/app/support/page").then((m) => m.metadata),
      import("@/app/premium/page").then((m) => m.generateMetadata()),
      import("@/app/referral/page").then((m) => m.generateMetadata()),
      import("@/app/custom-projects/page").then((m) => m.metadata),
      import("@/app/projects/trending/page").then((m) => m.generateMetadata()),
    ]);
    for (const metadata of [about, faq, support, premium, referral, customProjects, trending]) {
      expect(metadata.alternates?.canonical).not.toBe("https://www.campusedux.com/");
      expect(metadata.alternates?.canonical).not.toBe("/");
      expect(metadata.alternates?.canonical).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 1b. Orphan-URL consolidation: /projects/new, /projects/premium and
//     /projects/best-sellers are permanently redirected into the existing
//     /projects marketplace route (which already supports the same
//     filter/sort via `?flag=` and `?sort=`) instead of standalone pages.
// ---------------------------------------------------------------------------
async function getConfiguredRedirects() {
  const { default: nextConfig } = await import("../../next.config.js");
  return nextConfig.redirects?.() ?? [];
}

/** Import via a widened `string` (not a literal) so `tsc` doesn't try to resolve a module that's deliberately deleted. */
async function expectPageRemoved(specifier: string) {
  await expect(import(specifier)).rejects.toBeTruthy();
}

describe("Phase 3 follow-up: orphan project-URL consolidation redirects", () => {
  it("next.config.js redirects /projects/new to /projects", async () => {
    const redirects = await getConfiguredRedirects();
    expect(redirects).toContainEqual({ source: "/projects/new", destination: "/projects", permanent: true });
  });

  it("next.config.js redirects /projects/premium to /projects?flag=premium", async () => {
    const redirects = await getConfiguredRedirects();
    expect(redirects).toContainEqual({
      source: "/projects/premium",
      destination: "/projects?flag=premium",
      permanent: true,
    });
  });

  it("next.config.js redirects /projects/best-sellers to /projects?flag=bestseller&sort=popular (both params — flag alone would sort newest-first, not by sales)", async () => {
    const redirects = await getConfiguredRedirects();
    expect(redirects).toContainEqual({
      source: "/projects/best-sellers",
      destination: "/projects?flag=bestseller&sort=popular",
      permanent: true,
    });
  });

  it("the three standalone page files no longer exist", async () => {
    await expectPageRemoved("@/app/projects/new/page");
    await expectPageRemoved("@/app/projects/premium/page");
    await expectPageRemoved("@/app/projects/best-sellers/page");
  });

  it("sitemap.ts no longer lists the three redirected URLs, but keeps /projects and /projects/trending", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).not.toContain("https://www.campusedux.com/projects/new");
    expect(urls).not.toContain("https://www.campusedux.com/projects/premium");
    expect(urls).not.toContain("https://www.campusedux.com/projects/best-sellers");
    expect(urls).toContain("https://www.campusedux.com/projects");
    expect(urls).toContain("https://www.campusedux.com/projects/trending");
  });
});

// ---------------------------------------------------------------------------
// 2. Shared résumé share-token route
// ---------------------------------------------------------------------------
describe("Phase 3: /r/[token] shared résumé route", () => {
  it("is noindex, nofollow — it renders a real user's personal résumé", async () => {
    const { metadata } = await import("@/app/r/[token]/page");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("does not declare a canonical pointing at the homepage (no single canonical URL exists for a per-token share page)", async () => {
    const { metadata } = await import("@/app/r/[token]/page");
    expect(metadata.alternates?.canonical).not.toBe("https://www.campusedux.com/");
    expect(metadata.alternates?.canonical).not.toBe("/");
  });
});

// ---------------------------------------------------------------------------
// 3. Auth / transactional pages
// ---------------------------------------------------------------------------
describe("Phase 3: auth pages are noindex, follow", () => {
  it("/login", async () => {
    const { metadata } = await import("@/app/login/page");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("/register", async () => {
    const { metadata } = await import("@/app/register/page");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("/forgot-password", async () => {
    const { metadata } = await import("@/app/forgot-password/page");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("/reset-password", async () => {
    const { metadata } = await import("@/app/reset-password/page");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("/logout", async () => {
    const { metadata } = await import("@/app/logout/page");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

// ---------------------------------------------------------------------------
// 4. robots.ts
// ---------------------------------------------------------------------------
describe("Phase 3: robots.ts disallows /r", () => {
  it("disallow list includes /r", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots() as { rules: { disallow: string[] } };
    expect(result.rules.disallow).toContain("/r");
  });

  it("does not disallow the bare auth pages (noindex meta is their control, not robots.txt)", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots() as { rules: { disallow: string[] } };
    for (const path of ["/login", "/register", "/forgot-password", "/reset-password", "/logout"]) {
      expect(result.rules.disallow).not.toContain(path);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Referral link domain fallback
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({ id: "u-referral-1" })),
}));

import { supabase, resetSupabaseMock, setTableResult } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

/** Recursively finds the first element of the given component type in a React element tree (mirrors tests/app/onboarding.test.ts). */
function findByType(node: unknown, type: unknown): { props: Record<string, unknown> } | null {
  if (!node || typeof node !== "object") return null;
  const el = node as { type?: unknown; props?: { children?: unknown } };
  if (el.type === type) return el as { props: Record<string, unknown> };
  const children = el.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findByType(child, type);
      if (found) return found;
    }
    return null;
  }
  return findByType(children, type);
}

describe("Phase 3: account referral link never falls back to campusedux.app", () => {
  const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (ORIGINAL_SITE_URL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
    vi.resetModules();
  });

  it("resolves to https://www.campusedux.com when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    resetSupabaseMock();
    setTableResult("referral_codes", { data: { code: "ABC123", total_referrals: 0, total_earned: 0 } });
    setTableResult("referrals", { data: [] });

    const { default: CopyLinkButton } = await import("@/app/account/referral/CopyLinkButton");
    const { default: AccountReferralPage } = await import("@/app/account/referral/page");
    const result = await AccountReferralPage();
    const button = findByType(result, CopyLinkButton);

    expect(button).not.toBeNull();
    expect(button!.props.link).toBe("https://www.campusedux.com/register?ref=ABC123");
    expect(button!.props.link).not.toContain("campusedux.app");
  });

  it("honors NEXT_PUBLIC_SITE_URL when set (same convention as robots.ts / sitemap.ts)", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    vi.resetModules();
    resetSupabaseMock();
    setTableResult("referral_codes", { data: { code: "XYZ789", total_referrals: 0, total_earned: 0 } });
    setTableResult("referrals", { data: [] });

    const { default: CopyLinkButton } = await import("@/app/account/referral/CopyLinkButton");
    const { default: AccountReferralPage } = await import("@/app/account/referral/page");
    const result = await AccountReferralPage();
    const button = findByType(result, CopyLinkButton);

    expect(button!.props.link).toBe("https://example.test/register?ref=XYZ789");
  });

  it("never contains the old campusedux.app domain regardless of env state", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    resetSupabaseMock();
    setTableResult("referral_codes", { data: { code: "NOAPP1", total_referrals: 0, total_earned: 0 } });
    setTableResult("referrals", { data: [] });

    const { default: CopyLinkButton } = await import("@/app/account/referral/CopyLinkButton");
    const { default: AccountReferralPage } = await import("@/app/account/referral/page");
    const result = await AccountReferralPage();
    const button = findByType(result, CopyLinkButton);

    expect(button!.props.link).not.toMatch(/campusedux\.app/);
  });
});
