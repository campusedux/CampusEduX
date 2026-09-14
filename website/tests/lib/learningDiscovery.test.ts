import { describe, it, expect } from "vitest";
import { gridTechProfile, rankTutorials, mergeUniqueById } from "@/lib/learningDiscovery";

describe("gridTechProfile", () => {
  it("maps the seeded grids to a clean label + recall terms", () => {
    expect(gridTechProfile("java-tutorial", "Java Tutorials")).toEqual({ label: "Java", terms: ["Java"] });
    expect(gridTechProfile("python-tutorial", "Python Tutorial").label).toBe("Python");
    expect(gridTechProfile("ai-ml-notes", "AI/ML Notes")).toMatchObject({ label: "AI/ML" });
    expect(gridTechProfile("ai-ml-notes").terms).toContain("Machine Learning");
  });

  it("adds synonyms so a match hits more tech_stack / skills values", () => {
    expect(gridTechProfile("javascript-tutorial").terms).toEqual(
      expect.arrayContaining(["JavaScript", "JS"]),
    );
    expect(gridTechProfile("web-development").terms).toEqual(expect.arrayContaining(["HTML", "CSS"]));
    expect(gridTechProfile("cpp-tutorial").label).toBe("C++");
  });

  it("falls back to a title-cased slug for an unknown grid (no code change needed)", () => {
    expect(gridTechProfile("elixir-tutorial", "Elixir Tutorial")).toEqual({
      label: "Elixir",
      terms: ["Elixir", "elixir"],
    });
    expect(gridTechProfile("scala-notes", "Scala").label).toBe("Scala");
  });

  it("never returns an empty label or terms", () => {
    const p = gridTechProfile("", "");
    expect(p.label.length).toBeGreaterThan(0);
    expect(p.terms.length).toBeGreaterThan(0);
  });

  it("is case-insensitive on the slug", () => {
    expect(gridTechProfile("JAVA-TUTORIAL").label).toBe("Java");
  });
});

describe("rankTutorials", () => {
  const g = (over: Partial<{ name: string; is_featured: boolean; topic_count: number; sort_order: number }>) => ({
    name: "X",
    is_featured: false,
    topic_count: 0,
    sort_order: 0,
    ...over,
  });

  it("puts featured grids first, then most topics, then admin sort order", () => {
    const ranked = rankTutorials([
      g({ name: "few", topic_count: 3, sort_order: 5 }),
      g({ name: "featured", is_featured: true, topic_count: 1 }),
      g({ name: "many", topic_count: 40, sort_order: 9 }),
    ]);
    expect(ranked.map((x) => x.name)).toEqual(["featured", "many", "few"]);
  });

  it("does not mutate the input array", () => {
    const input = [g({ name: "a", topic_count: 1 }), g({ name: "b", topic_count: 2 })];
    const copy = [...input];
    rankTutorials(input);
    expect(input).toEqual(copy);
  });
});

describe("mergeUniqueById", () => {
  it("appends only new ids and respects the cap", () => {
    const base = [{ id: "1" }, { id: "2" }];
    const extra = [{ id: "2" }, { id: "3" }, { id: "4" }];
    expect(mergeUniqueById(base, extra, 3).map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("returns the base unchanged when nothing new fits", () => {
    const base = [{ id: "1" }, { id: "2" }];
    expect(mergeUniqueById(base, [{ id: "1" }], 6)).toEqual(base);
  });
});
