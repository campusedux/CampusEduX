import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, Code2, LayoutGrid } from "lucide-react";
import { Button, PageHeader, Chip, ChipRow } from "@/components/ui";
import { HeroVisual, type HeroCourse } from "./HeroVisual";

export interface HeroStat {
  value: number;
  label: string;
}

const formatCount = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const MOBILE_STAT_LABELS: Record<string, string> = {
  course: "Courses", courses: "Courses", lessons: "Lessons", "coding problems": "Problems", "interview topics": "Topics",
};
const QUICK_ACCESS = [
  { label: "Learn", href: "/learning", icon: BookOpen, tint: "text-accent-teal" },
  { label: "Practice", href: "/practice", icon: Code2, tint: "text-ink-muted" },
  { label: "Projects", href: "/projects", icon: LayoutGrid, tint: "text-orange-400" },
  { label: "Jobs", href: "/jobs", icon: Briefcase, tint: "text-accent-sky" },
];

/** Compact, server-rendered hero using only live catalogue counts. */
export function HomeHero({ stats, courses }: { stats: HeroStat[]; courses: HeroCourse[] }) {
  const shown = stats.filter((s) => s.value > 0);
  return (
    <section className="container-page pt-4 sm:pt-6 lg:pt-8" aria-labelledby="home-hero-title">
      <div className="relative min-w-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:bg-card sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="relative grid items-center gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div className="min-w-0">
            <PageHeader id="home-hero-title" title={<><span className="hero-headline-first">Learn skills. Build projects.</span>{" "}<span className="hero-headline-last">Land the <span className="text-gradient">job.</span></span></>} caption="Your next skill. Your next opportunity." />
            <div className="home-hero-actions mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
              <Button href="/learning" size="md" rightIcon={ArrowRight} className="min-w-0 px-3 sm:px-5">
                Start learning
              </Button>
              <Link href="/jobs" className="inline-flex min-h-11 items-center text-xs font-medium text-ink-muted hover:text-ink sm:text-sm">
                <span className="hero-jobs-original">Find jobs &amp; internships</span><span className="hero-jobs-mobile" hidden>Find jobs</span>
              </Link>
            </div>
            <ChipRow label="Quick access" className="mt-3">
              {QUICK_ACCESS.map(({ label, href, icon: Icon, tint }) => (
                <Chip key={href} href={href} className="gap-2 whitespace-nowrap">
                  <Icon className={`h-4 w-4 shrink-0 ${tint}`} aria-hidden />
                  {label}
                </Chip>
              ))}
            </ChipRow>
            {shown.length > 0 && (
              <dl className="mt-3 grid grid-cols-4 gap-3 sm:mt-5">
                {stats.filter((s) => s.value > 0 || MOBILE_STAT_LABELS[s.label]).map((s) => (
                  <div key={s.label} hidden={s.value <= 0} className="min-w-0 rounded-[14px] bg-card px-1 py-2 text-center sm:bg-surface sm:px-3 sm:py-3">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-base font-semibold tabular-nums text-ink sm:text-2xl">{formatCount(s.value)}</dd>
                    <dd className="text-xs leading-4 text-ink-muted"><span className="hero-stat-original">{s.label}</span><span className="hero-stat-mobile" hidden>{MOBILE_STAT_LABELS[s.label] ?? s.label}</span></dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="hidden lg:block"><HeroVisual courses={courses} /></div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
