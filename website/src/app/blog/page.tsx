import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Rss } from "lucide-react";
import {
  getBlogPage,
  getBlogCategories,
  getLatestPosts,
  BLOG_PAGE_SIZE,
  FEATURED_COUNT,
} from "@/lib/blog";
import type { BlogPostCard } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { EmptyState, Pagination, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const HERO_TITLE = "Insights, Ideas & Technology";
const DESCRIPTION =
  "Practical, plain-English articles on artificial intelligence, technology, programming and careers — written by the CampusEduX team for students and developers.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: `Blog · ${BRAND.name}`,
    description: DESCRIPTION,
    url: absoluteUrl("/blog"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: `Blog · ${BRAND.name}`, description: DESCRIPTION },
};

type SP = { page?: string; q?: string; category?: string; tag?: string };

const chipCls = (active: boolean) =>
  cn(
    "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
    active
      ? "border-primary bg-primary text-white"
      : "border-line bg-white text-ink-muted hover:border-primary/40 hover:text-ink",
  );

export default async function BlogIndexPage({ searchParams }: { searchParams: SP }) {
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const q = searchParams.q?.trim() || undefined;
  const category = searchParams.category?.trim() || undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const isFiltered = Boolean(q || category || tag);
  const showFeatured = page === 1 && !isFiltered;

  const [{ posts, total, missing }, categories, featured] = await Promise.all([
    getBlogPage({ page, q, category, tag }),
    getBlogCategories(),
    // Featured = the newest published posts, up to FEATURED_COUNT (6). It is NOT
    // the `is_featured` flag and never a single hero post — every other
    // published post still appears in "Latest articles" / on later pages.
    showFeatured ? getLatestPosts(FEATURED_COUNT) : Promise.resolve<BlogPostCard[]>([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const activeCategory = categories.find((c) => c.slug === category);

  // `getLatestPosts` and `getBlogPage` share one ordering, so `featured` is the
  // leading slice of page 1 — drop just those ids and keep every other post.
  const featuredIds = new Set(featured.map((p) => p.id));
  const latest = showFeatured ? posts.filter((p) => !featuredIds.has(p.id)) : posts;

  // Only hide the "Latest" block in the one case where it would be empty *and*
  // pointless: the unfiltered front page with ≤ FEATURED_COUNT posts total. Any
  // filtered / deep-page view keeps the section so its "no results" state shows.
  const hideLatest = showFeatured && latest.length === 0;

  const latestHeading = q
    ? `${total} result${total === 1 ? "" : "s"} for “${q}”`
    : activeCategory
      ? activeCategory.name
      : tag
        ? `#${tag}`
        : "Latest articles";

  const [lead, ...restFeatured] = featured;

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <JsonLd data={breadcrumbJsonLd([{ name: "Blog", path: "/blog" }])} />

      <PageHeader eyebrow="Blog" title={HERO_TITLE} />

      {missing ? (
        <EmptyState
          className="mt-8"
          icon={Newspaper}
          title="No articles yet"
          subtitle="Blog posts appear here as soon as they are published from the CampusEduX admin panel."
        />
      ) : (
        <>
          {categories.length > 0 ? (
            <nav aria-label="Blog categories" className="mt-6 flex flex-wrap gap-2">
              <Link href="/blog" className={chipCls(!category && !tag && !q)}>
                All
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/blog?category=${c.slug}`} className={chipCls(category === c.slug)}>
                  {c.name}
                </Link>
              ))}
            </nav>
          ) : null}

          {showFeatured && featured.length > 0 ? (
            <section className="mt-10">
              <h2 className="h-section">Featured articles</h2>
              <div className="mt-5 space-y-6">
                {lead ? <BlogCard post={lead} priority featured /> : null}
                {restFeatured.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {restFeatured.map((p, i) => (
                      <BlogCard key={p.id} post={p} priority={i < 2} />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {hideLatest ? null : (
            <section className="mt-12">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="h-section">{latestHeading}</h2>
                {isFiltered ? (
                  <Link
                    href="/blog"
                    className="whitespace-nowrap text-sm font-semibold text-primary hover:text-primary-700"
                  >
                    Clear filters
                  </Link>
                ) : null}
              </div>

              {latest.length === 0 ? (
                <EmptyState
                  className="mt-6"
                  icon={Rss}
                  title="Nothing here yet"
                  subtitle={
                    isFiltered
                      ? "No published articles match this search. Try a different word or category."
                      : "The first articles are on their way — check back soon."
                  }
                />
              ) : (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {latest.map((p, i) => (
                    <BlogCard key={p.id} post={p} priority={!showFeatured && i < 3} />
                  ))}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} basePath="/blog" params={{ q, category, tag }} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
