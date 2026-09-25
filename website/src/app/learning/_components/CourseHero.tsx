import type { LucideIcon } from "lucide-react";
import { BookOpen, Check, Layers, ListChecks, Lock } from "lucide-react";
import type { LearningGridBrief } from "@/lib/learning.types";
import type { CourseOutline } from "@/lib/courseOutline";
import { Badge } from "@/components/ui/Badge";
import { CourseCover } from "@/components/learning/CourseCover";

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
    <div className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm text-white ring-1 backdrop-blur-sm ${PILL[tone].box}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${PILL[tone].icon}`}>
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
    <header className="overflow-hidden rounded-3xl border border-line bg-card shadow-card">
      <div className="relative isolate">
        <CourseCover course={{ ...brief, cover_image_url: coverImageUrl }} variant="banner" className="-z-10" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-transparent" />

        <div className="max-w-3xl px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
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
          <h1 className="h-hero mt-5 text-white">{brief.name}</h1>
          {description && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">{description}</p>}

          <dl className="mt-6 flex flex-wrap gap-2.5">
            <StatPill icon={Layers} tone="sky" value={outline.sections.length} label="Sections" unit="section" />
            <StatPill icon={BookOpen} tone="emerald" value={outline.total} label="Lessons" unit="lesson" />
            {testCount > 0 && <StatPill icon={ListChecks} tone="amber" value={testCount} label="Practice tests" unit="practice test" />}
          </dl>
        </div>
      </div>

      {shownLearn.length >= 2 && (
        <div className="px-6 py-6 sm:px-8 lg:px-10 lg:py-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">What you&apos;ll learn</p>
          <ul className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {shownLearn.map((name, i) => (
              <li key={`${i}-${name}`} className="flex items-start gap-3 text-[15px] leading-snug text-ink">
                <span className="mt-px flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
          {learn.length > shownLearn.length && (
            <p className="mt-4 text-xs font-medium text-ink-muted">+ {learn.length - shownLearn.length} more sections in the curriculum below</p>
          )}
        </div>
      )}
    </header>
  );
}

export default CourseHero;
