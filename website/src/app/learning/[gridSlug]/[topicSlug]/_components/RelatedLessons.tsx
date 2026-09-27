import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import type { LearningTree } from "@/lib/learning.types";
import { selectRelatedLessons } from "@/lib/learningDiscovery";

/**
 * "Related lessons" on a Learning lesson page — 3–5 same-course lessons that
 * share title keywords and/or the lesson's section (see `selectRelatedLessons`
 * in `src/lib/learningDiscovery.ts`). Built from the course tree the page has
 * already fetched, so it adds no query and inherits the page's ISR. Server
 * Component: plain crawlable links, zero client JS. Prev/next are excluded
 * (the lesson nav already links them). Renders nothing when there is no
 * genuine match or for a thin-template course.
 */
export function RelatedLessons({
  tree,
  topicSlug,
  exclude,
}: {
  tree: LearningTree | null;
  topicSlug: string;
  exclude?: (string | null | undefined)[];
}) {
  const lessons = selectRelatedLessons(tree, topicSlug, {
    exclude: (exclude ?? []).filter((s): s is string => Boolean(s)),
  });
  if (lessons.length === 0) return null;

  return (
    <section className="mt-10 border-t border-line pt-8" aria-labelledby="related-lessons-title">
      <h2 id="related-lessons-title" className="flex items-center gap-2 text-lg font-bold text-ink">
        <BookOpenText className="h-5 w-5 text-primary" aria-hidden /> Related lessons
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {lessons.map((l) => (
          <li key={l.topicSlug}>
            <Link
              href={`/learning/${l.gridSlug}/${l.topicSlug}`}
              className="card card-hover group flex h-full items-start justify-between gap-3 p-4"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-ink group-hover:text-primary">{l.title}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">{l.sectionName}</span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-ink-faint group-hover:text-primary" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RelatedLessons;
