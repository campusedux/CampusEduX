import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Rss } from "lucide-react";
import {
  getBlogPage,
  getBlogCategories,
  BLOG_PAGE_SIZE,
  FEATURED_COUNT,
} from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { EmptyState, Pagination, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, listingCanonical, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { parsePage } from "@/lib/marketplace";
import { BRAND } from "@/lib/brand";

// Admin invalidation is best-effort; publication changes require a fresh render.
export const revalidate = 0;

const HERO_TITLE = "Insights, Ideas & Technology";
const DESCRIPTION =
  "Practical, plain-English articles on artificial intelligence, technology, programming and careers — written by the CampusEduX team for students and developers.";

export async function generateMetadata({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);
  const q = searchParams.q?.trim() || undefined;
  const category = searchParams.category?.trim() || undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const { posts } = await getBlogPage({ page, q, category, tag });
  const url = listingCanonical("/blog", page, Boolean(q || category || tag));
  return {
    title: "Blog: AI, Programming & Career Articles",
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: `Blog: AI, Programming & Career Articles | ${BRAND.name}`,
      description: DESCRIPTION,
      url,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `Blog: AI, Programming & Career Articles | ${BRAND.name}`,
      description: DESCRIPTION,
    },
    robots: posts.length === 0 ? { index: false, follow: true } : undefined,
  };
}

type SP = { page?: string; q?: string; category?: string; tag?: string };

const chipCls = (active: boolean) =>
  cn(
    "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition",
    active
      ? "border-primary bg-primary text-white"
      : "border-line bg-card text-ink-muted hover:border-primary/40 hover:text-ink",
  );

export default async function BlogIndexPage({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }) {
  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);
  const q = searchParams.q?.trim() || undefined;
  const category = searchParams.category?.trim() || undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const isFiltered = Boolean(q || category || tag);
  const showFeatured = page === 1 && !isFiltered;

  const [{ posts, total, missing }, categories] = await Promise.all([
    getBlogPage({ page, q, category, tag }),
    getBlogCategories(),
  ]);
  // Featured uses the same ordering as page 1; reuse those cards instead of
  // issuing another read for its leading six rows.
  const featured = showFeatured ? posts.slice(0, FEATURED_COUNT) : [];

  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const activeCategory = categories.find((c) => c.slug === category);

  // Drop just the featured ids and keep every other post.
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
    <div className="page-shell">
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
            <nav aria-label="Blog categories" className="mt-4 flex flex-wrap gap-2 max-md:-mx-4 max-md:flex-nowrap max-md:snap-x max-md:overflow-x-auto max-md:px-4 mobile-scrollbar-hide">
              <Link href="/blog" className={cn(chipCls(!category && !tag && !q), "max-md:shrink-0 max-md:snap-start")}>
                All
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/blog?category=${c.slug}`} className={cn(chipCls(category === c.slug), "max-md:shrink-0 max-md:snap-start")}>
                  {c.name}
                </Link>
              ))}
            </nav>
          ) : null}

          {showFeatured && featured.length > 0 ? (
            <section className="mt-8">
              <h2 className="h-section">Featured articles</h2>
              <div className="mt-4 space-y-5 max-md:space-y-3">
                {lead ? <BlogCard post={lead} priority featured /> : null}
                {/* Adaptive so a leftover card never sits in 1/3 width next to
                    empty space: 1 → full-width horizontal card like the lead,
                    2 → two equal columns, 3+ → three columns (2 on tablet). */}
                {restFeatured.length === 1 ? (
                  <BlogCard post={restFeatured[0]} priority featured />
                ) : restFeatured.length > 1 ? (
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 max-md:gap-3",
                      restFeatured.length >= 3 && "xl:grid-cols-3 2xl:grid-cols-4",
                    )}
                  >
                    {restFeatured.map((p, i) => (
                      <BlogCard key={p.id} post={p} priority={i < 2} />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {hideLatest ? null : (
            <section className="mt-10 max-md:mt-8">
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
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4 max-md:mt-4 max-md:gap-3">
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
