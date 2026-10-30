import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, FileText, LayoutGrid, SearchX } from "lucide-react";
import { getLearningGrids, searchLearning } from "@/lib/learning";
import type { LearningGridCard } from "@/lib/learning";
import { Badge, EmptyState, PageHeader, SearchBar, SectionHeader, Skeleton, Chip, ChipRow, ListLoading } from "@/components/ui";
import { CourseCard } from "@/components/learning/CourseCard";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, courseListJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import { ContinueLearningRow } from "./_components/ContinueLearningRow";
import { PopularTopics } from "./_components/PopularTopics";

export const revalidate = 21600;

// Names only courses that exist on the live /learning index (2026-09-27):
// Java, Python, DBMS & SQL, Spring Boot, AI/ML Notes and Generative AI.
const TITLE = "Programming Tutorials: Java, Python, SQL & More | CampusEduX";
const DESCRIPTION =
  "Structured programming tutorials on CampusEduX — Java, Python, DBMS & SQL, Spring Boot, AI/ML and Generative AI, split into short lessons with examples.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/learning") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/learning"),
    type: "website",
    siteName: BRAND.name,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

type Access = "free" | "premium";
type SP = { q?: string; access?: string; [key: string]: string | string[] | undefined };

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/** Lesson/course search results — streamed behind a skeleton. */
async function SearchResults({ q }: { q: string }) {
  const hits = await searchLearning(q, 30);
  return (
    <section className="mt-5 sm:mt-8" aria-labelledby="search-results-title">
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
        <ul className="list-enter mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          {hits.map((h, i) => (
            <li key={`${h.grid_slug}-${h.topic_slug ?? "grid"}-${i}`}>
              <Link
                href={h.kind === "grid" ? `/learning/${h.grid_slug}` : `/learning/${h.grid_slug}/${h.topic_slug}`}
                className="group flex min-w-0 items-start gap-3 p-4 transition-colors hover:bg-surface [overflow-wrap:anywhere]"
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
    <div className="mt-6 space-y-3 sm:mt-8" aria-hidden>
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
    <div className="list-enter grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
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
async function LearningContent({ searchParams }: { searchParams: SP }) {
  const q = searchParams.q?.trim() ?? "";
  const access: Access | null = searchParams.access === "free" || searchParams.access === "premium" ? searchParams.access : null;
  const grids = await getLearningGrids();

  const lessonTotal = grids.reduce((n, g) => n + (g.topic_count ?? 0), 0);
  const showAccess = grids.some((g) => !g.is_premium) && grids.some((g) => g.is_premium);
  const visible = access && showAccess ? grids.filter((g) => (access === "premium" ? g.is_premium : !g.is_premium)) : grids;
  const featured = visible.filter((g) => g.is_featured);

  const clearParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "q" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) clearParams.append(key, item);
  }
  const clearQuery = clearParams.toString();
  const clearSearchHref = clearQuery ? `/learning?${clearQuery}` : "/learning";

  const tabHref = (a: Access | null) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (a) p.set("access", a);
    const s = p.toString();
    return s ? `/learning?${s}` : "/learning";
  };

  return (
    <div className="mobile-discovery page-shell">
      <JsonLd data={breadcrumbJsonLd([{ name: "Learning", path: "/learning" }])} />
      {grids.length > 0 ? (
        <JsonLd
          data={courseListJsonLd(grids.map((g) => ({ name: g.name, description: g.description, path: `/learning/${g.slug}` })))}
        />
      ) : null}

      <div className="min-w-0">
        <PageHeader title="Learning" icon={BookOpen} iconClassName="text-accent-teal" caption={`${grids.length} course${grids.length === 1 ? "" : "s"} · ${fmt(lessonTotal)} lessons`} />
        <SearchBar
          action="/learning"
          label="Search courses and lessons"
          defaultValue={q}
          placeholder="Search a topic, e.g. joins, loops, OOP…"
          hiddenParams={{ access: access ?? undefined }}
          className="mt-3 max-w-2xl"
        />
        {q ? (
          <Link href={clearSearchHref} className="hit-44 mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-700">
            Clear search
          </Link>
        ) : null}
      </div>

      {showAccess && (
        <ChipRow label="Filter by access" sticky className="mt-3">
          {([null, "free", "premium"] as const).map((a) => (
            <Chip key={a ?? "all"} href={tabHref(a)} active={access === a}>{a === null ? "All" : a === "free" ? "Free" : "Premium"}</Chip>
          ))}
        </ChipRow>
      )}

      {q ? (
        <Suspense key={q} fallback={<SearchSkeleton />}>
          <SearchResults q={q} />
        </Suspense>
      ) : null}

      {!q && <ContinueLearningRow courses={grids.map(({ slug, name, topic_count }) => ({ slug, name, topic_count }))} />}

      {grids.length === 0 ? (
        <section className="mt-5 sm:mt-8">
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
            <section className="mt-5 sm:mt-10" aria-labelledby="featured-title">
              <SectionHeader id="featured-title" eyebrow="Hand-picked" title="Featured courses" />
              <CourseGrid courses={featured} />
            </section>
          )}

          <section className="mt-5 sm:mt-10" aria-labelledby="all-courses-title">
            <SectionHeader
              id="all-courses-title"
              title={access === "premium" ? "Premium courses" : access === "free" ? "Free courses" : "All courses"}

            />
            {visible.length === 0 ? (
              <EmptyState icon={BookOpen} title="Nothing here yet" subtitle="No courses match this filter right now." />
            ) : (
              <CourseGrid courses={visible} />
            )}
          </section>

          {/* 20 editorial lesson links across courses (see PopularTopics) */}
          {!q && <PopularTopics grids={grids} />}
        </>
      )}
    </div>
  );
}

// Keep streaming local to this index page: ancestor loading routes change nested 404 status.
export default function LearningPage({ searchParams }: { searchParams: SP }) {
  return <Suspense fallback={<ListLoading title="Learning" />}><LearningContent searchParams={searchParams} /></Suspense>;
}
