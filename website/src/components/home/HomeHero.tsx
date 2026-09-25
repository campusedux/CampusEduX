import { ArrowRight, Briefcase } from "lucide-react";
import { Button, SearchBar } from "@/components/ui";
import { HeroVisual, type HeroCourse } from "./HeroVisual";

export interface HeroStat {
  value: number;
  label: string;
}

const formatCount = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/**
 * Home hero — the first thing on the page for every visitor (server-rendered,
 * so it's the LCP and fully crawlable). Trust numbers come straight from the
 * live catalogue; a stat with no real value (0) is simply not shown.
 */
export function HomeHero({ stats, courses }: { stats: HeroStat[]; courses: HeroCourse[] }) {
  const shown = stats.filter((s) => s.value > 0);
  return (
    <section className="container-page pt-6 sm:pt-10" aria-labelledby="home-hero-title">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-card px-5 py-10 shadow-card sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        {/* Decorative ground: dotted grid fading out + two colour washes. */}
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,#000_20%,transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-accent-pink/10 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* No entrance animation: this block holds the LCP headline, which should paint immediately. */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary">
              {/* Static dot — an infinite "ping" here kept the main thread busy on mid-range phones. */}
              <span aria-hidden className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/15" />
              Learn · Practice · Build · Get hired
            </span>

            <h1 id="home-hero-title" className="h-display mt-5 max-w-2xl">
              Learn skills. Build projects. <span className="text-gradient">Land the job.</span>
            </h1>
            <p className="lede mt-5 max-w-xl sm:text-lg">
              Tutorials, coding practice, placement prep, final-year projects and fresh jobs &amp; internships — one
              student account on the web and the CampusEduX app.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/learning" size="lg" rightIcon={ArrowRight}>
                Start learning
              </Button>
              <Button href="/jobs" size="lg" variant="ghost" leftIcon={Briefcase}>
                Find jobs &amp; internships
              </Button>
            </div>

            <div className="mt-6 max-w-lg">
              <SearchBar action="/search" placeholder="Search courses, projects, jobs…" />
            </div>

            {shown.length > 0 && (
              <dl className="mt-9 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
                {shown.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-line bg-surface/70 px-4 py-3 sm:border-0 sm:bg-transparent sm:p-0">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
                      {formatCount(s.value)}
                    </dd>
                    <dd className="text-xs font-medium text-ink-muted sm:text-sm">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="hidden lg:block">
            <HeroVisual courses={courses} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
