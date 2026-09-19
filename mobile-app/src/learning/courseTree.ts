import type { LearningSectionNode, LearningTopicRef } from "@/types";
import { completionPercent } from "./progress/progressLogic";

/** A chapter (DB "section") with the current user's progress folded in. */
export interface ChapterView {
  id: string;
  /** 0-based position → shown as chapter number (index + 1). */
  index: number;
  name: string;
  topics: LearningTopicRef[];
  total: number;
  done: number;
  percent: number;
}

export function buildChapters(sections: LearningSectionNode[], completed: ReadonlySet<string>): ChapterView[] {
  return sections.map((s, index) => {
    const done = s.topics.reduce((n, t) => n + (completed.has(t.slug) ? 1 : 0), 0);
    return { id: s.id, index, name: s.name, topics: s.topics, total: s.topics.length, done, percent: completionPercent(done, s.topics.length) };
  });
}

/** Course totals over topics that actually exist in the tree (stale completions of unpublished topics don't inflate %). */
export function courseTotals(chapters: ChapterView[]) {
  const total = chapters.reduce((n, c) => n + c.total, 0);
  const done = chapters.reduce((n, c) => n + c.done, 0);
  return { total, done, percent: completionPercent(done, total) };
}

export type ResumeMode = "start" | "continue" | "review";

export interface ResumeTarget {
  topic: LearningTopicRef;
  chapterId: string;
  mode: ResumeMode;
}

/**
 * Where the hero button should go.
 *  - nothing done and never opened here → "start" at the first topic
 *  - otherwise → "continue": the last-opened topic if unfinished, else the next
 *    unfinished topic after it (wrapping), else the first unfinished
 *  - every topic done → "review" from the top
 */
export function pickResumeTopic(chapters: ChapterView[], completed: ReadonlySet<string>, lastOpenedSlug?: string | null): ResumeTarget | null {
  const flat = chapters.flatMap((c) => c.topics.map((topic) => ({ topic, chapterId: c.id })));
  if (flat.length === 0) return null;

  const lastIdx = lastOpenedSlug ? flat.findIndex((f) => f.topic.slug === lastOpenedSlug) : -1;
  const doneCount = flat.reduce((n, f) => n + (completed.has(f.topic.slug) ? 1 : 0), 0);

  if (doneCount === 0 && lastIdx < 0) return { ...flat[0], mode: "start" };
  if (doneCount >= flat.length) return { ...flat[0], mode: "review" };

  const order = lastIdx >= 0 ? [...flat.slice(lastIdx), ...flat.slice(0, lastIdx)] : flat;
  const next = order.find((f) => !completed.has(f.topic.slug)) ?? flat[0];
  return { ...next, mode: "continue" };
}
