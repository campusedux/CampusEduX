import { getLearningTopicPage } from "@/lib/learning";
import { renderOgCard } from "@/lib/ogImage";

// Per-lesson Open Graph image (lesson title + course + chapter). The page's
// generateMetadata leaves `openGraph.images` unset so this file-convention
// image is the one Next.js emits (see the note on DEFAULT_OG_IMAGE in lib/seo.ts).
export const alt = "CampusEduX lesson";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { gridSlug: string; topicSlug: string } }) {
  const page = await getLearningTopicPage(params.gridSlug, params.topicSlug).catch(() => null);
  if (!page) return renderOgCard({ title: "Learning", eyebrow: "CampusEduX" });
  return renderOgCard({ title: page.topic.title, eyebrow: page.grid.name, footer: page.section.name });
}
