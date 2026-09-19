import type { LearningGridCard } from "@/types";
import { completionPercent } from "./progress/progressLogic";

/**
 * Average minutes of reading per topic, used ONLY for the approximate
 * course-level total. Per-topic times are never shown in lists (they'd be
 * inaccurate); the reader computes its own from the real word count.
 */
export const AVG_TOPIC_MINUTES = 8;

/** "~3 hrs" / "~1 hr" / "~45 min"; `null` (hide it) when there are no topics or the count is missing. */
export function estimateCourseTime(topicCount: number | null | undefined): string | null {
  if (!topicCount || topicCount <= 0 || !Number.isFinite(topicCount)) return null;
  const minutes = topicCount * AVG_TOPIC_MINUTES;
  if (minutes < 60) return `~${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const hrs = Math.round(minutes / 60);
  return `~${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
}

export type CourseTag = { label: "Popular" | "Premium"; tone: "popular" | "premium" };

/** Only tags backed by real data: `is_featured` → Popular, `is_premium` → Premium. */
export function courseTags(grid: Pick<LearningGridCard, "is_featured" | "is_premium">): CourseTag[] {
  const tags: CourseTag[] = [];
  if (grid.is_featured) tags.push({ label: "Popular", tone: "popular" });
  if (grid.is_premium) tags.push({ label: "Premium", tone: "premium" });
  return tags;
}

export type CourseFilter = "all" | "in-progress" | "completed" | "bookmarked";

/** All / In Progress / Completed. (`bookmarked` is topic-level and handled separately.) */
export function matchesCourseFilter(filter: CourseFilter, completed: number, total: number): boolean {
  const pct = completionPercent(completed, total);
  if (filter === "completed") return total > 0 && pct >= 100;
  if (filter === "in-progress") return pct > 0 && pct < 100;
  return true;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Split `text` around case-insensitive matches of any word (≥2 chars) in `query`. */
export function splitHighlight(text: string, query: string): HighlightSegment[] {
  const terms = Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((t) => t.length >= 2)
        .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    ),
  );
  if (!text || terms.length === 0) return [{ text, match: false }];
  const re = new RegExp(`(${terms.join("|")})`, "gi");
  const out: HighlightSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[0].length === 0) {
      re.lastIndex += 1;
      continue;
    }
    if (m.index > last) out.push({ text: text.slice(last, m.index), match: false });
    out.push({ text: m[0], match: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false });
  return out.length ? out : [{ text, match: false }];
}

export function firstName(fullName?: string | null): string {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

/** True when the string is an emoji glyph (course icons come from the DB as either an emoji or an icon name). */
export function isEmoji(s: string | null | undefined): s is string {
  return !!s && /\p{Extended_Pictographic}/u.test(s);
}
