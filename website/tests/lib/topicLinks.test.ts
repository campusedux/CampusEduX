import { describe, expect, it } from "vitest";
import { buildTopicLinkIndex, createTopicLinkState } from "@/lib/topicLinks";
import type { LearningTree } from "@/lib/learning.types";

function tree(topics: { slug: string; title: string }[]): LearningTree {
  return {
    grid: { id: "g1", name: "Java Tutorial", slug: "java-tutorial", description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null },
    sections: [
      { id: "s1", name: "Collections", slug: "collections", description: "", topics: topics.map((t, i) => ({ id: `t${i}`, ...t, short_description: "", is_premium: false })) },
    ],
  };
}

describe("buildTopicLinkIndex", () => {
  it("excludes the current topic (no self-links)", () => {
    const t = tree([
      { slug: "arraylist", title: "ArrayList" },
      { slug: "linkedlist", title: "LinkedList" },
    ]);
    const index = buildTopicLinkIndex(t, "java-tutorial", "arraylist");
    expect(index.map((e) => e.topicKey)).toEqual(["linkedlist"]);
  });

  it("builds a canonical /learning/<grid>/<topic> href for every entry", () => {
    const t = tree([{ slug: "arraylist", title: "ArrayList" }]);
    const index = buildTopicLinkIndex(t, "java-tutorial", "other");
    expect(index[0].href).toBe("/learning/java-tutorial/arraylist");
  });

  it("strips common wrapper phrases into a second alias, keeping the original title too", () => {
    const t = tree([{ slug: "arrays-intro", title: "Introduction to Java Arrays" }]);
    const index = buildTopicLinkIndex(t, "java-tutorial", "other");
    expect(index[0].terms).toContain("introduction to java arrays");
    expect(index[0].terms).toContain("java arrays");
  });

  it("drops aliases that are too short or too generic to safely auto-link", () => {
    const t = tree([{ slug: "overview", title: "Overview" }, { slug: "faq", title: "FAQ" }]);
    const index = buildTopicLinkIndex(t, "java-tutorial", "other");
    // "Overview" strips to nothing useful (both raw + normalized alias are the
    // generic-list word) and "FAQ" is under the 4-char minimum -> both dropped.
    expect(index).toHaveLength(0);
  });

  it("returns [] for a null tree", () => {
    expect(buildTopicLinkIndex(null, "java-tutorial", "x")).toEqual([]);
  });
});

describe("createTopicLinkState", () => {
  it("starts with an empty used-topics set and the given cap", () => {
    const state = createTopicLinkState(5);
    expect(state.usedTopics.size).toBe(0);
    expect(state.linksLeft).toBe(5);
  });

  it("defaults to a positive cap when omitted", () => {
    expect(createTopicLinkState().linksLeft).toBeGreaterThan(0);
  });
});
