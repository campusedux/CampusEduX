import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, FileText, LayoutGrid, Search, SearchX } from "lucide-react";
import { getLearningGrids, searchLearning } from "@/lib/learning";
import type { LearningGridCard } from "@/lib/learning";
import { Badge, EmptyState, SectionHeader, Skeleton } from "@/components/ui";
import { CourseCard } from "@/components/learning/CourseCard";
import JsonLd from "@/components/JsonLd";
import { cn } from "@/lib/cn";
import { absoluteUrl, courseListJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { ContinueLearningRow } from "./_components/ContinueLearningRow";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Learning",
  description:
    "Free, structured learning resources on CampusEduX — tutorials and documentation across programming, DSA, web development, databases and more.",
  alternates: { canonical: absoluteUrl("/learning") },
  openGraph: { title: "Learning · CampusEduX", url: absoluteUrl("/learning"), type: "website", images: [DEFAULT_OG_IMAGE] },
};

type Access = "free" | "premium";
type SP = { q?: string; access?: string };

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/** Lesson/course search results — streamed behind a skeleton. */
async function SearchResults({ q }: { q: string }) {
  const hits = await searchLearning(q, 30);
  return (
    <section className="mt-8" aria-labelledby="search-results-title">
      <h2 id="search-results-title" className="text-sm font-semibold text-ink-muted">
        {hits.length} result{hits.length === 1 ? "" : "s"} for “{q}”
      </h2>
      {hits.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title="No matches"
          subtitle="Try a shorter or different word, or browse the courses below."
        />
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          {hits.map((h, i) => (
            <li key={`${h.grid_slug}-${h.topic_slug ?? "grid"}-${i}`}>
              <Link
                href={h.kind === "grid" ? `/learning/${h.grid_slug}` : `/learning/${h.grid_slug}/${h.topic_slug}`}
                className="group flex items-start gap-3 p-4 transition-colors hover:bg-surface"
              >
                <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  {h.kind === "grid" ? (
                    <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink group-hover:text-primary">{h.title}</span>
                    {h.kind === "grid" ? <Badge tone="primary">Course</Badge> : null}
                    {h.is_premium ? <Badge tone="premium">Premium</Badge> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-faint">
                    {h.grid_name}
                    {h.section_name ? ` · ${h.section_name}` : ""}
                  </span>
                  {h.snippet ? <span className="mt-1 block line-clamp-2 text-sm text-ink-muted">{h.snippet}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-hidden>
      <Skeleton className="h-4 w-40" />
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseGrid({ courses }: { courses: LearningGridCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {courses.map((g) => (
        <CourseCard key={g.id} course={g} compactOnMobile />
      ))}
    </div>
  );
}

/**
 * Learning hub, designed around the real catalogue (a handful of deep
 * courses): search · Continue learning (signed-in) · Featured · All courses,
 * with a Free / Premium filter. A catalogue section with fewer than two items
 * is not shown, and the filter only appears when both kinds exist.
 */
export default async function LearningIndexPage({ searchParams }: { searchParams: SP }) {
  const q = searchParams.q?.trim() ?? "";
  const access: Access | null = searchParams.access === "free" || searchParams.access === "premium" ? searchParams.access : null;
  const grids = await getLearningGrids();

  const lessonTotal = grids.reduce((n, g) => n + (g.topic_count ?? 0), 0);
  const showAccess = grids.some((g) => !g.is_premium) && grids.some((g) => g.is_premium);
  const visible = access && showAccess ? grids.filter((g) => (access === "premium" ? g.is_premium : !g.is_premium)) : grids;
  const featured = visible.filter((g) => g.is_featured);

  const tabHref = (a: Access | null) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (a) p.set("access", a);
    const s = p.toString();
    return s ? `/learning?${s}` : "/learning";
  };

  return (
    <div className="page-shell">
      {grids.length > 0 ? (
        <JsonLd
          data={courseListJsonLd(grids.map((g) => ({ name: g.name, description: g.description, path: `/learning/${g.slug}` })))}
        />
      ) : null}

      <header className="relative overflow-hidden rounded-3xl border border-line bg-card px-5 py-8 shadow-card sm:px-10 sm:py-12">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,#000_15%,transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Learning</p>
          <h1 className="h-hero mt-2">Learn at your own pace</h1>
          {grids.length > 0 && (
            <p className="lede mt-3">
              {grids.length} in-depth course{grids.length === 1 ? "" : "s"} · {fmt(lessonTotal)} lessons with practice
              questions and mock tests.
            </p>
          )}
          <form action="/learning" method="get" role="search" className="mt-6 flex gap-2">
            {access ? <input type="hidden" name="access" value={access} /> : null}
            <label className="relative flex-1">
              <span className="sr-only">Search courses and lessons</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search a topic, e.g. joins, loops, OOP…"
                className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-4 focus:ring-primary/15 focus:bg-card"
              />
            </label>
            <button type="submit" className="btn-primary h-12 px-5">
              Search
            </button>
          </form>
          {q ? (
            <Link href={tabHref(access)} className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-700">
              Clear search
            </Link>
          ) : null}
        </div>
      </header>

      {q ? (
        <Suspense key={q} fallback={<SearchSkeleton />}>
          <SearchResults q={q} />
        </Suspense>
      ) : null}

      {!q && <ContinueLearningRow courses={grids.map(({ slug, name, topic_count }) => ({ slug, name, topic_count }))} />}

      {grids.length === 0 ? (
        <section className="mt-10">
          <h2 className="sr-only">All learning resources</h2>
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            subtitle="Courses appear here as soon as they are published from the CampusEduX admin panel."
          />
        </section>
      ) : (
        <>
          {!q && featured.length >= 2 && (
            <section className="mt-12" aria-labelledby="featured-title">
              <SectionHeader id="featured-title" eyebrow="Hand-picked" title="Featured courses" />
              <CourseGrid courses={featured} />
            </section>
          )}

          <section className="mt-12" aria-labelledby="all-courses-title">
            <SectionHeader
              id="all-courses-title"
              title={access === "premium" ? "Premium courses" : access === "free" ? "Free courses" : "All courses"}
              action={
                showAccess ? (
                  <nav aria-label="Filter by access" className="flex gap-1 rounded-xl bg-surface p-1">
                    {([null, "free", "premium"] as const).map((a) => (
                      <Link
                        key={a ?? "all"}
                        href={tabHref(a)}
                        aria-current={access === a ? "page" : undefined}
                        className={cn(
                          "h-9 rounded-lg px-3.5 text-sm font-semibold leading-9 transition",
                          access === a ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink",
                        )}
                      >
                        {a === null ? "All" : a === "free" ? "Free" : "Premium"}
                      </Link>
                    ))}
                  </nav>
                ) : undefined
              }
            />
            {visible.length === 0 ? (
              <EmptyState icon={BookOpen} title="Nothing here yet" subtitle="No courses match this filter right now." />
            ) : (
              <CourseGrid courses={visible} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
