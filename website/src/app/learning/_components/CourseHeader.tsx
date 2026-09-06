import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui";
import type { LearningTree, LearningTreeTopic } from "@/lib/learning";

/**
 * Course overview header — title, description, section/topic counts and the
 * primary "start reading" CTA. One shared shell for every grid (Python, Java,
 * or any future course); only the data changes.
 */
export function CourseHeader({
  grid,
  sectionCount,
  topicCount,
  start,
}: {
  grid: LearningTree["grid"];
  sectionCount: number;
  topicCount: number;
  start: { sectionSlug: string; topic: LearningTreeTopic } | null;
}) {
  return (
    <div className="border-b border-line pb-6">
      {grid.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied Storage URL
        <img
          src={grid.cover_image_url}
          alt=""
          className="mb-6 aspect-[3/1] w-full rounded-2xl border border-line object-cover"
        />
      ) : null}

      <h1 className="text-3xl font-bold tracking-tight text-ink">{grid.name}</h1>
      {grid.description ? <p className="mt-3 max-w-2xl text-ink-muted">{grid.description}</p> : null}

      <div className="mt-5 flex flex-wrap items-center gap-5">
        {start ? (
          <Button href={`/learning/${grid.slug}/${start.topic.slug}`} rightIcon={ArrowRight}>
            Start Learning
          </Button>
        ) : null}
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {sectionCount} section{sectionCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {topicCount} topic{topicCount === 1 ? "" : "s"}
          </span>
        </span>
      </div>
    </div>
  );
}

export default CourseHeader;
