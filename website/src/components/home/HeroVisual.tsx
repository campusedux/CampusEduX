import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, Briefcase, Code2, FileText, GraduationCap, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Right-hand hero composition — a layered "product" panel built only from
 * real links and real catalogue data: up to three published courses (name +
 * lesson count) and the module shortcuts. No fabricated progress, users or
 * numbers.
 */
type Tile = { label: string; href: string; icon: LucideIcon; tile: string; fg: string };

/** Literal class strings so Tailwind keeps them. */
const TILES: Tile[] = [
  { label: "Projects", href: "/projects", icon: LayoutGrid, tile: "bg-primary-50", fg: "text-primary" },
  { label: "Practice", href: "/practice", icon: Code2, tile: "bg-accent-pink/10", fg: "text-accent-pink" },
  { label: "Jobs", href: "/jobs", icon: Briefcase, tile: "bg-accent-sky/10", fg: "text-accent-sky" },
  { label: "Resume", href: "/resume", icon: FileText, tile: "bg-accent-amber/10", fg: "text-accent-amber" },
];

export interface HeroCourse {
  slug: string;
  name: string;
  topic_count: number;
}

export function HeroVisual({ courses }: { courses: HeroCourse[] }) {
  return (
    <div className="relative">
      {/* soft brand glow behind the panel */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-primary/25 via-accent-violet/15 to-accent-pink/20 blur-2xl"
      />
      <div className="relative rounded-3xl border border-line bg-card/95 p-4 shadow-card-lg backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center gap-1.5 px-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 text-xs font-medium text-ink-faint">campusedux.com</span>
        </div>

        {courses.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface/60 p-3">
            <p className="flex items-center gap-1.5 px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden /> Start a course
            </p>
            <div className="grid gap-1.5">
              {courses.map((c) => (
                <Link
                  key={c.slug}
                  href={`/learning/${c.slug}`}
                  className="group flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink group-hover:text-primary">{c.name}</span>
                    <span className="block text-xs text-ink-faint">{c.topic_count} lessons</span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-4 gap-2">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-card px-1 py-3 transition hover:border-primary/30 hover:bg-surface"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 motion-reduce:transform-none",
                    t.tile,
                  )}
                >
                  <Icon className={cn("h-5 w-5", t.fg)} aria-hidden />
                </span>
                <span className="text-xs font-semibold text-ink">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HeroVisual;
