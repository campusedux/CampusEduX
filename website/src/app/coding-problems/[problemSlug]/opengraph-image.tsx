import { getCodingProblem } from "@/lib/learning";
import { renderOgCard } from "@/lib/ogImage";

// Per-problem Open Graph image (problem title + difficulty + topic). Only the
// title/difficulty/topic are drawn — the same fields the premium gate shows.
export const alt = "CampusEduX coding problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params: paramsPromise }: { params: Promise<{ problemSlug: string }> }) {
  const params = await paramsPromise;
  const detail = await getCodingProblem(params.problemSlug).catch(() => null);
  if (!detail) return renderOgCard({ title: "Coding Problems", eyebrow: "CampusEduX" });
  const { problem, topic } = detail;
  return renderOgCard({
    title: problem.title,
    eyebrow: [problem.difficulty, "Coding Problem"].filter(Boolean).join(" · "),
    footer: topic.title,
  });
}
