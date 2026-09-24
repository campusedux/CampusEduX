import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Sparkles } from "lucide-react";
import type { LearningGridCard } from "@/lib/learning.types";
import { Badge } from "@/components/ui/Badge";
import { CourseCardProgress } from "./CourseCardProgress";

export type CourseCardData = Pick<
  LearningGridCard,
  "id" | "slug" | "name" | "description" | "icon" | "cover_image_url" | "accent_color" | "is_featured" | "is_premium" | "section_count" | "topic_count"
>;

const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);
const FALLBACK_ACCENT = "#4F39F6";
/** Only a plain 6-digit hex is trusted for the inline tint (admin-entered value). */
const safeAccent = (c: string | null) => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : FALLBACK_ACCENT);

/**
 * Course (Learning grid) card: cover art, title, Featured / Free / Premium
 * badges, sections · lessons, a one-line outcome (the description), and a
 * progress strip once the visitor has started it (device-only progress).
 * Server component; the progress strip is a tiny client island.
 */
export function CourseCard({ course, className }: { course: CourseCardData; className?: string }) {
  const accent = safeAccent(course.accent_color);
  return (
    <Link
      href={`/learning/${course.slug}`}
      className={`card card-hover group flex flex-col overflow-hidden ${className ?? ""}`}
    >
      <div
        className="relative flex aspect-[16/7] items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}26, ${accent}0d 60%, transparent)` }}
      >
        {course.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied Storage URL (any host)
          <img
            src={course.cover_image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        ) : (
          <>
            <span aria-hidden className="bg-grid absolute inset-0 opacity-60" />
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-2xl shadow-card transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transform-none"
              style={{ color: accent }}
            >
              {course.icon && isEmoji(course.icon) ? course.icon : <BookOpen className="h-6 w-6" aria-hidden />}
            </span>
          </>
        )}
        {/* Solid card-coloured underlay so the tinted badges stay legible on any cover image. */}
        <span className="absolute left-3 top-3 flex gap-1.5">
          {course.is_featured && (
            <span className="inline-flex rounded-full bg-card shadow-card">
              <Badge tone="primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                Featured
              </Badge>
            </span>
          )}
          <span className="inline-flex rounded-full bg-card shadow-card">
            {course.is_premium ? <Badge tone="premium">Premium</Badge> : <Badge tone="success">Free</Badge>}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-ink group-hover:text-primary">
          {course.name}
        </h3>
        {course.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{course.description}</p>
        ) : null}
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-4 text-xs font-medium text-ink-faint">
            {course.section_count > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {course.section_count} section{course.section_count === 1 ? "" : "s"}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {course.topic_count} lesson{course.topic_count === 1 ? "" : "s"}
            </span>
            <ArrowRight
              className="ml-auto h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
              aria-hidden
            />
          </div>
          <CourseCardProgress gridSlug={course.slug} totalLessons={course.topic_count} />
        </div>
      </div>
    </Link>
  );
}

export default CourseCard;
