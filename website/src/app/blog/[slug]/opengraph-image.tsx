import { getBlogPost } from "@/lib/blog";
import { renderOgCard } from "@/lib/ogImage";

// Open Graph image for a blog post WITHOUT a featured image. A post that has
// one keeps it: the page sets `openGraph.images` only in that case, and an
// explicit `images` key takes precedence over this file-convention image.
export const alt = "CampusEduX blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  const post = await getBlogPost(params.slug).catch(() => null);
  if (!post) return renderOgCard({ title: "Blog", eyebrow: "CampusEduX" });
  return renderOgCard({ title: post.title, eyebrow: post.category_name || "Blog", footer: post.author_name || null });
}
