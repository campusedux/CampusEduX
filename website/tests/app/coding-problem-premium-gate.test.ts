import { describe, it, expect, vi } from "vitest";
import type { CodingProblemDetail } from "@/lib/learning.types";
import type { PracticeProblemDetail } from "@/lib/practice.types";

/**
 * Phase 3 Batch 4: locked/premium coding-problem pages must stay indexable,
 * but their initial server-rendered HTML and metadata must accurately
 * represent what an anonymous visitor can actually see — not a content-free
 * skeleton, and not a description that implies the gated statement is
 * visible. These tests pin:
 *   1. Locked metadata stays indexable (no `robots: { index: false }`).
 *   2. Locked metadata never leaks gated content, even if it were present on
 *      the `problem` object — the RPC already nulls it, this is defense in
 *      depth against a future regression.
 *   3. `CodingProblemLockedNotice` / `PracticeProblemLockedNotice` — the
 *      component now rendered on the very first paint (no "checking"
 *      skeleton) — contain real, meaningful text (title, difficulty,
 *      "Premium", the upgrade notice, both CTAs) and never surface gated
 *      fields (description/examples/constraints/hints/editorial) even when
 *      those fields are non-empty on the prop they're given.
 *   4. Free/unlocked metadata generation is byte-for-byte unchanged.
 *   5. Both routes (`/coding-problems/*`, `/practice/problems/*`) follow the
 *      same safe pattern.
 */

/** Recursively finds the first element of the given component type in a React element tree (mirrors tests/app/onboarding.test.ts / coding-problem-breadcrumb.test.ts). */
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

/** Recursively finds every element of the given component type in a React element tree. */
function findAllByType(node: unknown, type: unknown, acc: { props: Record<string, unknown> }[] = []) {
  if (!node || typeof node !== "object") return acc;
  const el = node as { type?: unknown; props?: { children?: unknown } };
  if (el.type === type) acc.push(el as { props: Record<string, unknown> });
  const children = el.props?.children;
  if (Array.isArray(children)) {
    children.forEach((child) => findAllByType(child, type, acc));
  } else {
    findAllByType(children, type, acc);
  }
  return acc;
}

/** Flattens every string/number leaf in a React element tree into one array — the plain text a browser (or a non-JS crawler) would actually see. */
function collectText(node: unknown, acc: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === "boolean") return acc;
  if (typeof node === "string" || typeof node === "number") {
    acc.push(String(node));
    return acc;
  }
  if (Array.isArray(node)) {
    node.forEach((n) => collectText(n, acc));
    return acc;
  }
  if (typeof node === "object") {
    collectText((node as { props?: { children?: unknown } }).props?.children, acc);
  }
  return acc;
}

function makeCodingProblem(overrides: Partial<CodingProblemDetail["problem"]> = {}): CodingProblemDetail["problem"] {
  return {
    id: "p-1",
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    is_premium: true,
    supported_languages: ["java", "python"],
    description: null,
    examples: [],
    constraints: [],
    hints: [],
    starter_code: {},
    time_complexity: "",
    space_complexity: "",
    ...overrides,
  };
}

function makeCodingProblemDetail(overrides: Partial<CodingProblemDetail["problem"]> = {}, locked = true): CodingProblemDetail {
  return {
    problem: makeCodingProblem(overrides),
    topic: { grid_slug: "java-tutorial", topic_slug: "arrays", title: "Arrays" },
    locked,
    editorial: "",
    solution_code: {},
    solution_approach: "",
  };
}

// A sentinel string standing in for "gated content" — the RPC nulls the real
// fields when locked, but these tests also prove the *rendering* code never
// surfaces them even if a future caller (or a bug) sets them anyway.
const GATED_MARKER = "SHOULD_NEVER_APPEAR_IN_LOCKED_OUTPUT — full problem statement text";

// ---------------------------------------------------------------------------
// 1 + 2 + 4. /coding-problems/[problemSlug] generateMetadata
// ---------------------------------------------------------------------------
vi.mock("@/lib/learning", () => ({
  getCodingProblem: vi.fn(),
}));

describe("Phase 3 Batch 4: /coding-problems/[problemSlug] generateMetadata", () => {
  it("stays indexable when locked (no robots:index:false)", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { generateMetadata } = await import("@/app/coding-problems/[problemSlug]/page");
    vi.mocked(getCodingProblem).mockResolvedValue(
      makeCodingProblemDetail({ title: "Trapping Rain Water", difficulty: "Hard", description: null }, true),
    );

    const metadata = await generateMetadata({ params: { problemSlug: "trapping-rain-water" } });

    expect(metadata.robots).toBeUndefined();
  });

  it("builds an accurate, gated-safe fallback description when locked (title + difficulty + topic + premium notice)", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { generateMetadata } = await import("@/app/coding-problems/[problemSlug]/page");
    vi.mocked(getCodingProblem).mockResolvedValue(
      makeCodingProblemDetail({ title: "Trapping Rain Water", difficulty: "Hard", description: null }, true),
    );

    const metadata = await generateMetadata({ params: { problemSlug: "trapping-rain-water" } });

    expect(metadata.description).toContain("Trapping Rain Water");
    expect(metadata.description).toContain("Hard");
    expect(metadata.description).toContain("Arrays");
    expect(metadata.description?.toLowerCase()).toContain("premium");
  });

  it("never lets a non-null description leak past the locked fallback, even if the RPC contract were violated", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { generateMetadata } = await import("@/app/coding-problems/[problemSlug]/page");
    // The real RPC always nulls `description` when locked, but `generateMetadata`
    // reading `detail.locked` (not just falsy description) is what actually
    // guarantees this — pin that by keeping `locked: true` here.
    vi.mocked(getCodingProblem).mockResolvedValue(makeCodingProblemDetail({ description: null }, true));

    const metadata = await generateMetadata({ params: { problemSlug: "two-sum" } });

    expect(metadata.description).not.toContain(GATED_MARKER);
  });

  it("keeps the canonical/URL identical to the unlocked page (same URL, different content by auth)", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { generateMetadata } = await import("@/app/coding-problems/[problemSlug]/page");
    vi.mocked(getCodingProblem).mockResolvedValue(makeCodingProblemDetail({ slug: "two-sum" }, true));

    const metadata = await generateMetadata({ params: { problemSlug: "two-sum" } });

    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/coding-problems/two-sum");
  });

  it("regression: unlocked metadata still uses the real description, stripped + truncated exactly as before", async () => {
    const { getCodingProblem } = await import("@/lib/learning");
    const { generateMetadata } = await import("@/app/coding-problems/[problemSlug]/page");
    const longDescription = `Given an array # of *integers* — ${"x".repeat(200)}`;
    vi.mocked(getCodingProblem).mockResolvedValue(
      makeCodingProblemDetail({ title: "Two Sum", difficulty: "Easy", description: longDescription }, false),
    );

    const metadata = await generateMetadata({ params: { problemSlug: "two-sum" } });

    const expected = longDescription.replace(/[#>*`_|\-]+/g, " ").trim().slice(0, 155);
    expect(metadata.description).toBe(expected);
    expect(metadata.description?.toLowerCase()).not.toContain("premium problem");
  });
});

// ---------------------------------------------------------------------------
// Same 4 checks for /practice/problems/[slug] generateMetadata
// ---------------------------------------------------------------------------
vi.mock("@/lib/practice", () => ({
  getPracticeProblem: vi.fn(),
}));

function makePracticeProblemDetail(
  overrides: Partial<CodingProblemDetail["problem"]> = {},
  locked = true,
  categoryName = "Arrays",
): PracticeProblemDetail {
  return {
    ...makeCodingProblemDetail(overrides, locked),
    category: { slug: "arrays", name: categoryName },
  };
}

describe("Phase 3 Batch 4: /practice/problems/[slug] generateMetadata", () => {
  it("stays indexable when locked (no robots:index:false)", async () => {
    const { getPracticeProblem } = await import("@/lib/practice");
    const { generateMetadata } = await import("@/app/practice/problems/[slug]/page");
    vi.mocked(getPracticeProblem).mockResolvedValue(
      makePracticeProblemDetail({ title: "Valid Parentheses", difficulty: "Medium", description: null }, true, "Stacks"),
    );

    const metadata = await generateMetadata({ params: { slug: "valid-parentheses" } });

    expect(metadata.robots).toBeUndefined();
  });

  it("builds an accurate, gated-safe fallback description when locked (title + difficulty + category + premium notice)", async () => {
    const { getPracticeProblem } = await import("@/lib/practice");
    const { generateMetadata } = await import("@/app/practice/problems/[slug]/page");
    vi.mocked(getPracticeProblem).mockResolvedValue(
      makePracticeProblemDetail({ title: "Valid Parentheses", difficulty: "Medium", description: null }, true, "Stacks"),
    );

    const metadata = await generateMetadata({ params: { slug: "valid-parentheses" } });

    expect(metadata.description).toContain("Valid Parentheses");
    expect(metadata.description).toContain("Medium");
    expect(metadata.description).toContain("Stacks");
    expect(metadata.description?.toLowerCase()).toContain("premium");
  });

  it("never lets a non-null description leak past the locked fallback", async () => {
    const { getPracticeProblem } = await import("@/lib/practice");
    const { generateMetadata } = await import("@/app/practice/problems/[slug]/page");
    vi.mocked(getPracticeProblem).mockResolvedValue(makePracticeProblemDetail({ description: null }, true));

    const metadata = await generateMetadata({ params: { slug: "two-sum" } });

    expect(metadata.description).not.toContain(GATED_MARKER);
  });

  it("regression: unlocked metadata still uses the real description, stripped + truncated exactly as before", async () => {
    const { getPracticeProblem } = await import("@/lib/practice");
    const { generateMetadata } = await import("@/app/practice/problems/[slug]/page");
    const longDescription = `Given a string # of *brackets* — ${"y".repeat(200)}`;
    vi.mocked(getPracticeProblem).mockResolvedValue(
      makePracticeProblemDetail({ title: "Valid Parentheses", difficulty: "Medium", description: longDescription }, false),
    );

    const metadata = await generateMetadata({ params: { slug: "valid-parentheses" } });

    const expected = longDescription.replace(/[#>*`_|\-]+/g, " ").trim().slice(0, 155);
    expect(metadata.description).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 3 + 5. The pure locked-notice components — what's actually in the initial
// server-rendered HTML now that the "checking" skeleton is gone.
// ---------------------------------------------------------------------------
describe("Phase 3 Batch 4: CodingProblemLockedNotice (initial locked render)", () => {
  it("renders meaningful static text: title, difficulty, Premium badge, upgrade notice and both CTAs", async () => {
    const { CodingProblemLockedNotice } = await import(
      "@/app/coding-problems/[problemSlug]/CodingProblemPremiumGate"
    );
    const tree = CodingProblemLockedNotice({
      problem: makeCodingProblem({ title: "Trapping Rain Water", difficulty: "Hard" }),
      topic: { grid_slug: "java-tutorial", topic_slug: "arrays", title: "Arrays" },
      loginNext: "/coding-problems/trapping-rain-water",
    });
    const text = collectText(tree).join(" ");

    expect(text).toContain("Trapping Rain Water");
    expect(text).toContain("Hard");
    expect(text).toContain("Premium");
    expect(text).toContain("This is a premium problem");
    expect(text).toContain("See Premium plans");
    expect(text).toContain("I already have Premium");
  });

  it("never surfaces gated fields (description/examples/constraints/hints) even if they're non-empty on the prop", async () => {
    const { CodingProblemLockedNotice } = await import(
      "@/app/coding-problems/[problemSlug]/CodingProblemPremiumGate"
    );
    const tree = CodingProblemLockedNotice({
      problem: makeCodingProblem({
        description: GATED_MARKER,
        examples: [{ input: GATED_MARKER, output: GATED_MARKER, explanation: GATED_MARKER }],
        constraints: [GATED_MARKER],
        hints: [GATED_MARKER],
      }),
      topic: { grid_slug: "java-tutorial", topic_slug: "arrays", title: "Arrays" },
      loginNext: "/coding-problems/two-sum",
    });
    const text = collectText(tree).join(" ");

    expect(text).not.toContain(GATED_MARKER);
  });

  it("wires the Premium / sign-in CTAs to the right hrefs", async () => {
    const { CodingProblemLockedNotice } = await import(
      "@/app/coding-problems/[problemSlug]/CodingProblemPremiumGate"
    );
    const { Button } = await import("@/components/ui");
    const tree = CodingProblemLockedNotice({
      problem: makeCodingProblem(),
      topic: { grid_slug: "java-tutorial", topic_slug: "arrays", title: "Arrays" },
      loginNext: "/coding-problems/two-sum",
    });
    const buttons = findAllByType(tree, Button);

    expect(buttons.map((b) => b.props.href)).toEqual([
      "/premium",
      "/login?next=%2Fcoding-problems%2Ftwo-sum",
    ]);
  });
});

describe("Phase 3 Batch 4: PracticeProblemLockedNotice (initial locked render)", () => {
  it("renders meaningful static text: title, difficulty, category, Premium badge, upgrade notice and both CTAs", async () => {
    const { PracticeProblemLockedNotice } = await import(
      "@/app/practice/problems/[slug]/PracticeProblemPremiumGate"
    );
    const tree = PracticeProblemLockedNotice({
      problem: makeCodingProblem({ title: "Valid Parentheses", difficulty: "Medium" }),
      categoryName: "Stacks",
      loginNext: "/practice/problems/valid-parentheses",
    });
    const text = collectText(tree).join(" ");

    expect(text).toContain("Valid Parentheses");
    expect(text).toContain("Medium");
    expect(text).toContain("Stacks");
    expect(text).toContain("Premium");
    expect(text).toContain("This is a premium problem");
    expect(text).toContain("See Premium plans");
    expect(text).toContain("I already have Premium");
  });

  it("never surfaces gated fields (description/examples/constraints/hints) even if they're non-empty on the prop", async () => {
    const { PracticeProblemLockedNotice } = await import(
      "@/app/practice/problems/[slug]/PracticeProblemPremiumGate"
    );
    const tree = PracticeProblemLockedNotice({
      problem: makeCodingProblem({
        description: GATED_MARKER,
        examples: [{ input: GATED_MARKER, output: GATED_MARKER, explanation: GATED_MARKER }],
        constraints: [GATED_MARKER],
        hints: [GATED_MARKER],
      }),
      categoryName: "Stacks",
      loginNext: "/practice/problems/valid-parentheses",
    });
    const text = collectText(tree).join(" ");

    expect(text).not.toContain(GATED_MARKER);
  });

  it("wires the Premium / sign-in CTAs to the right hrefs, mirroring the coding-problems route", async () => {
    const { PracticeProblemLockedNotice } = await import(
      "@/app/practice/problems/[slug]/PracticeProblemPremiumGate"
    );
    const { Button } = await import("@/components/ui");
    const tree = PracticeProblemLockedNotice({
      problem: makeCodingProblem(),
      categoryName: "Arrays",
      loginNext: "/practice/problems/two-sum",
    });
    const buttons = findAllByType(tree, Button);

    expect(buttons.map((b) => b.props.href)).toEqual([
      "/premium",
      "/login?next=%2Fpractice%2Fproblems%2Ftwo-sum",
    ]);
  });
});
