import { buildChapters, courseTotals, pickResumeTopic } from "@/learning/courseTree";
import type { LearningSectionNode } from "@/types";

const topic = (slug: string) => ({ id: `id-${slug}`, title: slug, slug, short_description: "", is_premium: false });
const sections: LearningSectionNode[] = [
  { id: "s1", name: "Basics", slug: "basics", description: "", topics: [topic("a"), topic("b"), topic("c")] },
  { id: "s2", name: "Advanced", slug: "advanced", description: "", topics: [topic("d"), topic("e")] },
  { id: "s3", name: "Empty", slug: "empty", description: "", topics: [] },
];
const chapters = (done: string[]) => buildChapters(sections, new Set(done));

describe("buildChapters / courseTotals", () => {
  it("folds per-chapter progress in", () => {
    const c = chapters(["a", "b", "d"]);
    expect(c.map((x) => [x.done, x.total, x.percent])).toEqual([[2, 3, 67], [1, 2, 50], [0, 0, 0]]);
    expect(courseTotals(c)).toEqual({ total: 5, done: 3, percent: 60 });
  });

  it("ignores completions of topics that no longer exist", () => {
    expect(courseTotals(chapters(["a", "ghost-1", "ghost-2"]))).toEqual({ total: 5, done: 1, percent: 20 });
  });
});

describe("pickResumeTopic", () => {
  it("start: nothing done, never opened", () => {
    const r = pickResumeTopic(chapters([]), new Set(), null)!;
    expect([r.mode, r.topic.slug, r.chapterId]).toEqual(["start", "a", "s1"]);
  });

  it("continue: last-opened topic if unfinished", () => {
    const r = pickResumeTopic(chapters(["a"]), new Set(["a"]), "b")!;
    expect([r.mode, r.topic.slug]).toEqual(["continue", "b"]);
  });

  it("continue: next unfinished after a finished last-opened topic, across chapters", () => {
    const done = new Set(["a", "b", "c"]);
    const r = pickResumeTopic(chapters([...done]), done, "c")!;
    expect([r.mode, r.topic.slug, r.chapterId]).toEqual(["continue", "d", "s2"]);
  });

  it("continue: wraps to an earlier unfinished topic", () => {
    const done = new Set(["b", "c", "d", "e"]);
    const r = pickResumeTopic(chapters([...done]), done, "e")!;
    expect(r.topic.slug).toBe("a");
  });

  it("continue when opened but nothing completed yet", () => {
    const r = pickResumeTopic(chapters([]), new Set(), "d")!;
    expect([r.mode, r.topic.slug]).toEqual(["continue", "d"]);
  });

  it("review when everything is done; null when the course has no topics", () => {
    const all = new Set(["a", "b", "c", "d", "e"]);
    expect(pickResumeTopic(chapters([...all]), all, "e")!.mode).toBe("review");
    expect(pickResumeTopic(buildChapters([], new Set()), new Set(), null)).toBeNull();
  });
});
