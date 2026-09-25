import { describe, it, expect } from "vitest";
import { flattenTopics, GRID_TYPE_LABEL, type LearningTree } from "@/lib/learning.types";

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

describe("GRID_TYPE_LABEL", () => {
  it("has a human label for every known grid type", () => {
    for (const t of ["content", "custom"]) {
      expect(typeof GRID_TYPE_LABEL[t]).toBe("string");
      expect(GRID_TYPE_LABEL[t].length).toBeGreaterThan(0);
    }
  });
});
