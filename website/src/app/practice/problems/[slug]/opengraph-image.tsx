import { getPracticeProblem } from "@/lib/practice";
import { renderOgCard } from "@/lib/ogImage";

// Per-problem Open Graph image (problem title + difficulty + category). Only
// the title/difficulty/category are drawn — the same fields the premium gate shows.
export const alt = "CampusEduX practice problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  const detail = await getPracticeProblem(params.slug).catch(() => null);
  if (!detail) return renderOgCard({ title: "Coding Problems", eyebrow: "Practice" });
  const { problem, category } = detail;
  return renderOgCard({
    title: problem.title,
    eyebrow: [problem.difficulty, "Practice Problem"].filter(Boolean).join(" · "),
    footer: category?.name ?? "Practice",
  });
}
