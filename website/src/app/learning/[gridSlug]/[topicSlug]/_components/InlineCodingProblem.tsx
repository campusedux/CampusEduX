import Link from "next/link";
import { getCodingProblem } from "@/lib/learning";
import type { TopicCodingProblemCard } from "@/lib/learning.types";
import { ProblemPanel } from "@/app/coding-problems/[problemSlug]/_components/ProblemPanel";

/** Reuses the existing statement/examples/hints/editorial and solution gate.
 * No judge or privileged read is performed while opening a tutorial.
 */
export async function InlineCodingProblem({ card, gridSlug, topicSlug }: {
  card: TopicCodingProblemCard;
  gridSlug: string;
  topicSlug: string;
}) {
  let detail;
  try {
    detail = await getCodingProblem(card.slug);
  } catch {
    return <div className="p-4 text-sm text-ink-muted">This exercise could not be loaded here. <Link className="inline-flex min-h-11 items-center font-semibold text-primary underline" href={`/coding-problems/${card.slug}`}>Open {card.title}</Link></div>;
  }
  if (!detail || detail.topic.grid_slug !== gridSlug || detail.topic.topic_slug !== topicSlug) return null;
  return <div className="min-w-0 rounded-2xl border border-line bg-card">
    {detail.locked ? <div className="p-4">
      <h3 className="font-semibold text-ink">{card.title}</h3>
      <p className="mt-2 text-sm text-ink-muted">Open the problem to check your access and view the exercise.</p>
    </div> : <ProblemPanel detail={detail} embedded />}
    <div className="border-t border-line p-4">
      <Link href={`/coding-problems/${card.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">
        {detail.locked ? "View access options" : "Open editor and run tests"}
      </Link>
    </div>
  </div>;
}
