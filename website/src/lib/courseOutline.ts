import type { LearningTree } from "@/lib/learning.types";

/**
 * Slim, client-safe view of a Learning grid tree: just what navigation,
 * progress and the curriculum need (no descriptions, no icons). Passed to
 * client islands so a 150–300 lesson course ships the minimum payload.
 */
export interface OutlineLesson {
  id: string;
  slug: string;
  title: string;
  isPremium: boolean;
  /** 1-based position across the whole course. */
  number: number;
}
export interface OutlineSection {
  id: string;
  name: string;
  lessons: OutlineLesson[];
}
export interface CourseOutline {
  gridSlug: string;
  gridName: string;
  sections: OutlineSection[];
  /** Every lesson slug in reading order. */
  order: string[];
  total: number;
}

export function toOutline(tree: LearningTree): CourseOutline {
  let n = 0;
  const sections = tree.sections.map((s) => ({
    id: s.id,
    name: s.name,
    lessons: s.topics.map((t) => ({ id: t.id, slug: t.slug, title: t.title, isPremium: t.is_premium, number: ++n })),
  }));
  const order = sections.flatMap((s) => s.lessons.map((l) => l.slug));
  return { gridSlug: tree.grid.slug, gridName: tree.grid.name, sections, order, total: order.length };
}

export function findLesson(outline: CourseOutline, slug: string): { section: OutlineSection; lesson: OutlineLesson } | null {
  for (const section of outline.sections) {
    const lesson = section.lessons.find((l) => l.slug === slug);
    if (lesson) return { section, lesson };
  }
  return null;
}
