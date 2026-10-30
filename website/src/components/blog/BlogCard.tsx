import Link from "next/link";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBlogDate } from "@/lib/blog";
import type { BlogPostCard as BlogPostCardData } from "@/lib/blog.types";
import { BlogImage } from "./BlogImage";

/**
 * The blog listing tile — shared by the Featured block, the Latest grid and the
 * "Related articles" strip so every card in the blog reads the same. Surface
 * language matches `.card` (rounded-xl, `border-line`, `shadow-card`, hover
 * lift). `h-full` + the flex column let a CSS-grid row equalise card heights.
 *
 * `featured` switches to a wide two-column layout (image left, text right) from
 * `lg` up — used for the lead article on the blog index (and a lone leftover
 * featured article). Below `lg` it stacks like a normal card.
 *
 * Thumbnails are 16:9 with title text baked in near the top, so the wrapper is
 * `aspect-[16/9]` with a 150px cap. `object-cover` crops oversized images.
 * Presentation only; same href, same data.
 */
export function BlogCard({
  post,
  priority = false,
  featured = false,
}: {
  post: BlogPostCardData;
  priority?: boolean;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "card card-hover group flex h-full min-w-0 flex-col overflow-hidden max-md:min-h-24 max-md:flex-row max-md:border-0 max-md:bg-transparent max-md:shadow-none",
        featured && "max-md:!flex-col max-md:!border max-md:!bg-card",
        featured && "lg:h-[260px] lg:max-h-[280px] lg:flex-row",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-primary-50",
          featured ? "aspect-[16/10] lg:aspect-auto lg:h-full lg:w-[40%] max-md:aspect-[16/9] max-md:max-h-40" : "aspect-[16/9] max-h-[150px] max-md:aspect-auto max-md:h-[78px] max-md:w-[104px] max-md:rounded-lg",
        )}
      >
        {post.featured_image ? (
          <BlogImage
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            priority={priority}
            sizes={
              featured
                ? "(min-width: 1024px) 40vw, 100vw"
                : "(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 768px) 50vw, 104px"
            }
            className="h-full w-full"
            imgClassName="object-cover object-top transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-surface">
            <Newspaper className="h-10 w-10 text-primary/30" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 max-md:p-2 max-md:pl-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs max-md:gap-y-0">
          {post.category_name ? (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 font-semibold uppercase tracking-wide text-primary max-md:px-2 max-md:py-0.5 max-md:text-[10px]">
              {post.category_name}
            </span>
          ) : null}
          {post.reading_time ? (
            <span className="inline-flex items-center gap-1 text-ink-faint max-md:hidden">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {post.reading_time} min read
            </span>
          ) : null}
        </div>

        <h3
          className={cn(
            "mt-2 line-clamp-2 font-semibold leading-snug text-ink group-hover:text-primary",
            featured ? "text-xl md:text-2xl max-md:text-[15px]" : "text-base max-md:text-[15px]",
            "max-md:mt-1",
          )}
        >
          {post.title}
        </h3>

        {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-ink-muted max-md:hidden">{post.excerpt}</p> : null}

        <div className={cn("flex items-end justify-between gap-3 border-t border-line pt-2 text-xs text-ink-faint max-md:mt-auto max-md:border-0 max-md:pt-1", featured ? "mt-3" : "mt-auto")}>
          <span className="min-w-0 truncate">
            {post.author_name}
            {post.published_at ? <span> · {formatBlogDate(post.published_at)}</span> : null}
          </span>
          <span className="inline-flex flex-shrink-0 items-center gap-1 font-semibold text-primary max-md:hidden">
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
