import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, RefreshCw } from "lucide-react";
import {
  getBlogPost,
  getRelatedPosts,
  getAdjacentPosts,
  articleJsonLd,
  extractToc,
  extractFaqs,
  formatBlogDate,
  stripMarkdown,
} from "@/lib/blog";
import { Markdown, createTopicLinkState } from "@/components/learning/Markdown";
import { BLOG_TOPIC_LINKS } from "@/lib/blogLinks";
import { Breadcrumb } from "@/components/ui";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogImage } from "@/components/blog/BlogImage";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { ShareButtons } from "@/components/blog/ShareButtons";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { authoredDescription } from "@/lib/metaDescription";
import { plainTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";

// Best-effort CMS invalidation cannot guarantee immediate unpublish removal.
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const post = await getBlogPost(params.slug);
  if (!post) return completeSeoMetadata({ title: "Article not found", robots: { index: false, follow: false } }, { dynamicImage: true });

  const description = authoredDescription(post.seo_description || post.excerpt || stripMarkdown(post.content), post.title);
  const title = plainTitle(post.seo_title || post.title);
  const url = post.canonical_url || absoluteUrl(`/blog/${post.slug}`);
  const images = post.featured_image
    ? [{ url: post.featured_image.startsWith("http") ? post.featured_image : absoluteUrl(post.featured_image) }]
    : undefined;
  const keywords = post.seo_keywords || post.tags.join(", ") || undefined;

  return completeSeoMetadata({
    title: { absolute: title },
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      // A post with a featured image uses it; one without gets no `images`
      // key, so this route's opengraph-image.tsx (title card) is used instead.
      ...(images ? { images } : {}),
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  }, { dynamicImage: true });
}

export default async function BlogPostPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  const [related, adjacent] = await Promise.all([
    getRelatedPosts(post.id, post.category_name, 3),
    getAdjacentPosts(post.published_at),
  ]);

  const toc = extractToc(post.content);
  const faqs = extractFaqs(post.content);
  const url = absoluteUrl(`/blog/${post.slug}`);
  const publishedLabel = formatBlogDate(post.published_at);
  const updatedLabel = formatBlogDate(post.updated_at);
  const showUpdated =
    updatedLabel &&
    updatedLabel !== publishedLabel &&
    new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 36 * 3600 * 1000;

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      {faqs.length > 0 ? <JsonLd data={faqJsonLd(faqs)} /> : null}

      <div className="container-page py-8 md:py-10">
        <div className="mx-auto flex w-full justify-center gap-8">
          <article className="min-w-0 w-full max-w-3xl leading-relaxed">
            <Breadcrumb items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

            <header className="mt-5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                {post.category_name ? (
                  <Link
                    href={post.category_slug ? `/blog?category=${post.category_slug}` : "/blog"}
                    className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 font-semibold uppercase tracking-wide text-primary hover:bg-primary-100"
                  >
                    {post.category_name}
                  </Link>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {post.title}
              </h1>
              {post.excerpt ? <p className="mt-3 text-lg text-ink-muted">{post.excerpt}</p> : null}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3 text-sm text-ink-muted">
                <span className="font-medium text-ink">{post.author_name}</span>
                {publishedLabel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-ink-faint" aria-hidden />
                    <time dateTime={post.published_at}>{publishedLabel}</time>
                  </span>
                ) : null}
                {showUpdated ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-ink-faint" aria-hidden />
                    Updated <time dateTime={post.updated_at}>{updatedLabel}</time>
                  </span>
                ) : null}
                {post.reading_time ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-ink-faint" aria-hidden />
                    {post.reading_time} min read
                  </span>
                ) : null}
              </div>
            </header>

            {post.featured_image ? (
              <BlogImage
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                priority
                sizes="(min-width: 1024px) 704px, 100vw"
                className="mt-6 aspect-[16/9] rounded-xl border border-line"
              />
            ) : null}

            {/* Mobile TOC */}
            {toc.length >= 3 ? (
              <details className="mt-6 rounded-xl border border-line bg-surface p-4 xl:hidden">
                <summary className="cursor-pointer text-sm font-semibold text-ink">On this page</summary>
                <ArticleToc items={toc} className="mt-3" />
              </details>
            ) : null}

            <div className="mt-8">
              <Markdown
                source={post.content}
                headingLevelOffset={0}
                topicLinks={BLOG_TOPIC_LINKS}
                linkState={createTopicLinkState(3)}
              />
            </div>

            {/* Tags */}
            {post.tags.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/blog?tag=${encodeURIComponent(t)}`}
                    className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:text-primary"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <ShareButtons url={url} title={post.title} />
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Blog
              </Link>
            </div>

            {/* Prev / Next */}
            {adjacent.prev || adjacent.next ? (
              <nav
                className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-6"
                aria-label="More articles"
              >
                {adjacent.prev ? (
                  <Link
                    href={`/blog/${adjacent.prev.slug}`}
                    className="group flex flex-1 flex-col rounded-xl border border-line p-3 text-left hover:border-primary/30 hover:bg-surface"
                  >
                    <span className="flex items-center gap-1 text-xs text-ink-faint">
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
                    </span>
                    <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">
                      {adjacent.prev.title}
                    </span>
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
                {adjacent.next ? (
                  <Link
                    href={`/blog/${adjacent.next.slug}`}
                    className="group flex flex-1 flex-col items-end rounded-xl border border-line p-3 text-right hover:border-primary/30 hover:bg-surface"
                  >
                    <span className="flex items-center gap-1 text-xs text-ink-faint">
                      Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">
                      {adjacent.next.title}
                    </span>
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
              </nav>
            ) : null}

            {/* Related */}
            {related.length > 0 ? (
              <section className="mt-12">
                <h2 className="text-lg font-bold text-ink">Related articles</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-5">
                  {related.map((p) => (
                    <BlogCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          {/* Desktop sticky TOC */}
          {toc.length >= 3 ? (
            <aside className="hidden w-56 flex-shrink-0 xl:block">
              <div className="sticky top-24">
                <ArticleToc items={toc} />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
