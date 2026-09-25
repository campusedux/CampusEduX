import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Sparkles } from "lucide-react";
import type { LearningGridCard } from "@/lib/learning.types";
import { Badge } from "@/components/ui/Badge";
import { courseAccent, isEmojiIcon } from "@/lib/courseCover";
import { CourseCardProgress } from "./CourseCardProgress";
import { CourseCover } from "./CourseCover";

export type CourseCardData = Pick<
  LearningGridCard,
  "id" | "slug" | "name" | "description" | "icon" | "cover_image_url" | "accent_color" | "is_featured" | "is_premium" | "section_count" | "topic_count"
>;


/**
 * Course (Learning grid) card: cover art, title, Featured / Free / Premium
 * badges, sections · lessons, a two-line outcome (the description), and a
 * progress row (device-only progress; "Not started" until the visitor starts).
 * Server component; the progress row is a tiny client island.
 */
export function CourseCard({
  course,
  compactOnMobile = false,
  className,
}: {
  course: CourseCardData;
  /** Below `sm`: drop the cover art for a compact row (Learning hub lists). */
  compactOnMobile?: boolean;
  className?: string;
}) {
  const accent = courseAccent(course.accent_color, course.slug);
  const icon = isEmojiIcon(course.icon) ? course.icon : <BookOpen className="h-5 w-5" aria-hidden />;
  return (
    <Link
      href={`/learning/${course.slug}`}
      className={`card card-hover group flex flex-col overflow-hidden ${className ?? ""}`}
    >
      <div className={`relative overflow-hidden ${compactOnMobile ? "hidden aspect-[16/7] sm:block" : "aspect-[16/7]"}`}>
        <CourseCover course={course} />
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

      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        {compactOnMobile && (
          <div className="mb-3 flex items-center gap-2 sm:hidden">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-lg"
              style={{ color: accent }}
            >
              {icon}
            </span>
            {course.is_featured && <Badge tone="primary">Featured</Badge>}
            {course.is_premium ? <Badge tone="premium">Premium</Badge> : <Badge tone="success">Free</Badge>}
          </div>
        )}
        <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-ink group-hover:text-primary">
          {course.name}
        </h3>
        {/* Always two lines tall, so every card in a row lines up exactly. */}
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-muted">{course.description}</p>
        <div className="mt-auto pt-3">
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
