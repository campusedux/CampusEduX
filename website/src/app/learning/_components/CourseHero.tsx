import type { LucideIcon } from "lucide-react";
import { BookOpen, Check, ChevronDown, Layers, ListChecks, Lock } from "lucide-react";
import type { LearningGridBrief } from "@/lib/learning.types";
import type { CourseOutline } from "@/lib/courseOutline";
import { Badge } from "@/components/ui/Badge";
import { CourseCover } from "@/components/learning/CourseCover";
import { DBMS_SQL_SLUG } from "@/lib/databaseTutorial";

const WHAT_YOU_LEARN_MAX = 8;

/** Literal class strings so Tailwind keeps them; tints sit on the dark banner overlay in both themes. */
const PILL = {
  sky: { box: "bg-sky-400/15 ring-sky-300/30", icon: "bg-sky-400/25 text-sky-100" },
  emerald: { box: "bg-emerald-400/15 ring-emerald-300/30", icon: "bg-emerald-400/25 text-emerald-100" },
  amber: { box: "bg-amber-400/15 ring-amber-300/30", icon: "bg-amber-400/25 text-amber-100" },
} as const;

function StatPill({
  icon: Icon,
  tone,
  value,
  label,
  unit,
}: {
  icon: LucideIcon;
  tone: keyof typeof PILL;
  value: number;
  label: string;
  /** Singular noun shown after the number, e.g. "lesson". */
  unit: string;
}) {
  return (
    <div className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg py-1 pl-1 pr-2.5 text-xs text-white ring-1 ${PILL[tone].box}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${PILL[tone].icon}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-semibold tabular-nums">{value}</span>{" "}
        <span className="text-white/80">
          {unit}
          {value === 1 ? "" : "s"}
        </span>
      </dd>
    </div>
  );
}

/**
 * Course header — a CourseCover banner (admin cover image, or the generated
 * cover) behind the title, description and REAL stats only (sections,
 * lessons, premium lesson count, practice tests), then "What you'll learn" =
 * the course's actual section titles; no invented outcomes. The banner text
 * is always white on a dark overlay, so it reads the same in both themes.
 */
export function CourseHero({
  brief,
  outline,
  description,
  coverImageUrl,
  testCount,
}: {
  brief: LearningGridBrief;
  outline: CourseOutline;
  description: string;
  coverImageUrl: string | null;
  testCount: number;
}) {
  const premiumLessons = outline.sections.reduce((n, s) => n + s.lessons.filter((l) => l.isPremium).length, 0);
  const learn = outline.sections.filter((s) => s.lessons.length > 0).map((s) => s.name);
  const shownLearn = learn.slice(0, WHAT_YOU_LEARN_MAX);

  return (
    <header className="min-w-0 overflow-hidden rounded-2xl border border-line bg-card shadow-card [overflow-wrap:anywhere]">
      <div className="relative isolate bg-slate-950">
        <CourseCover course={{ ...brief, cover_image_url: coverImageUrl }} variant="banner" className="-z-10 opacity-20" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-slate-950/50" />

        <div className="min-w-0 max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {/* Solid card-coloured underlay keeps the tinted badges legible on the banner. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-card">
              {brief.is_premium ? <Badge tone="premium">Premium course</Badge> : <Badge tone="success">Free course</Badge>}
            </span>
            {premiumLessons > 0 && !brief.is_premium && (
              <span className="inline-flex rounded-full bg-card">
                <Badge tone="neutral">
                  <Lock className="h-3 w-3" aria-hidden /> {premiumLessons} premium lesson{premiumLessons === 1 ? "" : "s"}
                </Badge>
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-white [text-wrap:balance] sm:text-[2rem] lg:text-[2.25rem]">{brief.name}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">{description}</p>}

          <dl className="mt-4 flex flex-wrap gap-2">
            {outline.gridSlug !== DBMS_SQL_SLUG && <StatPill icon={Layers} tone="sky" value={outline.sections.length} label="Sections" unit="section" />}
            <StatPill icon={BookOpen} tone="emerald" value={outline.total} label={outline.gridSlug === DBMS_SQL_SLUG ? "Topics" : "Lessons"} unit={outline.gridSlug === DBMS_SQL_SLUG ? "topic" : "lesson"} />
            {testCount > 0 && <StatPill icon={ListChecks} tone="amber" value={testCount} label="Practice tests" unit="practice test" />}
          </dl>
        </div>
      </div>

      {shownLearn.length >= 2 && (
        <details className="group/outcomes border-t border-line px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg [&::-webkit-details-marker]:hidden">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">What you&apos;ll learn</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open/outcomes:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <ul className="mb-2 mt-2 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {shownLearn.map((name, i) => (
              <li key={`${i}-${name}`} className="flex min-w-0 items-start gap-2 text-sm leading-6 text-ink">
                <span className="mt-px flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="min-w-0">{name}</span>
              </li>
            ))}
          </ul>
          {learn.length > shownLearn.length && (
            <p className="mb-2 mt-3 text-xs font-medium text-ink-muted">+ {learn.length - shownLearn.length} more sections in the curriculum below</p>
          )}
        </details>
      )}
    </header>
  );
}

export default CourseHero;
