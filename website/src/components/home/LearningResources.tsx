import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getLearningGrids } from "@/lib/learning";
import { SectionHeader } from "@/components/ui";

/**
 * Home "Learning" section — published, website-visible Learning grids from the
 * admin panel (via the `learning_grids_list` RPC). Renders nothing when there
 * are none, so it never shows an empty section.
 */
export async function LearningResources() {
  const grids = await getLearningGrids();
  if (grids.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeader title="Learning" viewAllHref="/learning" viewAllLabel="All resources" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grids.slice(0, 6).map((g) => (
          <Link
            key={g.id}
            href={`/learning/${g.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg active:scale-[.99] motion-reduce:transform-none"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-primary"
              style={{ backgroundColor: g.accent_color ? `${g.accent_color}1a` : "#EEF0FF" }}
            >
              {g.icon && /\p{Extended_Pictographic}/u.test(g.icon) ? (
                g.icon
              ) : (
                <BookOpen className="h-5 w-5" aria-hidden />
              )}
            </span>
            <div className="mt-3 font-bold text-ink group-hover:text-primary">{g.name}</div>
            {g.description ? (
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-muted">{g.description}</p>
            ) : (
              <span className="flex-1" />
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {g.topic_count} topic{g.topic_count === 1 ? "" : "s"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default LearningResources;
