import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Phase 3 SEO audit fixes:
 *   1. 10 pages that silently inherited the root layout's `canonical: "/"`
 *      now self-canonicalize.
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
    const { metadata } = await import("@/app/faq/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/faq");
  });

  it("/support", async () => {
    const { metadata } = await import("@/app/support/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/support");
  });

  it("/premium", async () => {
    const { metadata } = await import("@/app/premium/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/premium");
  });

  it("/referral", async () => {
    const { metadata } = await import("@/app/referral/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/referral");
  });

  it("/custom-projects", async () => {
    const { metadata } = await import("@/app/custom-projects/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/custom-projects");
  });

  it("/projects/trending", async () => {
    const { metadata } = await import("@/app/projects/trending/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects/trending");
  });

  it("/projects/new", async () => {
    const { metadata } = await import("@/app/projects/new/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects/new");
  });

  it("/projects/premium", async () => {
    const { metadata } = await import("@/app/projects/premium/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects/premium");
  });

  it("/projects/best-sellers", async () => {
    const { metadata } = await import("@/app/projects/best-sellers/page");
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects/best-sellers");
  });

  it("none of the 10 pages canonicalize to the homepage anymore", async () => {
    const modules = await Promise.all([
      import("@/app/about/page"),
      import("@/app/faq/page"),
      import("@/app/support/page"),
      import("@/app/premium/page"),
      import("@/app/referral/page"),
      import("@/app/custom-projects/page"),
      import("@/app/projects/trending/page"),
      import("@/app/projects/new/page"),
      import("@/app/projects/premium/page"),
      import("@/app/projects/best-sellers/page"),
    ]);
    for (const { metadata } of modules) {
      expect(metadata.alternates?.canonical).not.toBe("https://www.campusedux.com/");
      expect(metadata.alternates?.canonical).not.toBe("/");
      expect(metadata.alternates?.canonical).toBeTruthy();
    }
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
