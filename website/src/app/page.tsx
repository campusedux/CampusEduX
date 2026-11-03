import { completeSeoMetadata } from "@/lib/seo";
import { safeHref } from "@/lib/safeUrl";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import JobCard, { JobCardData } from "@/components/JobCard";
import { SectionHeader, Reveal } from "@/components/ui";
import { HomeHero } from "@/components/home/HomeHero";
import { ContinueLearningRow } from "./learning/_components/ContinueLearningRow";
import { HomePersonal } from "@/components/home/HomePersonal";
import { CustomProjectPromo } from "@/components/home/CustomProjectPromo";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { PopularCourses } from "@/components/home/PopularCourses";
import { PlacementPrep } from "@/components/home/PlacementPrep";
import { Testimonials, type TestimonialRow } from "@/components/home/Testimonials";
import { PremiumReferralCta } from "@/components/home/PremiumReferralCta";
import { BlogCard } from "@/components/blog/BlogCard";
import { getLatestPosts } from "@/lib/blog";
import type { BlogPostCard } from "@/lib/blog";
import { getLearningGrids } from "@/lib/learning";
import { getPracticeCategories } from "@/lib/practice";
import { getInterviewCategories } from "@/lib/interviewQuestions";
import { inWindow } from "@/lib/home";
import { getCachedHomeData } from "@/lib/cache";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

export const revalidate = 0; // Publication changes must be checked on each render.

interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  target_url: string | null;
}

// Per-request memo (shared by generateMetadata + the page) over the
// fresh public rows in lib/cache.ts.
const getHomeData = cache(async () => {
  const raw = await getCachedHomeData();
  const activeBanner = raw.banners.find((b) => inWindow(b.starts_at, b.ends_at)) ?? null;
  return {
    trending: raw.trending as ProjectCardData[],
    jobs: raw.jobs as JobCardData[],
    testimonials: raw.testimonials as TestimonialRow[],
    faqs: raw.faqs as FaqRow[],
    banner: activeBanner
      ? {
          id: activeBanner.id,
          title: activeBanner.title,
          subtitle: activeBanner.subtitle,
          image_url: activeBanner.image_url,
          target_url: activeBanner.target_url,
        }
      : (null as HomeBanner | null),
  };
});

type FaqRow = { id: string; question: string; answer: string };

export async function generateMetadata(): Promise<Metadata> {
  const { banner } = await getHomeData();
  return completeSeoMetadata({
    title: { absolute: "CampusEduX: Projects, Jobs & Placement Prep" },
    description: "Explore student projects, fresher jobs, tutorials, coding practice and resume tools on CampusEduX.",
    // Declared here, not in the root layout, so pages without their own
    // canonical (404s, redirects) never inherit the homepage's.
    alternates: { canonical: "/" },
    openGraph: {
      title: "CampusEduX: Projects, Jobs & Placement Prep",
      description: "Explore student projects, fresher jobs, tutorials, coding practice and resume tools on CampusEduX.",
      images: safeHref(banner?.image_url) ? [{ url: safeHref(banner?.image_url) as string }] : [DEFAULT_OG_IMAGE],
    },
  });
}

async function HomeContent() {
  const [{ trending, jobs, testimonials, faqs, banner }, latestPosts, grids, practiceCategories, interviewCategories] =
    await Promise.all([
      getHomeData(),
      // Public cards only; article bodies stay out of the home payload.
      getLatestPosts(3),
      getLearningGrids(),
      getPracticeCategories(),
      // Optional home discovery may be omitted; the interview hub must surface failures.
      getInterviewCategories().catch(() => []),
    ]);
  const posts = latestPosts as BlogPostCard[];

  // Trust numbers — only real, live catalogue counts (a zero is hidden by the hero).
  const lessonCount = grids.reduce((n, g) => n + (g.topic_count ?? 0), 0);
  const problemCount = practiceCategories.reduce((n, c) => n + (c.problem_count ?? 0), 0);
  const interviewTopicCount = interviewCategories.reduce((n, c) => n + (c.topic_count ?? 0), 0);
  const stats = [
    { value: grids.length, label: grids.length === 1 ? "course" : "courses" },
    { value: lessonCount, label: "lessons" },
    { value: problemCount, label: "coding problems" },
    { value: interviewTopicCount, label: "interview topics" },
  ];
  const featuredFirst = [...grids].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

  return (
    <div className="home-page pb-6">
      {/* 1 · Hero — first for every visitor (server-rendered, crawlable, LCP). */}
      <HomeHero
        stats={stats}
        courses={featuredFirst.slice(0, 3).map(({ slug, name, topic_count }) => ({ slug, name, topic_count }))}
      />

      <div className="container-page">
        <ContinueLearningRow courses={grids.map(({ slug, name, topic_count }) => ({ slug, name, topic_count }))} />
      </div>
      <Reveal>
        <ModuleGrid />
      </Reveal>
      <PopularCourses courses={grids} />

      {/* Admin `banners` row (placement 'home') — shown as a promo card under the hero. */}
      {banner && (
        <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-label="Announcement">
          <Link
            href={safeHref(banner.target_url) ?? "/projects"}
            className="card card-hover group grid items-center gap-4 overflow-hidden p-4 md:gap-5 md:p-5 lg:grid-cols-2"
          >
            <div>
              <h2 className="h-section">{banner.title}</h2>
              {banner.subtitle && <p className="lede mt-2">{banner.subtitle}</p>}
              <span className="btn-primary mt-3">
                Explore <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
            {safeHref(banner.image_url) && (
              <div className="relative h-32 overflow-hidden rounded-xl bg-primary-50 md:h-40">
                <Image
                  src={safeHref(banner.image_url) ?? ""}
                  alt=""
                  fill
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>
            )}
          </Link>
        </section>
      )}

      {/* 3 · Custom Project promo banner */}
      <CustomProjectPromo />

      {/* Keep the personalized dashboard; the resume card is already above. */}
      <HomePersonal
        showContinue={false}
        courses={grids.map(({ slug, name, topic_count, is_featured, is_premium }) => ({ slug, name, topic_count, is_featured, is_premium }))}
        jobs={jobs.slice(0, 3)}
      />

      {/* 6 · Latest jobs */}
      {jobs.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-jobs-title">
            <SectionHeader
              id="home-jobs-title"
              eyebrow="Careers"
              title="Latest jobs & internships"
              description="Fresh openings for students and freshers."
              viewAllHref="/jobs"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-md:!grid-cols-1 max-md:gap-3">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* 7 · Projects marketplace preview */}
      {trending.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-projects-title">
            <SectionHeader
              id="home-projects-title"
              eyebrow="Marketplace"
              title="Trending projects"
              description="Final-year projects with source code, ready to learn from and present."
              viewAllHref="/projects/trending"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4 2xl:grid-cols-5 max-md:!grid-cols-1 max-md:gap-3">
              {trending.map((p, i) => (
                <ProjectCard key={p.id} project={p} rank={i < 3 ? i + 1 : undefined} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* 8 · Placement prep */}
      <Reveal>
        <PlacementPrep problemCount={problemCount} interviewTopicCount={interviewTopicCount} />
      </Reveal>

      {/* 9 · Testimonials / success stories */}
      <Reveal>
        <Testimonials items={testimonials} />
      </Reveal>

      {posts.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-blog-title">
            <SectionHeader id="home-blog-title" eyebrow="Blog" title="Latest from the blog" viewAllHref="/blog" viewAllLabel="All articles" className="max-md:[&>a]:hidden" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4 max-md:gap-3">
              {posts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
            <Link href="/blog" className="mt-3 hidden min-h-11 items-center gap-1 text-sm font-semibold text-primary max-md:inline-flex">All articles <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </section>
        </Reveal>
      )}

      {/* 10 · Premium + Referral */}
      <Reveal>
        <PremiumReferralCta />
      </Reveal>

      {faqs.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-faq-title">
            <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_1.6fr] lg:items-start">
              <SectionHeader
                id="home-faq-title"
                eyebrow="FAQ"
                title="Questions, answered"
                description="Still stuck? Our support team is a message away."
                viewAllHref="/faq"
                viewAllLabel="All FAQs"
                className="lg:block"
              />
              <div className="card divide-y divide-line px-5 sm:px-6">
                {faqs.map((f) => (
                  <details key={f.id} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                      {f.question}
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface text-ink-muted transition-transform group-open:rotate-45 motion-reduce:transform-none">
                        <Plus className="h-4 w-4" aria-hidden />
                      </span>
                    </summary>
                    <p className="mt-2 pr-10 text-sm leading-relaxed text-ink-muted">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Final CTA — the site footer's call-to-action band directly follows. */}
    </div>
  );
}

// Resolve the hero and its required reads before committing the page response.
export default async function HomePage() {
  return await HomeContent();
}
