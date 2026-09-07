import { describe, it, expect } from "vitest";
import {
  sanitizeSearchTerm,
  isSearchableTerm,
  arrayMatchVariants,
  withQuery,
  projectHref,
  jobHref,
  blogHref,
  learningHref,
  resumeTemplatesHref,
  flattenGroups,
  SEARCH_GROUP_ORDER,
  SEARCH_GROUP_LABEL,
  MIN_SEARCH_TERM,
  type SearchGroup,
} from "@/lib/searchModel";

describe("sanitizeSearchTerm", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeSearchTerm("  java   tutorial ")).toBe("java tutorial");
  });

  it("is case-preserving (matching is done case-insensitively downstream)", () => {
    expect(sanitizeSearchTerm("JAVA")).toBe("JAVA");
    expect(sanitizeSearchTerm("Java")).toBe("Java");
  });

  it("strips characters that break PostgREST or()/ilike filters", () => {
    expect(sanitizeSearchTerm("java, (script)")).toBe("java script");
    expect(sanitizeSearchTerm('a"b\\c%d_e*f')).toBe("a b c d e f");
    expect(sanitizeSearchTerm("50%")).toBe("50");
  });

  it("returns '' for empty / all-punctuation input", () => {
    expect(sanitizeSearchTerm("")).toBe("");
    expect(sanitizeSearchTerm(null)).toBe("");
    expect(sanitizeSearchTerm(undefined)).toBe("");
    expect(sanitizeSearchTerm("()%,_")).toBe("");
  });

  it("caps very long queries", () => {
    expect(sanitizeSearchTerm("x".repeat(500)).length).toBe(80);
  });
});

describe("isSearchableTerm", () => {
  it(`requires at least ${MIN_SEARCH_TERM} characters`, () => {
    expect(isSearchableTerm("")).toBe(false);
    expect(isSearchableTerm("a")).toBe(false);
    expect(isSearchableTerm("ja")).toBe(true);
    expect(isSearchableTerm("java")).toBe(true);
  });
});

describe("arrayMatchVariants", () => {
  it("widens a term to lower / Capitalised / UPPER for exact array-element matches", () => {
    expect(arrayMatchVariants("java").sort()).toEqual(["JAVA", "Java", "java"].sort());
  });
  it("dedupes when the term is already one of the variants", () => {
    expect(arrayMatchVariants("Java")).toContain("Java");
    expect(new Set(arrayMatchVariants("Java")).size).toBe(arrayMatchVariants("Java").length);
  });
});

describe("withQuery", () => {
  it("builds an encoded ?q= link and drops it for an empty term", () => {
    expect(withQuery("/learning", "java tutorial")).toBe("/learning?q=java%20tutorial");
    expect(withQuery("/projects", "  ")).toBe("/projects");
  });
});

describe("detail href builders route each type to its own page", () => {
  it("never sends a non-project result to /projects", () => {
    expect(projectHref("pr-1")).toBe("/projects/pr-1");
    expect(jobHref("jb-9")).toBe("/jobs/jb-9");
    expect(blogHref("java-vs-python")).toBe("/blog/java-vs-python");
    expect(learningHref("java-tutorial")).toBe("/learning/java-tutorial");
    expect(learningHref("java-tutorial", "collections")).toBe("/learning/java-tutorial/collections");
    expect(resumeTemplatesHref()).toBe("/resume/templates");
  });

  it("encodes ids with unusual characters", () => {
    expect(projectHref("a b/c")).toBe("/projects/a%20b%2Fc");
  });
});

describe("group metadata", () => {
  it("has a label for every ordered group", () => {
    for (const type of SEARCH_GROUP_ORDER) {
      expect(typeof SEARCH_GROUP_LABEL[type]).toBe("string");
      expect(SEARCH_GROUP_LABEL[type].length).toBeGreaterThan(0);
    }
  });
  it("orders learning before projects (tutorials are the primary miss today)", () => {
    expect(SEARCH_GROUP_ORDER.indexOf("learning")).toBeLessThan(SEARCH_GROUP_ORDER.indexOf("projects"));
  });
});

describe("flattenGroups", () => {
  it("concatenates every group's items in order for keyboard nav", () => {
    const groups: SearchGroup[] = [
      { type: "learning", label: "Learning", allHref: null, total: 2, items: [
        { id: "l1", title: "Java Tutorial", href: "/learning/java" },
        { id: "l2", title: "Core Java", href: "/learning/java/core" },
      ] },
      { type: "projects", label: "Projects", allHref: null, total: 1, items: [
        { id: "p1", title: "Java E-commerce", href: "/projects/p1" },
      ] },
    ];
    expect(flattenGroups(groups).map((i) => i.id)).toEqual(["l1", "l2", "p1"]);
  });
});
