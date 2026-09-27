import { safeHref } from "@/lib/safeUrl";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Lock, Download, Video } from "lucide-react";
import { getLearningTree, getLearningTopicPage } from "@/lib/learning";
import { createTopicLinkState } from "@/components/learning/Markdown";
import { LessonBlock } from "@/components/learning/LessonBlock";
import { buildTopicLinkIndex } from "@/lib/topicLinks";
import { isTemplatedGenerativeAiBody } from "@/lib/contentQuality";
import { lessonDescription } from "@/lib/metaDescription";
import { courseLanguage, lessonTitle } from "@/lib/seoTitles";
import { lessonFaqPairs } from "@/lib/lessonFaq";
import JsonLd from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, techArticleJsonLd } from "@/lib/seo";
import type { LearningTopicPage, LearningTree } from "@/lib/learning";
import { toOutline, findLesson } from "@/lib/courseOutline";
import { lessonToc, lessonReadingMinutes } from "@/lib/lessonToc";
import { Breadcrumb, EmptyState } from "@/components/ui";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { LessonShell } from "../../_components/LessonShell";
import { ReadingProgress } from "../../_components/ReadingProgress";
import { LessonComplete } from "../../_components/LessonComplete";
import { LearningBookmarkButton } from "./LearningBookmarkButton";
import { PremiumTopicContent } from "./PremiumTopicContent";
import { TopicPractice } from "./_components/TopicPractice";
import { TopicDiscovery } from "./_components/TopicDiscovery";
import { RelatedLessons } from "./_components/RelatedLessons";
import { RecordLessonVisit } from "./RecordLessonVisit";

export const revalidate = 86400;
export const dynamicParams = true;

// Returning [] (not the full topic list) still registers this route for ISR —
// on-demand renders are then full-route cached for `revalidate` seconds. The
// grid can hold 150+ topics; prerendering them all would run that many RPCs at
// build time. Raise this to `getLearningTopicParams()` (or a bounded slice)
// once build infra can absorb it.
export function generateStaticParams() {
  return [];
}

/** How many lessons in the course carry this exact short_description (1 = unique to this lesson). */
function shortDescriptionDuplicates(tree: LearningTree | null, shortDescription: string): number {
  const key = (shortDescription ?? "").trim().toLowerCase();
  if (!tree || !key) return 1;
  return tree.sections.reduce(
    (n, s) => n + s.topics.filter((t) => (t.short_description ?? "").trim().toLowerCase() === key).length,
    0,
  );
}

/** Meta description for a lesson — shared by generateMetadata and the TechArticle JSON-LD. */
function describeLesson(page: LearningTopicPage, tree: LearningTree | null): string {
  const { topic, grid, section } = page;
  return lessonDescription({
    topicTitle: topic.title,
    shortDescription: topic.short_description,
    shortDescriptionDuplicates: shortDescriptionDuplicates(tree, topic.short_description),
    language: courseLanguage(grid.slug, grid.name, topic.title),
    courseName: grid.name,
    sectionName: section.name,
    blocks: page.locked ? [] : page.contents,
    isPremium: topic.is_premium,
  });
}

export async function generateMetadata({
  params,
}: {
  params: { gridSlug: string; topicSlug: string };
}): Promise<Metadata> {
  const [page, tree] = await Promise.all([
    getLearningTopicPage(params.gridSlug, params.topicSlug),
    getLearningTree(params.gridSlug),
  ]);
  if (!page) return { title: "Topic not found", robots: { index: false, follow: false } };
  const { topic, grid } = page;
  const bodyText = page.contents.map((c) => c.body).join(" ").replace(/[#>*`_|\-]+/g, " ").trim();
  const title = lessonTitle({ topicTitle: topic.title, gridSlug: grid.slug, courseName: grid.name });
  const description = describeLesson(page, tree);
  const url = absoluteUrl(`/learning/${grid.slug}/${topic.slug}`);
  // Generative AI tutorial topics (migration 0069/041) are a mail-merge
  // template: the same filler paragraphs repeat verbatim regardless of the
  // topic's actual subject. Keep the page available to logged-in users, just
  // don't send it to search — one topic in this grid is genuinely original
  // and is left indexable, since this checks actual body content, not grid
  // membership.
  const isThinTemplate = isTemplatedGenerativeAiBody(bodyText);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // No `images` key: the route's opengraph-image.tsx (lesson title card) is
    // used — an explicit `images` here would shadow it.
    openGraph: { title, description, url, type: "article", siteName: BRAND.name },
    twitter: { card: "summary_large_image", title, description },
    robots: isThinTemplate ? { index: false, follow: true } : undefined,
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
  if (!tree) notFound();
  // The course exists but this lesson doesn't (renamed / removed by an admin,
  // or an old "Continue learning" link): land on the course, not a 404.
  if (!page) redirect(`/learning/${tree.grid.slug}`);
  const { topic, section, grid, locked, contents, prev, next } = page;
  // Internal-linking glossary for this page — built once from the already-
  // fetched grid tree (no extra query), shared across every content block's
  // <Markdown> call below so a given topic is only ever auto-linked once.
  const topicLinkIndex = buildTopicLinkIndex(tree, grid.slug, topic.slug);
  const topicLinkState = createTopicLinkState();

  const outline = toOutline(tree);
  const here = findLesson(outline, topic.slug);
  const sectionSlugs = here ? here.section.lessons.map((l) => l.slug) : [topic.slug];
  const nextSection = next ? findLesson(outline, next.slug)?.section.name : undefined;
  const toc = locked ? [] : lessonToc(contents);
  const minutes = !locked && contents.length > 0 ? lessonReadingMinutes(contents) : null;
  const lessonRef = {
    gridSlug: grid.slug,
    gridName: grid.name,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    sectionName: section.name,
  };
  const completeCard = (
    <LessonComplete
      variant="card"
      lesson={lessonRef}
      sectionSlugs={sectionSlugs}
      courseSlugs={outline.order}
      next={next ? { slug: next.slug, title: next.title, sectionName: nextSection } : null}
    />
  );

  const lessonPath = `/learning/${grid.slug}/${topic.slug}`;
  // FAQPage only for Q&A the server actually renders (never a locked lesson's withheld body).
  const faqs = locked ? [] : lessonFaqPairs(contents);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Learning", path: "/learning" },
          { name: grid.name, path: `/learning/${grid.slug}` },
          { name: topic.title, path: lessonPath },
        ])}
      />
      <JsonLd
        data={techArticleJsonLd({
          headline: topic.title,
          description: describeLesson(page, tree),
          path: lessonPath,
          courseName: grid.name,
          coursePath: `/learning/${grid.slug}`,
          sectionName: section.name,
          dateModified: topic.updated_at,
          imagePath: `${lessonPath}/opengraph-image`,
          isPremium: topic.is_premium,
        })}
      />
      {faqs.length > 0 ? <JsonLd data={faqJsonLd(faqs)} /> : null}
      <ReadingProgress targetId="lesson-article" />
      <LessonShell
        outline={outline}
        currentSlug={topic.slug}
        rail={toc.length >= 2 ? <ArticleToc items={toc} /> : undefined}
      >
        <RecordLessonVisit {...lessonRef} />
        <Breadcrumb
          className="mb-5"
          items={[
            { label: "Learning", href: "/learning" },
            { label: grid.name, href: `/learning/${grid.slug}` },
            { label: topic.title },
          ]}
        />

        <article id="lesson-article" className="max-w-[46rem]">
          <header>
            <p className="eyebrow">
              {section.name}
              {here ? (
                <span className="font-medium normal-case tracking-normal text-ink-faint">
                  {" "}
                  · Lesson {here.lesson.number} of {outline.total}
                </span>
              ) : null}
            </p>
            <h1 className="mt-3 font-display text-[1.9rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-[2.4rem]">
              {topic.title}
            </h1>
            {topic.short_description ? <p className="lede mt-3">{topic.short_description}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {minutes ? (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-surface px-3 text-[0.8rem] font-medium text-ink-muted">
                  <Clock className="h-4 w-4" aria-hidden /> {minutes} min read
                </span>
              ) : null}
              {topic.is_premium ? (
                <span className="inline-flex h-9 items-center gap-1 rounded-xl bg-warning/15 px-3 text-[0.8rem] font-semibold text-amber-800 dark:text-amber-300">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
                </span>
              ) : null}
              <LearningBookmarkButton topicId={topic.id} slugPath={`/learning/${grid.slug}/${topic.slug}`} />
              {!locked && (
                <LessonComplete
                  variant="compact"
                  lesson={lessonRef}
                  sectionSlugs={sectionSlugs}
                  courseSlugs={outline.order}
                  next={next ? { slug: next.slug, title: next.title, sectionName: nextSection } : null}
                />
              )}
            </div>
          </header>

          <hr className="my-8 border-line" />

          {locked ? (
            /* Server render (anon client) always locks a premium topic — the body
               is never in the initial HTML. This island re-checks with the
               visitor's real session and renders the content (and the
               "Mark as complete" card) for a premium member / admin. */
            <PremiumTopicContent
              gridSlug={grid.slug}
              topicSlug={topic.slug}
              loginNext={`/learning/${grid.slug}/${topic.slug}`}
              unlockedFooter={completeCard}
            />
          ) : contents.length === 0 ? (
            <EmptyState title="No content yet" subtitle="This topic's content is on its way — check back soon." />
          ) : (
            <>
              <div className="max-w-none text-[16.5px]">
                {contents.map((block) => (
                  <section key={block.id} className="mb-10">
                    <LessonBlock block={block} topicLinks={topicLinkIndex} linkState={topicLinkState} />
                    {(safeHref(block.file_url) || safeHref(block.video_url)) && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {safeHref(block.file_url) ? (
                          <a
                            href={safeHref(block.file_url) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost h-10 text-sm"
                          >
                            <Download className="h-4 w-4" aria-hidden /> Attachment
                          </a>
                        ) : null}
                        {safeHref(block.video_url) ? (
                          <a
                            href={safeHref(block.video_url) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost h-10 text-sm"
                          >
                            <Video className="h-4 w-4" aria-hidden /> Watch video
                          </a>
                        ) : null}
                      </div>
                    )}
                  </section>
                ))}
              </div>
              {completeCard}
            </>
          )}
        </article>

        <div className="max-w-[46rem]">
          {/* Topic-specific Mock Tests + Coding Problems (renders nothing when there are none) */}
          <TopicPractice gridSlug={grid.slug} topicSlug={topic.slug} />

          {/* 3–5 same-course related lessons (keyword + section match), from the already-fetched tree */}
          <RelatedLessons tree={tree} topicSlug={topic.slug} exclude={[prev?.slug, next?.slug]} />

          <nav className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="Lesson navigation">
            {prev ? (
              <Link
                href={`/learning/${grid.slug}/${prev.slug}`}
                className="card card-hover group flex flex-col p-4 text-left"
              >
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
                </span>
                <span className="mt-1 text-sm font-semibold text-ink group-hover:text-primary">{prev.title}</span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next ? (
              <Link
                href={`/learning/${grid.slug}/${next.slug}`}
                className="card card-hover group flex flex-col items-end p-4 text-right"
              >
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="mt-1 text-sm font-semibold text-ink group-hover:text-primary">{next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        {/* Internal-linking / discovery — Other Tutorials, Related Projects,
            Related Jobs, Latest Jobs, Other Learning Topics. Renders nothing
            when it has no real content for this topic. */}
        <TopicDiscovery gridSlug={grid.slug} gridName={grid.name} />
      </LessonShell>
    </>
  );
}
