import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import type { LearningTreeSection } from "@/lib/learning";

/**
 * One section card on the course overview page — section name/description as
 * a header, then its topics as clean clickable rows. Reused for every grid and
 * every section, so a 6-topic course and a 150-topic one get the same rhythm.
 */
export function TopicSection({ section, gridSlug }: { section: LearningTreeSection; gridSlug: string }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="border-b border-line pb-3.5">
        <h2 className="text-lg font-bold text-ink">{section.name}</h2>
        {section.description ? <p className="mt-1 text-sm text-ink-muted">{section.description}</p> : null}
      </div>

      {section.topics.length === 0 ? (
        <p className="pt-4 text-sm text-ink-faint">No topics published yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {section.topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/learning/${gridSlug}/${topic.slug}`}
                className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3.5 transition-colors hover:bg-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink group-hover:text-primary">{topic.title}</span>
                  {topic.short_description ? (
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">{topic.short_description}</span>
                  ) : null}
                </span>
                {topic.is_premium ? (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    <Lock className="h-3 w-3" aria-hidden /> Premium
                  </span>
                ) : null}
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TopicSection;
