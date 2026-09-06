import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText, Wrench, Gift, ArrowRight } from "lucide-react";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import JobCard, { JobCardData } from "@/components/JobCard";
import { SectionHeader, Rating, Reveal, Button } from "@/components/ui";
import { OffersStrip, type OfferBanner } from "@/components/home/OffersStrip";
import { PremiumPromo } from "@/components/home/PremiumPromo";
import { LearningResources } from "@/components/home/LearningResources";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { HeroVisual } from "@/components/home/HeroVisual";
import { BRAND } from "@/lib/brand";
import { inWindow } from "@/lib/home";
import { getCachedHomeData } from "@/lib/cache";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

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
    offers: raw.offers as OfferBanner[],
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
      images: banner?.image_url ? [{ url: banner.image_url }] : undefined,
    },
  };
}

export default async function HomePage() {
  const { trending, jobs, testimonials, faqs, banner, offers } = await getHomeData();

  return (
    <div className="pb-16 sm:pb-20">
      {/* Hero — an admin `banners` row for placement 'home' overrides the default copy. */}
      <header className="container-page pb-8 pt-8 sm:pb-10 sm:pt-10">
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
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {BRAND.tagline}
                </span>
                <h1 className="mt-5 max-w-xl text-[1.75rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.7rem]">
                  Everything a student needs for a career, in one place.
                </h1>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-muted sm:text-base">
                  Buy or sell final-year projects, apply to jobs and internships, prepare for placements, build a
                  resume, and get a custom project built — all on one account, shared with the CampusEduX app.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button href="/projects">Browse projects</Button>
                  <Button href="/learning" variant="ghost">
                    Explore learning
                  </Button>
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

      <OffersStrip offers={offers} />

      <section className="container-page pt-10">
        <PremiumPromo />
      </section>

      <Reveal>
        <LearningResources />
      </Reveal>

      {trending.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 sm:pt-14">
            <SectionHeader title="Trending projects" viewAllHref="/projects/trending" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((p, i) => (
                <ProjectCard key={p.id} project={p} rank={i < 3 ? i + 1 : undefined} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {jobs.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 sm:pt-14">
            <SectionHeader title="Latest jobs" viewAllHref="/jobs" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Static module overview — links into the dynamic sections above/below. */}
      <Reveal>
        <section className="container-page pt-10 sm:pt-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/resume", title: "Resume Builder", body: "Guided sections, ATS scoring, PDF export.", icon: FileText },
              { href: "/custom-projects", title: "Custom Projects", body: "Describe what you need — get it built and delivered.", icon: Wrench },
              { href: "/referral", title: "Referral Program", body: "Invite a friend, earn wallet credit.", icon: Gift },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg active:scale-[.99] motion-reduce:transform-none"
                >
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

      {testimonials.length > 0 && (
        <Reveal>
          <section className="container-page pt-10 sm:pt-14">
            <SectionHeader title="What students say" />
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
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
          <section className="container-page pt-10 sm:pt-14">
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
    </div>
  );
}
