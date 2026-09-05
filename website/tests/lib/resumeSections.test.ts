import { describe, it, expect } from "vitest";
import { normalizeLayout, moveSection, toggleHidden, MANAGEABLE_SECTIONS } from "@/lib/resumeBuilder/sections";

describe("normalizeLayout", () => {
  it("returns the full default order for an empty/missing layout", () => {
    expect(normalizeLayout({})).toEqual({ order: [...MANAGEABLE_SECTIONS], hidden: [] });
    expect(normalizeLayout(undefined)).toEqual({ order: [...MANAGEABLE_SECTIONS], hidden: [] });
  });

  it("preserves a stored order and appends any section missing from it", () => {
    const result = normalizeLayout({ order: ["skills", "summary"], hidden: ["skills"] });
    expect(result.order.slice(0, 2)).toEqual(["skills", "summary"]);
    expect(result.order).toHaveLength(MANAGEABLE_SECTIONS.length);
    expect(new Set(result.order)).toEqual(new Set(MANAGEABLE_SECTIONS));
    expect(result.hidden).toEqual(["skills"]);
  });

  it("drops unrecognised keys instead of trusting arbitrary stored strings", () => {
    const result = normalizeLayout({ order: ["summary", "not-a-real-section"], hidden: ["also-fake"] });
    expect(result.order).not.toContain("not-a-real-section");
    expect(result.hidden).toEqual([]);
  });
});

describe("moveSection", () => {
  const order = [...MANAGEABLE_SECTIONS];

  it("swaps a section up with its neighbour", () => {
    const result = moveSection(order, "education", "up");
    expect(result[0]).toBe("education");
    expect(result[1]).toBe("summary");
  });

  it("swaps a section down with its neighbour", () => {
    const result = moveSection(order, "summary", "down");
    expect(result[0]).toBe("education");
    expect(result[1]).toBe("summary");
  });

  it("is a no-op moving the first section up", () => {
    expect(moveSection(order, "summary", "up")).toEqual(order);
  });

  it("is a no-op moving the last section down", () => {
    const last = order[order.length - 1];
    expect(moveSection(order, last, "down")).toEqual(order);
  });
});

describe("toggleHidden", () => {
  it("hides a visible section", () => {
    expect(toggleHidden([], "summary")).toEqual(["summary"]);
  });

  it("unhides an already-hidden section", () => {
    expect(toggleHidden(["summary", "skills"], "summary")).toEqual(["skills"]);
  });
});
