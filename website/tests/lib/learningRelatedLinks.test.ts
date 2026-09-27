import { describe, it, expect } from "vitest";
import {
  lessonTokens,
  selectRelatedLessons,
  selectPopularLessons,
  popularPickGridSlugs,
  isThinTemplateGrid,
  POPULAR_LESSON_PICKS,
  POPULAR_LESSON_LIMIT,
} from "@/lib/learningDiscovery";
import type { LearningTree } from "@/lib/learning.types";

type T = [slug: string, title: string, premium?: boolean];

function tree(slug: string, name: string, sections: [id: string, name: string, topics: T[]][]): LearningTree {
  return {
    grid: { id: `g-${slug}`, name, slug, description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null },
    sections: sections.map(([id, sname, topics]) => ({
      id,
      name: sname,
      slug: id,
      description: "",
      topics: topics.map(([tslug, title, premium]) => ({
        id: `${slug}:${tslug}`,
        slug: tslug,
        title,
        short_description: "",
        is_premium: Boolean(premium),
      })),
    })),
  };
}

// Shaped after the real Java Tutorials course (slugs/titles as published).
const JAVA = tree("java-tutorial", "Java Tutorials", [
  ["s-basics", "Java Basics", [["introduction-to-java", "Introduction to Java"], ["first-java-program", "First Java Program"], ["data-types", "Data Types"], ["variables", "Variables"]]],
  ["s-loops", "Control Flow", [["if-else", "if-else"], ["switch", "switch"], ["for-loop", "for Loop"], ["while-loop", "while Loop"], ["do-while-loop", "do-while Loop"], ["nested-loops", "Nested Loops"]]],
  ["s-oop", "OOP", [["class", "Class"], ["inheritance", "Inheritance"], ["types-of-inheritance", "Types of Inheritance"], ["polymorphism", "Polymorphism"], ["super-keyword", "super Keyword"], ["abstract-class", "Abstract Class", true]]],
  ["s-coll", "Collections", [["collection-framework", "Collection Framework"], ["map", "Map"], ["hashmap", "HashMap"], ["linkedhashmap", "LinkedHashMap"], ["treemap", "TreeMap"], ["hashset", "HashSet"]]],
  ["s-int", "Interview Prep", [["oop-interview-questions", "OOP Interview Questions"], ["java-hashmap-internals", "HashMap Internals"]]],
]);

const slugsOf = (r: { topicSlug: string }[]) => r.map((x) => x.topicSlug);

describe("lessonTokens", () => {
  it("drops stopwords + grid words and singularises plurals", () => {
    const stop = lessonTokens("Java Tutorials java-tutorial");
    expect(Array.from(lessonTokens("Introduction to Java Arrays", stop))).toEqual(["array"]);
    expect(Array.from(lessonTokens("Nested Loops"))).toEqual(["nested", "loop"]);
    expect(lessonTokens("Classes").has("class")).toBe(true);
    expect(lessonTokens("OOP Interview Questions").has("question")).toBe(false);
  });
});

describe("selectRelatedLessons", () => {
  it("prefers keyword matches, then same-section neighbours, and never returns the lesson itself", () => {
    const r = slugsOf(selectRelatedLessons(JAVA, "hashmap"));
    expect(r).not.toContain("hashmap");
    // keyword matches (hashmap ⊂ linkedhashmap, "HashMap Internals" across sections) rank first
    expect(r.slice(0, 2).sort()).toEqual(["java-hashmap-internals", "linkedhashmap"]);
    expect(r.length).toBeLessThanOrEqual(5);
    expect(r.length).toBeGreaterThanOrEqual(3);
    // everything else is from the same section
    for (const s of r.slice(2)) expect(["collection-framework", "map", "treemap", "hashset"]).toContain(s);
  });

  it("links related loop lessons and excludes prev/next when asked", () => {
    const r = slugsOf(selectRelatedLessons(JAVA, "for-loop", { exclude: ["switch", "while-loop"] }));
    expect(r).not.toContain("switch");
    expect(r).not.toContain("while-loop");
    expect(r.slice(0, 2).sort()).toEqual(["do-while-loop", "nested-loops"]);
  });

  it("matches across sections of the same course only on a shared keyword", () => {
    const r = slugsOf(selectRelatedLessons(JAVA, "inheritance"));
    expect(r[0]).toBe("types-of-inheritance");
    expect(r).not.toContain("for-loop");
    expect(r).not.toContain("hashmap");
  });

  it("skips premium lessons", () => {
    const r = slugsOf(selectRelatedLessons(JAVA, "polymorphism", { limit: 10 }));
    expect(r).not.toContain("abstract-class");
  });

  it("respects the limit and returns stable results", () => {
    expect(selectRelatedLessons(JAVA, "class", { limit: 3 })).toHaveLength(3);
    expect(selectRelatedLessons(JAVA, "class")).toEqual(selectRelatedLessons(JAVA, "class"));
  });

  it("builds links from the tree's own grid slug + section name", () => {
    const [first] = selectRelatedLessons(JAVA, "for-loop");
    expect(first.gridSlug).toBe("java-tutorial");
    expect(first.gridName).toBe("Java Tutorials");
    expect(first.sectionName).toBe("Control Flow");
  });

  it("returns [] for a missing tree, an unknown lesson, or a thin-template course", () => {
    expect(selectRelatedLessons(null, "x")).toEqual([]);
    expect(selectRelatedLessons(JAVA, "no-such-lesson")).toEqual([]);
    const genAi = tree("generative-ai", "Generative AI", [["s", "Basics", [["a", "Prompt Basics"], ["b", "Prompt Patterns"]]]]);
    expect(isThinTemplateGrid("generative-ai")).toBe(true);
    expect(selectRelatedLessons(genAi, "a")).toEqual([]);
  });

  it("returns nothing when a lesson has no section-mates and no keyword match", () => {
    const lonely = tree("x-course", "X Course", [["s1", "One", [["alpha", "Alpha"]]], ["s2", "Two", [["beta", "Beta"]]]]);
    expect(selectRelatedLessons(lonely, "alpha")).toEqual([]);
  });
});

describe("selectPopularLessons", () => {
  const SQL = tree("dbms-sql-tutorial", "DBMS & SQL Tutorial", [
    ["q", "Joins", [["inner-join", "INNER JOIN"], ["left-join", "LEFT JOIN"]]],
    ["k", "Keys", [["primary-key", "Primary Key", true]]],
  ]);

  it("resolves picks in order against real trees and caps at the limit", () => {
    const picks = [
      { gridSlug: "java-tutorial", topicSlug: "inheritance" },
      { gridSlug: "dbms-sql-tutorial", topicSlug: "inner-join" },
      { gridSlug: "java-tutorial", topicSlug: "hashmap" },
    ];
    const r = selectPopularLessons([JAVA, SQL], { picks, limit: 2 });
    expect(r.map((l) => `${l.gridSlug}/${l.topicSlug}`)).toEqual(["java-tutorial/inheritance", "dbms-sql-tutorial/inner-join"]);
    expect(r[1].title).toBe("INNER JOIN");
  });

  it("drops missing, premium, duplicate, premium-course and thin-template picks (never fabricates)", () => {
    const genAi = tree("generative-ai", "Generative AI", [["s", "S", [["intro", "Intro"]]]]);
    const picks = [
      { gridSlug: "java-tutorial", topicSlug: "does-not-exist" },
      { gridSlug: "dbms-sql-tutorial", topicSlug: "primary-key" }, // premium lesson
      { gridSlug: "java-tutorial", topicSlug: "inheritance" },
      { gridSlug: "java-tutorial", topicSlug: "inheritance" }, // duplicate
      { gridSlug: "generative-ai", topicSlug: "intro" }, // thin-template course
      { gridSlug: "python-tutorial", topicSlug: "oop" }, // tree not available
      { gridSlug: "dbms-sql-tutorial", topicSlug: "left-join" },
    ];
    expect(slugsOf(selectPopularLessons([JAVA, SQL, genAi, null], { picks }))).toEqual(["inheritance", "left-join"]);
    expect(slugsOf(selectPopularLessons([JAVA, SQL], { picks, premiumGridSlugs: ["DBMS-SQL-TUTORIAL"] }))).toEqual([
      "inheritance",
    ]);
  });

  it("ships 20 primary picks plus reserves, no duplicates, spread across courses", () => {
    expect(POPULAR_LESSON_LIMIT).toBe(20);
    expect(POPULAR_LESSON_PICKS.length).toBeGreaterThan(POPULAR_LESSON_LIMIT);
    const keys = POPULAR_LESSON_PICKS.map((p) => `${p.gridSlug}/${p.topicSlug}`);
    expect(new Set(keys).size).toBe(keys.length);
    const grids = popularPickGridSlugs();
    expect(grids.length).toBeGreaterThanOrEqual(4);
    expect(grids).not.toContain("generative-ai");
    // no single course holds more than a third of the primary 20
    const primary = POPULAR_LESSON_PICKS.slice(0, POPULAR_LESSON_LIMIT);
    for (const g of grids) expect(primary.filter((p) => p.gridSlug === g).length).toBeLessThanOrEqual(7);
  });
});
