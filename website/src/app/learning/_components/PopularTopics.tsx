import Link from "next/link";
import { FileText } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { getLearningTree } from "@/lib/learning";
import type { LearningGridCard } from "@/lib/learning.types";
import { popularPickGridSlugs, selectPopularLessons } from "@/lib/learningDiscovery";

/**
 * "Popular topics" on /learning — up to 20 lesson links across the courses.
 *
 * Selection is EDITORIAL, not metric-driven: the schema has no anon-readable
 * popularity signal (no view counters; progress is device-only; bookmarks are
 * owner-only RLS). `POPULAR_LESSON_PICKS` in `src/lib/learningDiscovery.ts` is
 * the documented list; each pick is resolved against the real, published
 * course tree and dropped if it's gone, premium, or in a premium /
 * thin-template course. Trees come from the same request-memoized `getLearningTree`
 * entries the course pages use (one per course referenced by the picks, and
 * only for courses `learning_grids_list` says are published). Server
 * Component — plain crawlable links, no client JS.
 */
export async function PopularTopics({ grids }: { grids: LearningGridCard[] }) {
  const published = new Map(grids.map((g) => [g.slug.toLowerCase(), g]));
  const slugs = popularPickGridSlugs().filter((s) => published.has(s));
  if (slugs.length === 0) return null;

  const trees = await Promise.all(slugs.map((s) => getLearningTree(published.get(s)!.slug)));
  const lessons = selectPopularLessons(trees, {
    premiumGridSlugs: grids.filter((g) => g.is_premium).map((g) => g.slug),
  });
  if (lessons.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="popular-topics-title">
      <SectionHeader
        id="popular-topics-title"
        title="Popular topics"
        description="Foundational, frequently needed concepts from every course — a good place to start."
      />
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {lessons.map((l) => (
          <li key={`${l.gridSlug}/${l.topicSlug}`}>
            <Link
              href={`/learning/${l.gridSlug}/${l.topicSlug}`}
              className="group flex h-full items-start gap-3 rounded-xl border border-line bg-card px-3.5 py-3 transition hover:border-primary/40 hover:bg-surface"
            >
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink group-hover:text-primary">{l.title}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">{l.gridName}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PopularTopics;
