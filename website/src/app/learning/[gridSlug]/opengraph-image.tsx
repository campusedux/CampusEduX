import { getLearningGridBrief } from "@/lib/learning";
import { renderOgCard } from "@/lib/ogImage";

// Per-course Open Graph image, used when the course has no cover image of its
// own (the page sets `openGraph.images` only when `cover_image_url` exists).
export const alt = "CampusEduX course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params: paramsPromise }: { params: Promise<{ gridSlug: string }> }) {
  const params = await paramsPromise;
  const grid = await getLearningGridBrief(params.gridSlug).catch(() => null);
  if (!grid) return renderOgCard({ title: "Learning", eyebrow: "CampusEduX" });
  return renderOgCard({ title: grid.name, eyebrow: "Course", footer: "Lessons with examples" });
}
