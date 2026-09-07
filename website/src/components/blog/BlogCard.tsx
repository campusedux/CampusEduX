import Link from "next/link";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBlogDate } from "@/lib/blog";
import type { BlogPostCard as BlogPostCardData } from "@/lib/blog.types";
import { BlogImage } from "./BlogImage";

/**
 * The single blog listing tile — shared by the Featured grid, the Latest grid
 * and the "Related articles" strip so every card in the blog reads the same.
 * Surface language matches `ResourceCard` (rounded-2xl, `border-line`,
 * `shadow-card`, hover lift). `h-full` + the flex column let a CSS-grid row
 * equalise every card's height regardless of title / excerpt length.
 */
export function BlogCard({
  post,
  priority = false,
}: {
  post: BlogPostCardData;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-lg motion-reduce:transform-none"
    >
      <div className="relative aspect-[16/9] flex-shrink-0 overflow-hidden bg-primary-50">
        {post.featured_image ? (
          <BlogImage
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            priority={priority}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full"
            imgClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-surface">
            <Newspaper className="h-10 w-10 text-primary/30" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {post.category_name ? (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 font-semibold uppercase tracking-wide text-primary">
              {post.category_name}
            </span>
          ) : null}
          {post.reading_time ? (
            <span className="inline-flex items-center gap-1 text-ink-faint">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {post.reading_time} min read
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink group-hover:text-primary">
          {post.title}
        </h3>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-muted">{post.excerpt}</p>
        ) : (
          <span className="flex-1" />
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3 text-xs text-ink-faint">
          <span className="min-w-0 truncate">
            {post.author_name}
            {post.published_at ? <span> · {formatBlogDate(post.published_at)}</span> : null}
          </span>
          <span className="inline-flex flex-shrink-0 items-center gap-1 font-semibold text-primary">
            Read article
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
