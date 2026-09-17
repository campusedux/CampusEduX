import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Lock, Download, Video } from "lucide-react";
import { getLearningTree, getLearningTopicPage } from "@/lib/learning";
import { Markdown } from "@/components/learning/Markdown";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { DocsShell } from "../../_components/DocsShell";
import { EmptyState } from "@/components/ui";
import { LearningBookmarkButton } from "./LearningBookmarkButton";
import { PremiumTopicContent } from "./PremiumTopicContent";
import { TopicPractice } from "./_components/TopicPractice";
import { TopicDiscovery } from "./_components/TopicDiscovery";

export const revalidate = 300;
export const dynamicParams = true;

// Returning [] (not the full topic list) still registers this route for ISR —
// on-demand renders are then full-route cached for `revalidate` seconds. The
// grid can hold 150+ topics; prerendering them all would run that many RPCs at
// build time. Raise this to `getLearningTopicParams()` (or a bounded slice)
// once build infra can absorb it.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { gridSlug: string; topicSlug: string };
}): Promise<Metadata> {
  const page = await getLearningTopicPage(params.gridSlug, params.topicSlug);
  if (!page) return { title: "Topic not found", robots: { index: false, follow: false } };
  const { topic, grid } = page;
  const bodyText = page.contents.map((c) => c.body).join(" ").replace(/[#>*`_|\-]+/g, " ").trim();
  const description = (topic.short_description || bodyText || `${topic.title} — ${grid.name} on CampusEduX.`).slice(0, 155);
  const url = absoluteUrl(`/learning/${grid.slug}/${topic.slug}`);
  return {
    title: `${topic.title} · ${grid.name}`,
    description,
    alternates: { canonical: url },
    openGraph: { title: topic.title, description, url, type: "article", images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary", title: topic.title, description },
  };
}

export default async function TopicPage({
  params,
}: {
  params: { gridSlug: string; topicSlug: string };
}) {
  const [tree, page] = await Promise.all([
    getLearningTree(params.gridSlug),
    getLearningTopicPage(params.gridSlug, params.topicSlug),
  ]);
  if (!tree || !page) notFound();
  const { topic, section, grid, locked, contents, prev, next } = page;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Learning", path: "/learning" },
          { name: grid.name, path: `/learning/${grid.slug}` },
          { name: topic.title, path: `/learning/${grid.slug}/${topic.slug}` },
        ])}
      />
      <DocsShell tree={tree} gridSlug={grid.slug}>
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-faint">
          <Link href="/learning" className="hover:text-ink">
            Learning
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link href={`/learning/${grid.slug}`} className="hover:text-ink">
            {grid.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-ink-faint">{section.name}</span>
        </nav>

        <article>
          <header>
            <h1 className="text-3xl font-bold text-ink">{topic.title}</h1>
            {topic.short_description ? <p className="mt-3 text-ink-muted">{topic.short_description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <LearningBookmarkButton topicId={topic.id} slugPath={`/learning/${grid.slug}/${topic.slug}`} />
              {topic.is_premium ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
                </span>
              ) : null}
            </div>
          </header>

          <hr className="my-6 border-line" />

          {locked ? (
            /* Server render (anon client) always locks a premium topic — the body
               is never in the initial HTML. This island re-checks with the
               visitor's real session and renders the content for a premium
               member / admin. */
            <PremiumTopicContent
              gridSlug={grid.slug}
              topicSlug={topic.slug}
              loginNext={`/learning/${grid.slug}/${topic.slug}`}
            />
          ) : contents.length === 0 ? (
            <EmptyState title="No content yet" subtitle="This topic's content is on its way — check back soon." />
          ) : (
            <div className="max-w-none">
              {contents.map((block) => (
                <section key={block.id} className="mb-8">
                  {block.heading ? <h2 className="mb-3 text-xl font-bold text-ink">{block.heading}</h2> : null}
                  {block.content_format === "plain" ? (
                    <p className="whitespace-pre-line leading-7 text-ink-muted">{block.body}</p>
                  ) : (
                    <Markdown source={block.body} />
                  )}
                  {(block.file_url || block.video_url) && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {block.file_url ? (
                        <a
                          href={block.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface"
                        >
                          <Download className="h-4 w-4" aria-hidden /> Attachment
                        </a>
                      ) : null}
                      {block.video_url ? (
                        <a
                          href={block.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface"
                        >
                          <Video className="h-4 w-4" aria-hidden /> Watch video
                        </a>
                      ) : null}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </article>

        {/* Topic-specific Mock Tests + Coding Problems (renders nothing when there are none) */}
        <TopicPractice gridSlug={grid.slug} topicSlug={topic.slug} />

        <nav className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-6" aria-label="Topic navigation">
          {prev ? (
            <Link
              href={`/learning/${grid.slug}/${prev.slug}`}
              className="group flex flex-1 flex-col rounded-xl border border-line p-3 text-left hover:border-primary/30 hover:bg-surface"
            >
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
              </span>
              <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">{prev.title}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/learning/${grid.slug}/${next.slug}`}
              className="group flex flex-1 flex-col items-end rounded-xl border border-line p-3 text-right hover:border-primary/30 hover:bg-surface"
            >
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">{next.title}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>

        {/* Internal-linking / discovery — Other Tutorials, Related Projects,
            Related Jobs, Latest Jobs, Other Learning Topics. Renders nothing
            when it has no real content for this topic. */}
        <TopicDiscovery gridSlug={grid.slug} gridName={grid.name} />
      </DocsShell>
    </>
  );
}
