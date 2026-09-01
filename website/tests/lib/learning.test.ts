import { describe, it, expect } from "vitest";
import { firstTopicOf, flattenTopics, isContentGrid, GRID_TYPE_LABEL, type LearningTree } from "@/lib/learning.types";

function tree(sections: { slug: string; topics: string[] }[]): LearningTree {
  return {
    grid: { id: "g", name: "Java", slug: "java", description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null },
    sections: sections.map((s, si) => ({
      id: `s${si}`,
      name: s.slug,
      slug: s.slug,
      description: "",
      topics: s.topics.map((t, ti) => ({
        id: `t${si}-${ti}`,
        title: t,
        slug: t.toLowerCase(),
        short_description: "",
        is_premium: false,
      })),
    })),
  };
}

describe("firstTopicOf", () => {
  it("returns the first topic of the first non-empty section", () => {
    const r = firstTopicOf(tree([{ slug: "empty", topics: [] }, { slug: "basics", topics: ["Intro", "Vars"] }]));
    expect(r?.sectionSlug).toBe("basics");
    expect(r?.topic.title).toBe("Intro");
  });

  it("returns null when the whole tree has no topics", () => {
    expect(firstTopicOf(tree([{ slug: "a", topics: [] }]))).toBeNull();
  });
});

describe("flattenTopics", () => {
  it("flattens in section then topic order and pairs each topic with its section", () => {
    const flat = flattenTopics(tree([
      { slug: "basics", topics: ["Intro", "Vars"] },
      { slug: "oop", topics: ["Inheritance"] },
    ]));
    expect(flat.map((x) => x.topic.title)).toEqual(["Intro", "Vars", "Inheritance"]);
    expect(flat.map((x) => x.section.slug)).toEqual(["basics", "basics", "oop"]);
  });
});

describe("isContentGrid", () => {
  it("treats content / custom / unknown / null as a Grid→Topic→Content tree", () => {
    for (const t of ["content", "custom", "communication", "", null, undefined]) {
      expect(isContentGrid(t as string)).toBe(true);
    }
  });
  it("treats the four specialised practice types as NOT a plain tree", () => {
    for (const t of ["aptitude", "dsa", "mock_test", "hr", "company"]) {
      expect(isContentGrid(t)).toBe(false);
    }
  });
});

describe("GRID_TYPE_LABEL", () => {
  it("has a human label for every known grid type", () => {
    for (const t of ["content", "aptitude", "dsa", "mock_test", "hr", "company", "custom"]) {
      expect(typeof GRID_TYPE_LABEL[t]).toBe("string");
      expect(GRID_TYPE_LABEL[t].length).toBeGreaterThan(0);
    }
  });
});
