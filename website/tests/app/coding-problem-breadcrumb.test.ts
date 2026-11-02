import { describe, it, expect, vi } from "vitest";
import type { CodingProblemDetail } from "@/lib/learning.types";
import type { PracticeProblemDetail } from "@/lib/practice.types";

/**
 * Phase 3 Batch 2: the visible coding-problem breadcrumb used the generic
 * label "Coding Problem" instead of the real problem title, even though the
 * JSON-LD breadcrumb (breadcrumbJsonLd in page.tsx) already used the real
 * title. These tests pin the fix: the visible breadcrumb's last crumb is
 * always the actual problem title, never the generic label, on both the
 * Learning topic-practice route (/coding-problems/[problemSlug]) and the
 * global Practice route (/practice/problems/[slug]) — locked and unlocked.
 */

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

function makeCodingProblemDetail(overrides: Partial<CodingProblemDetail["problem"]> = {}): CodingProblemDetail {
  return {
    problem: {
      id: "p-1",
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      is_premium: false,
      supported_languages: ["java", "python"],
      description: "Given an array...",
      examples: [],
      constraints: [],
      hints: [],
      starter_code: {},
      time_complexity: "O(n)",
      space_complexity: "O(n)",
      ...overrides,
    },
    topic: { grid_slug: "java-tutorial", topic_slug: "arrays", title: "Arrays" },
    locked: false,
    editorial: "",
    solution_code: {},
    solution_approach: "",
  };
}

// ---------------------------------------------------------------------------
// 1. Pure crumb builders (ProblemPanel's default + the global Practice route)
// ---------------------------------------------------------------------------
describe("Phase 3 Batch 2: defaultProblemCrumbs (Learning topic-practice breadcrumb)", () => {
  it("uses the real problem title as the last, unlinked crumb", async () => {
    const { defaultProblemCrumbs } = await import(
      "@/app/coding-problems/[problemSlug]/_components/ProblemPanel"
    );
    const detail = makeCodingProblemDetail({ title: "Longest Palindromic Substring" });
    const crumbs = defaultProblemCrumbs(detail);
    expect(crumbs[crumbs.length - 1]).toEqual({ label: "Longest Palindromic Substring" });
    expect(crumbs.map((c) => c.label)).not.toContain("Coding Problem");
  });

  it("keeps the Learning -> topic hierarchy and links unchanged", async () => {
    const { defaultProblemCrumbs } = await import(
      "@/app/coding-problems/[problemSlug]/_components/ProblemPanel"
    );
    const detail = makeCodingProblemDetail();
    const crumbs = defaultProblemCrumbs(detail);
    expect(crumbs[0]).toEqual({ label: "Learning", href: "/learning" });
    expect(crumbs[1]).toEqual({ label: "Arrays", href: "/learning/java-tutorial/arrays" });
    expect(crumbs[2].href).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. /coding-problems/[problemSlug] page wiring (locked + unlocked)
// ---------------------------------------------------------------------------
vi.mock("@/lib/learning", () => ({
  getCodingProblem: vi.fn(),
  getCodingProblemRelated: vi.fn().mockResolvedValue(null),
}));

describe("Phase 3 Batch 2: /coding-problems/[problemSlug] page", () => {
  it("passes the real problem title through to the unlocked workspace (ProblemPanel falls back to defaultProblemCrumbs)", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { CodingProblemBody } = await import("@/app/coding-problems/[problemSlug]/CodingProblemBody");
    const detail = makeCodingProblemDetail({ title: "Merge Intervals" });
    vi.mocked(getCodingProblem).mockResolvedValue(detail);

    const { default: CodingProblemPage } = await import("@/app/coding-problems/[problemSlug]/page");
    const result = await CodingProblemPage({ params: Promise.resolve({ problemSlug: "merge-intervals" }) });
    const body = findByType(result, CodingProblemBody);

    expect(body).not.toBeNull();
    expect((body!.props.detail as CodingProblemDetail).problem.title).toBe("Merge Intervals");
    expect(body!.props.nav).toBeUndefined();
  });

  it("passes the real problem title to the premium gate when locked, not the generic label", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { CodingProblemPremiumGate } = await import(
      "@/app/coding-problems/[problemSlug]/CodingProblemPremiumGate"
    );
    const detail = { ...makeCodingProblemDetail({ title: "Trapping Rain Water" }), locked: true };
    vi.mocked(getCodingProblem).mockResolvedValue(detail);

    const { default: CodingProblemPage } = await import("@/app/coding-problems/[problemSlug]/page");
    const result = await CodingProblemPage({ params: Promise.resolve({ problemSlug: "trapping-rain-water" }) });
    const gate = findByType(result, CodingProblemPremiumGate);

    expect(gate).not.toBeNull();
    expect((gate!.props.problem as CodingProblemDetail["problem"]).title).toBe("Trapping Rain Water");
    expect(gate!.props.problem).not.toBe("Coding Problem");
  });
});

// ---------------------------------------------------------------------------
// 3. /practice/problems/[slug] page wiring — practiceCrumbs (locked + unlocked)
// ---------------------------------------------------------------------------
vi.mock("@/lib/practice", () => ({
  getPracticeProblem: vi.fn(),
  getPracticeProblemRelated: vi.fn().mockResolvedValue(null),
}));

function makePracticeProblemDetail(title: string, locked = false): PracticeProblemDetail {
  return {
    ...makeCodingProblemDetail({ title }),
    locked,
    category: { slug: "arrays", name: "Arrays" },
  };
}

describe("Phase 3 Batch 2: /practice/problems/[slug] page", () => {
  it("builds the visible nav with the real problem title as the last crumb (unlocked)", async () => {
    const { getPracticeProblem } = await import("@/lib/practice");
    const { CodingProblemBody } = await import("@/app/coding-problems/[problemSlug]/CodingProblemBody");
    vi.mocked(getPracticeProblem).mockResolvedValue(makePracticeProblemDetail("Binary Search"));

    const { default: PracticeProblemPage } = await import("@/app/practice/problems/[slug]/page");
    const result = await PracticeProblemPage({ params: Promise.resolve({ slug: "binary-search" }) });
    const body = findByType(result, CodingProblemBody);

    expect(body).not.toBeNull();
    const nav = body!.props.nav as { label: string; href?: string }[];
    expect(nav.map((c) => c.label)).toEqual(["Practice", "Coding Problems", "Binary Search"]);
    expect(nav.map((c) => c.label)).not.toContain("Coding Problem");
    expect(nav[0]).toEqual({ label: "Practice", href: "/practice" });
    expect(nav[1]).toEqual({ label: "Coding Problems", href: "/practice/problems" });
    expect(nav[2].href).toBeUndefined();
  });

  it("passes the real problem title to the practice premium gate when locked", async () => {
    const { getPracticeProblem } = await import("@/lib/practice");
    const { PracticeProblemPremiumGate } = await import(
      "@/app/practice/problems/[slug]/PracticeProblemPremiumGate"
    );
    vi.mocked(getPracticeProblem).mockResolvedValue(makePracticeProblemDetail("Valid Parentheses", true));

    const { default: PracticeProblemPage } = await import("@/app/practice/problems/[slug]/page");
    const result = await PracticeProblemPage({ params: Promise.resolve({ slug: "valid-parentheses" }) });
    const gate = findByType(result, PracticeProblemPremiumGate);

    expect(gate).not.toBeNull();
    expect((gate!.props.problem as CodingProblemDetail["problem"]).title).toBe("Valid Parentheses");
  });
});
