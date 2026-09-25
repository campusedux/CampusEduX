import { BookOpen, CheckCircle2, Layers, ListChecks, Lock } from "lucide-react";
import type { LearningGridBrief } from "@/lib/learning.types";
import type { CourseOutline } from "@/lib/courseOutline";
import { Badge } from "@/components/ui/Badge";

const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);
const safeAccent = (c: string | null) => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#4F39F6");
const WHAT_YOU_LEARN_MAX = 8;

/**
 * Course header — title, description and REAL stats only (sections, lessons,
 * premium lesson count, practice tests). "What you'll learn" lists the course's
 * actual section titles; no invented outcomes.
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
  const accent = safeAccent(brief.accent_color);
  const premiumLessons = outline.sections.reduce((n, s) => n + s.lessons.filter((l) => l.isPremium).length, 0);
  const learn = outline.sections.filter((s) => s.lessons.length > 0).map((s) => s.name);
  const shownLearn = learn.slice(0, WHAT_YOU_LEARN_MAX);

  return (
    <header className="relative overflow-hidden rounded-3xl border border-line bg-card shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at top left, ${accent}24, transparent 60%)` }}
      />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,#000,transparent_70%)]" />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:p-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {brief.is_premium ? <Badge tone="premium">Premium course</Badge> : <Badge tone="success">Free course</Badge>}
            {premiumLessons > 0 && !brief.is_premium && (
              <Badge tone="neutral">
                <Lock className="h-3 w-3" aria-hidden /> {premiumLessons} premium lesson{premiumLessons === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <div className="mt-5 flex items-start gap-4">
            <span
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-line bg-card text-2xl shadow-card"
              style={{ color: accent }}
            >
              {brief.icon && isEmoji(brief.icon) ? brief.icon : <BookOpen className="h-6 w-6" aria-hidden />}
            </span>
            <h1 className="h-hero min-w-0">{brief.name}</h1>
          </div>
          {description && <p className="lede mt-4 max-w-2xl">{description}</p>}

          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" aria-hidden />
              <dt className="sr-only">Sections</dt>
              <dd>
                <span className="font-semibold text-ink">{outline.sections.length}</span>{" "}
                <span className="text-ink-muted">section{outline.sections.length === 1 ? "" : "s"}</span>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden />
              <dt className="sr-only">Lessons</dt>
              <dd>
                <span className="font-semibold text-ink">{outline.total}</span>{" "}
                <span className="text-ink-muted">lesson{outline.total === 1 ? "" : "s"}</span>
              </dd>
            </div>
            {testCount > 0 && (
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" aria-hidden />
                <dt className="sr-only">Practice tests</dt>
                <dd>
                  <span className="font-semibold text-ink">{testCount}</span>{" "}
                  <span className="text-ink-muted">practice test{testCount === 1 ? "" : "s"}</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied Storage URL
          <img src={coverImageUrl} alt="" className="aspect-[16/10] w-full self-center rounded-2xl border border-line object-cover" />
        ) : shownLearn.length >= 2 ? (
          <div className="rounded-2xl border border-line bg-surface/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">What you&apos;ll learn</p>
            <ul className="mt-3 grid gap-2">
              {shownLearn.map((name, i) => (
                <li key={`${i}-${name}`} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
                  <span>{name}</span>
                </li>
              ))}
            </ul>
            {learn.length > shownLearn.length && (
              <p className="mt-3 text-xs font-medium text-ink-muted">+ {learn.length - shownLearn.length} more sections</p>
            )}
          </div>
        ) : null}
      </div>

      {coverImageUrl && shownLearn.length >= 2 && (
        <div className="relative border-t border-line px-6 py-5 sm:px-8 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">What you&apos;ll learn</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {shownLearn.map((name, i) => (
              <li key={`${i}-${name}`} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export default CourseHero;
