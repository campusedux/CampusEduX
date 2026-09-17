import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText, Wrench, Gift, ArrowRight, Sparkles } from "lucide-react";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import JobCard, { JobCardData } from "@/components/JobCard";
import { SectionHeader, Rating, Reveal, Button, SearchBar } from "@/components/ui";
import { LearningResources } from "@/components/home/LearningResources";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { HeroVisual } from "@/components/home/HeroVisual";
import { BlogCard } from "@/components/blog/BlogCard";
import { getLatestPosts } from "@/lib/blog";
import type { BlogPostCard } from "@/lib/blog";
import { BRAND } from "@/lib/brand";
import { inWindow } from "@/lib/home";
import { getCachedHomeData } from "@/lib/cache";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

export const revalidate = 300; // 5-min ISR — catalog + CMS change via the admin panel, not per request

interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  target_url: string | null;
}

// Per-request memo (shared by generateMetadata + the page) over the
// cross-request cached rows in lib/cache.ts.
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

type TestimonialRow = { id: string; author_name: string; author_role: string | null; quote: string; rating: number };
type FaqRow = { id: string; question: string; answer: string };

export async function generateMetadata(): Promise<Metadata> {
  const { banner } = await getHomeData();
  return {
    title: "CampusEduX — Projects, Jobs, Placement Prep & Resume, in one app",
    description:
      "Buy or sell final-year projects, apply to jobs and internships, prepare for placements, build a resume, and get a custom project built — one account across web and the CampusEduX app.",
    openGraph: {
      title: "CampusEduX",
      description: "Projects · Jobs · Placement Prep · Resume · Custom Projects — for students.",
      images: banner?.image_url ? [{ url: banner.image_url }] : [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function HomePage() {
  const [{ trending, jobs, testimonials, faqs, banner }, latestPosts] = await Promise.all([
    getHomeData(),
    // Same cross-request-cached helper `/blog` uses for its Featured strip.
    getLatestPosts(3),
  ]);
  const posts = latestPosts as BlogPostCard[];

  return (
    <div className="pb-16 sm:pb-20">
      <section className="container-page pt-8 sm:pt-12" aria-label="Custom project development">
        <CustomProjectBanner />
      </section>

      {/* Hero — an admin `banners` row for placement 'home' overrides the default copy. */}
      <header className="container-page pb-8 pt-8 sm:pb-10 sm:pt-12">
        {banner ? (
          <Link
            href={banner.target_url || "/projects"}
            className="group block overflow-hidden rounded-3xl border border-line bg-primary-50 shadow-card transition hover:shadow-card-lg"
          >
            <div className="grid items-center gap-6 p-6 sm:grid-cols-2 sm:p-10">
              <div>
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">{banner.title}</h1>
                {banner.subtitle && <p className="mt-2 text-ink-muted">{banner.subtitle}</p>}
                <span className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-primary-600">
                  Explore
                </span>
              </div>
              {banner.image_url && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-primary-50">
                  <Image
                    src={banner.image_url}
                    alt=""
                    fill
                    priority
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary-50 via-white to-primary-50/50 px-6 py-10 sm:px-12 sm:py-14 lg:px-14 lg:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 top-1/2 hidden h-72 w-72 -translate-y-1/2 text-primary opacity-[0.12] lg:block"
              style={{
                backgroundImage: "radial-gradient(currentColor 1.6px, transparent 1.6px)",
                backgroundSize: "18px 18px",
                WebkitMaskImage: "radial-gradient(circle at center, #000, transparent 72%)",
                maskImage: "radial-gradient(circle at center, #000, transparent 72%)",
              }}
            />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
              <div>
                <span className="eyebrow inline-flex rounded-full bg-primary/10 px-3 py-1">{BRAND.tagline}</span>
                <h1 className="h-hero mt-5 max-w-xl">Everything a student needs for a career, in one place.</h1>
                <p className="lede mt-4 max-w-lg">
                  Buy or sell final-year projects, apply to jobs and internships, prepare for placements, build a
                  resume, and get a custom project built — all on one account, shared with the CampusEduX app.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button href="/projects">Browse projects</Button>
                  <Button href="/learning" variant="ghost">
                    Explore learning
                  </Button>
                </div>
                <div className="mt-6 max-w-md">
                  <SearchBar action="/search" placeholder="Search projects, jobs, learning…" />
                </div>
              </div>
              <div className="hidden lg:block">
                <HeroVisual />
              </div>
            </div>
          </div>
        )}
      </header>

      <ModuleGrid />

      {trending.length > 0 && (
        <Reveal>
          <section className="container-page pt-12 sm:pt-16">
            <SectionHeader title="Trending projects" viewAllHref="/projects/trending" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((p, i) => (
                <ProjectCard key={p.id} project={p} rank={i < 3 ? i + 1 : undefined} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <LearningResources />
      </Reveal>

      {jobs.length > 0 && (
        <Reveal>
          <section className="container-page pt-12 sm:pt-16">
            <SectionHeader title="Latest jobs" viewAllHref="/jobs" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {posts.length > 0 && (
        <Reveal>
          <section className="container-page pt-12 sm:pt-16">
            <SectionHeader title="Latest from the blog" viewAllHref="/blog" viewAllLabel="All articles" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <BlogCard key={p.id} post={p} priority={i < 3} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Static module overview — links into the dynamic sections above/below. */}
      <Reveal>
        <section className="container-page pt-12 sm:pt-16">
          <SectionHeader title="More on CampusEduX" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/resume", title: "Resume Builder", body: "Guided sections, ATS scoring, PDF export.", icon: FileText },
              { href: "/custom-projects", title: "Custom Projects", body: "Describe what you need — get it built and delivered.", icon: Wrench },
              { href: "/referral", title: "Referral Program", body: "Invite a friend, earn wallet credit.", icon: Gift },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.href} href={m.href} className="card card-hover group flex items-start gap-4 p-5">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold tracking-tight text-ink group-hover:text-primary">{m.title}</span>
                      <ArrowRight
                        className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">{m.body}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* Premium promotion */}
      <Reveal>
        <section className="container-page pt-12 sm:pt-16">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-50 via-white to-primary-50/40 px-6 py-10 sm:px-12 sm:py-12">
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div className="max-w-xl">
                <span className="eyebrow inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  CampusEduX Premium
                </span>
                <h2 className="h-section mt-2">Go further, faster with Premium.</h2>
                <p className="lede mt-2">
                  Priority access, extra placement material and faster support — everything already free stays free.
                </p>
              </div>
              <Button href="/premium" size="lg" rightIcon={ArrowRight} className="flex-shrink-0">
                See plans
              </Button>
            </div>
          </div>
        </section>
      </Reveal>

      {testimonials.length > 0 && (
        <Reveal>
          <section className="container-page pt-12 sm:pt-16">
            <SectionHeader title="What students say" />
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="card p-5">
                  {t.rating > 0 && <Rating value={t.rating} showCount={false} />}
                  <blockquote className="mt-2 text-sm text-ink-muted">“{t.quote}”</blockquote>
                  <figcaption className="mt-3 text-sm font-semibold text-ink">
                    — {t.author_name}
                    {t.author_role ? <span className="font-normal text-ink-muted">, {t.author_role}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {faqs.length > 0 && (
        <Reveal>
          <section className="container-page pt-12 sm:pt-16">
            <SectionHeader title="Frequently asked questions" viewAllHref="/faq" viewAllLabel="All FAQs" />
            <div className="divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                    {f.question}
                    <span className="text-ink-faint transition-transform group-open:rotate-45 motion-reduce:transform-none" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-ink-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Final CTA */}
      <Reveal>
        <section className="container-page pt-12 sm:pt-16">
          <div className="rounded-3xl bg-primary px-6 py-10 text-center text-white sm:px-12 sm:py-14">
            <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
              Start with one account — the web and the app stay in sync.
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-primary transition hover:bg-white/90 active:scale-[.98] motion-reduce:active:scale-100"
              >
                Create your account
              </Link>
              <Link
                href="/projects"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[.98] motion-reduce:active:scale-100"
              >
                Browse the marketplace
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
